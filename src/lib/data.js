/**
 * Seed data ported verbatim from `design/Sekelas App v2.dc.html`.
 * Values are kept exactly as the design defines them so every label, colour and
 * number on screen matches the mockup.
 */

import { DEMO_NOW, jkt } from "./clock.js";

export const PRIMARY = "#6D4AFF";

// Jam pelajaran nyata: 4 blok per hari, istirahat 10.45–11.00 & 12.30–13.00
export const PERIODS = [
  ["07.30", "09.00"],
  ["09.15", "10.45"],
  ["11.00", "12.30"],
  ["13.00", "14.30"],
];

export const CLASS_ROOMS = {
  "10ipa1": "Ruang 101",
  "10ips1": "Ruang 102",
  "11ipa1": "Ruang 201",
  "11ipa2": "Ruang 202",
  "11ips1": "Ruang 203",
  "11ips2": "Ruang 204",
  "11bhs": "Ruang 205",
  "12ipa1": "Ruang 301",
  "12ips1": "Ruang 302",
};

export const LAB_ROOMS = { fis: "Lab Fisika", ing: "Lab Bahasa" };

export const SCHOOL = {
  name: "SMA Nusantara 1",
  full: "SMA Negeri 1 Nusantara",
  npsn: "20219871",
  address: "Jl. Diponegoro No. 47, Bandung 40115",
  phone: "(022) 4207512",
  year: "2026/2027",
  semester: "Ganjil",
  principal: "Drs. Suryanto Wibisono, M.Pd.",
};

export const ROOMS = [
  { code: "R-101", name: "Ruang 101", type: "Ruang kelas", capacity: 36, floor: 1 },
  { code: "R-102", name: "Ruang 102", type: "Ruang kelas", capacity: 36, floor: 1 },
  { code: "R-201", name: "Ruang 201", type: "Ruang kelas", capacity: 34, floor: 2 },
  { code: "R-202", name: "Ruang 202", type: "Ruang kelas", capacity: 34, floor: 2 },
  { code: "R-203", name: "Ruang 203", type: "Ruang kelas", capacity: 36, floor: 2 },
  { code: "R-204", name: "Ruang 204", type: "Ruang kelas", capacity: 32, floor: 2 },
  { code: "R-205", name: "Ruang 205", type: "Ruang kelas", capacity: 30, floor: 2 },
  { code: "R-301", name: "Ruang 301", type: "Ruang kelas", capacity: 32, floor: 3 },
  { code: "R-302", name: "Ruang 302", type: "Ruang kelas", capacity: 32, floor: 3 },
  { code: "LAB-FIS", name: "Lab Fisika", type: "Laboratorium", capacity: 32, floor: 1 },
  { code: "LAB-BHS", name: "Lab Bahasa", type: "Laboratorium", capacity: 30, floor: 3 },
];

export function roomInfo(name) {
  return ROOMS.filter((r) => r.name === name)[0] || null;
}

export const ME = {
  name: "Alya Pratiwi",
  nis: "2210488",
  nisn: "0071234588",
  classId: "11ipa2",
  gender: "Perempuan",
  birth: "Bandung, 14 Maret 2009",
  phone: "0812-2145-8890",
  guardian: "Suryadi Pratama · 0813-2200-4471",
  address: "Jl. Cikutra Baru V No. 12, Bandung",
};

export const STUDENT_POOL = [
  "Alya Pratiwi",
  "Bagas Nugroho",
  "Citra Maharani",
  "Dimas Ardiansyah",
  "Eka Rahmawati",
  "Farhan Maulana",
  "Gita Ayu Lestari",
  "Hafiz Ramadhan",
  "Indah Permatasari",
  "Joko Prasetyo",
  "Kirana Wulandari",
  "Luthfi Hidayat",
  "Mega Anindya",
  "Naufal Rizky",
  "Oktavia Sari",
  "Putra Wibowo",
  "Qonita Zahra",
  "Rafi Alfarizi",
  "Salsabila Hana",
  "Taufik Hidayat",
  "Ulfa Nabila",
  "Vino Saputra",
  "Wulan Cahyani",
  "Yoga Dwi Santoso",
  "Zahra Amelia",
  "Aditya Kurniawan",
  "Bunga Larasati",
  "Cahyo Utomo",
  "Dewi Anggraini",
  "Erlangga Putra",
  "Fitri Handayani",
  "Galih Ramadhan",
  "Hana Safira",
  "Irfan Maulida",
  "Jihan Aprilia",
  "Krisna Bagaskara",
  "Lina Marlina",
  "Miftah Fauzan",
  "Nadia Syaputri",
  "Rangga Pratama",
];

export const SUBJECTS = [
  {
    id: "mat",
    name: "Matematika",
    abbr: "MA",
    room: "Ruang 202",
    color: "#6D4AFF",
    onColor: "#fff",
    tint: "#F1EEFF",
    border: "rgba(109,74,255,.14)",
    ink: "#5334E0",
    attendance: "98%",
  },
  {
    id: "fis",
    name: "Fisika",
    abbr: "FI",
    room: "Lab Fisika",
    color: "#10B981",
    onColor: "#fff",
    tint: "#E9FBF3",
    border: "rgba(16,185,129,.16)",
    ink: "#0B7A55",
    attendance: "95%",
  },
  {
    id: "bin",
    name: "Bahasa Indonesia",
    abbr: "BI",
    room: "Ruang 202",
    color: "#FACC15",
    onColor: "#3C3200",
    tint: "#FFF7DB",
    border: "rgba(250,204,21,.28)",
    ink: "#8A6100",
    attendance: "97%",
  },
  {
    id: "sej",
    name: "Sejarah",
    abbr: "SE",
    room: "Ruang 202",
    color: "#FF6B5A",
    onColor: "#fff",
    tint: "#FFEDE9",
    border: "rgba(255,107,90,.2)",
    ink: "#C2402F",
    attendance: "92%",
  },
  {
    id: "ing",
    name: "Bahasa Inggris",
    abbr: "EN",
    room: "Lab Bahasa",
    color: "#38BDF8",
    onColor: "#04364A",
    tint: "#E6F6FE",
    border: "rgba(56,189,248,.24)",
    ink: "#0A6D91",
    attendance: "99%",
  },
];

const KB = 1024;
const MB = 1024 * KB;

/**
 * Tabel materi — satu sumber untuk sisi guru maupun siswa.
 *
 * Sebelumnya ada dua: `SUBJECTS[].materials` yang statis (dibaca layar Detail
 * Mapel siswa) dan `st.materials` (dibaca layar Materi guru). Hanya yang kedua
 * yang ditulis saat guru mengunggah, jadi file baru **tidak pernah** sampai ke
 * siswa. Menyatukannya sekaligus memperbaiki itu.
 *
 * Ukuran disimpan dalam byte, bukan string "2,4 MB" — supaya totalnya benar-benar
 * dijumlahkan, bukan di-parse ulang dari teks.
 */
export const MATERIALS = [
  { id: "mat-0", subjectId: "mat", name: "Limit Fungsi Aljabar.pdf", ext: "PDF", sizeBytes: Math.round(2.4 * MB), createdAt: jkt(2026, 9, 3) },
  { id: "mat-1", subjectId: "mat", name: "Latihan Turunan (Bab 4).docx", ext: "DOC", sizeBytes: 480 * KB, createdAt: jkt(2026, 9, 1) },
  { id: "mat-2", subjectId: "mat", name: "Rangkuman Trigonometri.pdf", ext: "PDF", sizeBytes: Math.round(1.1 * MB), createdAt: jkt(2026, 8, 28) },
  { id: "fis-0", subjectId: "fis", name: "Modul Hukum Newton.pdf", ext: "PDF", sizeBytes: Math.round(3.2 * MB), createdAt: jkt(2026, 9, 4) },
  { id: "fis-1", subjectId: "fis", name: "Panduan Laporan Praktikum.docx", ext: "DOC", sizeBytes: 320 * KB, createdAt: jkt(2026, 9, 2) },
  { id: "bin-0", subjectId: "bin", name: "Struktur Teks Eksposisi.pdf", ext: "PDF", sizeBytes: 890 * KB, createdAt: jkt(2026, 9, 3) },
  { id: "bin-1", subjectId: "bin", name: "Contoh Esai Argumentatif.pdf", ext: "PDF", sizeBytes: Math.round(1.3 * MB), createdAt: jkt(2026, 8, 30) },
  { id: "sej-0", subjectId: "sej", name: "Pergerakan Nasional 1908.pdf", ext: "PDF", sizeBytes: Math.round(2.1 * MB), createdAt: jkt(2026, 9, 1) },
  { id: "ing-0", subjectId: "ing", name: "Narrative Text Worksheet.pdf", ext: "PDF", sizeBytes: 640 * KB, createdAt: jkt(2026, 9, 5) },
  { id: "ing-1", subjectId: "ing", name: "Speaking Rubric.pdf", ext: "PDF", sizeBytes: 210 * KB, createdAt: jkt(2026, 8, 29) },
];

/** "2,4 MB" / "480 KB" — koma sebagai pemisah desimal, seperti di desain. */
export const formatSize = (bytes) =>
  bytes >= MB ? (bytes / MB).toFixed(1).replace(".", ",") + " MB" : Math.round(bytes / KB) + " KB";

/** Total terpakai, selalu dalam MB dengan satu desimal. */
export const formatTotalSize = (bytes) => (bytes / MB).toFixed(1).replace(".", ",") + " MB";

export const DAY_NAMES = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
export const MAJORS = ["IPA", "IPS", "Bahasa"];
export const LEVELS = ["X", "XI", "XII"];

/**
 * `students` di sini hanyalah **input pembangkit roster**, bukan kolom.
 * Jumlah siswa selalu dihitung dari tabel `STUDENTS` di bawah — menyimpan
 * angkanya juga berarti dua sumber yang pasti melenceng begitu TU menambah
 * atau mengeluarkan siswa.
 */
const CLASS_SEED = [
  { id: "10ipa1", name: "X IPA 1", level: "X", major: "IPA", students: 35, newMaterials: 6, homeroomTeacherId: "t1" },
  { id: "10ips1", name: "X IPS 1", level: "X", major: "IPS", students: 33, newMaterials: 4, homeroomTeacherId: "t4" },
  { id: "11ipa1", name: "XI IPA 1", level: "XI", major: "IPA", students: 34, newMaterials: 9, homeroomTeacherId: "t1" },
  { id: "11ipa2", name: "XI IPA 2", level: "XI", major: "IPA", students: 32, newMaterials: 14, homeroomTeacherId: "t2" },
  { id: "11ips1", name: "XI IPS 1", level: "XI", major: "IPS", students: 36, newMaterials: 7, homeroomTeacherId: "t4" },
  { id: "11ips2", name: "XI IPS 2", level: "XI", major: "IPS", students: 31, newMaterials: 5, homeroomTeacherId: "t3" },
  { id: "11bhs", name: "XI Bahasa", level: "XI", major: "Bahasa", students: 28, newMaterials: 11, homeroomTeacherId: "t5" },
  { id: "12ipa1", name: "XII IPA 1", level: "XII", major: "IPA", students: 30, newMaterials: 8, homeroomTeacherId: "t2" },
  { id: "12ips1", name: "XII IPS 1", level: "XII", major: "IPS", students: 29, newMaterials: 3, homeroomTeacherId: "t3" },
];

export const CLASSES = CLASS_SEED.map(({ students, ...c }) => ({
  ...c,
  // Ruang kelas jadi kolom, bukan lookup berdasarkan id kelas.
  roomName: CLASS_ROOMS[c.id] || null,
}));

export const ALL_CLASS_IDS = CLASSES.map((c) => c.id);
export const IPA_CLASS_IDS = CLASSES.filter((c) => c.major === "IPA").map((c) => c.id);

const TEACHER_SEED = [
  {
    id: "t1",
    name: "Ratna Dewi",
    degree: "Ratna Dewi, S.Pd.",
    email: "ratna.d@nusantara1.sch.id",
    initials: "RD",
    nip: "19810412 200604 2 003",
    phone: "0811-2043-7781",
    status: "PNS",
    since: 2006,
    assignments: [{ subjectId: "mat", classIds: ALL_CLASS_IDS.slice() }],
  },
  {
    id: "t2",
    name: "Hendra Susilo",
    degree: "Hendra Susilo, S.Pd., M.Si.",
    email: "hendra.s@nusantara1.sch.id",
    initials: "HS",
    nip: "19770926 200312 1 004",
    phone: "0812-2288-4410",
    status: "PNS",
    since: 2003,
    assignments: [{ subjectId: "fis", classIds: IPA_CLASS_IDS.slice() }],
  },
  {
    id: "t3",
    name: "Sari Puspita",
    degree: "Sari Puspita, S.Pd.",
    email: "sari.p@nusantara1.sch.id",
    initials: "SP",
    nip: "19850703 201101 2 012",
    phone: "0813-2091-5527",
    status: "PNS",
    since: 2011,
    assignments: [{ subjectId: "bin", classIds: ALL_CLASS_IDS.slice() }],
  },
  {
    id: "t4",
    name: "Bagus Yudha",
    degree: "Bagus Yudha, S.Hum.",
    email: "bagus.y@nusantara1.sch.id",
    initials: "BY",
    nip: "19890218 201504 1 007",
    phone: "0857-2144-9903",
    status: "PPPK",
    since: 2015,
    assignments: [{ subjectId: "sej", classIds: ALL_CLASS_IDS.slice() }],
  },
  {
    id: "t5",
    name: "Clara Wijaya",
    degree: "Clara Wijaya, S.S.",
    email: "clara.w@nusantara1.sch.id",
    initials: "CW",
    nip: "19920605 201807 2 015",
    phone: "0821-3377-6620",
    status: "PPPK",
    since: 2018,
    assignments: [{ subjectId: "ing", classIds: ALL_CLASS_IDS.slice() }],
  },
];

export const TU_ACCOUNT = {
  name: "Retno Widyastuti",
  degree: "Retno Widyastuti, A.Md.",
  email: "tu.akademik@nusantara1.sch.id",
  nip: "19880124 201203 2 009",
  role: "Staf TU Akademik",
  phone: "0812-2019-4455",
  since: 2012,
};

export const TEACHERS = TEACHER_SEED.map(({ assignments, ...t }) => t);

/**
 * Penugasan mengajar pada grain aslinya: satu baris per (guru, mapel, kelas).
 *
 * Sebelumnya bersarang — `teachers[].assignments[{subjectId, classIds[]}]` —
 * yang membuat setiap pertanyaan ("siapa yang mengajar X di kelas Y?") jadi
 * pencarian dua tingkat. Urutan baris mengikuti urutan seed, jadi semua daftar
 * yang dirender tetap urut seperti desain.
 */
export const TEACHING_ASSIGNMENTS = TEACHER_SEED.flatMap((t) =>
  t.assignments.flatMap((a) => a.classIds.map((classId) => ({ teacherId: t.id, subjectId: a.subjectId, classId }))),
);

export function uniq(a) {
  return a.filter((x, i) => a.indexOf(x) === i);
}

/** Mapel yang diajarkan di sebuah kelas, urut seperti daftar mapel. */
export function subjectsOfClass(classId, assignments = TEACHING_ASSIGNMENTS) {
  return SUBJECTS.filter((s) => assignments.some((a) => a.subjectId === s.id && a.classId === classId));
}

export const TASK_KINDS = ["Individu", "Kelompok", "Kuis"];

export const COLORS = [
  { color: "#6D4AFF" },
  { color: "#10B981" },
  { color: "#FACC15" },
  { color: "#FF6B5A" },
  { color: "#38BDF8" },
];

const initialsOf = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

/**
 * Roster satu kelas, dibangkitkan deterministik dari urutan kelas + jumlahnya.
 * Hanya dipakai sekali, saat membangun `STUDENTS` di bawah.
 */
function makeRoster(c, classIndex) {
  const base = classIndex < 0 ? 0 : classIndex * 5;
  const out = [];
  for (let k = 0; k < c.students; k++) {
    const nm = STUDENT_POOL[(base + k) % STUDENT_POOL.length];
    out.push({
      name: nm,
      nis: "22" + (10400 + classIndex * 40 + k + 1),
      nisn: "00712" + String(34500 + classIndex * 40 + k + 1),
      initials: initialsOf(nm),
    });
  }
  // Alya harus jadi siswa nyata di kelasnya sendiri, bukan nama pool.
  if (c.id === ME.classId) {
    const dup = out.findIndex((s) => s.name === ME.name);
    if (dup !== -1) out.splice(dup, 1);
    else out.pop();
    out.unshift({ name: ME.name, nis: ME.nis, nisn: ME.nisn, initials: "AP" });
  }
  return out;
}

/**
 * Tabel siswa — datar, ber-id stabil, satu baris per siswa.
 * Ini hasil akhir `makeRoster`; pembangkitnya tidak pernah jalan lagi setelah
 * modul ini dimuat, jadi menambah/mengeluarkan siswa tidak bisa lagi bentrok
 * dengan angka yang dibangkitkan ulang.
 */
export const STUDENTS = CLASS_SEED.flatMap((c, ci) =>
  makeRoster(c, ci).map((s, k) => ({
    id: c.id + "-" + String(k + 1).padStart(2, "0"),
    classId: c.id,
    name: s.name,
    nis: s.nis,
    nisn: s.nisn,
    initials: s.initials,
    isMe: c.id === ME.classId && s.name === ME.name,
  })),
  // `sortOrder` berarti satu hal saja: posisi baris di tabel. Kalau dibuat
  // bermakna per kelas, `ORDER BY sort_order` akan mengacak antar kelas.
).map((s, i) => ({ ...s, sortOrder: i }));

export const makeStudentId = (classId, seq) => classId + "-n" + seq;
export { initialsOf };

export function mins(t) {
  const m = /(\d{1,2})[.:](\d{2})/.exec(String(t || ""));
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
}

// 20 sel jadwal (5 hari x 4 jam pelajaran). Pemetaan di bawah menjamin:
// satu kelas tidak pernah dua mapel di jam sama, dan satu guru/lab tidak pernah bentrok.
export function makeSlots() {
  const out = [];
  CLASSES.forEach((c, ci) => {
    const shift = Math.floor(ci / 5);
    subjectsOfClass(c.id).forEach((s) => {
      const si = SUBJECTS.findIndex((x) => x.id === s.id);
      for (let m = 0; m < 2; m++) {
        const d = (si + 2 * m + ci) % 5; // 2 mapel per hari per kelas
        const pi = (2 * m + shift + d) % 4; // guru & lab tidak pernah bentrok
        const p = PERIODS[pi];
        out.push({
          id: c.id + "-" + s.id + m,
          classId: c.id,
          subjectId: s.id,
          day: DAY_NAMES[d],
          start: p[0],
          end: p[1],
          room: LAB_ROOMS[s.id] || CLASS_ROOMS[c.id] || "Ruang kelas",
        });
      }
    });
  });
  return out;
}

/**
 * Tugas — satu tabel untuk dua sudut pandang.
 *
 * Desain punya dua array untuk entitas yang sama: `TASKS` (sisi siswa, id 1–8)
 * dan `ADMIN_TASKS` (sisi guru, id a1–a11). Setelah "hari ini" dipatok, keempat
 * baris yang tumpang-tindih terbukti cocok deadline dan bobotnya, jadi keduanya
 * disatukan dengan kunci (kelas, judul). Riwayat nilai (`PAST_GRADES`) juga
 * masuk ke sini sebagai tugas `isArchived`, sehingga rata-rata rapor dihitung
 * dari data yang sama, bukan dari array terpisah.
 *
 * `legacyNo` mempertahankan id numerik sisi siswa supaya `?taskId=2` dari
 * katalog desain tetap membuka tugas yang sama.
 *
 * `seedSubmitted` dan `me` bukan kolom — keduanya hanya bahan untuk
 * membangkitkan `SUBMISSIONS` di bawah, lalu dibuang dari baris yang diekspor.
 */
const TASK_SEED = [
  // ---- XI IPA 2: terlihat oleh siswa maupun guru ----
  {
    id: "a1",
    legacyNo: 1,
    classId: "11ipa2",
    subjectId: "mat",
    teacherId: "t1",
    title: "Kerjakan soal limit fungsi hal. 84–86",
    desc: "Selesaikan soal nomor 1–15 pada buku paket halaman 84–86. Tulis langkah pengerjaan, bukan hanya jawaban akhir. Kumpulkan foto atau scan PDF melalui Sekelas.",
    kind: "Individu",
    weightPct: 10,
    dueAt: jkt(2026, 9, 7, 23, 59),
    files: [
      { name: "Soal Limit hal 84-86.pdf", ext: "PDF", size: "1,8 MB" },
      { name: "Format pengumpulan.docx", ext: "DOC", size: "180 KB" },
    ],
    seedSubmitted: 18,
  },
  {
    id: "a2",
    legacyNo: 2,
    classId: "11ipa2",
    subjectId: "fis",
    teacherId: "t2",
    title: "Laporan praktikum Hukum Newton",
    desc: "Susun laporan hasil praktikum kemarin: tujuan, alat & bahan, langkah kerja, tabel data, analisis, dan kesimpulan. Maksimal 8 halaman, format PDF.",
    kind: "Kelompok",
    groupSize: 4,
    weightPct: 20,
    dueAt: jkt(2026, 9, 8, 12, 0),
    files: [{ name: "Panduan Laporan Praktikum.docx", ext: "DOC", size: "320 KB" }],
    seedSubmitted: 6,
  },
  {
    id: "a3",
    legacyNo: 3,
    classId: "11ipa2",
    subjectId: "ing",
    teacherId: "t5",
    title: "Write a 300-word narrative text",
    desc: "Choose one legend from your region and rewrite it as a narrative text (orientation, complication, resolution, re-orientation). Mind the past tense.",
    kind: "Individu",
    weightPct: 10,
    dueAt: jkt(2026, 9, 9, 8, 0),
    files: [{ name: "Narrative Text Worksheet.pdf", ext: "PDF", size: "640 KB" }],
    seedSubmitted: 11,
  },
  {
    id: "b4",
    legacyNo: 4,
    classId: "11ipa2",
    subjectId: "bin",
    teacherId: "t3",
    title: "Esai argumentatif: literasi digital remaja",
    desc: "Tulis esai 700–900 kata dengan struktur tesis–argumen–penegasan ulang. Sertakan minimal dua sumber kredibel dan daftar rujukan.",
    kind: "Individu",
    weightPct: 15,
    dueAt: jkt(2026, 9, 11, 23, 59),
    files: [{ name: "Struktur Teks Eksposisi.pdf", ext: "PDF", size: "890 KB" }],
  },
  {
    id: "b5",
    legacyNo: 5,
    classId: "11ipa2",
    subjectId: "sej",
    teacherId: "t4",
    title: "Rangkuman bab Pergerakan Nasional",
    desc: "Buat rangkuman satu halaman berisi tokoh, organisasi, dan peristiwa penting periode 1908–1928. Boleh berbentuk mind map.",
    kind: "Individu",
    weightPct: 10,
    dueAt: jkt(2026, 9, 14, 10, 0),
    files: [{ name: "Pergerakan Nasional 1908.pdf", ext: "PDF", size: "2,1 MB" }],
  },
  {
    id: "a4",
    legacyNo: 6,
    classId: "11ipa2",
    subjectId: "mat",
    teacherId: "t1",
    title: "Kuis online turunan fungsi",
    desc: "Kuis 20 soal pilihan ganda, durasi 40 menit, dikerjakan langsung di Sekelas. Bisa dibuka sekali saja.",
    kind: "Kuis",
    weightPct: 5,
    dueAt: jkt(2026, 9, 16, 15, 0),
    files: [{ name: "Latihan Turunan (Bab 4).docx", ext: "DOC", size: "480 KB" }],
    seedSubmitted: 0,
  },
  {
    id: "b7",
    legacyNo: 7,
    classId: "11ipa2",
    subjectId: "fis",
    teacherId: "t2",
    title: "Latihan soal gerak parabola",
    desc: "Soal 1–10 tentang gerak parabola, dikumpulkan lewat Sekelas.",
    kind: "Individu",
    weightPct: 10,
    dueAt: jkt(2026, 9, 6, 23, 59),
    files: [{ name: "Modul Hukum Newton.pdf", ext: "PDF", size: "3,2 MB" }],
    me: {
      submittedAt: jkt(2026, 9, 5, 19, 24),
      file: "Tugas-Alya.pdf",
      score: 88,
      feedback: "Langkah pengerjaan rapi. Perhatikan satuan di nomor 7.",
      gradedAt: jkt(2026, 9, 5),
    },
  },
  {
    id: "b8",
    legacyNo: 8,
    classId: "11ipa2",
    subjectId: "bin",
    teacherId: "t3",
    title: "Baca & tandai gagasan utama hal. 52–55",
    desc: "Baca teks eksposisi halaman 52–55, tandai gagasan utama tiap paragraf, lalu tulis ringkasan tiga kalimat.",
    kind: "Individu",
    weightPct: 5,
    dueAt: jkt(2026, 9, 7, 23, 59),
    files: [{ name: "Struktur Teks Eksposisi.pdf", ext: "PDF", size: "890 KB" }],
    me: { submittedAt: jkt(2026, 9, 7, 8, 10), file: "Tugas-Alya.pdf" },
  },

  // ---- Kelas lain: hanya sisi guru ----
  { id: "a5", classId: "11ipa1", subjectId: "mat", teacherId: "t1", title: "Latihan integral tentu hal. 61", desc: "Latihan integral tentu hal. 61 nomor 1–12. Sertakan langkah substitusi secara lengkap.", kind: "Individu", weightPct: 10, dueAt: jkt(2026, 9, 8, 23, 59), seedSubmitted: 22 },
  { id: "a6", classId: "11ipa1", subjectId: "fis", teacherId: "t2", title: "Presentasi energi terbarukan", desc: "Presentasi kelompok 10 menit tentang satu sumber energi terbarukan. Kumpulkan slide sebelum tampil.", kind: "Kelompok", groupSize: 4, weightPct: 25, dueAt: jkt(2026, 9, 12, 10, 0), seedSubmitted: 4 },
  { id: "a7", classId: "11ips1", subjectId: "sej", teacherId: "t4", title: "Analisis sumber sejarah lokal", desc: "Analisis satu sumber sejarah lokal (foto, dokumen, atau wawancara). Jelaskan konteks dan keasliannya.", kind: "Individu", weightPct: 15, dueAt: jkt(2026, 9, 10, 23, 59), seedSubmitted: 19 },
  { id: "a8", classId: "11ips1", subjectId: "bin", teacherId: "t3", title: "Esai argumentatif: literasi digital", desc: "Esai argumentatif 600–800 kata tentang literasi digital. Wajib memuat minimal 3 sumber rujukan.", kind: "Individu", weightPct: 15, dueAt: jkt(2026, 9, 11, 23, 59), seedSubmitted: 12 },
  { id: "a9", classId: "11ips2", subjectId: "sej", teacherId: "t4", title: "Kuis periode kolonial", desc: "Kuis 25 soal tentang periode kolonial di Indonesia. Waktu 40 menit.", kind: "Kuis", weightPct: 5, dueAt: jkt(2026, 9, 9, 13, 0), seedSubmitted: 0 },
  { id: "a10", classId: "11bhs", subjectId: "ing", teacherId: "t5", title: "Group storytelling performance", desc: "Tampilkan cerita rakyat dalam bahasa Inggris secara berkelompok, durasi 7–10 menit.", kind: "Kelompok", groupSize: 4, weightPct: 20, dueAt: jkt(2026, 9, 13, 9, 0), seedSubmitted: 3 },
  { id: "a11", classId: "11bhs", subjectId: "bin", teacherId: "t3", title: "Menyusun puisi bebas + telaah diksi", desc: "Tulis satu puisi bebas, lalu telaah pilihan diksi dan majas yang kamu gunakan dalam 1 paragraf.", kind: "Individu", weightPct: 10, dueAt: jkt(2026, 9, 15, 23, 59), seedSubmitted: 8 },

  // ---- Arsip: riwayat nilai yang sudah keluar, tidak muncul di daftar tugas ----
  ...[
    { subjectId: "mat", teacherId: "t1", title: "Ulangan Bab 3 · Limit fungsi", weightPct: 15, score: 85, at: jkt(2026, 8, 29) },
    { subjectId: "mat", teacherId: "t1", title: "Latihan trigonometri hal. 40", weightPct: 10, score: 92, at: jkt(2026, 8, 22) },
    { subjectId: "fis", teacherId: "t2", title: "Kuis Hukum Newton", weightPct: 5, score: 76, at: jkt(2026, 8, 27) },
    { subjectId: "bin", teacherId: "t3", title: "Baca & tandai gagasan utama", weightPct: 5, score: 90, at: jkt(2026, 9, 7) },
    { subjectId: "bin", teacherId: "t3", title: "Teks eksposisi · draf pertama", weightPct: 10, score: 81, at: jkt(2026, 8, 25) },
    { subjectId: "sej", teacherId: "t4", title: "Kuis Pergerakan Nasional", weightPct: 5, score: 74, at: jkt(2026, 9, 2) },
    { subjectId: "ing", teacherId: "t5", title: "Descriptive text worksheet", weightPct: 10, score: 95, at: jkt(2026, 9, 1) },
    { subjectId: "ing", teacherId: "t5", title: "Speaking practice 1", weightPct: 10, score: 89, at: jkt(2026, 8, 24) },
  ].map((g, i) => ({
    id: "arc" + (i + 1),
    classId: ME.classId,
    subjectId: g.subjectId,
    teacherId: g.teacherId,
    title: g.title,
    desc: "",
    kind: "Individu",
    weightPct: g.weightPct,
    dueAt: g.at,
    isArchived: true,
    me: { submittedAt: g.at, score: g.score, gradedAt: g.at },
  })),
];

/**
 * Kolom opsional dinormalkan di sini supaya bentuk barisnya identik dengan yang
 * dikembalikan database — itu yang membuat round-trip Postgres bisa dibandingkan
 * persis dengan seed lokal.
 */
export const TASKS = TASK_SEED.map(({ seedSubmitted, me, ...t }) => ({
  ...t,
  legacyNo: t.legacyNo ?? null,
  teacherId: t.teacherId ?? null,
  groupSize: t.groupSize ?? null,
  desc: t.desc ?? "",
  files: t.files ?? [],
  isArchived: !!t.isArchived,
}));

export const taskIdByLegacy = (n) => (TASKS.find((t) => t.legacyNo === Number(n)) || {}).id;

/** "Kelompok (4 orang)" / "Kuis" / "Tugas individu" — string yang dipakai desain. */
export const taskType = (t) =>
  t.kind === "Kelompok" ? "Kelompok (" + (t.groupSize || 4) + " orang)" : t.kind === "Kuis" ? "Kuis" : "Tugas individu";

export const ME_STUDENT_ID = (STUDENTS.find((s) => s.isMe) || {}).id;

/**
 * Pengumpulan — menggantikan `done`, `sub`, `grade`, `submittedAt`, `file`,
 * `st.grades`, `st.subs`, **dan** kolom hitungan `submitted`.
 *
 * Dua hal penting di sini:
 *
 * 1. Baris milik Alya diambil dari kebenaran sisi siswa, bukan dari tebakan
 *    posisional. Desain menebak siapa yang sudah mengumpulkan dengan `i <
 *    submitted` atas roster urut abjad; Alya urutan kedua, jadi tampilan guru
 *    menyatakan dia sudah mengumpulkan tugas yang menurut tampilan siswa belum.
 *    Sekarang keduanya sepakat.
 * 2. Jumlahnya tetap sama — sisa kuota diisi teman sekelas, melewati Alya.
 */
function buildSubmissions(seed) {
  const out = [];
  let n = 0;
  const nextId = () => "sub" + ++n;
  const byName = (a, b) => a.name.localeCompare(b.name);

  for (const t of seed) {
    if (!t.me) continue;
    out.push({
      id: nextId(),
      taskId: t.id,
      studentId: ME_STUDENT_ID,
      checkedOffAt: t.me.submittedAt ?? null,
      submittedAt: t.me.submittedAt ?? null,
      fileName: t.me.file ?? null,
      note: null,
      score: t.me.score ?? null,
      feedback: t.me.feedback ?? null,
      gradedAt: t.me.gradedAt ?? null,
    });
  }

  for (const t of seed) {
    const target = t.seedSubmitted || 0;
    if (!target) continue;
    // Jam pengumpulan tidak pernah ditampilkan untuk teman sekelas; yang penting
    // ia sebelum deadline dan tidak di masa depan.
    const at = new Date(Math.min(t.dueAt.getTime() - 3_600_000, DEMO_NOW.getTime()));
    let filled = out.filter((s) => s.taskId === t.id && s.submittedAt).length;
    for (const r of STUDENTS.filter((s) => s.classId === t.classId).sort(byName)) {
      if (filled >= target) break;
      if (r.isMe) continue;
      out.push({
        id: nextId(),
        taskId: t.id,
        studentId: r.id,
        checkedOffAt: at,
        submittedAt: at,
        fileName: "Tugas-" + r.name.split(" ")[0] + ".pdf",
        note: null,
        score: null,
        feedback: null,
        gradedAt: null,
      });
      filled++;
    }
  }
  return out;
}

export const SUBMISSIONS = buildSubmissions(TASK_SEED);

const minutesAgo = (n) => new Date(DEMO_NOW.getTime() - n * 60_000);

/**
 * Notifikasi siswa. Warnanya tidak disimpan — diturunkan dari `kind` di
 * view-model. `target` menyimpan ke mana notifikasi membawa, bukan callback.
 * `readAt` yang menentukan latar baris, bukan flag global "sudah dibuka".
 */
export const NOTIFICATIONS = [
  {
    id: "n1",
    kind: "Tugas baru",
    text: "Ratna Dewi menambah tugas “Kuis online turunan fungsi” untuk XI IPA 2",
    createdAt: minutesAgo(12),
    readAt: null,
    target: { screen: "taskDetail", legacyTaskNo: 6 },
  },
  {
    id: "n2",
    kind: "Deadline",
    text: "“Laporan praktikum Hukum Newton” jatuh tempo besok 12.00 — belum kamu kumpulkan",
    createdAt: minutesAgo(60),
    readAt: null,
    target: { screen: "taskDetail", legacyTaskNo: 2 },
  },
  {
    id: "n3",
    kind: "Nilai keluar",
    text: "Nilai “Latihan soal gerak parabola” sudah keluar: 88",
    createdAt: minutesAgo(20 * 60),
    readAt: minutesAgo(19 * 60),
    target: { screen: "grades" },
  },
  {
    id: "n4",
    kind: "Jadwal berubah",
    text: "Fisika dipindah ke Rabu 13.00 di Lab Fisika oleh TU",
    createdAt: minutesAgo(26 * 60),
    readAt: minutesAgo(19 * 60),
    target: { screen: "calendar" },
  },
];

/** Aktivitas terbaru di dashboard TU. */
export const ACTIVITY = [
  { id: "ac1", text: "Hendra Susilo menambah tugas “Laporan praktikum Hukum Newton”", color: "#10B981", createdAt: minutesAgo(12) },
  { id: "ac2", text: "Sari Puspita mengunggah materi “Struktur Teks Eksposisi.pdf”", color: "#FACC15", createdAt: minutesAgo(60) },
  { id: "ac3", text: "Jadwal Fisika XI IPA 2 dipindah ke Rabu 13.00", color: "#6D4AFF", createdAt: minutesAgo(3 * 60) },
  { id: "ac4", text: "18 siswa menyelesaikan kuis turunan fungsi", color: "#38BDF8", createdAt: minutesAgo(28 * 60) },
];
