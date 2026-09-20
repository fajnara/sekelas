import { and, asc, eq } from "drizzle-orm";

import { getDb } from "./client.js";
import { rowsToSnapshot } from "./mappers.js";
import * as s from "./schema.js";

/**
 * Membaca seluruh workspace dalam satu putaran query.
 *
 * Satu workspace hanya ~600 baris (5 mapel, 9 kelas, ~290 siswa, ~90 slot,
 * ~23 tugas, ~150 pengumpulan), jadi memuat semuanya sekaligus justru pilihan
 * yang benar: pemuatan sebagian akan memaksa `async` masuk ke lapisan turunan
 * yang kontraknya sinkron.
 *
 * `orderBy` bukan hiasan — banyak daftar di layar dirender apa adanya, jadi
 * urutannya harus sama dengan urutan seed.
 */
export async function loadWorkspaceSnapshot(workspaceId, dbArg) {
  const db = dbArg || (await getDb());
  const id = workspaceId || (await templateWorkspaceId(db));
  if (!id) throw new Error("Belum ada workspace. Jalankan `npm run db:seed` dulu.");

  const scoped = (table) => db.select().from(table).where(eq(table.workspaceId, id)).orderBy(asc(table.sortOrder));

  const [
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
  ] = await Promise.all([
    scoped(s.subjects),
    scoped(s.teachers),
    scoped(s.classes),
    scoped(s.teachingAssignments),
    scoped(s.students),
    scoped(s.subjectSlots),
    scoped(s.tasks),
    scoped(s.submissions),
    scoped(s.materials),
    scoped(s.notifications),
    scoped(s.activityLog),
  ]);

  return rowsToSnapshot({
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
  });
}

async function templateWorkspaceId(db) {
  const [row] = await db
    .select({ id: s.workspaces.id })
    .from(s.workspaces)
    .where(eq(s.workspaces.kind, "template"))
    .limit(1);
  return row && row.id;
}

export async function findWorkspace(db, id) {
  const [row] = await db.select().from(s.workspaces).where(and(eq(s.workspaces.id, id))).limit(1);
  return row || null;
}
