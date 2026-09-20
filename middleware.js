import { NextResponse } from "next/server";

import { PERSONA_COOKIE, PERSONA_COOKIE_MAX_AGE, parsePersona, personaFromParams } from "@/lib/persona";
import {
  WORKSPACE_COOKIE,
  WORKSPACE_COOKIE_MAX_AGE,
  WORKSPACE_HEADER,
  readWorkspaceCookie,
  signWorkspaceId,
} from "@/lib/workspace-cookie";

/**
 * Memberi setiap pengunjung satu sandbox.
 *
 * Harus di middleware, bukan di halaman: Server Component tidak bisa menyetel
 * cookie, jadi tanpa ini render **pertama** belum punya id dan perlu redirect
 * perantara. Id-nya diteruskan sebagai header request supaya halaman langsung
 * bisa memakainya pada render yang sama dengan saat cookie-nya dibuat.
 */
export async function middleware(request) {
  // Tanpa database tidak ada sandbox, jadi cookie-nya tidak ada gunanya — dan
  // itu mode default (`npm run dev`, CI, harness fidelitas).
  if (!process.env.DATABASE_URL) return NextResponse.next();

  // Mode frozen tidak menyentuh database sama sekali, jadi jangan buat sandbox.
  // Ini sekaligus menahan crawler dan bot screenshot dari membuat workspace
  // sampah — setiap URL frame di README membawa `frozen=1`.
  if (request.nextUrl.searchParams.get("frozen") === "1") return NextResponse.next();

  const fromCookie = await readWorkspaceCookie(request.cookies.get(WORKSPACE_COOKIE)?.value);
  const workspaceId = fromCookie || crypto.randomUUID();

  const headers = new Headers(request.headers);
  headers.set(WORKSPACE_HEADER, workspaceId);

  const response = NextResponse.next({ request: { headers } });

  if (!fromCookie) {
    response.cookies.set(WORKSPACE_COOKIE, await signWorkspaceId(workspaceId), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: WORKSPACE_COOKIE_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    });
  }

  // Persona awal, **hanya kalau belum ada**. Kunjungan pertama ke
  // `/?screen=tuClasses&role=tu` langsung berperan sebagai TU, jadi tautan
  // langsung di README tetap bisa menulis tanpa lewat layar login.
  //
  // Tidak pernah menimpa yang sudah ada: parameter `role` tetap menempel di URL
  // setelah pengunjung berpindah peran lewat layar login, dan Server Action
  // di-POST ke URL itu juga — menimpanya akan mengembalikan persona lama di
  // aksi berikutnya, lalu menolaknya.
  if (!parsePersona(request.cookies.get(PERSONA_COOKIE)?.value)) {
    response.cookies.set(PERSONA_COOKIE, personaFromParams(Object.fromEntries(request.nextUrl.searchParams)), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: PERSONA_COOKIE_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

export const config = {
  // Dipersempit: aset statis tidak perlu sandbox, dan membiarkannya lewat sini
  // hanya menambah kerja per request.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml)$).*)"],
};
