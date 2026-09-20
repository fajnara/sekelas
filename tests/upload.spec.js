import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import {
  ACCEPT_ATTRIBUTE,
  MAX_UPLOAD_BYTES,
  extensionLabel,
  objectPath,
  validateUpload,
} from "../src/lib/storage/rules.js";
import { UPLOAD_TOKEN_TTL_MS, readUploadToken, signUploadToken } from "../src/lib/storage/upload-token.js";

/**
 * Aturan berkas dan driver penyimpanan lokal.
 *
 * Validasinya diuji sebagai fungsi murni karena itu satu-satunya pertahanan
 * yang nyata: atribut `accept` di input hanya menyaring dialog pemilih file dan
 * bisa dilewati sepenuhnya, jadi berkas apa pun bisa sampai ke server.
 */

const fakeFile = (name, size, type = "") => ({ name, size, type });

test.describe("aturan berkas", () => {
  test("menerima tipe yang dijanjikan dua dropzone desain", () => {
    for (const name of ["a.pdf", "b.doc", "c.docx", "d.ppt", "e.pptx", "f.png", "g.jpg", "h.jpeg"]) {
      expect(validateUpload(fakeFile(name, 1024)), name).toBeNull();
    }
  });

  test("menolak tipe lain, walau ekstensinya disamarkan", () => {
    expect(validateUpload(fakeFile("virus.exe", 1024))).toBe("Tipe file tidak didukung.");
    expect(validateUpload(fakeFile("skrip.sh", 1024))).toBe("Tipe file tidak didukung.");
    expect(validateUpload(fakeFile("tanpa-ekstensi", 1024))).toBe("Tipe file tidak didukung.");
    // Ekstensi PDF tapi isinya mengaku executable.
    expect(validateUpload(fakeFile("palsu.pdf", 1024, "application/x-msdownload"))).toBe(
      "Isi file tidak cocok dengan ekstensinya.",
    );
  });

  test("menolak yang terlalu besar dan yang kosong", () => {
    expect(validateUpload(fakeFile("besar.pdf", MAX_UPLOAD_BYTES + 1))).toBe("Maksimal 25 MB.");
    expect(validateUpload(fakeFile("pas.pdf", MAX_UPLOAD_BYTES))).toBeNull();
    expect(validateUpload(fakeFile("kosong.pdf", 0))).toBe("File-nya kosong.");
    expect(validateUpload(null)).toBe("Pilih file dulu.");
  });

  test("batas ukurannya sama dengan janji di layar", () => {
    // Dropzone desain berbunyi "maks 25 MB". Kalau keduanya berbeda, aplikasi
    // menolak berkas yang menurut layarnya sendiri boleh.
    expect(MAX_UPLOAD_BYTES).toBe(25 * 1024 * 1024);
  });

  test("atribut accept mencakup semua tipe yang lolos validasi", () => {
    for (const ext of ACCEPT_ATTRIBUTE.split(",")) {
      expect(validateUpload(fakeFile("berkas" + ext, 512)), ext).toBeNull();
    }
  });

  test("label ekstensi mengikuti badge desain", () => {
    expect(extensionLabel("Limit Fungsi.pdf")).toBe("PDF");
    expect(extensionLabel("Latihan.docx")).toBe("DOC");
    expect(extensionLabel("Slide.pptx")).toBe("PPT");
    expect(extensionLabel("Foto.jpg")).toBe("IMG");
  });

  test("jalur objek selalu diawali id workspace", () => {
    const ws = "11111111-1111-4111-8111-111111111111";
    const path = objectPath(ws, "materials", "m_1", "Materi Ujian.pdf");
    expect(path.startsWith(ws + "/")).toBe(true);
    expect(path).toBe(ws + "/materials/m_1.pdf");
    // Nama asli tidak masuk ke jalur, jadi nama berkas aneh tidak bisa
    // dipakai untuk keluar dari folder sandbox.
    expect(objectPath(ws, "materials", "m_2", "../../etc/passwd.pdf")).toBe(ws + "/materials/m_2.pdf");
  });
});

test.describe("driver penyimpanan lokal", () => {
  let dir;
  let local;

  test.beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), "sekelas-storage-"));
    process.env.STORAGE_DIR = dir;
    local = await import("../src/lib/storage/local.js");
  });

  test.afterAll(async () => {
    delete process.env.STORAGE_DIR;
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  test("menyimpan lalu membaca kembali byte yang sama", async () => {
    const bytes = new TextEncoder().encode("isi berkas uji");
    const file = { name: "uji.pdf", type: "application/pdf", arrayBuffer: async () => bytes };
    const path = "ws-1/materials/m_1.pdf";

    await local.put(path, file);
    expect(new Uint8Array(await readFile(join(dir, path)))).toEqual(new Uint8Array(bytes));

    await local.remove(path);
    await expect(readFile(join(dir, path))).rejects.toThrow();
  });

  test("menolak jalur yang mencoba keluar dari foldernya", async () => {
    const file = { name: "x.pdf", type: "application/pdf", arrayBuffer: async () => new Uint8Array([1]) };
    await expect(local.put("../keluar.pdf", file)).rejects.toThrow("Jalur objek tidak valid");
    await expect(local.put("ws/../../keluar.pdf", file)).rejects.toThrow("Jalur objek tidak valid");
  });

  test("seluruh objek satu sandbox bisa dibuang sekaligus", async () => {
    // Dipakai `?reset=1` dan pembersihan berkala: tanpa ini byte-nya tertinggal
    // tanpa baris pemilik, dan tidak ada lagi yang bisa menghapusnya.
    const file = { name: "a.pdf", type: "application/pdf", arrayBuffer: async () => new Uint8Array([1, 2, 3]) };
    await local.put("ws-gc/materials/m_1.pdf", file);
    await local.put("ws-gc/submissions/s_1.pdf", file);
    await local.put("ws-lain/materials/m_1.pdf", file);

    await local.removePrefix("ws-gc");

    await expect(readFile(join(dir, "ws-gc/materials/m_1.pdf"))).rejects.toThrow();
    await expect(readFile(join(dir, "ws-gc/submissions/s_1.pdf"))).rejects.toThrow();
    // Sandbox lain tidak ikut terbawa.
    expect((await readFile(join(dir, "ws-lain/materials/m_1.pdf"))).length).toBe(3);
  });

  test("awalan yang mencoba keluar dari foldernya ditolak juga", async () => {
    await expect(local.removePrefix("..")).rejects.toThrow("Jalur objek tidak valid");
  });

  test("URL unduhan melewati route milik aplikasi sendiri", async () => {
    expect(await local.signedUrl("ws-1/materials/m_1.pdf")).toBe(
      "/api/file?path=ws-1%2Fmaterials%2Fm_1.pdf",
    );
  });

  test("alamat unggah membawa token, bukan jalur", async () => {
    // Kalau jalurnya boleh disebut klien, ia bisa menulis ke sandbox siapa pun.
    const { url, method } = await local.signUpload("ws-1/materials/m_1.pdf");
    expect(method).toBe("PUT");
    expect(url.startsWith("/api/file?token=")).toBe(true);
    expect(url).not.toContain("ws-1");
  });
});

/**
 * Unggah langsung membuka satu lubang: server tidak lagi memegang byte-nya,
 * jadi ukuran dan tipe yang dikirim klien tidak bisa dipercaya. Inilah yang
 * menutupnya.
 */
test.describe("pemeriksaan objek yang benar-benar sampai", () => {
  let dir;
  let storage;

  test.beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), "sekelas-confirm-"));
    process.env.STORAGE_DIR = dir;
    storage = await import("../src/lib/storage/index.js");
  });

  test.afterAll(async () => {
    delete process.env.STORAGE_DIR;
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  const write = async (path, bytes) => {
    const local = await import("../src/lib/storage/local.js");
    await local.put(path, { name: "x.pdf", type: "application/pdf", arrayBuffer: async () => bytes });
  };

  test("ukuran yang dicatat adalah ukuran sebenarnya, bukan yang diklaim", async () => {
    await write("ws-1/materials/m_1.pdf", new Uint8Array(1234));

    // Klien mengaku 9 byte; yang tersimpan 1234. Angka ini menggerakkan
    // "4,0 MB terpakai" di layar Materi, jadi bukan hiasan.
    const confirmed = await storage.confirmUpload("ws-1/materials/m_1.pdf", { claimedSize: 9 });
    expect(confirmed.sizeBytes).toBe(1234);
    expect(confirmed.error).toBeUndefined();
  });

  test("objek yang tidak pernah sampai ditolak", async () => {
    const confirmed = await storage.confirmUpload("ws-1/materials/hantu.pdf", { claimedSize: 10 });
    expect(confirmed.error).toBe("File tidak sampai. Coba unggah lagi.");
    expect(confirmed.sizeBytes).toBeUndefined();
  });

  test("objek kosong ditolak dan ikut dibuang", async () => {
    await write("ws-1/materials/kosong.pdf", new Uint8Array(0));

    expect((await storage.confirmUpload("ws-1/materials/kosong.pdf", { claimedSize: 1024 })).error).toBe(
      "File-nya kosong.",
    );
    // Dibuang, bukan cuma ditolak — kalau tidak, byte-nya tinggal tanpa baris.
    await expect(readFile(join(dir, "ws-1/materials/kosong.pdf"))).rejects.toThrow();
  });

  test("objek yang melampaui batas ditolak walau klien mengaku kecil, dan ikut dibuang", async () => {
    // Inilah serangan yang dulu tidak mungkin: dropzone memeriksa di klien, dan
    // klien bisa dilewati sepenuhnya.
    await write("ws-1/materials/besar.pdf", new Uint8Array(MAX_UPLOAD_BYTES + 1));

    expect((await storage.confirmUpload("ws-1/materials/besar.pdf", { claimedSize: 1024 })).error).toBe(
      "Maksimal 25 MB.",
    );
    await expect(readFile(join(dir, "ws-1/materials/besar.pdf"))).rejects.toThrow();
  });
});

test.describe("token unggah", () => {
  const path = "ws-1/materials/m_1.pdf";

  test.beforeAll(() => {
    process.env.SESSION_SECRET = "rahasia-uji-token";
  });

  test.afterAll(() => {
    delete process.env.SESSION_SECRET;
  });

  test("jalurnya bisa dibaca kembali dari token yang sah", async () => {
    expect(await readUploadToken(await signUploadToken(path))).toBe(path);
  });

  test("token karangan, kosong, atau berubah satu huruf ditolak", async () => {
    const token = await signUploadToken(path);

    expect(await readUploadToken(token.slice(0, -1) + "x")).toBeNull();
    expect(await readUploadToken(token.replace(/\..*$/, ".palsu"))).toBeNull();
    expect(await readUploadToken("tanpa-titik")).toBeNull();
    expect(await readUploadToken("")).toBeNull();
    expect(await readUploadToken(null)).toBeNull();
  });

  test("jalur di dalam token tidak bisa ditukar tanpa merusak tanda tangannya", async () => {
    const token = await signUploadToken(path);
    const [claim, mac] = token.split(".");
    const asli = JSON.parse(Buffer.from(claim, "base64url").toString("utf8"));

    // Jalurnya ditukar ke sandbox lain, tanda tangannya dibiarkan.
    const palsu = Buffer.from(JSON.stringify({ ...asli, path: "ws-lain/materials/m_1.pdf" })).toString("base64url");
    expect(await readUploadToken(palsu + "." + mac)).toBeNull();
  });

  test("token yang kedaluwarsa tidak berlaku lagi", async () => {
    const token = await signUploadToken(path, { ttlMs: 1000 });
    expect(await readUploadToken(token, { now: Date.now() + 500 })).toBe(path);
    expect(await readUploadToken(token, { now: Date.now() + 2000 })).toBeNull();
  });

  test("umurnya dua jam, sama seperti signed upload URL Supabase", () => {
    expect(UPLOAD_TOKEN_TTL_MS).toBe(2 * 60 * 60 * 1000);
  });
});
