import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import { createPgliteDb } from "../src/lib/db/client.js";
import { loadWorkspaceSnapshot } from "../src/lib/db/queries.js";
import { seedTemplate } from "../src/lib/db/seed.js";
import { SNAPSHOT_TABLES, localSnapshot } from "../src/lib/snapshot.js";

/**
 * Menguji skema, migrasi, seed, dan query sungguhan di Postgres — yang berjalan
 * di dalam proses lewat PGlite, jadi tidak butuh server maupun rahasia apa pun
 * dan tetap bisa jalan di CI.
 *
 * Inti gerbangnya satu: snapshot yang keluar dari database harus **identik**
 * dengan seed lokal. Kalau tidak, aplikasi akan tampil berbeda begitu
 * `DATABASE_URL` dipasang — dan itu tidak akan tertangkap harness visual, karena
 * harness berjalan tanpa database.
 *
 * Satu instance PGlite dipakai bersama: membuat lalu menutup beberapa instance
 * dalam satu worker membuat WASM-nya crash.
 */

test.describe.configure({ mode: "serial" });

let pg;
let db;
let seeded;

test.beforeAll(async () => {
  const created = await createPgliteDb();
  db = created.db;
  pg = created.raw;

  const dir = join(process.cwd(), "drizzle");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  expect(files.length, "migrasi harus sudah di-generate (npm run db:generate)").toBeGreaterThan(0);
  for (const f of files) {
    // File migrasi Drizzle memisahkan statement dengan penanda ini.
    for (const stmt of readFileSync(join(dir, f), "utf8").split("--> statement-breakpoint")) {
      if (stmt.trim()) await pg.exec(stmt);
    }
  }

  seeded = await seedTemplate(db);
});

test.afterAll(async () => {
  if (pg) await pg.close();
});

/** Membandingkan tanpa terganggu urutan kunci atau Date vs string ISO. */
const canonical = (value) =>
  JSON.parse(JSON.stringify(value, (_k, v) => (v instanceof Date ? v.toISOString() : v)));

test("snapshot dari database identik dengan seed lokal", async () => {
  expect(seeded.workspaceId).toBeTruthy();

  const fromDb = await loadWorkspaceSnapshot(seeded.workspaceId, db);
  const local = localSnapshot();

  // Dibandingkan per tabel supaya kegagalannya langsung menunjuk tabelnya.
  for (const table of SNAPSHOT_TABLES) {
    expect(canonical(fromDb[table]), `tabel ${table}`).toEqual(canonical(local[table]));
  }
});

test("jumlah baris satu workspace tetap kecil", () => {
  const { counts } = seeded;
  const total = Object.values(counts).reduce((a, n) => a + n, 0);
  // Dasar keputusan memuat seluruh workspace sekaligus, dan dasar biaya
  // penyalinan per pengunjung di Fase 4.
  expect(total).toBeLessThan(1200);
  expect(counts.students).toBe(288);
  expect(counts.tasks).toBe(23);
  // 4 kelas IPA × 5 mapel + 5 kelas non-IPA × 4 mapel, masing-masing 2 sesi.
  expect(counts.subjectSlots).toBe(80);
  expect(counts.submissions).toBe(113);
});

test("satu siswa hanya punya satu pengumpulan per tugas", async () => {
  const dup = await pg.query(
    `SELECT task_id, student_id FROM submissions
     WHERE workspace_id = $1 GROUP BY task_id, student_id HAVING count(*) > 1`,
    [seeded.workspaceId],
  );
  expect(dup.rows).toEqual([]);
});

test("setiap referensi antar tabel punya induk", async () => {
  // Foreign key belum dipasang di skema (workspace disalin per baris di Fase 4),
  // jadi keutuhannya diuji di sini.
  const checks = [
    ["tasks.class_id", "SELECT 1 FROM tasks t LEFT JOIN classes c ON c.workspace_id=t.workspace_id AND c.id=t.class_id WHERE t.workspace_id=$1 AND c.id IS NULL"],
    ["tasks.subject_id", "SELECT 1 FROM tasks t LEFT JOIN subjects s ON s.workspace_id=t.workspace_id AND s.id=t.subject_id WHERE t.workspace_id=$1 AND s.id IS NULL"],
    ["submissions.task_id", "SELECT 1 FROM submissions x LEFT JOIN tasks t ON t.workspace_id=x.workspace_id AND t.id=x.task_id WHERE x.workspace_id=$1 AND t.id IS NULL"],
    ["submissions.student_id", "SELECT 1 FROM submissions x LEFT JOIN students st ON st.workspace_id=x.workspace_id AND st.id=x.student_id WHERE x.workspace_id=$1 AND st.id IS NULL"],
    ["students.class_id", "SELECT 1 FROM students st LEFT JOIN classes c ON c.workspace_id=st.workspace_id AND c.id=st.class_id WHERE st.workspace_id=$1 AND c.id IS NULL"],
    ["classes.homeroom_teacher_id", "SELECT 1 FROM classes c LEFT JOIN teachers t ON t.workspace_id=c.workspace_id AND t.id=c.homeroom_teacher_id WHERE c.workspace_id=$1 AND c.homeroom_teacher_id IS NOT NULL AND t.id IS NULL"],
    ["subject_slots.subject_id", "SELECT 1 FROM subject_slots sl LEFT JOIN subjects s ON s.workspace_id=sl.workspace_id AND s.id=sl.subject_id WHERE sl.workspace_id=$1 AND s.id IS NULL"],
    ["materials.subject_id", "SELECT 1 FROM materials m LEFT JOIN subjects s ON s.workspace_id=m.workspace_id AND s.id=m.subject_id WHERE m.workspace_id=$1 AND s.id IS NULL"],
    ["teaching_assignments.teacher_id", "SELECT 1 FROM teaching_assignments a LEFT JOIN teachers t ON t.workspace_id=a.workspace_id AND t.id=a.teacher_id WHERE a.workspace_id=$1 AND t.id IS NULL"],
  ];

  for (const [label, sql] of checks) {
    const res = await pg.query(sql, [seeded.workspaceId]);
    expect(res.rows, label).toEqual([]);
  }
});

test("tepat satu siswa ditandai sebagai persona demo", async () => {
  const res = await pg.query("SELECT id FROM students WHERE workspace_id = $1 AND is_me", [seeded.workspaceId]);
  expect(res.rows).toHaveLength(1);
});
