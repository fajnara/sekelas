import * as schema from "./schema.js";

let cached = null;
let cachedSql = null;

/**
 * Koneksi database, dibuat sekali per proses.
 *
 * Dua driver, satu skema:
 *
 * - `DATABASE_URL` biasa → `postgres-js` (Supabase, Neon, Postgres lokal).
 * - `DATABASE_URL=pglite` → Postgres yang berjalan di dalam proses
 *   (`@electric-sql/pglite`). Dipakai uji otomatis: skema, migrasi, dan query
 *   yang sama diuji sungguhan tanpa perlu server atau rahasia apa pun.
 */
export async function getDb() {
  if (cached) return cached;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diset.");

  // Impor dinamis: driver tidak ikut ter-bundle kalau tidak dipakai, dan modul
  // ini tetap bisa dijalankan Node langsung (skrip seed) tanpa `require`.
  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");

  // Supabase memakai pooler transaksi, yang tidak mendukung prepared statement.
  const sql = postgres(url, { max: 1, prepare: false });
  cachedSql = sql;
  cached = drizzle(sql, { schema });
  return cached;
}

/**
 * Menutup koneksi. Wajib dipanggil skrip sekali-jalan seperti seed: keluar
 * tanpa menutup akan meninggalkan koneksi menggantung di pooler.
 */
export async function closeDb() {
  if (cachedSql) await cachedSql.end({ timeout: 5 });
  cachedSql = null;
  cached = null;
}

/** Postgres in-process untuk pengujian. Tidak pernah dipakai di produksi. */
export async function createPgliteDb() {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const pg = new PGlite();
  return { db: drizzle(pg, { schema }), raw: pg };
}

export function resetDbCache() {
  cached = null;
}
