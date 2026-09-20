import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import { createPgliteDb } from "../src/lib/db/client.js";
import { loadWorkspaceSnapshot } from "../src/lib/db/queries.js";
import { seedTemplate } from "../src/lib/db/seed.js";
import {
  cronDenied,
  gcWorkspaces,
  getOrCreateWorkspace,
  resetWorkspace,
  templateWorkspaceId,
} from "../src/lib/db/workspace.js";
import { readWorkspaceCookie, signWorkspaceId } from "../src/lib/workspace-cookie.js";

/**
 * Sandbox per pengunjung, diuji di Postgres sungguhan lewat PGlite.
 *
 * Pertanyaan yang dijawab di sini cuma satu, tapi itu yang paling menentukan
 * apakah URL portfolio ini aman dibagikan: **benarkah dua pengunjung terpisah?**
 * Setiap layar TU punya tombol Hapus, jadi kalau jawabannya tidak, satu orang
 * yang penasaran bisa mengosongkan demo orang lain.
 */

test.describe.configure({ mode: "serial" });

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

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
});

test.afterAll(async () => {
  if (pg) await pg.close();
});

test("kunjungan pertama menyalin template, kunjungan berikutnya tidak", async () => {
  const first = await getOrCreateWorkspace(db, A);
  expect(first).toEqual({ id: A, created: true });

  const second = await getOrCreateWorkspace(db, A);
  expect(second).toEqual({ id: A, created: false });

  const template = await templateWorkspaceId(db);
  const [fromSandbox, fromTemplate] = await Promise.all([
    loadWorkspaceSnapshot(A, db),
    loadWorkspaceSnapshot(template, db),
  ]);
  // Salinannya utuh: isinya sama dengan template, bukan sebagian.
  expect(JSON.stringify(fromSandbox)).toBe(JSON.stringify(fromTemplate));
});

test("fungsi penyalin ikut membawa kolom yang baru ditambahkan", async () => {
  // Daftar kolomnya dibaca dari katalog Postgres, jadi kolom baru ikut tersalin
  // tanpa menyentuh fungsinya. Diuji dengan benar-benar menambah kolom.
  await pg.exec("ALTER TABLE subjects ADD COLUMN probe text");
  try {
    const template = await templateWorkspaceId(db);
    await pg.query("UPDATE subjects SET probe = 'ikut' WHERE workspace_id = $1", [template]);

    const fresh = "33333333-3333-4333-8333-333333333333";
    await getOrCreateWorkspace(db, fresh);

    const res = await pg.query("SELECT DISTINCT probe FROM subjects WHERE workspace_id = $1", [fresh]);
    expect(res.rows).toEqual([{ probe: "ikut" }]);
  } finally {
    await pg.exec("ALTER TABLE subjects DROP COLUMN probe");
  }
});

test("menghapus data di satu sandbox tidak menyentuh sandbox lain", async () => {
  await getOrCreateWorkspace(db, B);

  // Meniru pengunjung yang menghapus semuanya dari panel TU.
  await pg.query("DELETE FROM classes WHERE workspace_id = $1", [A]);
  await pg.query("DELETE FROM tasks WHERE workspace_id = $1", [A]);
  await pg.query("DELETE FROM students WHERE workspace_id = $1", [A]);

  const wrecked = await loadWorkspaceSnapshot(A, db);
  expect(wrecked.classes).toHaveLength(0);
  expect(wrecked.students).toHaveLength(0);

  const untouched = await loadWorkspaceSnapshot(B, db);
  expect(untouched.classes).toHaveLength(9);
  expect(untouched.students).toHaveLength(288);
  expect(untouched.tasks).toHaveLength(23);

  // Template juga harus tetap bersih — dari situ semua sandbox berikutnya lahir.
  const template = await templateWorkspaceId(db);
  const pristine = await loadWorkspaceSnapshot(template, db);
  expect(pristine.classes).toHaveLength(9);
});

test("reset mengembalikan sandbox ke kondisi awal", async () => {
  await resetWorkspace(db, A);
  const after = await loadWorkspaceSnapshot(A, db);
  expect(after.classes).toHaveLength(9);
  expect(after.students).toHaveLength(288);

  const template = await templateWorkspaceId(db);
  expect(JSON.stringify(after)).toBe(JSON.stringify(await loadWorkspaceSnapshot(template, db)));
});

test("kunjungan bersamaan hanya menyemai satu kali", async () => {
  const id = "44444444-4444-4444-8444-444444444444";
  const results = await Promise.all([
    getOrCreateWorkspace(db, id),
    getOrCreateWorkspace(db, id),
    getOrCreateWorkspace(db, id),
  ]);
  // Tepat satu yang membuat; kalau tidak, barisnya akan ganda.
  expect(results.filter((r) => r.created)).toHaveLength(1);

  const rows = await pg.query("SELECT count(*)::int AS n FROM classes WHERE workspace_id = $1", [id]);
  expect(rows.rows[0].n).toBe(9);
});

test.describe("pembersihan berkala", () => {
  const LAMA = "55555555-5555-4555-8555-555555555555";
  const BARU = "66666666-6666-4666-8666-666666666666";

  test("sandbox yang lama tidak dibuka dihapus, yang masih hidup tidak", async () => {
    await getOrCreateWorkspace(db, LAMA);
    await getOrCreateWorkspace(db, BARU);

    // Dibuat 30 hari lalu dan tidak pernah dibuka lagi.
    await pg.query("UPDATE workspaces SET last_seen_at = now() - interval '30 days' WHERE id = $1", [LAMA]);

    const { deleted, remaining } = await gcWorkspaces(db);
    expect(deleted).toContain(LAMA);
    expect(deleted).not.toContain(BARU);

    // Barisnya ikut terhapus, bukan cuma baris workspace-nya — foreign key
    // belum dipasang, jadi tidak ada cascade yang mengurusnya.
    const rows = await pg.query("SELECT count(*)::int AS n FROM students WHERE workspace_id = $1", [LAMA]);
    expect(rows.rows[0].n).toBe(0);
    expect(remaining).toBeGreaterThan(0);
  });

  test("template tidak pernah ikut terhapus, walau tidak pernah dibuka", async () => {
    const template = await templateWorkspaceId(db);
    // Template memang tidak punya pengunjung, jadi `last_seen_at`-nya tidak
    // pernah bergerak. Kalau GC melihat `kind`, ia akan lolos; kalau tidak,
    // seluruh aplikasi mati pada pembersihan pertama.
    await pg.query("UPDATE workspaces SET last_seen_at = now() - interval '400 days' WHERE id = $1", [template]);

    const { deleted } = await gcWorkspaces(db);
    expect(deleted).not.toContain(template);
    expect(await templateWorkspaceId(db)).toBe(template);
    expect((await loadWorkspaceSnapshot(template, db)).classes).toHaveLength(9);
  });

  test("membuka sandbox menggerakkan batas hidupnya", async () => {
    await pg.query("UPDATE workspaces SET last_seen_at = now() - interval '30 days' WHERE id = $1", [BARU]);
    // Satu kunjungan sudah cukup untuk menyelamatkannya.
    await getOrCreateWorkspace(db, BARU);

    const { deleted } = await gcWorkspaces(db);
    expect(deleted).not.toContain(BARU);
  });

  test("panggilan tanpa rahasia yang benar ditolak, dan tanpa rahasia sama sekali dimatikan", () => {
    const secret = "rahasia";
    expect(cronDenied({ secret, authorization: "Bearer rahasia" })).toBeNull();

    expect(cronDenied({ secret, authorization: "Bearer salah" })).toEqual({ status: 401, error: "Tidak berhak." });
    expect(cronDenied({ secret, authorization: null })).toEqual({ status: 401, error: "Tidak berhak." });
    expect(cronDenied({ secret, authorization: "rahasia" })).toEqual({ status: 401, error: "Tidak berhak." });

    // Belum dikonfigurasi tidak boleh berarti "boleh dipanggil siapa saja":
    // route ini menghapus data, dan `/api/*` di Vercel bisa diakses publik.
    expect(cronDenied({ secret: "", authorization: "Bearer " })?.status).toBe(503);
    expect(cronDenied({ secret: undefined, authorization: "Bearer undefined" })?.status).toBe(503);
  });

  test("ambang batasnya bisa digeser, dan hanya itu yang menentukan", async () => {
    await pg.query("UPDATE workspaces SET last_seen_at = now() - interval '3 days' WHERE id = $1", [BARU]);

    expect((await gcWorkspaces(db, { days: 14 })).deleted).not.toContain(BARU);
    expect((await gcWorkspaces(db, { days: 1 })).deleted).toContain(BARU);
  });
});

test.describe("cookie sandbox", () => {
  test("id yang ditandatangani bisa dibaca kembali", async () => {
    const value = await signWorkspaceId(A);
    expect(await readWorkspaceCookie(value)).toBe(A);
  });

  test("id karangan ditolak", async () => {
    // Tanpa ini, satu skrip bisa mengirim uuid acak dan tiap satu memicu
    // pembuatan workspace baru berisi ~600 baris.
    expect(await readWorkspaceCookie(B)).toBeNull();
    expect(await readWorkspaceCookie(B + ".palsu")).toBeNull();
    expect(await readWorkspaceCookie("")).toBeNull();
    expect(await readWorkspaceCookie(null)).toBeNull();

    // Tanda tangan sah tapi id-nya diganti.
    const signed = await signWorkspaceId(A);
    const tampered = B + signed.slice(signed.lastIndexOf("."));
    expect(await readWorkspaceCookie(tampered)).toBeNull();
  });
});
