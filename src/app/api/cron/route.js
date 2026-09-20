import { getDb } from "@/lib/db/client";
import { WORKSPACE_TTL_DAYS, cronDenied, gcWorkspaces } from "@/lib/db/workspace";
import { deletePrefix } from "@/lib/storage";

/**
 * Pembersihan harian sandbox — dan sekaligus keep-alive.
 *
 * Satu-satunya route handler di aplikasi ini; semua tulisan lain lewat Server
 * Action. Ada di sini karena Vercel Cron memang memanggil URL, bukan fungsi.
 *
 * Dua pekerjaannya:
 *
 * 1. Menghapus sandbox yang sudah dua minggu tidak dibuka, beserti barisnya dan
 *    berkas yang diunggah di dalamnya.
 * 2. Menyentuh database setiap hari. Project Postgres gratis Supabase pause
 *    setelah satu minggu tanpa aktivitas — fatal untuk URL portfolio yang
 *    dibuka sesekali. Jadwal harian ini mencegahnya, gratis.
 *
 * Jadwalnya di [vercel.json](../../../../vercel.json).
 */
export const dynamic = "force-dynamic";

export async function GET(request) {
  const denied = cronDenied({
    secret: process.env.CRON_SECRET,
    authorization: request.headers.get("authorization"),
  });
  if (denied) return json({ error: denied.error }, denied.status);

  if (!process.env.DATABASE_URL) return json({ error: "DATABASE_URL belum diset." }, 503);

  const db = await getDb();
  const { deleted, remaining, cutoff } = await gcWorkspaces(db);

  // Byte-nya dibuang setelah barisnya, bukan sebelum: kalau penghapusan objek
  // gagal, yang tertinggal adalah berkas tanpa baris (bisa dibersihkan lagi
  // besok), bukan baris yang menunjuk berkas yang sudah hilang.
  const failed = [];
  for (const id of deleted) {
    try {
      await deletePrefix(id);
    } catch (error) {
      console.error("gagal menghapus objek sandbox", id, error);
      failed.push(id);
    }
  }

  return json({
    ok: true,
    ttlDays: WORKSPACE_TTL_DAYS,
    cutoff: cutoff.toISOString(),
    deleted: deleted.length,
    storageFailed: failed.length,
    remaining,
  });
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
