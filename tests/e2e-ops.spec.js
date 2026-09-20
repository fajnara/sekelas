import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

/**
 * Operasi: reset sandbox dan pembersihan berkala, lewat HTTP sungguhan.
 *
 * Dijalankan `npm run test:e2e`; dilewati tanpa database.
 */
const storageDir = process.env.STORAGE_DIR;

test.skip(!process.env.DATABASE_URL, "perlu DATABASE_URL — pakai npm run test:e2e");

/** Semua objek di folder penyimpanan, supaya bisa dihitung sebelum/sesudah. */
async function countObjects(base = storageDir) {
  let n = 0;
  for (const entry of await readdir(base, { withFileTypes: true })) {
    const next = join(base, entry.name);
    n += entry.isDirectory() ? await countObjects(next) : 1;
  }
  return n;
}

test("reset mengembalikan sandbox, membuang berkasnya, dan tidak menempel di URL", async ({ page }) => {
  const objectsBefore = storageDir ? await countObjects() : 0;

  // Sesuatu yang jelas bukan kondisi awal: satu kelas baru, satu materi baru.
  await page.goto("/?screen=tuClasses&role=tu");
  await page.getByRole("button", { name: "+ Tambah Kelas" }).click();
  await page.getByPlaceholder("mis. XI IPA 3").fill("XII IPA 9");
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.getByText("Kelas XII IPA 9 ditambahkan.")).toBeVisible();

  const kelasAda = async () => {
    await page.goto("/?screen=tuClasses&role=tu");
    return page.getByText("XII IPA 9").count();
  };
  await expect.poll(kelasAda, { timeout: 20_000, intervals: [250, 500, 1000, 2000] }).toBeGreaterThan(0);

  await page.goto("/?reset=1");

  // Parameternya dibuang: kalau tetap menempel, tiap muat ulang akan mereset
  // lagi dan pengunjung tidak akan pernah bisa mencoba apa pun.
  expect(new URL(page.url()).search).toBe("");

  await page.goto("/?screen=tuClasses&role=tu");
  await expect(page.getByText("XII IPA 9")).toHaveCount(0);
  // Kembali ke kondisi awal, bukan kosong.
  await expect(page.getByText("X IPA 1")).toBeVisible();

  // Dan berkas sandbox-nya ikut dibuang, bukan tertinggal tanpa baris pemilik.
  if (storageDir) expect(await countObjects()).toBe(objectsBefore);
});

/**
 * Pintu masuk cron. Yang **tidak** diuji di sini: jalur suksesnya.
 *
 * PGlite di balik protokol wire hanya melayani satu koneksi sekaligus, dan
 * server Next sudah memegangnya untuk merender halaman. Route handler-nya
 * membuka koneksi sendiri, jadi di harness ini ia selalu kena `ECONNRESET` —
 * batasan database tiruannya, bukan aplikasinya; Postgres sungguhan menerima
 * dua koneksi tanpa keluhan.
 *
 * Yang menutupi celah itu: `gcWorkspaces()` dan `cronDenied()` diuji langsung
 * di Postgres di `tests/workspace.spec.js`, dan README meminta satu `curl`
 * setelah deploy — di sanalah jalur suksesnya dibuktikan untuk pertama kali.
 */
test.describe("pintu masuk pembersihan berkala", () => {
  const url = "/api/cron";

  test("tanpa rahasia yang benar, tidak dikerjakan", async ({ request }) => {
    expect((await request.get(url)).status()).toBe(401);
    expect((await request.get(url, { headers: { authorization: "Bearer salah" } })).status()).toBe(401);
    // Tanpa header pun 401, bukan 200: penghapusan data tidak boleh kebetulan.
    expect((await request.get(url, { headers: { authorization: "" } })).status()).toBe(401);
  });

  test("penolakannya tidak pernah di-cache", async ({ request }) => {
    const response = await request.get(url);
    expect(response.headers()["cache-control"]).toContain("no-store");
  });
});

test("folder penyimpanan tidak dipakai di luar sandbox mana pun", async () => {
  test.skip(!storageDir, "hanya berlaku untuk driver folder lokal");
  // Setiap objek harus berada di bawah folder ber-uuid; kalau ada yang di akar,
  // berarti ada jalur yang lupa diawali id workspace.
  for (const entry of await readdir(storageDir, { withFileTypes: true })) {
    expect(entry.isDirectory(), entry.name).toBe(true);
    expect(entry.name, entry.name).toMatch(/^[0-9a-f-]{36}$/i);
    expect((await stat(join(storageDir, entry.name))).isDirectory()).toBe(true);
  }
});
