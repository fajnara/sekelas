import { mkdtemp, readdir, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

/**
 * Jalur unggah, dari klik sampai byte di penyimpanan.
 *
 * Dijalankan lewat `npm run test:e2e`, yang menyiapkan Postgres sungguhan dan
 * folder penyimpanan sungguhan lalu mem-build aplikasinya. Tanpa itu env-nya
 * kosong dan seluruh file ini dilewati — `npm test` biasa tidak butuh database.
 *
 * Yang dibuktikan di sini adalah hal yang tidak bisa dibuktikan uji unit: berkas
 * yang dipilih di satu layar benar-benar sampai ke database, ke disk, dan ke
 * layar peran lain.
 */
const storageDir = process.env.STORAGE_DIR;

test.skip(!process.env.DATABASE_URL || !storageDir, "perlu DATABASE_URL dan STORAGE_DIR — pakai npm run test:e2e");

// Berurutan: satu sandbox, satu koneksi PGlite, dan langkah-langkahnya memang
// saling bergantung.
test.describe.configure({ mode: "serial" });

const GURU_MATERI = "/?screen=adminMaterials&role=guru&guruId=t1";
const SISWA_MAPEL = "/?screen=subjectDetail&subjectId=mat";

/** PDF asli sekecil mungkin — cukup untuk dibaca sebagai PDF oleh peramban. */
const MINIMAL_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
    "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\n" +
    "trailer<</Root 1 0 R>>\n%%EOF\n",
);

/**
 * 2 MB — cukup besar untuk membuktikan sesuatu: kalau byte-nya kembali lewat
 * Server Action, batas bawaan Next (1 MB) akan menolaknya, dan di Vercel batas
 * 4,5 MB miliknya akan memotong berkas yang lebih besar lagi.
 */
const PDF_2MB = Buffer.concat([MINIMAL_PDF, Buffer.alloc(2 * 1024 * 1024 - MINIMAL_PDF.length, 0x20)]);

let dir;

/**
 * Satu halaman dipakai ketiga langkah, bukan fixture `page` bawaan: tiap test
 * Playwright biasanya dapat konteks baru, dan konteks baru berarti cookie baru —
 * jadi sandbox baru, tanpa materi yang baru saja diunggah.
 */
let page;

test.beforeAll(async ({ browser }) => {
  dir = await mkdtemp(join(tmpdir(), "sekelas-berkas-"));
  page = await browser.newPage();
});

test.afterAll(async () => {
  await page?.close();
});

const filePath = async (name, bytes) => {
  const path = join(dir, name);
  await writeFile(path, bytes);
  return path;
};

/** Semua objek yang tersimpan di folder penyimpanan, relatif terhadap akarnya. */
async function storedObjects() {
  const out = [];
  const walk = async (base, prefix) => {
    for (const entry of await readdir(base, { withFileTypes: true })) {
      const next = join(base, entry.name);
      if (entry.isDirectory()) await walk(next, prefix + entry.name + "/");
      else out.push({ path: prefix + entry.name, size: (await stat(next)).size });
    }
  };
  await walk(storageDir, "");
  return out;
}

test("guru mengunggah materi; siswa melihatnya, dan file-nya ada di disk", async () => {
  const pdf = await filePath("Soal Ulangan Bab 1.pdf", PDF_2MB);

  // Byte-nya harus pergi **langsung** ke penyimpanan, bukan lewat Server
  // Action. Itu seluruh alasan jalur unggahnya tiga langkah, jadi ia diawasi:
  // satu PUT ke alamat bertanda tangan, dan tidak ada POST action yang
  // membawa berkas sebesar itu.
  const puts = [];
  let biggestPost = 0;
  page.on("request", (r) => {
    if (r.method() === "PUT") puts.push(r.url());
    if (r.method() === "POST") biggestPost = Math.max(biggestPost, r.postDataBuffer()?.length ?? 0);
  });

  await page.goto(GURU_MATERI);
  await page.getByText("+ Upload").click();
  await page.locator('input[type="file"]').setInputFiles(pdf);

  // Dropzone menampilkan nama berkas pilihan, jadi ini bukti input-nya terbaca.
  await expect(page.getByText("Soal Ulangan Bab 1.pdf")).toBeVisible();

  await page.getByRole("button", { name: "Upload", exact: true }).click();

  // 1. Muncul di layar Materi guru, langsung, tanpa menunggu server: patch-nya
  //    optimistik dan toast-nya naik di `setState` yang sama.
  await expect(page.getByText("Materi diunggah ke Matematika.")).toBeVisible();
  await expect(page.getByText("Soal Ulangan Bab 1.pdf")).toBeVisible();

  // 2. Bertahan setelah muat ulang — artinya barisnya benar-benar di database,
  //    bukan cuma di state klien.
  //
  //    Simpanannya *write-behind*, jadi muat ulangnya diulang sampai baris itu
  //    ada. Yang ditunggu adalah hasilnya, bukan respons HTTP action-nya:
  //    menunggu badan respons selesai (`response.finished()`) ternyata kadang
  //    menggantung tanpa batas walau datanya sudah tersimpan — aliran RSC-nya
  //    belum tentu ditutup Next secepat action-nya kelar.
  await expect
    .poll(
      async () => {
        await page.reload();
        return page.getByText("Soal Ulangan Bab 1.pdf").count();
      },
      { timeout: 20_000, intervals: [250, 500, 1000, 2000, 4000] },
    )
    .toBeGreaterThan(0);

  // 3. Byte-nya ada di penyimpanan, di bawah folder workspace, seukuran aslinya.
  const objects = await storedObjects();
  const stored = objects.filter((o) => o.path.includes("/materials/"));
  expect(stored).toHaveLength(1);
  expect(stored[0].size).toBe(PDF_2MB.length);
  expect(stored[0].path).toMatch(/^[0-9a-f-]{36}\/materials\/m[^/]*\.pdf$/);

  // 3b. Dan jalannya memang langsung: satu PUT bertanda tangan, sementara POST
  //     action terbesar jauh di bawah ukuran berkasnya.
  expect(puts.filter((u) => u.includes("/api/file?token="))).toHaveLength(1);
  expect(biggestPost).toBeLessThan(100 * 1024);

  // 4. Terlihat di layar siswa — inilah bug yang ikut tertutup: sebelum materi
  //    disatukan ke satu tabel, unggahan guru tidak pernah sampai ke sini.
  await page.goto(SISWA_MAPEL);
  await expect(page.getByText("Soal Ulangan Bab 1.pdf")).toBeVisible();
});

test("berkas yang dilarang ditolak sebelum apa pun tersimpan", async () => {
  const before = await storedObjects();

  const exe = await filePath("pemasang.exe", Buffer.from("MZ"));
  const besar = await filePath("Modul Tebal.pdf", Buffer.alloc(26 * 1024 * 1024));

  await page.goto(GURU_MATERI);
  await page.getByText("+ Upload").click();

  await page.locator('input[type="file"]').setInputFiles(exe);
  await expect(page.getByText("Tipe file tidak didukung.")).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles(besar);
  await expect(page.getByText("Maksimal 25 MB.")).toBeVisible();

  // Tidak ada objek baru: penolakannya terjadi sebelum ada yang ditulis.
  expect(await storedObjects()).toHaveLength(before.length);
});

test("menghapus materi ikut membuang byte-nya", async () => {
  await page.goto(GURU_MATERI);

  const before = await storedObjects();
  expect(before.length).toBeGreaterThan(0);

  // Barisnya dicari dari nama berkasnya, lalu naik ke kartu terdekat yang
  // memuat tombol hapus — daftar guru berisi materi seed juga, jadi "tombol
  // hapus satu-satunya" bukan asumsi yang benar.
  const row = page
    .getByText("Soal Ulangan Bab 1.pdf", { exact: true })
    .locator("xpath=ancestor::div[.//button[@title='Hapus file']][1]");
  await row.locator('button[title="Hapus file"]').click();
  await expect(page.getByText("File dihapus.")).toBeVisible();

  await expect
    .poll(
      async () => {
        await page.reload();
        return page.getByText("Soal Ulangan Bab 1.pdf").count();
      },
      { timeout: 20_000, intervals: [250, 500, 1000, 2000, 4000] },
    )
    .toBe(0);

  const after = await storedObjects();
  expect(after.length).toBe(before.length - 1);
});
