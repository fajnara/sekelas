import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Skema Sekelas.
 *
 * Dua keputusan yang menopang semuanya:
 *
 * 1. **Primary key komposit `(workspaceId, id)` dengan id bertipe teks**
 *    (`'mat'`, `'11ipa2'`, `'t1'`, `'a1'`) — bukan uuid. Semua foreign key
 *    menunjuk id teks, sehingga menyalin satu workspace jadi sekadar
 *    `INSERT … SELECT` tanpa perlu memetakan ulang id. Itu yang membuat sandbox
 *    per pengunjung di Fase 4 murah.
 * 2. **Tidak ada kolom yang bisa dihitung.** Tidak ada jumlah siswa, tidak ada
 *    hitungan pengumpulan, tidak ada status pengumpulan, tidak ada label waktu.
 *    Setiap angka semacam itu pernah jadi sumber ketidakcocokan di prototipe.
 *
 * `sortOrder` dan `createdAt` bukan hiasan: banyak daftar di layar dirender apa
 * adanya, jadi query harus bisa mengembalikan urutan yang sama seperti seed.
 */

const ws = () => uuid("workspace_id").notNull();
const rowId = () => text("id").notNull();

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  // 'template' disalin untuk tiap pengunjung baru; 'demo' milik pengunjung.
  kind: text("kind").notNull().default("demo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Katalog ruangan — global, hanya dibaca. */
export const rooms = pgTable("rooms", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  capacity: smallint("capacity").notNull(),
  floor: smallint("floor").notNull(),
});

export const subjects = pgTable(
  "subjects",
  {
    workspaceId: ws(),
    id: rowId(),
    name: text("name").notNull(),
    abbr: text("abbr").notNull(),
    // Keenam warna tidak bisa diturunkan dari satu nilai, jadi disimpan semua.
    color: text("color").notNull(),
    onColor: text("on_color").notNull(),
    tint: text("tint").notNull(),
    border: text("border").notNull(),
    ink: text("ink").notNull(),
    attendance: text("attendance").notNull(),
    room: text("room"),
    sortOrder: smallint("sort_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.id] })],
);

export const teachers = pgTable(
  "teachers",
  {
    workspaceId: ws(),
    id: rowId(),
    name: text("name").notNull(),
    degree: text("degree"),
    email: text("email").notNull(),
    initials: text("initials").notNull(),
    nip: text("nip"),
    phone: text("phone"),
    status: text("status"),
    since: smallint("since"),
    sortOrder: smallint("sort_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.id] })],
);

export const classes = pgTable(
  "classes",
  {
    workspaceId: ws(),
    id: rowId(),
    name: text("name").notNull(),
    level: text("level").notNull(),
    major: text("major").notNull(),
    // Wali kelas sebagai FK, bukan nama — nama guru bisa berubah.
    homeroomTeacherId: text("homeroom_teacher_id"),
    roomName: text("room_name"),
    newMaterials: smallint("new_materials").notNull().default(0),
    sortOrder: smallint("sort_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.id] })],
);

/** Satu baris per (guru, mapel, kelas) — grain aslinya. */
export const teachingAssignments = pgTable(
  "teaching_assignments",
  {
    workspaceId: ws(),
    teacherId: text("teacher_id").notNull(),
    subjectId: text("subject_id").notNull(),
    classId: text("class_id").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.teacherId, t.subjectId, t.classId] })],
);

export const students = pgTable(
  "students",
  {
    workspaceId: ws(),
    id: rowId(),
    classId: text("class_id").notNull(),
    name: text("name").notNull(),
    nis: text("nis").notNull(),
    nisn: text("nisn"),
    initials: text("initials").notNull(),
    /** Menandai siswa yang dipakai sebagai persona demo. */
    isMe: boolean("is_me").notNull().default(false),
    sortOrder: smallint("sort_order").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.id] }),
    uniqueIndex("students_nis_per_class").on(t.workspaceId, t.classId, t.nis),
  ],
);

export const subjectSlots = pgTable(
  "subject_slots",
  {
    workspaceId: ws(),
    id: rowId(),
    classId: text("class_id").notNull(),
    subjectId: text("subject_id").notNull(),
    dayIndex: smallint("day_index").notNull(),
    /** Menit sejak tengah malam — bukan string "07.30", supaya bisa diurutkan. */
    startMin: smallint("start_min").notNull(),
    endMin: smallint("end_min").notNull(),
    roomName: text("room_name"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.id] })],
);

export const tasks = pgTable(
  "tasks",
  {
    workspaceId: ws(),
    id: rowId(),
    classId: text("class_id").notNull(),
    subjectId: text("subject_id").notNull(),
    createdByTeacherId: text("created_by_teacher_id"),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    kind: text("kind").notNull(),
    groupSize: smallint("group_size"),
    weightPct: numeric("weight_pct", { precision: 5, scale: 2 }).notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    /** Lampiran — ditulis sekali, tidak pernah di-query per baris. */
    attachments: jsonb("attachments").notNull().default([]),
    /** Riwayat nilai: nyata sebagai tugas, tapi di luar daftar tugas aktif. */
    isArchived: boolean("is_archived").notNull().default(false),
    /** Nomor 1–8 sisi siswa, supaya `?taskId=2` dari katalog desain tetap jalan. */
    legacyNo: smallint("legacy_no"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.id] })],
);

/**
 * Pengumpulan. Menggantikan `done`, `sub`, `grade`, `submittedAt`, `file`,
 * peta nilai berkunci nama, **dan** kolom hitungan `submitted`.
 *
 * `checkedOffAt` dan `submittedAt` dipisah karena desain membedakan keduanya:
 * mencentang tugas tidak sama dengan mengumpulkan file.
 */
export const submissions = pgTable(
  "submissions",
  {
    workspaceId: ws(),
    id: rowId(),
    taskId: text("task_id").notNull(),
    studentId: text("student_id").notNull(),
    checkedOffAt: timestamp("checked_off_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    fileName: text("file_name"),
    storagePath: text("storage_path"),
    note: text("note"),
    score: smallint("score"),
    feedback: text("feedback"),
    gradedAt: timestamp("graded_at", { withTimezone: true }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.id] }),
    uniqueIndex("submissions_one_per_student").on(t.workspaceId, t.taskId, t.studentId),
  ],
);

export const materials = pgTable(
  "materials",
  {
    workspaceId: ws(),
    id: rowId(),
    subjectId: text("subject_id").notNull(),
    name: text("name").notNull(),
    ext: text("ext").notNull(),
    /** Byte, bukan "2,4 MB" — supaya totalnya dijumlahkan, bukan di-parse. */
    sizeBytes: integer("size_bytes").notNull(),
    storagePath: text("storage_path"),
    uploadedByTeacherId: text("uploaded_by_teacher_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.id] })],
);

export const notifications = pgTable(
  "notifications",
  {
    workspaceId: ws(),
    id: rowId(),
    kind: text("kind").notNull(),
    text: text("text").notNull(),
    /** Ke mana notifikasi membawa, mis. `{"screen":"taskDetail","legacyTaskNo":6}`. */
    target: jsonb("target").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.id] })],
);

export const activityLog = pgTable(
  "activity_log",
  {
    workspaceId: ws(),
    id: rowId(),
    text: text("text").notNull(),
    color: text("color").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.id] })],
);

/** Urut FK — dipakai saat menyalin workspace dan saat seeding. */
export const WORKSPACE_TABLES = [
  subjects,
  teachers,
  classes,
  teachingAssignments,
  students,
  subjectSlots,
  tasks,
  submissions,
  materials,
  notifications,
  activityLog,
];

export const workspaceRelations = relations(workspaces, ({ many }) => ({
  subjects: many(subjects),
  classes: many(classes),
}));
