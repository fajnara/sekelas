"use server";

import { cookies } from "next/headers";

import { now } from "@/lib/clock";
import { requireWorkspace } from "@/lib/db/session";
import { PERSONA_COOKIE, PERSONA_COOKIE_MAX_AGE, formatPersona } from "@/lib/persona";
import * as writes from "@/lib/db/writes";
import { confirmUpload, deleteObject, signUpload, signedUrl } from "@/lib/storage";
import { objectPath, validateUpload } from "@/lib/storage/rules";

/**
 * Server Action — adaptor tipis, bukan tempat logika.
 *
 * Masing-masing hanya: selesaikan sesi dari cookie, lalu panggil fungsi tulis
 * di `src/lib/db/writes.js`. Logikanya sengaja ada di sana supaya bisa diuji
 * langsung di Postgres tanpa runtime Next.
 *
 * Tanpa `DATABASE_URL` aplikasi tidak pernah memanggil action ini — perubahan
 * cukup hidup di memori, dan itu mode default.
 */
const run = (allow, fn) => async (input) => {
  const session = await requireWorkspace(allow);
  if (session.error) return { error: session.error };
  try {
    return (await fn(session.db, session.workspaceId, { ...input, at: now() })) || { ok: true };
  } catch (error) {
    // Pesan aslinya tidak diteruskan ke klien: isinya bisa memuat detail
    // internal. Yang dibutuhkan UI cuma "gagal".
    console.error("action gagal", error);
    return { error: "Gagal menyimpan. Coba lagi." };
  }
};

/**
 * Unggahan **tidak lewat Server Action**.
 *
 * Byte-nya dikirim klien langsung ke penyimpanan, memakai alamat berumur pendek
 * yang dicetak di sini. Alasannya satu dan keras: badan request di Vercel
 * dibatasi 4,5 MB di semua paket, dan batas itu memotong sebelum kode aplikasi
 * dijalankan — sementara dua dropzone desain menjanjikan 25 MB.
 *
 * Jadi satu unggahan kini tiga langkah:
 *
 * 1. `signUploadAction` — memeriksa persona dan aturan berkasnya, lalu mencetak
 *    alamat unggah untuk satu jalur objek tertentu.
 * 2. Klien mengunggah byte-nya ke alamat itu.
 * 3. Action pencatat (`addMaterialAction`, `submitTaskAction`) menuliskan
 *    barisnya — setelah **memeriksa objek yang benar-benar sampai**.
 *
 * Langkah 3 itu yang menutup lubang yang dibuka langkah 2: server tidak lagi
 * memegang berkasnya, jadi nama, ukuran, dan tipe yang dikirim klien tidak bisa
 * dipercaya begitu saja.
 */
const UPLOAD_ROLE = { materials: "guru", submissions: "siswa" };

export async function signUploadAction({ kind, id, fileName, sizeBytes, contentType } = {}) {
  const session = await requireWorkspace(UPLOAD_ROLE[kind]);
  if (session.error) return { error: session.error };
  if (!UPLOAD_ROLE[kind]) return { error: "Jenis unggahan tidak dikenal." };

  // Metadata inilah yang bisa diperiksa sebelum ada byte apa pun. Pemeriksaan
  // yang menentukan tetap di langkah 3, terhadap objek yang sungguh sampai.
  const problem = validateUpload({ name: fileName, size: sizeBytes, type: contentType });
  if (problem) return { error: problem };

  try {
    const storagePath = objectPath(session.workspaceId, kind, id, fileName);
    const { url, method } = await signUpload(storagePath);
    return { url, method, storagePath };
  } catch (error) {
    console.error("gagal menandatangani unggahan", error);
    return { error: "Gagal mengunggah. Coba lagi." };
  }
}

/**
 * Action pencatat: memastikan objeknya ada dan ukurannya masuk akal, lalu
 * memakai **ukuran sebenarnya**, bukan yang diklaim klien — `sizeBytes`
 * menggerakkan "4,0 MB terpakai" di layar Materi.
 */
const withRecord = (kind, fn) =>
  run(UPLOAD_ROLE[kind], async (db, workspaceId, input) => {
    const { storagePath, sizeBytes: claimedSize, ...rest } = input;

    // Jalur objek selalu diawali id workspace; ini menahan pencatatan baris
    // yang menunjuk berkas sandbox lain.
    if (storagePath && !String(storagePath).startsWith(workspaceId + "/")) {
      return { error: "File tidak ditemukan." };
    }

    const confirmed = storagePath
      ? await confirmUpload(storagePath, { claimedSize })
      : { sizeBytes: claimedSize };
    if (confirmed.error) return { error: confirmed.error };

    return (await fn(db, workspaceId, { ...rest, storagePath: storagePath || null, sizeBytes: confirmed.sizeBytes })) || { ok: true };
  });

/**
 * Peran yang boleh memanggil tiap action mengikuti pemilik layarnya: nav siswa,
 * nav guru, dan nav TU tidak pernah berbagi satu tulisan pun. Daftarnya ditulis
 * di sini, di sebelah action-nya, supaya tidak ada tempat kedua yang harus ikut
 * diubah saat sebuah action berpindah layar.
 */

/* ---------- pengumpulan (siswa) ---------- */
export const submitTaskAction = withRecord("submissions", writes.submitTask);
export const unsubmitTaskAction = run("siswa", writes.unsubmitTask);
export const toggleTaskAction = run("siswa", writes.toggleTask);

/* ---------- penilaian (guru) ---------- */
export const gradeSubmissionAction = run("guru", writes.gradeSubmission);

/* ---------- tugas ---------- */
export const saveTaskAction = run("guru", writes.saveTask);
export const deleteTaskAction = run("guru", writes.deleteTask);

/* ---------- materi ---------- */
export const addMaterialAction = withRecord("materials", writes.addMaterial);

/** Menghapus baris **dan** byte-nya, supaya objek tak bertuan tidak menumpuk. */
export const deleteMaterialAction = run("guru", async (db, workspaceId, input) => {
  const result = await writes.deleteMaterial(db, workspaceId, input);
  if (result.storagePath) await deleteObject(result.storagePath);
  return { ok: true };
});

/** URL berumur pendek untuk mengunduh; `null` kalau tidak ada penyimpanan. */
export async function fileUrlAction({ path }) {
  const session = await requireWorkspace();
  if (session.error) return { error: session.error };
  // Jalur objek selalu diawali id workspace, jadi ini menahan pembacaan
  // lintas-sandbox walau path-nya dikarang.
  if (!path || !String(path).startsWith(session.workspaceId + "/")) return { error: "File tidak ditemukan." };
  return { url: await signedUrl(path) };
}

/* ---------- jadwal ---------- */
export const saveSlotAction = run("tu", writes.saveSlot);
export const deleteSlotAction = run("tu", writes.deleteSlot);

/* ---------- siswa ---------- */
export const addStudentAction = run("tu", writes.addStudent);
export const removeStudentAction = run("tu", writes.removeStudent);

/* ---------- kelas ---------- */
export const saveClassAction = run("tu", writes.saveClass);
export const deleteClassAction = run("tu", writes.deleteClass);

/* ---------- penugasan ---------- */
export const saveAssignmentAction = run("tu", writes.saveAssignment);
export const removeAssignmentAction = run("tu", writes.removeAssignment);

/* ---------- mata pelajaran ---------- */
export const deleteSubjectAction = run("tu", writes.deleteSubject);

/* ---------- notifikasi ---------- */
export const markNotificationsReadAction = run("siswa", writes.markNotificationsRead);

/* ---------- persona ---------- */

/**
 * Tombol Masuk di layar login desain memilih peran; tidak ada password yang
 * diperiksa, dan memang tidak pernah ada. Yang disimpan hanya peran itu, supaya
 * server tahu aksi siapa yang sah dan supaya muat ulang tidak mengembalikan
 * pengunjung ke peran siswa.
 *
 * Tidak memakai `run()`: ini yang **menetapkan** persona, jadi ia tidak boleh
 * dijaga oleh persona lama. Sandbox-nya tetap wajib ada.
 */
export async function loginAction({ role, guruId } = {}) {
  const session = await requireWorkspace();
  if (session.error) return { error: session.error };

  const value = formatPersona({ role, teacherId: guruId });
  if (!value) return { error: "Peran tidak dikenal." };

  (await cookies()).set(PERSONA_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: PERSONA_COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return { ok: true };
}

/** Keluar melepas persona, **bukan** sandbox: datanya harus masih ada saat masuk lagi. */
export async function logoutAction() {
  (await cookies()).delete(PERSONA_COOKIE);
  return { ok: true };
}
