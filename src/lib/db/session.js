import { cookies } from "next/headers";

import { PERSONA_COOKIE, denyReason, parsePersona } from "../persona.js";
import { WORKSPACE_COOKIE, readWorkspaceCookie } from "../workspace-cookie.js";
import { getDb } from "./client.js";

/**
 * Menyelesaikan sandbox **dan** persona pemanggil untuk sebuah Server Action.
 *
 * Keduanya dibaca dari **cookie**, bukan dari argumen. Kalau id workspace boleh
 * dikirim pemanggil, siapa pun bisa menulis ke sandbox orang lain hanya dengan
 * menebak id-nya — dan itu satu-satunya hal yang memisahkan pengunjung di sini.
 *
 * Cookie-nya juga dibaca langsung, bukan lewat header dari middleware: action
 * harus tetap aman walau middleware tidak berjalan untuk rute-nya.
 *
 * `allow` menyebut peran yang boleh memanggil. Ini penjaga kecocokan, bukan
 * keamanan — lihat [src/lib/persona.js](../persona.js) soal kenapa. Gunanya:
 * layar satu peran tidak bisa memanggil tulisan milik peran lain, dan kalau itu
 * terjadi, penolakannya muncul sebagai toast lalu patch optimistiknya
 * dikembalikan — bukan tersimpan diam-diam.
 */
export async function requireWorkspace(allow) {
  const jar = await cookies();
  const workspaceId = await readWorkspaceCookie(jar.get(WORKSPACE_COOKIE)?.value);
  if (!workspaceId) return { error: "Sesi tidak ditemukan. Muat ulang halaman." };

  const persona = parsePersona(jar.get(PERSONA_COOKIE)?.value);
  const denied = denyReason(persona, allow);
  if (denied) return { error: denied };

  return { db: await getDb(), workspaceId, persona };
}
