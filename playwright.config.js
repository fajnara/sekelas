import { defineConfig } from "@playwright/test";

/**
 * Fidelity harness. Renders every design frame at the design's own 390×844 and
 * diffs it against a committed baseline, so "pixel-faithful" stays a verifiable
 * claim while the data layer is rebuilt underneath.
 *
 * Uses the system Edge (`channel: "msedge"`) rather than Playwright's bundled
 * Chromium — the bundled download fails on this machine, and Edge is Chromium.
 */
/**
 * Port bisa digeser lewat env supaya uji end-to-end (yang butuh `DATABASE_URL`
 * dan folder penyimpanan) tidak menempel pada server frozen yang mungkin masih
 * hidup di 3100 — `reuseExistingServer` akan memakainya, dan server itu tidak
 * punya database.
 */
const port = Number(process.env.PW_PORT || 3100);

export default defineConfig({
  testDir: "./tests",
  snapshotPathTemplate: "{testDir}/__frames__/{arg}{ext}",
  forbidOnly: !!process.env.CI,
  // Satu worker, disengaja. Dengan dua worker, kontensi CPU membuat
  // stability-loop `toHaveScreenshot` pada layar terberat (Home) melewati
  // timeout dan melaporkan kegagalan palsu. Oracle yang bisa salah lebih buruk
  // daripada oracle yang lambat — dan ternyata satu worker malah lebih cepat
  // (54s vs 1,1 menit) karena tidak ada screenshot yang perlu diulang.
  workers: 1,
  reporter: [["list"]],

  use: {
    // A production build on its own port: deterministic rendering, no dev
    // double-render or overlay, and no collision with `npm run dev` on 3000.
    baseURL: `http://localhost:${port}`,
    // Exactly the design frame. At this width `sm:p-[16px]` on the page does
    // not apply, so the phone fills the viewport and the screenshot is the phone.
    viewport: { width: 390, height: 844 },
    channel: "msedge",
  },

  expect: {
    timeout: 20_000,
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      // The first frame in each worker pays for hydration and the font swap;
      // the default 5s expires mid-settle.
      timeout: 20_000,
      // Tolerates a few antialiasing pixels; any real layout, size or colour
      // change is far larger than this.
      maxDiffPixels: 60,
    },
  },

  // Uji jam dan uji database tidak membuka browser sama sekali, jadi tidak perlu
  // menunggu build + server. `npm run test:unit` melewatinya.
  webServer: process.env.PW_SKIP_SERVER
    ? undefined
    : {
        command: `npm run build && npx next start -p ${port}`,
        url: `http://localhost:${port}`,
        // Server frozen di 3100 memang layak dipakai ulang — build-nya mahal dan
        // isinya sama. Untuk e2e tidak: port-nya baru setiap kali, dan memakai
        // ulang apa pun yang menjawab di sana pernah membuat uji menempel pada
        // server sisa yang sedang mati, lalu menggantung tanpa pesan.
        reuseExistingServer: !process.env.PW_FRESH_SERVER,
        timeout: 300_000,
      },
});
