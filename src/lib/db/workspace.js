import { and, eq, lt, sql } from "drizzle-orm";

import * as s from "./schema.js";

/**
 * Menemukan sandbox pengunjung, atau membuatnya dari template.
 *
 * Penyalinannya satu panggilan `seed_workspace()` — sebelas `INSERT … SELECT`
 * di dalam database, bukan ~600 baris yang lewat jaringan. Dengan begitu
 * pengunjung baru tidak menunggu lama pada render pertama.
 *
 * `ON CONFLICT DO NOTHING` menjaga kasus dua request pertama datang bersamaan
 * (misal halaman dibuka dua tab sekaligus): hanya satu yang benar-benar
 * membuat, dan hanya yang membuat itu yang menyemai.
 */
export async function getOrCreateWorkspace(db, workspaceId) {
  const existing = await db
    .select({ id: s.workspaces.id })
    .from(s.workspaces)
    .where(eq(s.workspaces.id, workspaceId))
    .limit(1);

  if (existing.length) {
    // Menggerakkan pembersihan berkala: sandbox yang lama tidak disentuh dihapus.
    await db.update(s.workspaces).set({ lastSeenAt: new Date() }).where(eq(s.workspaces.id, workspaceId));
    return { id: workspaceId, created: false };
  }

  const template = await templateWorkspaceId(db);
  if (!template) throw new Error("Workspace template belum ada. Jalankan `npm run db:seed`.");

  const inserted = await db
    .insert(s.workspaces)
    .values({ id: workspaceId, kind: "demo" })
    .onConflictDoNothing()
    .returning({ id: s.workspaces.id });

  // Kalah lomba dengan request lain: workspace-nya sudah disemai di sana.
  if (!inserted.length) return { id: workspaceId, created: false };

  await db.execute(sql`select seed_workspace(${workspaceId}::uuid, ${template}::uuid)`);
  return { id: workspaceId, created: true };
}

export async function templateWorkspaceId(db) {
  const [row] = await db
    .select({ id: s.workspaces.id })
    .from(s.workspaces)
    .where(eq(s.workspaces.kind, "template"))
    .limit(1);
  return row ? row.id : null;
}

/** Mengembalikan sandbox ke kondisi awal — dipakai `?reset=1`. */
export async function resetWorkspace(db, workspaceId) {
  const template = await templateWorkspaceId(db);
  if (!template) throw new Error("Workspace template belum ada.");
  for (const table of s.WORKSPACE_TABLES) await db.delete(table).where(eq(table.workspaceId, workspaceId));
  await db.execute(sql`select seed_workspace(${workspaceId}::uuid, ${template}::uuid)`);
}

/**
 * Menghapus satu workspace beserta seluruh barisnya.
 *
 * Per-tabel, bukan mengandalkan `ON DELETE CASCADE`: foreign key memang belum
 * dipasang, karena baris disalin per workspace dan urutan penyalinannya yang
 * menjaga keutuhan. Jadi penghapusannya harus eksplisit juga.
 */
export async function deleteWorkspace(db, workspaceId) {
  for (const table of s.WORKSPACE_TABLES) await db.delete(table).where(eq(table.workspaceId, workspaceId));
  await db.delete(s.workspaces).where(eq(s.workspaces.id, workspaceId));
}

/** Sandbox dianggap terbengkalai setelah dua minggu tidak dibuka. */
export const WORKSPACE_TTL_DAYS = 14;

/**
 * Alasan menolak panggilan cron, atau `null` kalau boleh dikerjakan.
 *
 * Murni dan terpisah dari route handler-nya, sama seperti `denyReason()` untuk
 * persona: inilah satu-satunya tempat keputusannya diambil, jadi bisa diuji
 * langsung tanpa menjalankan server.
 *
 * Tanpa `CRON_SECRET` route-nya **mati**, bukan terbuka: ia menghapus data, dan
 * di Vercel `/api/*` bisa diakses siapa saja.
 */
export function cronDenied({ secret, authorization }) {
  if (!secret) return { status: 503, error: "CRON_SECRET belum diset." };
  if (authorization !== "Bearer " + secret) return { status: 401, error: "Tidak berhak." };
  return null;
}

/**
 * Membersihkan sandbox yang terbengkalai.
 *
 * Dua gunanya, dan yang kedua tidak kalah penting: project Postgres gratis
 * Supabase **pause setelah satu minggu tanpa aktivitas**, yang fatal untuk URL
 * portfolio yang dibuka sesekali. Cron harian ini menyentuh database setiap
 * hari, jadi sekalian jadi keep-alive.
 *
 * Workspace `template` tidak pernah ikut terhapus: hanya `kind = 'demo'` yang
 * dipertimbangkan.
 */
export async function gcWorkspaces(db, { days = WORKSPACE_TTL_DAYS, now = new Date() } = {}) {
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const stale = await db
    .select({ id: s.workspaces.id })
    .from(s.workspaces)
    .where(and(eq(s.workspaces.kind, "demo"), lt(s.workspaces.lastSeenAt, cutoff)));

  for (const w of stale) await deleteWorkspace(db, w.id);

  const [{ n } = { n: 0 }] = await db.select({ n: sql`count(*)::int` }).from(s.workspaces);

  return { deleted: stale.map((w) => w.id), remaining: Number(n), cutoff };
}
