import { DAY_NAMES, mins } from "../data.js";

/**
 * Penerjemah dua arah antara baris database dan snapshot yang dipakai aplikasi.
 *
 * Bedanya sengaja: database menyimpan bentuk yang bisa diurutkan dan dijumlahkan
 * (`dayIndex`, menit integer), sedangkan aplikasi memakai bentuk yang siap
 * ditampilkan (`"Jumat"`, `"07.30"`) seperti di desain. Semua konversi hanya
 * terjadi di file ini, jadi tidak ada layar yang perlu tahu.
 */

const pad = (n) => String(n).padStart(2, "0");

/** 450 → "07.30" */
export const minutesToLabel = (m) => pad(Math.floor(m / 60)) + "." + pad(m % 60);

/** "07.30" → 450 */
export const labelToMinutes = (label) => mins(label);

/* ---------- database → snapshot ---------- */

export function rowsToSnapshot(rows) {
  return {
    subjects: rows.subjects.map((s) => ({
      id: s.id,
      name: s.name,
      abbr: s.abbr,
      color: s.color,
      onColor: s.onColor,
      tint: s.tint,
      border: s.border,
      ink: s.ink,
      attendance: s.attendance,
      room: s.room,
    })),
    classes: rows.classes.map((c) => ({
      id: c.id,
      name: c.name,
      level: c.level,
      major: c.major,
      homeroomTeacherId: c.homeroomTeacherId,
      roomName: c.roomName,
      newMaterials: c.newMaterials,
    })),
    teachers: rows.teachers.map((t) => ({
      id: t.id,
      name: t.name,
      degree: t.degree,
      email: t.email,
      initials: t.initials,
      nip: t.nip,
      phone: t.phone,
      status: t.status,
      since: t.since,
    })),
    teachingAssignments: rows.teachingAssignments.map((a) => ({
      teacherId: a.teacherId,
      subjectId: a.subjectId,
      classId: a.classId,
    })),
    students: rows.students.map((s) => ({
      id: s.id,
      classId: s.classId,
      name: s.name,
      nis: s.nis,
      nisn: s.nisn,
      initials: s.initials,
      isMe: s.isMe,
      sortOrder: s.sortOrder,
    })),
    slots: rows.subjectSlots.map((sl) => ({
      id: sl.id,
      classId: sl.classId,
      subjectId: sl.subjectId,
      day: DAY_NAMES[sl.dayIndex],
      start: minutesToLabel(sl.startMin),
      end: minutesToLabel(sl.endMin),
      room: sl.roomName,
    })),
    tasks: rows.tasks.map((t) => ({
      id: t.id,
      legacyNo: t.legacyNo,
      classId: t.classId,
      subjectId: t.subjectId,
      teacherId: t.createdByTeacherId,
      title: t.title,
      desc: t.description,
      kind: t.kind,
      groupSize: t.groupSize,
      // `numeric` kembali sebagai string dari Postgres.
      weightPct: Number(t.weightPct),
      dueAt: t.dueAt,
      files: t.attachments || [],
      isArchived: t.isArchived,
    })),
    submissions: rows.submissions.map((s) => ({
      id: s.id,
      taskId: s.taskId,
      studentId: s.studentId,
      checkedOffAt: s.checkedOffAt,
      submittedAt: s.submittedAt,
      fileName: s.fileName,
      note: s.note,
      score: s.score,
      feedback: s.feedback,
      gradedAt: s.gradedAt,
    })),
    materials: rows.materials.map((m) => ({
      id: m.id,
      subjectId: m.subjectId,
      name: m.name,
      ext: m.ext,
      sizeBytes: m.sizeBytes,
      createdAt: m.createdAt,
    })),
    notifications: rows.notifications.map((n) => ({
      id: n.id,
      kind: n.kind,
      text: n.text,
      createdAt: n.createdAt,
      readAt: n.readAt,
      target: n.target,
    })),
    activity: rows.activityLog.map((a) => ({
      id: a.id,
      text: a.text,
      color: a.color,
      createdAt: a.createdAt,
    })),
  };
}

/* ---------- snapshot → database ---------- */

/** `sortOrder` menjaga urutan baris, karena banyak daftar dirender apa adanya. */
const withOrder = (rows, workspaceId, map) =>
  rows.map((row, i) => ({ workspaceId, sortOrder: i, ...map(row) }));

export function snapshotToRows(snapshot, workspaceId) {
  return {
    subjects: withOrder(snapshot.subjects, workspaceId, (s) => ({
      id: s.id,
      name: s.name,
      abbr: s.abbr,
      color: s.color,
      onColor: s.onColor,
      tint: s.tint,
      border: s.border,
      ink: s.ink,
      attendance: s.attendance,
      room: s.room ?? null,
    })),
    teachers: withOrder(snapshot.teachers, workspaceId, (t) => ({
      id: t.id,
      name: t.name,
      degree: t.degree ?? null,
      email: t.email,
      initials: t.initials,
      nip: t.nip ?? null,
      phone: t.phone ?? null,
      status: t.status ?? null,
      since: t.since ?? null,
    })),
    classes: withOrder(snapshot.classes, workspaceId, (c) => ({
      id: c.id,
      name: c.name,
      level: c.level,
      major: c.major,
      homeroomTeacherId: c.homeroomTeacherId ?? null,
      roomName: c.roomName ?? null,
      newMaterials: c.newMaterials ?? 0,
    })),
    teachingAssignments: withOrder(snapshot.teachingAssignments, workspaceId, (a) => ({
      teacherId: a.teacherId,
      subjectId: a.subjectId,
      classId: a.classId,
    })),
    students: withOrder(snapshot.students, workspaceId, (s) => ({
      id: s.id,
      classId: s.classId,
      name: s.name,
      nis: s.nis,
      nisn: s.nisn ?? null,
      initials: s.initials,
      isMe: !!s.isMe,
    })),
    subjectSlots: withOrder(snapshot.slots, workspaceId, (sl) => ({
      id: sl.id,
      classId: sl.classId,
      subjectId: sl.subjectId,
      dayIndex: DAY_NAMES.indexOf(sl.day),
      startMin: labelToMinutes(sl.start),
      endMin: labelToMinutes(sl.end),
      roomName: sl.room ?? null,
    })),
    tasks: withOrder(snapshot.tasks, workspaceId, (t) => ({
      id: t.id,
      classId: t.classId,
      subjectId: t.subjectId,
      createdByTeacherId: t.teacherId ?? null,
      title: t.title,
      description: t.desc ?? "",
      kind: t.kind,
      groupSize: t.groupSize ?? null,
      weightPct: String(t.weightPct),
      dueAt: t.dueAt,
      attachments: t.files ?? [],
      isArchived: !!t.isArchived,
      legacyNo: t.legacyNo ?? null,
    })),
    submissions: withOrder(snapshot.submissions, workspaceId, (s) => ({
      id: s.id,
      taskId: s.taskId,
      studentId: s.studentId,
      checkedOffAt: s.checkedOffAt ?? null,
      submittedAt: s.submittedAt ?? null,
      fileName: s.fileName ?? null,
      storagePath: s.storagePath ?? null,
      note: s.note ?? null,
      score: s.score ?? null,
      feedback: s.feedback ?? null,
      gradedAt: s.gradedAt ?? null,
    })),
    materials: withOrder(snapshot.materials, workspaceId, (m) => ({
      id: m.id,
      subjectId: m.subjectId,
      name: m.name,
      ext: m.ext,
      sizeBytes: m.sizeBytes,
      storagePath: m.storagePath ?? null,
      uploadedByTeacherId: m.uploadedByTeacherId ?? null,
      createdAt: m.createdAt,
    })),
    notifications: withOrder(snapshot.notifications, workspaceId, (n) => ({
      id: n.id,
      kind: n.kind,
      text: n.text,
      target: n.target ?? {},
      createdAt: n.createdAt,
      readAt: n.readAt ?? null,
    })),
    activityLog: withOrder(snapshot.activity, workspaceId, (a) => ({
      id: a.id,
      text: a.text,
      color: a.color,
      createdAt: a.createdAt,
    })),
  };
}
