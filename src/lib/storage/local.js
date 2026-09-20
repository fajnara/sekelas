import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";

import { signUploadToken } from "./upload-token.js";

/**
 * Driver penyimpanan berbasis folder — untuk mencoba jalur upload tanpa akun
 * cloud, sepasang dengan `npm run db:local`.
 *
 * **Bukan untuk produksi.** Filesystem di Vercel bersifat sementara dan
 * read-only, jadi file akan hilang. Produksi memakai driver Supabase.
 */
const root = () => resolve(process.env.STORAGE_DIR);

/** Menahan `..` dan jalur absolut supaya tulisan tidak keluar dari folder. */
function safeTarget(path) {
  const target = resolve(join(root(), path));
  if (!target.startsWith(root() + sep)) throw new Error("Jalur objek tidak valid.");
  return target;
}

export async function put(path, file) {
  const target = safeTarget(path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await file.arrayBuffer()));
}

export async function remove(path) {
  await rm(safeTarget(path), { force: true });
}

/**
 * Menghapus seluruh objek di bawah satu awalan — dipakai saat sandbox direset
 * atau dibersihkan, supaya berkasnya tidak tertinggal tanpa baris pemilik.
 */
export async function removePrefix(prefix) {
  await rm(safeTarget(prefix), { recursive: true, force: true });
}

/**
 * Tidak ada URL yang bisa diakses browser untuk folder lokal, jadi file
 * disajikan lewat route handler milik aplikasi sendiri.
 */
export async function signedUrl(path) {
  return "/api/file?path=" + encodeURIComponent(path);
}

/**
 * Padanan signed upload URL Supabase: route milik aplikasi sendiri, dengan
 * token bertanda tangan yang menyebut jalurnya. Bentuk permintaannya dibuat
 * sama dengan Supabase (PUT, `multipart/form-data`, berkas di field tanpa nama)
 * supaya kode kliennya satu, bukan dua cabang yang salah satunya tak teruji.
 */
export async function signUpload(path) {
  const token = await signUploadToken(path);
  return { url: "/api/file?token=" + encodeURIComponent(token), method: "PUT" };
}

/** Ukuran objek yang **benar-benar** tersimpan, bukan yang diklaim klien. */
export async function statObject(path) {
  try {
    const info = await stat(safeTarget(path));
    return { size: info.size, contentType: null };
  } catch {
    return null;
  }
}
