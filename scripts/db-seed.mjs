import { closeDb, getDb } from "../src/lib/db/client.js";
import { seedTemplate } from "../src/lib/db/seed.js";

/**
 * Menyiapkan database sungguhan: menjalankan migrasi, lalu menulis workspace
 * `template` dari seed lokal.
 *
 *   DATABASE_URL="postgres://…" npm run db:seed
 *
 * Migrasi dijalankan lewat migrator Drizzle, yang mencatat apa saja yang sudah
 * diterapkan — jadi perintah ini aman dijalankan berulang.
 */
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL belum diset. Contoh:\n  DATABASE_URL=\"postgres://…\" npm run db:seed");
  process.exit(1);
}

const db = await getDb();

const { migrate } = await import("drizzle-orm/postgres-js/migrator");
console.log("Menjalankan migrasi…");
await migrate(db, { migrationsFolder: "drizzle" });

console.log("Menulis workspace template…");
const { workspaceId, counts } = await seedTemplate(db);

const total = Object.values(counts).reduce((a, n) => a + n, 0);
console.log(`\nSelesai. Workspace template: ${workspaceId}`);
for (const [table, n] of Object.entries(counts)) console.log(`  ${table.padEnd(22)} ${n}`);
console.log(`  ${"total".padEnd(22)} ${total}`);

// Ditutup rapi, bukan `process.exit` — koneksi yang digantung akan tetap
// dihitung oleh pooler.
await closeDb();
