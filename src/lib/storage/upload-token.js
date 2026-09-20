import { sameSignature, sign } from "../hmac.js";

/**
 * Token unggah untuk driver folder lokal.
 *
 * Supabase Storage sudah punya signed upload URL sendiri; driver lokal tidak,
 * jadi padanannya dibuat di sini supaya **kode klien sama untuk kedua driver** —
 * satu jalur unggah yang benar-benar dijalankan uji end-to-end, bukan dua jalur
 * dengan yang satu tidak pernah dicoba.
 *
 * Token-nya menyebut jalur objeknya dan kedaluwarsanya, lalu ditandatangani.
 * Tanpa itu, route unggahnya menerima jalur apa pun dari siapa pun.
 */

/** Dua jam, sama seperti signed upload URL Supabase. */
export const UPLOAD_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

const encode = (value) => Buffer.from(value, "utf8").toString("base64url");
const decode = (value) => Buffer.from(value, "base64url").toString("utf8");

export async function signUploadToken(path, { now = Date.now(), ttlMs = UPLOAD_TOKEN_TTL_MS } = {}) {
  const claim = encode(JSON.stringify({ path, exp: now + ttlMs }));
  return claim + "." + (await sign(claim));
}

/** Mengembalikan jalur objek kalau token-nya sah dan belum kedaluwarsa, atau `null`. */
export async function readUploadToken(token, { now = Date.now() } = {}) {
  if (!token || typeof token !== "string") return null;

  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;

  const claim = token.slice(0, dot);
  if (!sameSignature(token.slice(dot + 1), await sign(claim))) return null;

  try {
    const { path, exp } = JSON.parse(decode(claim));
    if (!path || typeof exp !== "number" || exp < now) return null;
    return path;
  } catch {
    return null;
  }
}
