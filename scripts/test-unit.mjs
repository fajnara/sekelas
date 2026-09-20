import { spawnSync } from "node:child_process";

/**
 * Uji jam dan uji database tidak membuka browser, jadi tidak perlu menunggu
 * `next build` + server. Flag ini yang mematikan `webServer` di konfigurasi
 * Playwright — dipakai lewat skrip Node supaya jalan sama di Windows dan POSIX.
 */
process.env.PW_SKIP_SERVER = "1";

const result = spawnSync(
  "npx",
  ["playwright", "test", "clock", "db", "workspace", "writes", "upload", "persona", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    shell: true,
    env: process.env,
  },
);

process.exit(result.status ?? 1);
