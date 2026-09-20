import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Uji end-to-end: aplikasi yang sudah di-build, Postgres sungguhan, dan folder
 * penyimpanan sungguhan.
 *
 *   npm run test:e2e
 *
 * Postgres-nya PGlite di balik protokol wire — sama seperti `npm run db:local`,
 * tapi dijalankan di dalam proses ini supaya tidak perlu jendela kedua dan
 * datanya pasti bersih setiap kali. Penyimpanan memakai driver folder lokal di
 * direktori sementara, jadi tidak perlu akun Supabase untuk membuktikan jalur
 * unggahnya utuh.
 *
 * Penting: server socket-nya hidup di proses **ini**, jadi jangan pernah pakai
 * `spawnSync` di bawah — itu memblokir event loop dan koneksi dari server Next
 * tidak akan pernah dilayani.
 */
/**
 * Port dipesan dari sistem, bukan ditetapkan. Menjalankan uji ini dua kali
 * berturut-turut dengan port tetap pernah membuat proses berikutnya bertemu
 * sisa proses sebelumnya yang belum benar-benar mati.
 */
const freePort = async () => {
  const { createServer } = await import("node:net");
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
};

const DB_PORT = Number(process.env.PGLITE_PORT) || (await freePort());
const APP_PORT = Number(process.env.PW_PORT) || (await freePort());

const storageDir = await mkdtemp(join(tmpdir(), "sekelas-e2e-"));

process.env.DATABASE_URL = `postgres://postgres:postgres@localhost:${DB_PORT}/postgres`;
process.env.STORAGE_DIR = storageDir;
process.env.SESSION_SECRET = "e2e-secret-tidak-rahasia";
process.env.CRON_SECRET = "e2e-cron-tidak-rahasia";
process.env.PW_PORT = String(APP_PORT);
process.env.PW_FRESH_SERVER = "1";

const { PGlite } = await import("@electric-sql/pglite");
const { PGLiteSocketServer } = await import("@electric-sql/pglite-socket");

const pg = new PGlite();
await pg.waitReady;
const socket = new PGLiteSocketServer({ db: pg, port: DB_PORT, host: "127.0.0.1" });
await socket.start();
console.log(`Postgres (PGlite) di port ${DB_PORT}. Penyimpanan: ${storageDir}`);

// Migrasi dan workspace template, lalu koneksinya ditutup — PGlite hanya
// melayani satu koneksi sekaligus, dan berikutnya milik server Next.
const { closeDb, getDb } = await import("../src/lib/db/client.js");
const { seedTemplate } = await import("../src/lib/db/seed.js");
const { migrate } = await import("drizzle-orm/postgres-js/migrator");

const db = await getDb();
await migrate(db, { migrationsFolder: "drizzle" });
await seedTemplate(db);
await closeDb();
console.log("Skema dan workspace template siap.");

const child = spawn("npx", ["playwright", "test", "e2e", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

const code = await new Promise((resolve) => child.on("exit", (status) => resolve(status ?? 1)));

await socket.stop();
await pg.close();
await rm(storageDir, { recursive: true, force: true });
process.exit(code);
