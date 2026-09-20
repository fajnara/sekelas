import { and, eq, sql } from "drizzle-orm";

import { DAY_NAMES } from "../data.js";
import { labelToMinutes } from "./mappers.js";
import * as s from "./schema.js";

/**
 * Semua operasi tulis, sebagai fungsi biasa `(db, workspaceId, input)`.
 *
 * Sengaja dipisah dari Server Action: action-nya cuma adaptor tipis yang
 * menyelesaikan sesi lalu memanggil fungsi di sini. Dengan begitu logika yang
 * berisiko bisa diuji langsung di Postgres tanpa runtime Next — dan memang ada
 * ujinya di `tests/writes.spec.js`.
 *
 * Setiap fungsi mengikat `workspace_id` sendiri. Id workspace **tidak pernah**
 * datang dari argumen pemanggil di sisi action; ia dibaca dari cookie.
 */

const scoped = (table, workspaceId, extra) =>
  extra ? and(eq(table.workspaceId, workspaceId), extra) : eq(table.workspaceId, workspaceId);

/** Baris pengumpulan dibuat saat pertama disentuh, lalu ditimpa. */
async function upsertSubmission(db, workspaceId, { id, taskId, studentId, patch }) {
  const existing = await db
    .select({ id: s.submissions.id })
    .from(s.submissions)
    .where(scoped(s.submissions, workspaceId, and(eq(s.submissions.taskId, taskId), eq(s.submissions.studentId, studentId))))
    .limit(1);

  if (existing.length) {
    await db
      .update(s.submissions)
      .set(patch)
      .where(scoped(s.submissions, workspaceId, eq(s.submissions.id, existing[0].id)));
    return existing[0].id;
  }

  await db.insert(s.submissions).values({ workspaceId, id, taskId, studentId, ...patch });
  return id;
}

/* ---------- baris turunan: aktivitas & notifikasi ---------- */

/**
 * Aktivitas dan notifikasi lahir dari aksi nyata, bukan cuma dari seed.
 *
 * Yang dicatat **hanya** kejadian yang sudah punya padanan di desain: tugas
 * baru, materi diunggah, jadwal berubah, dan nilai keluar. Menambah jenis lain
 * berarti mengarang warna dan nada yang desainnya tidak pernah menyebut — dan
 * di sini desain yang menang. Karena itu menghapus tugas, menambah siswa, atau
 * mengubah kelas tidak meninggalkan jejak di feed.
 *
 * Keduanya diurut `sort_order` naik dan seed-nya terbaru-dulu, jadi baris baru
 * mengambil `min - 1` supaya muncul di puncak.
 */
async function prepend(db, table, workspaceId, values) {
  const [{ top } = { top: 0 }] = await db
    .select({ top: sql`coalesce(min(${table.sortOrder}), 0) - 1` })
    .from(table)
    .where(scoped(table, workspaceId));

  await db.insert(table).values({ workspaceId, id: crypto.randomUUID(), ...values, sortOrder: Number(top) });
}

/**
 * Baris turunan tidak boleh menjatuhkan tulisan utamanya.
 *
 * Kalau catatan aktivitas gagal setelah tugasnya tersimpan, mengembalikan
 * `{error}` akan membuat UI me-rollback tugas yang **sudah ada** di database.
 * Jejaknya yang hilang jauh lebih ringan daripada itu.
 */
async function derive(work) {
  try {
    await work();
  } catch (error) {
    console.error("gagal menulis baris turunan", error);
  }
}

const logActivity = (db, workspaceId, { text, color, at }) =>
  prepend(db, s.activityLog, workspaceId, { text, color, createdAt: at });

const notify = (db, workspaceId, { kind, text, target, at }) =>
  prepend(db, s.notifications, workspaceId, { kind, text, target: target || {}, createdAt: at, readAt: null });

/** Kolomnya bisa disebut karena tugas memakai `title`, bukan `name`. */
const nameOf = async (db, workspaceId, table, id, column = table.name) => {
  if (!id) return null;
  const [row] = await db
    .select({ name: column })
    .from(table)
    .where(scoped(table, workspaceId, eq(table.id, id)))
    .limit(1);
  return row ? row.name : null;
};

/**
 * Siswa yang diperankan demo. Notifikasi hanya masuk kalau kejadiannya memang
 * menyangkut dia — kotak notifikasi di desain adalah kotak **satu** siswa, jadi
 * mengisinya dengan kejadian kelas lain akan bohong.
 */
async function demoStudent(db, workspaceId) {
  const [row] = await db
    .select({ id: s.students.id, classId: s.students.classId })
    .from(s.students)
    .where(scoped(s.students, workspaceId, eq(s.students.isMe, true)))
    .limit(1);
  return row || null;
}

/* ---------- pengumpulan (siswa) ---------- */

export const submitTask = (db, workspaceId, { id, taskId, studentId, fileName, storagePath, note, at }) =>
  upsertSubmission(db, workspaceId, {
    id,
    taskId,
    studentId,
    patch: { checkedOffAt: at, submittedAt: at, fileName, storagePath: storagePath ?? null, note },
  });

export const unsubmitTask = (db, workspaceId, { id, taskId, studentId }) =>
  upsertSubmission(db, workspaceId, {
    id,
    taskId,
    studentId,
    patch: { checkedOffAt: null, submittedAt: null, fileName: null, storagePath: null, note: null },
  });

/** `done` dikirim eksplisit: mencentang dan membatalkan centang lewat jalur sama. */
export const toggleTask = (db, workspaceId, { id, taskId, studentId, done, at }) =>
  upsertSubmission(db, workspaceId, { id, taskId, studentId, patch: { checkedOffAt: done ? at : null } });

/* ---------- penilaian (guru) ---------- */

export async function gradeSubmission(db, workspaceId, { id, taskId, studentId, score, note, at }) {
  const n = Math.max(0, Math.min(100, Number(score)));
  if (!Number.isFinite(n)) return { error: "Nilai harus 0–100." };

  // Tanggal pengumpulan diselesaikan di sini, bukan lewat `coalesce` di SQL:
  // merujuk kolom tabel sendiri sah di UPDATE tapi tidak di INSERT.
  const [existing] = await db
    .select({ submittedAt: s.submissions.submittedAt })
    .from(s.submissions)
    .where(scoped(s.submissions, workspaceId, and(eq(s.submissions.taskId, taskId), eq(s.submissions.studentId, studentId))))
    .limit(1);

  await upsertSubmission(db, workspaceId, {
    id,
    taskId,
    studentId,
    patch: {
      score: n,
      feedback: note || null,
      gradedAt: at,
      // Menilai berarti tugasnya memang masuk, walau belum tercatat terkumpul.
      submittedAt: (existing && existing.submittedAt) || at,
    },
  });

  await derive(async () => {
    // Hanya siswa yang diperankan demo yang punya kotak notifikasi di layar.
    const me = await demoStudent(db, workspaceId);
    if (!me || me.id !== studentId) return;
    const judul = await nameOf(db, workspaceId, s.tasks, taskId, s.tasks.title);
    await notify(db, workspaceId, {
      kind: "Nilai keluar",
      text: `Nilai “${judul}” sudah keluar: ${n}`,
      target: { screen: "grades" },
      at,
    });
  });

  return { ok: true };
}

/* ---------- tugas ---------- */

export async function saveTask(db, workspaceId, { id, editId, classId, teacherId, fields, at }) {
  const row = {
    classId,
    subjectId: fields.subjectId,
    createdByTeacherId: teacherId ?? null,
    title: fields.title,
    description: fields.desc ?? "",
    kind: fields.kind,
    groupSize: fields.groupSize ?? null,
    weightPct: String(fields.weightPct),
    dueAt: fields.dueAt,
  };

  if (editId) {
    await db.update(s.tasks).set(row).where(scoped(s.tasks, workspaceId, eq(s.tasks.id, editId)));
    return { ok: true };
  }

  const [{ next } = { next: 0 }] = await db
    .select({ next: sql`coalesce(max(${s.tasks.sortOrder}), 0) + 1` })
    .from(s.tasks)
    .where(scoped(s.tasks, workspaceId));

  await db
    .insert(s.tasks)
    .values({ workspaceId, id, ...row, attachments: [], isArchived: false, legacyNo: null, sortOrder: Number(next) });

  await derive(async () => {
    const guru = (await nameOf(db, workspaceId, s.teachers, teacherId)) || "Guru";
    await logActivity(db, workspaceId, {
      text: `${guru} menambah tugas “${fields.title}”`,
      color: "#10B981",
      at,
    });

    const me = await demoStudent(db, workspaceId);
    if (!me || me.classId !== classId) return;
    const kelas = await nameOf(db, workspaceId, s.classes, classId);
    await notify(db, workspaceId, {
      kind: "Tugas baru",
      text: `${guru} menambah tugas “${fields.title}” untuk ${kelas}`,
      // Tugas baru tidak punya `legacyNo`, jadi notifikasinya menunjuk id
      // langsung. Katalog desain memakai nomor 1–8; itu hanya untuk seed.
      target: { screen: "taskDetail", taskId: id },
      at,
    });
  });

  return { ok: true };
}

export async function deleteTask(db, workspaceId, { id }) {
  await db.delete(s.submissions).where(scoped(s.submissions, workspaceId, eq(s.submissions.taskId, id)));
  await db.delete(s.tasks).where(scoped(s.tasks, workspaceId, eq(s.tasks.id, id)));
  return { ok: true };
}

/* ---------- materi ---------- */

export async function addMaterial(
  db,
  workspaceId,
  { id, subjectId, name, ext, sizeBytes, storagePath, teacherId, at },
) {
  const [{ next } = { next: 0 }] = await db
    .select({ next: sql`coalesce(max(${s.materials.sortOrder}), 0) + 1` })
    .from(s.materials)
    .where(scoped(s.materials, workspaceId));

  await db.insert(s.materials).values({
    workspaceId,
    id,
    subjectId,
    name,
    ext,
    sizeBytes,
    storagePath: storagePath ?? null,
    uploadedByTeacherId: teacherId ?? null,
    createdAt: at,
    sortOrder: Number(next),
  });

  await derive(async () => {
    const guru = (await nameOf(db, workspaceId, s.teachers, teacherId)) || "Guru";
    await logActivity(db, workspaceId, { text: `${guru} mengunggah materi “${name}”`, color: "#FACC15", at });
  });

  // Tanpa notifikasi: empat jenis notifikasi di desain tidak mencakup materi,
  // dan jenis baru berarti nada warna baru yang desainnya tidak menyebut.
  return { ok: true };
}

/** Mengembalikan jalur objek yang perlu dihapus, supaya byte-nya tidak menumpuk. */
export async function deleteMaterial(db, workspaceId, { id }) {
  const [row] = await db
    .select({ storagePath: s.materials.storagePath })
    .from(s.materials)
    .where(scoped(s.materials, workspaceId, eq(s.materials.id, id)))
    .limit(1);
  await db.delete(s.materials).where(scoped(s.materials, workspaceId, eq(s.materials.id, id)));
  return { ok: true, storagePath: row ? row.storagePath : null };
}

/* ---------- jadwal ---------- */

/**
 * Bentrok jadwal, diperiksa **di server**.
 *
 * Klien juga memeriksanya supaya pesannya muncul seketika, tapi pemeriksaan itu
 * tidak bisa dipercaya: ia hanya melihat slot yang sedang ada di memori. Ini
 * yang menentukan.
 */
export async function checkSlotConflict(db, workspaceId, form) {
  const dayIndex = DAY_NAMES.indexOf(form.day);
  const startMin = labelToMinutes(form.start);
  const endMin = labelToMinutes(form.end);
  if (!(endMin > startMin)) return "Jam selesai harus setelah jam mulai.";

  const [teacher] = await db
    .select({ teacherId: s.teachingAssignments.teacherId })
    .from(s.teachingAssignments)
    .where(
      scoped(
        s.teachingAssignments,
        workspaceId,
        and(eq(s.teachingAssignments.subjectId, form.subjectId), eq(s.teachingAssignments.classId, form.classId)),
      ),
    )
    .limit(1);

  const rows = await db
    .select({
      id: s.subjectSlots.id,
      classId: s.subjectSlots.classId,
      subjectId: s.subjectSlots.subjectId,
      startMin: s.subjectSlots.startMin,
      endMin: s.subjectSlots.endMin,
      roomName: s.subjectSlots.roomName,
    })
    .from(s.subjectSlots)
    .where(scoped(s.subjectSlots, workspaceId, eq(s.subjectSlots.dayIndex, dayIndex)));

  const assignments = await db
    .select({
      teacherId: s.teachingAssignments.teacherId,
      subjectId: s.teachingAssignments.subjectId,
      classId: s.teachingAssignments.classId,
    })
    .from(s.teachingAssignments)
    .where(scoped(s.teachingAssignments, workspaceId));

  const teacherOf = (subjectId, classId) => {
    const hit = assignments.find((a) => a.subjectId === subjectId && a.classId === classId);
    return hit ? hit.teacherId : null;
  };

  const hit = rows.find((r) => {
    if (r.id === form.id) return false;
    if (r.endMin <= startMin || r.startMin >= endMin) return false;
    const sameClass = r.classId === form.classId;
    const sameRoom = r.roomName && form.room && r.roomName.toLowerCase() === form.room.toLowerCase();
    const sameTeacher = teacher && teacherOf(r.subjectId, r.classId) === teacher.teacherId;
    return sameClass || sameRoom || sameTeacher;
  });
  if (!hit) return null;

  const [subject] = await db
    .select({ name: s.subjects.name })
    .from(s.subjects)
    .where(scoped(s.subjects, workspaceId, eq(s.subjects.id, hit.subjectId)))
    .limit(1);
  const [klass] = await db
    .select({ name: s.classes.name })
    .from(s.classes)
    .where(scoped(s.classes, workspaceId, eq(s.classes.id, hit.classId)))
    .limit(1);

  const label = (m) => String(Math.floor(m / 60)).padStart(2, "0") + "." + String(m % 60).padStart(2, "0");
  const window = label(hit.startMin) + "–" + label(hit.endMin);
  const subjectName = subject ? subject.name : hit.subjectId;
  const className = klass ? klass.name : hit.classId;

  if (hit.classId === form.classId) return `Bentrok: ${className} sudah ada ${subjectName} ${window}.`;
  if (hit.roomName && form.room && hit.roomName.toLowerCase() === form.room.toLowerCase()) {
    return `Bentrok ruangan: ${hit.roomName} dipakai ${className} (${subjectName}) ${window}.`;
  }
  return `Bentrok guru: mengajar ${className} ${window}.`;
}

export async function saveSlot(db, workspaceId, { id, form, at }) {
  const conflict = await checkSlotConflict(db, workspaceId, form);
  if (conflict) return { error: conflict };

  const trail = async () =>
    derive(async () => {
      const mapel = await nameOf(db, workspaceId, s.subjects, form.subjectId);
      const kelas = await nameOf(db, workspaceId, s.classes, form.classId);
      const kapan = `${form.day} ${form.start}`;

      await logActivity(db, workspaceId, {
        text: form.id
          ? `Jadwal ${mapel} ${kelas} dipindah ke ${kapan}`
          : `Jadwal ${mapel} ${kelas} ditambahkan ${kapan}`,
        color: "#6D4AFF",
        at,
      });

      const me = await demoStudent(db, workspaceId);
      if (!me || me.classId !== form.classId) return;
      const ruang = form.room ? ` di ${form.room}` : "";
      await notify(db, workspaceId, {
        kind: "Jadwal berubah",
        text: `${mapel} ${form.id ? "dipindah" : "ditambahkan"} ke ${kapan}${ruang} oleh TU`,
        target: { screen: "calendar" },
        at,
      });
    });

  const row = {
    classId: form.classId,
    subjectId: form.subjectId,
    dayIndex: DAY_NAMES.indexOf(form.day),
    startMin: labelToMinutes(form.start),
    endMin: labelToMinutes(form.end),
    roomName: form.room ?? null,
  };

  if (form.id) {
    await db.update(s.subjectSlots).set(row).where(scoped(s.subjectSlots, workspaceId, eq(s.subjectSlots.id, form.id)));
    await trail();
    return { ok: true };
  }

  const [{ next } = { next: 0 }] = await db
    .select({ next: sql`coalesce(max(${s.subjectSlots.sortOrder}), 0) + 1` })
    .from(s.subjectSlots)
    .where(scoped(s.subjectSlots, workspaceId));

  await db.insert(s.subjectSlots).values({ workspaceId, id, ...row, sortOrder: Number(next) });
  await trail();
  return { ok: true };
}

export async function deleteSlot(db, workspaceId, { id }) {
  await db.delete(s.subjectSlots).where(scoped(s.subjectSlots, workspaceId, eq(s.subjectSlots.id, id)));
  return { ok: true };
}

/* ---------- siswa ---------- */

export async function addStudent(db, workspaceId, { id, classId, name, nis, initials }) {
  if (!name || !name.trim()) return { error: "Nama siswa belum diisi." };

  const [{ next } = { next: 0 }] = await db
    .select({ next: sql`coalesce(max(${s.students.sortOrder}), 0) + 1` })
    .from(s.students)
    .where(scoped(s.students, workspaceId));

  await db.insert(s.students).values({
    workspaceId,
    id,
    classId,
    name: name.trim(),
    nis,
    nisn: null,
    initials,
    isMe: false,
    sortOrder: Number(next),
  });
  return { ok: true };
}

export async function removeStudent(db, workspaceId, { id }) {
  await db.delete(s.submissions).where(scoped(s.submissions, workspaceId, eq(s.submissions.studentId, id)));
  await db.delete(s.students).where(scoped(s.students, workspaceId, eq(s.students.id, id)));
  return { ok: true };
}

/* ---------- kelas ---------- */

export async function saveClass(db, workspaceId, { id, editId, name, level, major, homeroomTeacherId }) {
  if (editId) {
    await db
      .update(s.classes)
      .set({ name, level, major, homeroomTeacherId: homeroomTeacherId ?? null })
      .where(scoped(s.classes, workspaceId, eq(s.classes.id, editId)));
    return { ok: true };
  }

  const [{ next } = { next: 0 }] = await db
    .select({ next: sql`coalesce(max(${s.classes.sortOrder}), 0) + 1` })
    .from(s.classes)
    .where(scoped(s.classes, workspaceId));

  await db.insert(s.classes).values({
    workspaceId,
    id,
    name,
    level,
    major,
    homeroomTeacherId: homeroomTeacherId ?? null,
    roomName: null,
    newMaterials: 0,
    sortOrder: Number(next),
  });
  return { ok: true };
}

/** Menghapus kelas ikut membawa siswa, jadwal, tugas, dan pengumpulannya. */
export async function deleteClass(db, workspaceId, { id }) {
  const tasks = await db
    .select({ id: s.tasks.id })
    .from(s.tasks)
    .where(scoped(s.tasks, workspaceId, eq(s.tasks.classId, id)));
  for (const t of tasks) {
    await db.delete(s.submissions).where(scoped(s.submissions, workspaceId, eq(s.submissions.taskId, t.id)));
  }
  const students = await db
    .select({ id: s.students.id })
    .from(s.students)
    .where(scoped(s.students, workspaceId, eq(s.students.classId, id)));
  for (const st of students) {
    await db.delete(s.submissions).where(scoped(s.submissions, workspaceId, eq(s.submissions.studentId, st.id)));
  }
  await db.delete(s.tasks).where(scoped(s.tasks, workspaceId, eq(s.tasks.classId, id)));
  await db.delete(s.students).where(scoped(s.students, workspaceId, eq(s.students.classId, id)));
  await db.delete(s.subjectSlots).where(scoped(s.subjectSlots, workspaceId, eq(s.subjectSlots.classId, id)));
  await db
    .delete(s.teachingAssignments)
    .where(scoped(s.teachingAssignments, workspaceId, eq(s.teachingAssignments.classId, id)));
  await db.delete(s.classes).where(scoped(s.classes, workspaceId, eq(s.classes.id, id)));
  return { ok: true };
}

/* ---------- penugasan ---------- */

export async function saveAssignment(db, workspaceId, { teacherId, subjectId, classIds, replace }) {
  if (!classIds || !classIds.length) return { error: "Pilih minimal satu kelas." };

  const mine = and(eq(s.teachingAssignments.teacherId, teacherId), eq(s.teachingAssignments.subjectId, subjectId));
  const existing = await db
    .select({ classId: s.teachingAssignments.classId })
    .from(s.teachingAssignments)
    .where(scoped(s.teachingAssignments, workspaceId, mine));

  const target = replace ? classIds : [...new Set(existing.map((e) => e.classId).concat(classIds))];

  await db.delete(s.teachingAssignments).where(scoped(s.teachingAssignments, workspaceId, mine));
  if (target.length) {
    await db
      .insert(s.teachingAssignments)
      .values(target.map((classId, i) => ({ workspaceId, teacherId, subjectId, classId, sortOrder: i })));
  }
  return { ok: true };
}

export async function removeAssignment(db, workspaceId, { teacherId, subjectId }) {
  await db
    .delete(s.teachingAssignments)
    .where(
      scoped(
        s.teachingAssignments,
        workspaceId,
        and(eq(s.teachingAssignments.teacherId, teacherId), eq(s.teachingAssignments.subjectId, subjectId)),
      ),
    );
  return { ok: true };
}

/* ---------- mata pelajaran ---------- */

/** Ditolak kalau masih dipakai — bukan dihapus dan meninggalkan baris tanpa induk. */
export async function deleteSubject(db, workspaceId, { id }) {
  const [slots] = await db
    .select({ n: sql`count(*)::int` })
    .from(s.subjectSlots)
    .where(scoped(s.subjectSlots, workspaceId, eq(s.subjectSlots.subjectId, id)));
  const [tasks] = await db
    .select({ n: sql`count(*)::int` })
    .from(s.tasks)
    .where(scoped(s.tasks, workspaceId, and(eq(s.tasks.subjectId, id), eq(s.tasks.isArchived, false))));

  const used = [Number(slots.n) && Number(slots.n) + " slot jadwal", Number(tasks.n) && Number(tasks.n) + " tugas"]
    .filter(Boolean)
    .join(" · ");
  if (used) return { error: "Masih dipakai di " + used + "." };

  await db
    .delete(s.teachingAssignments)
    .where(scoped(s.teachingAssignments, workspaceId, eq(s.teachingAssignments.subjectId, id)));
  await db.delete(s.subjects).where(scoped(s.subjects, workspaceId, eq(s.subjects.id, id)));
  return { ok: true };
}

/* ---------- notifikasi ---------- */

export async function markNotificationsRead(db, workspaceId, { at }) {
  await db
    .update(s.notifications)
    .set({ readAt: at })
    .where(scoped(s.notifications, workspaceId, sql`${s.notifications.readAt} is null`));
  return { ok: true };
}
