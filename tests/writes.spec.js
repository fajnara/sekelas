import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import { DEMO_NOW } from "../src/lib/clock.js";
import { createPgliteDb } from "../src/lib/db/client.js";
import { loadWorkspaceSnapshot } from "../src/lib/db/queries.js";
import { seedTemplate } from "../src/lib/db/seed.js";
import { getOrCreateWorkspace } from "../src/lib/db/workspace.js";
import * as writes from "../src/lib/db/writes.js";

/**
 * Setiap operasi tulis diuji langsung di Postgres.
 *
 * Logikanya sengaja dipisah dari Server Action supaya bisa diuji seperti ini:
 * action-nya cuma adaptor yang membaca cookie lalu memanggil fungsi di sini.
 *
 * Dua hal yang paling ingin dibuktikan:
 * 1. Setiap tulisan **benar-benar** tersimpan, bukan hanya tampak berubah.
 * 2. Tulisan satu pengunjung tidak bisa menyentuh data pengunjung lain.
 */

test.describe.configure({ mode: "serial" });

const A = "aaaaaaaa-1111-4111-8111-111111111111";
const B = "bbbbbbbb-2222-4222-8222-222222222222";

let pg;
let db;

test.beforeAll(async () => {
  const created = await createPgliteDb();
  db = created.db;
  pg = created.raw;
  const dir = join(process.cwd(), "drizzle");
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
    for (const stmt of readFileSync(join(dir, f), "utf8").split("--> statement-breakpoint")) {
      if (stmt.trim()) await pg.exec(stmt);
    }
  }
  await seedTemplate(db);
  await getOrCreateWorkspace(db, A);
  await getOrCreateWorkspace(db, B);
});

test.afterAll(async () => {
  if (pg) await pg.close();
});

const snap = (ws) => loadWorkspaceSnapshot(ws, db);
const at = DEMO_NOW;

/** Siswa persona di sandbox tertentu. */
async function meId(ws) {
  const s = await snap(ws);
  return s.students.find((x) => x.isMe).id;
}

test("siswa mengumpulkan tugas, lalu menariknya kembali", async () => {
  const me = await meId(A);
  const before = await snap(A);
  const task = before.tasks.find((t) => t.legacyNo === 1);
  expect(before.submissions.find((s) => s.taskId === task.id && s.studentId === me)).toBeUndefined();

  await writes.submitTask(db, A, {
    id: "sub_new",
    taskId: task.id,
    studentId: me,
    fileName: "Tugas-Alya.pdf",
    note: "catatan",
    at,
  });

  let row = (await snap(A)).submissions.find((s) => s.taskId === task.id && s.studentId === me);
  expect(row.submittedAt).toBeTruthy();
  expect(row.fileName).toBe("Tugas-Alya.pdf");
  expect(row.note).toBe("catatan");

  await writes.unsubmitTask(db, A, { id: "sub_new", taskId: task.id, studentId: me });
  row = (await snap(A)).submissions.find((s) => s.taskId === task.id && s.studentId === me);
  // Barisnya tetap ada, isinya dikosongkan — bukan dihapus.
  expect(row.submittedAt).toBeNull();
  expect(row.fileName).toBeNull();
});

test("mencentang tugas tidak sama dengan mengumpulkan", async () => {
  const me = await meId(A);
  const task = (await snap(A)).tasks.find((t) => t.legacyNo === 3);

  await writes.toggleTask(db, A, { id: "sub_tog", taskId: task.id, studentId: me, done: true, at });
  let row = (await snap(A)).submissions.find((s) => s.taskId === task.id && s.studentId === me);
  expect(row.checkedOffAt).toBeTruthy();
  expect(row.submittedAt).toBeNull();

  await writes.toggleTask(db, A, { id: "sub_tog", taskId: task.id, studentId: me, done: false, at });
  row = (await snap(A)).submissions.find((s) => s.taskId === task.id && s.studentId === me);
  expect(row.checkedOffAt).toBeNull();
});

test("guru menilai; nilai di luar rentang ditolak", async () => {
  const before = await snap(A);
  const task = before.tasks.find((t) => t.id === "a1");
  const student = before.students.find((s) => s.classId === "11ipa2" && !s.isMe);

  const bad = await writes.gradeSubmission(db, A, {
    id: "sub_g",
    taskId: task.id,
    studentId: student.id,
    score: "bukan angka",
    at,
  });
  expect(bad.error).toBeTruthy();

  await writes.gradeSubmission(db, A, { id: "sub_g", taskId: task.id, studentId: student.id, score: 91, note: "bagus", at });
  const row = (await snap(A)).submissions.find((s) => s.taskId === task.id && s.studentId === student.id);
  expect(row.score).toBe(91);
  expect(row.feedback).toBe("bagus");
  // Menilai menandai tugasnya masuk, walau sebelumnya belum tercatat.
  expect(row.submittedAt).toBeTruthy();

  // Di atas 100 dipotong, bukan ditolak — sesuai perilaku desain.
  await writes.gradeSubmission(db, A, { id: "sub_g", taskId: task.id, studentId: student.id, score: 250, at });
  const capped = (await snap(A)).submissions.find((s) => s.taskId === task.id && s.studentId === student.id);
  expect(capped.score).toBe(100);
});

test("guru membuat, mengubah, dan menghapus tugas", async () => {
  await writes.saveTask(db, A, {
    id: "t_new",
    classId: "11ipa2",
    teacherId: "t1",
    at,
    fields: { subjectId: "mat", title: "Tugas uji", desc: "d", kind: "Individu", groupSize: 4, weightPct: 12, dueAt: at },
  });
  let row = (await snap(A)).tasks.find((t) => t.id === "t_new");
  expect(row.title).toBe("Tugas uji");
  expect(row.weightPct).toBe(12);

  await writes.saveTask(db, A, {
    editId: "t_new",
    classId: "11ipa2",
    teacherId: "t1",
    at,
    fields: { subjectId: "mat", title: "Judul baru", desc: "d", kind: "Kuis", groupSize: null, weightPct: 5, dueAt: at },
  });
  row = (await snap(A)).tasks.find((t) => t.id === "t_new");
  expect(row.title).toBe("Judul baru");
  expect(row.kind).toBe("Kuis");

  await writes.deleteTask(db, A, { id: "t_new" });
  expect((await snap(A)).tasks.find((t) => t.id === "t_new")).toBeUndefined();
});

test("menghapus tugas ikut membawa pengumpulannya", async () => {
  const before = await snap(A);
  const withSubs = before.submissions.filter((s) => s.taskId === "a2").length;
  expect(withSubs).toBeGreaterThan(0);

  await writes.deleteTask(db, A, { id: "a2" });
  const after = await snap(A);
  expect(after.submissions.filter((s) => s.taskId === "a2")).toHaveLength(0);
});

test("bentrok jadwal ditolak di server, dengan alasannya", async () => {
  const slots = (await snap(A)).slots;
  const taken = slots.find((s) => s.classId === "11ipa2");

  const clash = await writes.saveSlot(db, A, {
    id: "slot_new",
    at,
    form: {
      id: null,
      classId: "11ipa2",
      subjectId: taken.subjectId,
      day: taken.day,
      start: taken.start,
      end: taken.end,
      room: taken.room,
    },
  });
  expect(clash.error).toContain("Bentrok");

  const backwards = await writes.saveSlot(db, A, {
    id: "slot_x",
    at,
    form: { id: null, classId: "11ipa2", subjectId: "mat", day: "Sabtu", start: "10.00", end: "09.00", room: "Ruang 202" },
  });
  expect(backwards.error).toContain("Jam selesai");

  // Hari Sabtu belum terpakai sama sekali, jadi ini harus lolos.
  const ok = await writes.saveSlot(db, A, {
    id: "slot_new",
    at,
    form: { id: null, classId: "11ipa2", subjectId: "mat", day: "Sabtu", start: "07.30", end: "09.00", room: "Ruang 909" },
  });
  expect(ok.ok).toBe(true);
  const saved = (await snap(A)).slots.find((s) => s.id === "slot_new");
  expect(saved.day).toBe("Sabtu");
  expect(saved.start).toBe("07.30");

  await writes.deleteSlot(db, A, { id: "slot_new" });
  expect((await snap(A)).slots.find((s) => s.id === "slot_new")).toBeUndefined();
});

test("TU menambah dan mengeluarkan siswa", async () => {
  const empty = await writes.addStudent(db, A, { id: "s_x", classId: "11ipa2", name: "   ", nis: "1", initials: "X" });
  expect(empty.error).toBeTruthy();

  await writes.addStudent(db, A, { id: "s_x", classId: "11ipa2", name: "Uji Siswa", nis: "2299999", initials: "US" });
  expect((await snap(A)).students.find((s) => s.id === "s_x").name).toBe("Uji Siswa");

  await writes.removeStudent(db, A, { id: "s_x" });
  expect((await snap(A)).students.find((s) => s.id === "s_x")).toBeUndefined();
});

test("menghapus kelas membersihkan siswa, jadwal, tugas, dan pengumpulannya", async () => {
  const before = await snap(A);
  expect(before.students.filter((s) => s.classId === "11ips1").length).toBeGreaterThan(0);
  const taskIds = before.tasks.filter((t) => t.classId === "11ips1").map((t) => t.id);
  expect(taskIds.length).toBeGreaterThan(0);

  await writes.deleteClass(db, A, { id: "11ips1" });

  const after = await snap(A);
  expect(after.classes.find((c) => c.id === "11ips1")).toBeUndefined();
  expect(after.students.filter((s) => s.classId === "11ips1")).toHaveLength(0);
  expect(after.slots.filter((s) => s.classId === "11ips1")).toHaveLength(0);
  expect(after.tasks.filter((t) => t.classId === "11ips1")).toHaveLength(0);
  expect(after.submissions.filter((s) => taskIds.includes(s.taskId))).toHaveLength(0);
});

test("penugasan bisa ditambah, ditimpa, dan dihapus", async () => {
  const none = await writes.saveAssignment(db, A, { teacherId: "t1", subjectId: "mat", classIds: [] });
  expect(none.error).toBeTruthy();

  await writes.saveAssignment(db, A, { teacherId: "t5", subjectId: "mat", classIds: ["10ipa1"], replace: false });
  let mine = (await snap(A)).teachingAssignments.filter((a) => a.teacherId === "t5" && a.subjectId === "mat");
  expect(mine.map((a) => a.classId)).toEqual(["10ipa1"]);

  await writes.saveAssignment(db, A, { teacherId: "t5", subjectId: "mat", classIds: ["10ips1"], replace: false });
  mine = (await snap(A)).teachingAssignments.filter((a) => a.teacherId === "t5" && a.subjectId === "mat");
  expect(mine.map((a) => a.classId).sort()).toEqual(["10ipa1", "10ips1"]);

  await writes.saveAssignment(db, A, { teacherId: "t5", subjectId: "mat", classIds: ["12ipa1"], replace: true });
  mine = (await snap(A)).teachingAssignments.filter((a) => a.teacherId === "t5" && a.subjectId === "mat");
  expect(mine.map((a) => a.classId)).toEqual(["12ipa1"]);

  await writes.removeAssignment(db, A, { teacherId: "t5", subjectId: "mat" });
  mine = (await snap(A)).teachingAssignments.filter((a) => a.teacherId === "t5" && a.subjectId === "mat");
  expect(mine).toHaveLength(0);
});

test("mapel yang masih dipakai tidak bisa dihapus", async () => {
  const refused = await writes.deleteSubject(db, A, { id: "mat" });
  expect(refused.error).toContain("Masih dipakai");
  expect((await snap(A)).subjects.find((s) => s.id === "mat")).toBeTruthy();
});

test("materi bisa diunggah dan dihapus", async () => {
  await writes.addMaterial(db, A, {
    id: "m_x",
    subjectId: "mat",
    name: "Materi Uji.pdf",
    ext: "PDF",
    sizeBytes: 1024,
    teacherId: "t1",
    at,
  });
  expect((await snap(A)).materials.find((m) => m.id === "m_x").name).toBe("Materi Uji.pdf");

  await writes.deleteMaterial(db, A, { id: "m_x" });
  expect((await snap(A)).materials.find((m) => m.id === "m_x")).toBeUndefined();
});

test("notifikasi bisa ditandai terbaca", async () => {
  expect((await snap(A)).notifications.filter((n) => !n.readAt).length).toBeGreaterThan(0);
  await writes.markNotificationsRead(db, A, { at });
  expect((await snap(A)).notifications.filter((n) => !n.readAt)).toHaveLength(0);
});

/**
 * Aktivitas dan notifikasi lahir dari aksi nyata.
 *
 * Uji "notifikasi bisa ditandai terbaca" di atas sudah menandai semua terbaca,
 * jadi apa pun yang belum terbaca di bawah ini pasti baru lahir dari aksi.
 */
test("tugas baru meninggalkan jejak di aktivitas dan notifikasi siswa", async () => {
  await writes.saveTask(db, A, {
    id: "t_jejak",
    classId: "11ipa2",
    teacherId: "t1",
    at,
    fields: {
      subjectId: "mat",
      title: "Kuis limit lanjutan",
      desc: "d",
      kind: "Kuis",
      groupSize: null,
      weightPct: 8,
      dueAt: at,
    },
  });

  const s = await snap(A);

  // Baris baru harus di puncak: daftarnya dirender apa adanya, terbaru dulu.
  expect(s.activity[0].text).toBe("Ratna Dewi menambah tugas “Kuis limit lanjutan”");
  expect(s.activity[0].color).toBe("#10B981");
  expect(s.activity[0].createdAt).toEqual(at);

  const unread = s.notifications.filter((n) => !n.readAt);
  expect(unread).toHaveLength(1);
  expect(unread[0].kind).toBe("Tugas baru");
  expect(unread[0].text).toBe("Ratna Dewi menambah tugas “Kuis limit lanjutan” untuk XI IPA 2");
  // Tugas baru tidak punya nomor katalog, jadi notifikasinya menunjuk id.
  expect(unread[0].target).toEqual({ screen: "taskDetail", taskId: "t_jejak" });

  await writes.markNotificationsRead(db, A, { at });
});

test("tugas untuk kelas lain masuk aktivitas, tapi bukan notifikasi siswa", async () => {
  await writes.saveTask(db, A, {
    id: "t_kelas_lain",
    classId: "12ipa1",
    teacherId: "t1",
    at,
    fields: { subjectId: "mat", title: "Tugas kelas lain", desc: "", kind: "Individu", groupSize: null, weightPct: 5, dueAt: at },
  });

  const s = await snap(A);
  expect(s.activity[0].text).toContain("Tugas kelas lain");
  // Kotak notifikasi di desain adalah kotak satu siswa — dia tidak di 12 IPA 1.
  expect(s.notifications.filter((n) => !n.readAt)).toHaveLength(0);
});

test("jadwal yang dipindah masuk aktivitas dan memberi tahu kelasnya", async () => {
  const slot = (await snap(A)).slots.find((x) => x.classId === "11ipa2");

  await writes.saveSlot(db, A, {
    id: slot.id,
    at,
    form: { ...slot, day: "Sabtu", start: "13.00", end: "14.30", room: "Ruang 909" },
  });

  const s = await snap(A);
  expect(s.activity[0].color).toBe("#6D4AFF");
  expect(s.activity[0].text).toContain("dipindah ke Sabtu 13.00");

  const unread = s.notifications.filter((n) => !n.readAt);
  expect(unread).toHaveLength(1);
  expect(unread[0].kind).toBe("Jadwal berubah");
  expect(unread[0].text).toContain("dipindah ke Sabtu 13.00 di Ruang 909 oleh TU");
  expect(unread[0].target).toEqual({ screen: "calendar" });

  await writes.markNotificationsRead(db, A, { at });
});

test("materi terunggah masuk aktivitas, tanpa notifikasi", async () => {
  await writes.addMaterial(db, A, {
    id: "m_jejak",
    subjectId: "mat",
    name: "Rangkuman Limit.pdf",
    ext: "PDF",
    sizeBytes: 2048,
    teacherId: "t2",
    at,
  });

  const s = await snap(A);
  expect(s.activity[0].text).toBe("Hendra Susilo mengunggah materi “Rangkuman Limit.pdf”");
  expect(s.activity[0].color).toBe("#FACC15");
  // Desain tidak punya jenis notifikasi untuk materi; mengarangnya berarti
  // mengarang warna dan nada yang tidak pernah disebut.
  expect(s.notifications.filter((n) => !n.readAt)).toHaveLength(0);
});

test("nilai keluar hanya memberi tahu siswa yang dinilai", async () => {
  const before = await snap(A);
  const task = before.tasks.find((t) => t.id === "a1");
  const other = before.students.find((x) => x.classId === "11ipa2" && !x.isMe);

  // Siswa lain: tidak ada notifikasi, karena kotaknya bukan kotaknya.
  await writes.gradeSubmission(db, A, { id: "sub_n1", taskId: task.id, studentId: other.id, score: 80, at });
  expect((await snap(A)).notifications.filter((n) => !n.readAt)).toHaveLength(0);

  const me = await meId(A);
  await writes.gradeSubmission(db, A, { id: "sub_n2", taskId: task.id, studentId: me, score: 93, at });

  const unread = (await snap(A)).notifications.filter((n) => !n.readAt);
  expect(unread).toHaveLength(1);
  expect(unread[0].kind).toBe("Nilai keluar");
  expect(unread[0].text).toBe(`Nilai “${task.title}” sudah keluar: 93`);
  expect(unread[0].target).toEqual({ screen: "grades" });

  // Menilai tidak mengotori feed TU: desainnya memang tidak punya baris itu.
  expect((await snap(A)).activity[0].text).not.toContain("Nilai");
});

test("semua kerusakan di sandbox A tidak menyentuh sandbox B", async () => {
  // Uji-uji di atas sudah menghapus kelas, tugas, siswa, dan jadwal di A.
  const a = await snap(A);
  const b = await snap(B);

  expect(a.classes.find((c) => c.id === "11ips1")).toBeUndefined();
  expect(a.tasks.find((t) => t.id === "a2")).toBeUndefined();

  // B harus persis seperti template.
  expect(b.classes).toHaveLength(9);
  expect(b.students).toHaveLength(288);
  expect(b.tasks).toHaveLength(23);
  expect(b.submissions).toHaveLength(113);
  expect(b.notifications.filter((n) => !n.readAt)).toHaveLength(2);
  expect(b.slots).toHaveLength(80);
});
