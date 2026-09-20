import { sameSignature, sign } from "./hmac.js";

/**
 * Cookie penanda sandbox pengunjung.
 *
 * Nilainya `<uuid>.<tanda tangan>`. Tanda tangannya bukan untuk melindungi
 * klaim apa pun — id-nya sendiri sudah jadi otorisasi, seperti session token.
 * Gunanya mencegah id yang dikarang: tanpa itu, satu skrip bisa mengirim ribuan
 * uuid acak dan tiap satu memicu pembuatan workspace baru berisi ~600 baris.
 */

export const WORKSPACE_COOKIE = "sk_ws";
export const WORKSPACE_HEADER = "x-sk-ws";

/** Umur cookie: cukup panjang agar pengunjung yang kembali menemukan datanya. */
export const WORKSPACE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function signWorkspaceId(id) {
  return id + "." + (await sign(id));
}

/** Mengembalikan id workspace kalau cookie-nya sah, atau `null`. */
export async function readWorkspaceCookie(value) {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot < 1) return null;
  const id = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  return sameSignature(mac, await sign(id)) ? id : null;
}
