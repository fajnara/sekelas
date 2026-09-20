/**
 * Aturan berkas — murni, tanpa modul Node.
 *
 * Dipisah dari pemilihan driver dengan sengaja: file ini diimpor kode klien
 * (untuk `accept` dan penolakan seketika), dan kalau ia menyentuh
 * `node:fs/promises` walau lewat impor dinamis, bundler akan menariknya ke
 * bundle browser dan build-nya gagal.
 */

/**
 * 25 MB, mengikuti janji yang tertulis di dua dropzone desain. Batasnya yang
 * menyesuaikan teks, bukan teks yang menyesuaikan batas — teksnya kontrak yang
 * dilihat pengguna, dan mengubahnya berarti mengubah piksel.
 */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** Ekstensi yang diterima, mengikuti teks di dua dropzone desain. */
export const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "pptx", "png", "jpg", "jpeg"];

export const ACCEPT_ATTRIBUTE = ALLOWED_EXTENSIONS.map((e) => "." + e).join(",");

const MIME_BY_EXTENSION = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ppt: ["application/vnd.ms-powerpoint"],
  pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
};

export const extensionOf = (name) => String(name || "").split(".").pop().toLowerCase();

/** Label pendek untuk badge di kartu file: "PDF", "DOC", "PPT", "IMG". */
export function extensionLabel(name) {
  const ext = extensionOf(name);
  if (ext === "doc" || ext === "docx") return "DOC";
  if (ext === "ppt" || ext === "pptx") return "PPT";
  if (ext === "png" || ext === "jpg" || ext === "jpeg") return "IMG";
  return ext.toUpperCase().slice(0, 4);
}

/**
 * Memeriksa berkas sebelum apa pun ditulis. Mengembalikan pesan kesalahan yang
 * bisa langsung ditampilkan, atau `null` kalau lolos.
 *
 * Dijalankan di klien **dan** di server. Yang di klien hanya demi respons cepat;
 * yang di server yang menentukan, karena atribut `accept` di input hanya
 * menyaring dialog pemilih file dan bisa dilewati sepenuhnya.
 */
export function validateUpload(file) {
  if (!file || typeof file.size !== "number" || !file.name) return "Pilih file dulu.";
  if (file.size === 0) return "File-nya kosong.";
  if (file.size > MAX_UPLOAD_BYTES) return "Maksimal 25 MB.";

  const ext = extensionOf(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) return "Tipe file tidak didukung.";

  // Tipe yang dilaporkan browser diperiksa juga, tapi tidak dipercaya
  // sendirian: ia mudah dipalsukan, dan sebagian browser mengirimnya kosong.
  const expected = MIME_BY_EXTENSION[ext];
  if (file.type && expected && !expected.includes(file.type)) return "Isi file tidak cocok dengan ekstensinya.";

  return null;
}

/** Jalur objek selalu diawali id workspace, jadi sandbox tidak bisa saling baca. */
export const objectPath = (workspaceId, kind, id, name) =>
  `${workspaceId}/${kind}/${id}.${extensionOf(name)}`;
