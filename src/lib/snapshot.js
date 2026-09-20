import {
  ACTIVITY,
  CLASSES,
  MATERIALS,
  NOTIFICATIONS,
  STUDENTS,
  SUBJECTS,
  SUBMISSIONS,
  TASKS,
  TEACHERS,
  TEACHING_ASSIGNMENTS,
  makeSlots,
} from "./data.js";

/**
 * Bentuk data yang dikonsumsi `useSekelas`.
 *
 * Ini satu-satunya kontrak antara sumber data dan view-model: hook-nya tidak
 * lagi mengimpor konstanta apa pun, cukup diberi objek berbentuk ini. Dengan
 * begitu sumbernya bisa ditukar — seed lokal (mode frozen, CI, tanpa database)
 * atau hasil query Postgres — tanpa menyentuh satu pun layar.
 *
 * Urutan baris **bermakna**: banyak daftar di layar dirender apa adanya, jadi
 * query database harus mengembalikan urutan yang sama (lihat `sortOrder` /
 * `createdAt` di skema).
 */
export const SNAPSHOT_TABLES = [
  "subjects",
  "classes",
  "teachers",
  "teachingAssignments",
  "students",
  "slots",
  "tasks",
  "submissions",
  "materials",
  "notifications",
  "activity",
];

/** Snapshot dari seed di `data.js` — tanpa menyentuh database. */
export function localSnapshot() {
  return {
    subjects: SUBJECTS.map((s) => ({ ...s })),
    classes: CLASSES.map((c) => ({ ...c })),
    teachers: TEACHERS.map((t) => ({ ...t })),
    teachingAssignments: TEACHING_ASSIGNMENTS.map((a) => ({ ...a })),
    students: STUDENTS.map((s) => ({ ...s })),
    slots: makeSlots(),
    tasks: TASKS.map((t) => ({ ...t })),
    submissions: SUBMISSIONS.map((s) => ({ ...s })),
    materials: MATERIALS.map((m) => ({ ...m })),
    notifications: NOTIFICATIONS.map((n) => ({ ...n })),
    activity: ACTIVITY.map((a) => ({ ...a })),
  };
}

/**
 * Melewatkan snapshot dari Server Component ke klien berarti melewati
 * serialisasi JSON, yang mengubah `Date` jadi string. Semua turunan waktu
 * mengandalkan `Date`, jadi dikembalikan di sini.
 */
const DATE_FIELDS = {
  tasks: ["dueAt"],
  submissions: ["checkedOffAt", "submittedAt", "gradedAt"],
  materials: ["createdAt"],
  notifications: ["createdAt", "readAt"],
  activity: ["createdAt"],
};

export function reviveSnapshot(snapshot) {
  const out = {};
  for (const table of SNAPSHOT_TABLES) {
    const fields = DATE_FIELDS[table];
    const rows = snapshot[table] || [];
    out[table] = fields
      ? rows.map((row) => {
          const next = { ...row };
          for (const f of fields) if (typeof next[f] === "string") next[f] = new Date(next[f]);
          return next;
        })
      : rows.map((row) => ({ ...row }));
  }
  return out;
}
