import { expect, test } from "@playwright/test";

/**
 * Persona lewat HTTP sungguhan: cookie, penjaga aksi, dan keluar.
 *
 * Dijalankan `npm run test:e2e`; dilewati tanpa database, seperti uji e2e lain.
 * Setiap test di sini sengaja memakai konteks peramban sendiri (fixture `page`
 * bawaan) — cookie bersih adalah bagian dari yang diuji.
 */
test.skip(!process.env.DATABASE_URL, "perlu DATABASE_URL — pakai npm run test:e2e");

test("persona bertahan setelah muat ulang", async ({ page }) => {
  await page.goto("/?screen=login&role=guru");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.getByText("Panel Guru")).toBeVisible();

  // URL tanpa parameter apa pun: yang menentukan sekarang cookie persona, bukan
  // query param. Sebelum Fase 7 ini akan mendarat di Home siswa.
  await page.goto("/");
  await expect(page.getByText("Panel Guru")).toBeVisible();
});

test("aksi milik peran lain ditolak server, dan patch optimistiknya dikembalikan", async ({ page }) => {
  // Masuk sebagai siswa lebih dulu: itu yang menetapkan cookie persona.
  await page.goto("/?screen=login");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.getByText("Senin, 7 September")).toBeVisible();

  // Lalu buka layar TU lewat URL. Middleware **tidak** menimpa persona yang
  // sudah ada, jadi layarnya tampil tapi personanya tetap siswa — persis
  // keadaan yang harus ditolak di sisi server.
  await page.goto("/?screen=tuClassDetail&role=tu&adminClass=10ipa1");
  await page.getByRole("button", { name: "Hapus", exact: true }).click();

  await expect(page.getByText("Aksi ini hanya untuk staf TU.")).toBeVisible();

  // Rollback: layar detail kelasnya kembali, bukan tertinggal di daftar kelas
  // dengan satu baris yang sebenarnya tidak terhapus.
  await expect(page.getByRole("button", { name: "Hapus", exact: true })).toBeVisible();

  // Dan kelasnya memang masih ada setelah muat ulang.
  await page.goto("/?screen=tuClasses&role=tu");
  await expect(page.getByText("X IPA 1")).toBeVisible();
});

test("keluar melepas persona, bukan data", async ({ page }) => {
  await page.goto("/?screen=login&role=tu");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.getByText("Panel TU")).toBeVisible();

  // Lewat nav di dalam aplikasi, bukan `goto`: tulisan pertama terjadi beberapa
  // ratus milidetik setelah Masuk, tanpa muat ulang di antaranya. Kalau cookie
  // persona-nya belum mendarat, action ini yang akan ditolak.
  await page.getByRole("button", { name: "Kelas", exact: true }).click();
  await page.getByRole("button", { name: "+ Tambah Kelas" }).click();
  await page.getByPlaceholder("mis. XI IPA 3").fill("XII IPS 9");
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.getByText("Kelas XII IPS 9 ditambahkan.")).toBeVisible();

  // Tunggu sampai kelasnya benar-benar tersimpan, bukan cuma optimistik.
  // Memuat ulang lewat `goto`, bukan `reload()`: navigasi di dalam aplikasi
  // tidak mengubah URL, jadi `reload()` akan kembali ke layar login.
  const kelasTersimpan = async () => {
    await page.goto("/?screen=tuClasses&role=tu");
    return page.getByText("XII IPS 9").count();
  };
  await expect.poll(kelasTersimpan, { timeout: 20_000, intervals: [250, 500, 1000, 2000, 4000] }).toBeGreaterThan(0);

  await page.goto("/?screen=tuProfile&role=tu");
  await page.getByRole("button", { name: "Keluar" }).click();
  await expect(page.getByText("Masuk sebagai")).toBeVisible();

  // Persona-nya benar-benar lepas: URL tanpa parameter sekarang kembali ke
  // layar siswa, bukan ke Panel TU seperti sebelum Keluar.
  await page.goto("/");
  await expect(page.getByText("Senin, 7 September")).toBeVisible();

  // Tapi sandbox-nya sama, jadi kelas yang tadi ditambahkan masih ada.
  await page.goto("/?screen=login&role=tu");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.goto("/?screen=tuClasses&role=tu");
  await expect(page.getByText("XII IPS 9")).toBeVisible();
});
