/**
 * Persona pengunjung: siapa yang sedang dia perankan.
 *
 * **Ini bukan autentikasi, dan sengaja tidak berpura-pura begitu.** Layar login
 * desain tidak memeriksa password — tombol Masuk memilih peran, titik. Jadi
 * cookie ini tidak ditandatangani: tanda tangan hanya akan melindungi klaim yang
 * pemiliknya memang boleh mengubah sesukanya (cukup masuk lagi sebagai orang
 * lain). Yang dijaga adalah **kecocokan**: aksi yang datang harus milik peran
 * yang sedang dipakai, sehingga layar siswa tidak bisa memanggil tulisan milik
 * TU — itu menangkap bug, bukan penyerang.
 *
 * `httpOnly` tetap dipasang supaya nilainya hanya berubah lewat satu pintu
 * (Server Action saat Masuk), bukan diam-diam dari kode klien.
 *
 * Tanpa modul Node apa pun: dipakai middleware (runtime Edge), Server Action,
 * dan Server Component.
 */

export const PERSONA_COOKIE = "sk_as";

/** Seumur cookie sandbox: keduanya menggambarkan satu kunjungan yang sama. */
export const PERSONA_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export const ROLES = ["siswa", "guru", "tu"];

/** Dipakai menyusun pesan penolakan yang menyebut perannya. */
export const ROLE_LABEL = { siswa: "siswa", guru: "guru", tu: "staf TU" };

const isRole = (value) => ROLES.indexOf(value) !== -1;

/** Id guru berbentuk `t1`, `t2`, … — sama seperti di seed. */
const isTeacherId = (value) => /^t\d+$/.test(String(value || ""));

/**
 * `"guru:t1"`, `"siswa"`, `"tu"`. Id guru ikut karena peran guru saja tidak
 * cukup untuk tahu materi siapa yang sedang diunggah.
 */
export function formatPersona({ role, teacherId } = {}) {
  if (!isRole(role)) return null;
  return role === "guru" && isTeacherId(teacherId) ? role + ":" + teacherId : role;
}

/** Mengembalikan `{ role, teacherId }`, atau `null` kalau nilainya tidak dikenal. */
export function parsePersona(value) {
  if (!value) return null;
  const [role, teacherId] = String(value).split(":");
  if (!isRole(role)) return null;
  if (role !== "guru") return { role, teacherId: null };
  return { role, teacherId: isTeacherId(teacherId) ? teacherId : "t1" };
}

/**
 * Alasan penolakan untuk persona yang tidak berhak, atau `null` kalau boleh.
 *
 * Murni dan terpisah dari `requireWorkspace()` supaya bisa diuji langsung —
 * inilah satu-satunya tempat keputusan "boleh atau tidak" diambil.
 *
 * `allow` yang kosong berarti tidak dijaga: dipakai action yang justru
 * **menetapkan** persona (Masuk), dan aksi yang berlaku untuk semua peran.
 */
export function denyReason(persona, allow) {
  if (!allow) return null;
  const allowed = [].concat(allow);
  if (persona && allowed.indexOf(persona.role) !== -1) return null;
  return "Aksi ini hanya untuk " + allowed.map((role) => ROLE_LABEL[role]).join(" atau ") + ".";
}

/**
 * Persona awal dari query param — `/?screen=tuClasses&role=tu` harus langsung
 * berperan sebagai TU, tanpa lewat layar login dulu. Nilai `guruId` default
 * mengikuti view-model, yang juga memakai `t1` kalau param-nya kosong.
 */
export const personaFromParams = ({ role, guruId } = {}) =>
  formatPersona({ role, teacherId: guruId || "t1" }) || formatPersona({ role: "siswa" });
