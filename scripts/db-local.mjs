import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

/**
 * Postgres lokal untuk pengembangan, tanpa Docker dan tanpa akun cloud.
 *
 * Menjalankan PGlite di balik protokol wire Postgres, jadi aplikasi bisa
 * menyambung seperti ke database sungguhan:
 *
 *   npm run db:local                       # jendela 1
 *   DATABASE_URL="postgres://postgres:postgres@localhost:5433/postgres" \
 *     npm run db:seed && npm run dev       # jendela 2
 *
 * Datanya hanya di memori: mati saat proses ditutup. Untuk mencoba jalur
 * database secara utuh, bukan untuk menyimpan apa pun.
 */
const port = Number(process.env.PGLITE_PORT || 5433);

const db = new PGlite();
await db.waitReady;

const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1" });
await server.start();

console.log(`Postgres (PGlite) siap di port ${port}.`);
console.log(`DATABASE_URL="postgres://postgres:postgres@localhost:${port}/postgres"`);
console.log("Ctrl+C untuk berhenti. Data tidak disimpan.");

const shutdown = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
