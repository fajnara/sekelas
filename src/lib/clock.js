/**
 * Satu-satunya sumber "sekarang" untuk seluruh aplikasi — diimpor hook klien
 * maupun (nanti) Server Action, supaya tidak ada dua jam yang bisa melenceng.
 *
 * Jamnya dipatok ke Senin 7 September 2026, 09:41 WIB. Itu bukan preferensi:
 * string "Senin, 7 September" ada sebagai literal di dua layar, dan layar tidak
 * boleh berubah. Menitnya juga dipilih sengaja — StatusBar menampilkan 09:41,
 * jadi label yang *diturunkan* untuk pengumpulan baru ("Hari ini · 09.41")
 * mereproduksi label yang dulu ditulis hardcode.
 *
 * Semua yang relatif (hari ini/besok, grid minggu, "N hari lagi") diturunkan
 * lewat `now()`. Tidak ada nilai relatif yang pernah disimpan — yang disimpan
 * selalu tanggal-waktu sungguhan.
 */

export const TZ = "Asia/Jakarta";

/** WIB = UTC+7 sepanjang tahun, tidak ada DST, jadi offset tetap ini aman. */
const TZ_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

export const DEMO_NOW = new Date("2026-09-07T09:41:00+07:00");

export const now = () =>
  process.env.NEXT_PUBLIC_DEMO_CLOCK === "live" ? new Date() : DEMO_NOW;

/** Membuat tanggal WIB dari komponen kalender. Bulan 1-based supaya enak dibaca. */
export const jkt = (year, month, day, hour = 0, minute = 0) =>
  new Date(Date.UTC(year, month - 1, day, hour, minute) - TZ_OFFSET_MS);

/**
 * Menggeser instant ke "waktu sipil" WIB, lalu dibaca dengan getUTC* — cara
 * ini menghindari ketergantungan pada timezone mesin yang menjalankan kode.
 */
const civil = (d) => new Date(d.getTime() + TZ_OFFSET_MS);

/** Nomor hari kalender WIB. Basis semua perbandingan hari. */
const civilDay = (d) => Math.floor((d.getTime() + TZ_OFFSET_MS) / DAY_MS);

export const MON_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export const MON_LONG = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const pad = (n) => String(n).padStart(2, "0");

export const hhmm = (d) => {
  const c = civil(d);
  return pad(c.getUTCHours()) + "." + pad(c.getUTCMinutes());
};

export const shortDate = (d) => {
  const c = civil(d);
  return c.getUTCDate() + " " + MON_SHORT[c.getUTCMonth()];
};

/** Format `<input type="date">`. */
export const isoDate = (d) => {
  const c = civil(d);
  return c.getUTCFullYear() + "-" + pad(c.getUTCMonth() + 1) + "-" + pad(c.getUTCDate());
};

/** Kebalikan `isoDate` + `hhmm`, dipakai saat guru menyimpan tugas. */
export const fromDateAndTime = (isoDay, timeLabel) => {
  const [y, m, d] = String(isoDay).split("-").map(Number);
  const t = /(\d{1,2})[.:](\d{2})/.exec(String(timeLabel || ""));
  if (!y || !m || !d) return null;
  return jkt(y, m, d, t ? Number(t[1]) : 23, t ? Number(t[2]) : 59);
};

export const dayOfMonth = (d) => civil(d).getUTCDate();
export const monthLong = (d) => MON_LONG[civil(d).getUTCMonth()];
export const yearOf = (d) => civil(d).getUTCFullYear();

/**
 * Selisih **hari kalender**, bukan selisih 24 jam. Ini bukan detail kosmetik:
 * tugas 3 jatuh 8 Sep 08.00, yang dari 7 Sep 09.41 hanya berjarak 22,3 jam.
 * Pembagian 24 jam akan memberi 0 ("Hari ini") padahal desain bilang 1
 * ("Besok") — dan angka itu juga menggerakkan progress ring serta filter
 * "Deadline dekat", jadi salahnya menyebar tanpa memunculkan error.
 */
export const calendarDaysUntil = (target, ref = now()) => civilDay(target) - civilDay(ref);

export const isToday = (d, ref = now()) => civilDay(d) === civilDay(ref);

export const startOfDay = (d) => new Date(civilDay(d) * DAY_MS - TZ_OFFSET_MS);
export const addDays = (d, n) => new Date(d.getTime() + n * DAY_MS);

/** Senin sebagai awal minggu, mengikuti urutan DAY_NAMES desain. */
export const startOfWeekMonday = (d = now()) => {
  const dow = (civil(d).getUTCDay() + 6) % 7;
  return addDays(startOfDay(d), -dow);
};

/* ---------- label yang tampil di layar ---------- */

/**
 * Label deadline di kartu & detail tugas.
 *
 * Untuk tugas yang sudah selesai, desain menampilkan tanggal **pengumpulan**,
 * bukan deadline — "Selesai · 5 Sep" pada tugas yang dikumpulkan 5 Sep 19.24
 * meski deadline-nya 6 Sep. Itu sebabnya `submittedAt` ikut diperiksa di sini.
 */
export const formatDue = ({ dueAt, done, submittedAt }, ref = now()) => {
  if (done) {
    const stamp = submittedAt || dueAt;
    return "Selesai · " + (isToday(stamp, ref) ? "hari ini" : shortDate(stamp));
  }
  const days = calendarDaysUntil(dueAt, ref);
  const prefix = days === 0 ? "Hari ini" : days === 1 ? "Besok" : shortDate(dueAt);
  return prefix + " · " + hhmm(dueAt);
};

/** "Hari ini · 08.10" / "5 Sep · 19.24" */
export const formatStamp = (d, ref = now()) =>
  (isToday(d, ref) ? "Hari ini" : shortDate(d)) + " · " + hhmm(d);

/**
 * Menormalkan jam yang diketik manual: "7.30" → "07.30".
 *
 * Bukan kosmetik. Slot jadwal diurutkan dengan perbandingan string, dan itu
 * hanya benar kalau jamnya selalu dua digit — tanpa ini, slot 07.30 yang
 * diketik "7.30" akan urut **setelah** slot 13.00.
 */
export const padTime = (value) => {
  const m = /(\d{1,2})[.:](\d{2})/.exec(String(value || ""));
  return m ? pad(m[1]) + "." + m[2] : String(value || "");
};

/** Deadline selalu absolut di sisi guru/TU: "8 Sep · 12.00" */
export const formatDeadline = (dueAt) => shortDate(dueAt) + " · " + hhmm(dueAt);

/**
 * "12 menit lalu" / "1 jam lalu" / "Kemarin" — untuk notifikasi dan aktivitas.
 * Dulu string-string ini ditulis langsung di data; sekarang diturunkan dari
 * waktu kejadian, jadi aksi pengunjung sendiri ikut berlabel benar.
 */
export const relativeTime = (d, ref = now()) => {
  const minutes = Math.floor((ref - d) / 60_000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return minutes + " menit lalu";
  const days = calendarDaysUntil(d, ref);
  if (days === 0) return Math.floor(minutes / 60) + " jam lalu";
  if (days === -1) return "Kemarin";
  return shortDate(d);
};
