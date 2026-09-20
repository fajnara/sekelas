import { readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

import { cookies } from "next/headers";

import { put } from "@/lib/storage/local";
import { readUploadToken } from "@/lib/storage/upload-token";
import { WORKSPACE_COOKIE, readWorkspaceCookie } from "@/lib/workspace-cookie";

/**
 * Menyajikan berkas dari driver penyimpanan lokal.
 *
 * Hanya dipakai saat `STORAGE_DIR` diset — untuk mencoba jalur upload tanpa
 * akun cloud. Dengan Supabase, URL bertanda tangan dipakai langsung dan route
 * ini tidak pernah tersentuh.
 */
export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!process.env.STORAGE_DIR) return new Response("Tidak tersedia.", { status: 404 });

  const workspaceId = await readWorkspaceCookie((await cookies()).get(WORKSPACE_COOKIE)?.value);
  if (!workspaceId) return new Response("Sesi tidak ditemukan.", { status: 401 });

  const path = new URL(request.url).searchParams.get("path") || "";
  // Jalur objek selalu diawali id workspace: ini yang menahan satu sandbox
  // membaca berkas sandbox lain.
  if (!path.startsWith(workspaceId + "/")) return new Response("File tidak ditemukan.", { status: 404 });

  const root = resolve(process.env.STORAGE_DIR);
  const target = resolve(join(root, path));
  if (!target.startsWith(root + sep)) return new Response("File tidak ditemukan.", { status: 404 });

  try {
    const bytes = await readFile(target);
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${path.split("/").pop()}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("File tidak ditemukan.", { status: 404 });
  }
}

/**
 * Menerima byte unggahan — padanan signed upload URL Supabase untuk driver lokal.
 *
 * Jalurnya datang dari **token**, bukan dari parameter: kalau klien boleh
 * menyebut jalurnya sendiri, ia bisa menulis ke sandbox siapa pun. Token itu
 * dicetak Server Action `signUploadAction`, yang sudah memeriksa persona dan
 * aturan berkasnya lebih dulu.
 *
 * Bentuk permintaannya sengaja sama dengan Supabase: `PUT`,
 * `multipart/form-data`, berkas di field tanpa nama. Dengan begitu kode kliennya
 * satu untuk kedua driver — bukan dua cabang dengan salah satunya tak teruji.
 */
export async function PUT(request) {
  if (!process.env.STORAGE_DIR) return new Response("Tidak tersedia.", { status: 404 });

  const workspaceId = await readWorkspaceCookie((await cookies()).get(WORKSPACE_COOKIE)?.value);
  if (!workspaceId) return new Response("Sesi tidak ditemukan.", { status: 401 });

  const token = new URL(request.url).searchParams.get("token");
  const path = await readUploadToken(token);
  if (!path) return new Response("Token unggah tidak sah atau kedaluwarsa.", { status: 401 });

  // Token-nya sudah menyebut jalurnya, tapi kepemilikannya diperiksa lagi:
  // token sandbox lain tidak boleh berlaku di sesi ini.
  if (!path.startsWith(workspaceId + "/")) return new Response("Bukan milik sesi ini.", { status: 403 });

  const form = await request.formData();
  const file = form.get("");
  if (!file || typeof file.arrayBuffer !== "function") return new Response("Tidak ada berkas.", { status: 400 });

  await put(path, file);
  return new Response(JSON.stringify({ Key: path }), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
