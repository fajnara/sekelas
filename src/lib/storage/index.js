/**
 * Pemilihan driver penyimpanan — **server saja**.
 *
 * Aturan berkas (validasi, `accept`, label ekstensi) ada di `./rules.js` supaya
 * kode klien bisa memakainya tanpa ikut menarik modul Node ke bundle browser.
 *
 * Tiga kemungkinan:
 * - `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` → Supabase Storage (produksi).
 * - `STORAGE_DIR` → folder lokal, untuk mencoba jalurnya tanpa akun cloud.
 * - keduanya kosong → tidak ada penyimpanan: barisnya tetap tersimpan, byte-nya
 *   dibuang. Itu mode default, dan membuat `npm run dev` tetap jalan.
 */

import { MAX_UPLOAD_BYTES } from "./rules.js";

function driver() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return "supabase";
  if (process.env.STORAGE_DIR) return "local";
  return null;
}

export const hasStorage = () => driver() !== null;

async function load() {
  const name = driver();
  if (!name) return null;
  return name === "supabase" ? import("./supabase.js") : import("./local.js");
}

// Tidak ada `putObject` di sini: byte-nya tidak pernah lewat server. Satu-satunya
// yang menulis adalah klien, ke alamat bertanda tangan dari `signUpload()` —
// dan untuk driver lokal, route `PUT /api/file` yang memakai driver-nya langsung.
// Membiarkan jalur tulis kedua yang tidak pernah dipakai hanya akan jadi jalur
// yang tidak pernah teruji.

export async function deleteObject(path) {
  if (!path) return;
  const impl = await load();
  if (impl) await impl.remove(path);
}

/**
 * Membuang seluruh objek milik satu sandbox. Dipakai `?reset=1` dan pembersihan
 * berkala — tanpa ini berkasnya tertinggal tanpa baris pemilik, dan tidak ada
 * lagi yang bisa menghapusnya.
 */
export async function deletePrefix(prefix) {
  if (!prefix) return;
  const impl = await load();
  if (impl) await impl.removePrefix(prefix);
}

/** URL berumur pendek untuk mengunduh. `null` kalau tidak ada penyimpanan. */
export async function signedUrl(path) {
  if (!path) return null;
  const impl = await load();
  return impl ? impl.signedUrl(path) : null;
}

/**
 * Alamat unggah berumur pendek. Klien mengirim byte-nya **langsung** ke sana,
 * tidak lewat Server Action — itu yang menghindari batas badan request 4,5 MB
 * milik Vercel, yang berlaku di semua paket.
 *
 * `{ url: null }` kalau tidak ada penyimpanan: klien melewati langkah unggah dan
 * barisnya tetap tersimpan tanpa byte, sama seperti sebelumnya.
 */
export async function signUpload(path) {
  const impl = await load();
  return impl ? impl.signUpload(path) : { url: null, method: null };
}

/**
 * Memeriksa objek yang **benar-benar** sampai, lalu mengembalikan ukurannya.
 *
 * Ini yang menutup lubang yang dibuka oleh unggah langsung: server tidak lagi
 * memegang byte-nya, jadi ukuran dan tipe yang dikirim klien tidak bisa
 * dipercaya — dan `sizeBytes` bukan hiasan, ia menggerakkan "4,0 MB terpakai"
 * di layar Materi. Objek yang melampaui batas ikut dihapus, bukan cuma ditolak.
 *
 * Tanpa driver, tidak ada yang bisa diperiksa: ukuran yang diklaim dipakai apa
 * adanya, dan itu memang tidak menyimpan apa pun.
 */
export async function confirmUpload(path, { claimedSize = 0 } = {}) {
  const impl = await load();
  if (!impl) return { sizeBytes: claimedSize };

  const info = await impl.statObject(path);
  if (!info) return { error: "File tidak sampai. Coba unggah lagi." };

  if (info.size === 0) {
    await impl.remove(path);
    return { error: "File-nya kosong." };
  }
  if (info.size > MAX_UPLOAD_BYTES) {
    await impl.remove(path);
    return { error: "Maksimal 25 MB." };
  }

  return { sizeBytes: info.size };
}
