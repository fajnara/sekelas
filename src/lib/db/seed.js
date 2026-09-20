import { eq } from "drizzle-orm";

import { ROOMS } from "../data.js";
import { localSnapshot } from "../snapshot.js";
import { snapshotToRows } from "./mappers.js";
import * as s from "./schema.js";
import { deleteWorkspace } from "./workspace.js";

/** Postgres membatasi jumlah parameter per statement, jadi insert dipotong. */
const CHUNK = 500;

async function insertAll(db, table, rows) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db.insert(table).values(rows.slice(i, i + CHUNK));
  }
}

/**
 * Menulis workspace `template` dari seed lokal.
 *
 * Inilah satu-satunya tempat `makeSlots()` dan pembangkit roster benar-benar
 * dipakai untuk mengisi database. Di Fase 4, tiap pengunjung baru cukup
 * menyalin workspace ini — dan karena semua primary key berbentuk
 * `(workspaceId, id teks)`, penyalinannya tidak perlu memetakan ulang id.
 */
export async function seedTemplate(db) {
  const snapshot = localSnapshot();

  // Katalog ruangan bersifat global; aman ditulis ulang.
  await db.delete(s.rooms);
  await insertAll(
    db,
    s.rooms,
    ROOMS.map((r) => ({ code: r.code, name: r.name, type: r.type, capacity: r.capacity, floor: r.floor })),
  );

  // Cascade belum dipasang di Fase 3, jadi workspace lama dibersihkan manual.
  const existing = await db.select({ id: s.workspaces.id }).from(s.workspaces).where(eq(s.workspaces.kind, "template"));
  for (const w of existing) await deleteWorkspace(db, w.id);

  const [workspace] = await db.insert(s.workspaces).values({ kind: "template" }).returning();
  const rows = snapshotToRows(snapshot, workspace.id);

  // Urut sesuai ketergantungan, supaya tetap valid saat foreign key dipasang.
  await insertAll(db, s.subjects, rows.subjects);
  await insertAll(db, s.teachers, rows.teachers);
  await insertAll(db, s.classes, rows.classes);
  await insertAll(db, s.teachingAssignments, rows.teachingAssignments);
  await insertAll(db, s.students, rows.students);
  await insertAll(db, s.subjectSlots, rows.subjectSlots);
  await insertAll(db, s.tasks, rows.tasks);
  await insertAll(db, s.submissions, rows.submissions);
  await insertAll(db, s.materials, rows.materials);
  await insertAll(db, s.notifications, rows.notifications);
  await insertAll(db, s.activityLog, rows.activityLog);

  return {
    workspaceId: workspace.id,
    counts: Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, v.length])),
  };
}

/** Dipindah ke `workspace.js` — tempatnya bersama GC dan reset. */
export { deleteWorkspace };
