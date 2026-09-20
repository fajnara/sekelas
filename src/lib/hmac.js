/**
 * Tanda tangan HMAC untuk nilai yang dititipkan ke klien.
 *
 * Dipakai dua hal: cookie sandbox ([workspace-cookie.js](workspace-cookie.js))
 * dan token unggah ([storage/upload-token.js](storage/upload-token.js)).
 *
 * Memakai Web Crypto, bukan `node:crypto`, supaya modul yang sama bisa dipakai
 * middleware (runtime Edge), Server Component, Server Action, dan route handler.
 */

const encoder = new TextEncoder();

let warned = false;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (value) return value;

  // Sengaja **tidak** melempar. Middleware berjalan di setiap request, jadi
  // melempar di sini mematikan seluruh situs. Akibat nyata dari rahasia yang
  // tidak stabil jauh lebih ringan: cookie lama gagal diverifikasi setelah
  // deploy, dan pengunjung mendapat sandbox baru. Merepotkan, bukan fatal.
  if (!warned && process.env.NODE_ENV === "production" && process.env.DATABASE_URL) {
    warned = true;
    console.warn("SESSION_SECRET belum diset — sandbox pengunjung akan hilang setiap deploy.");
  }
  return "sekelas-dev-secret";
}

let keyPromise = null;
let keyFor = null;

function hmacKey() {
  // Kuncinya di-cache, tapi ikut rahasianya: uji menyetel `SESSION_SECRET`
  // saat berjalan, dan kunci basi akan membuat tanda tangannya tidak cocok.
  const current = secret();
  if (!keyPromise || keyFor !== current) {
    keyFor = current;
    keyPromise = crypto.subtle.importKey("raw", encoder.encode(current), { name: "HMAC", hash: "SHA-256" }, false, [
      "sign",
    ]);
  }
  return keyPromise;
}

const toBase64Url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

export async function sign(message) {
  const mac = await crypto.subtle.sign("HMAC", await hmacKey(), encoder.encode(message));
  return toBase64Url(mac);
}

/**
 * Perbandingan waktu-tetap. Panjang tanda tangannya selalu sama, jadi cukup
 * XOR per karakter setelah panjangnya dipastikan.
 */
export function sameSignature(given, expected) {
  if (typeof given !== "string" || given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
