import { headers } from "next/headers";

import { localSnapshot } from "./snapshot.js";
import { WORKSPACE_HEADER } from "./workspace-cookie.js";

/**
 * Memilih dari mana snapshot diambil.
 *
 * Tiga jalur, dan yang pertama cocok akan dipakai:
 *
 * 1. **`?frozen=1`** — selalu seed lokal, database tidak disentuh. Ini oracle
 *    fidelitas: setiap URL frame merender hal yang sama selamanya, bisa jalan di
 *    CI tanpa database, dan tidak membuat sandbox (jadi crawler tidak menumpuk
 *    workspace sampah).
 * 2. **Tanpa `DATABASE_URL`** — juga seed lokal, supaya `npm run dev` langsung
 *    jalan setelah clone.
 * 3. **Ada `DATABASE_URL`** — sandbox pengunjung di Postgres, dibuat dari
 *    template pada kunjungan pertama.
 */
export async function loadSnapshot({ frozen = false } = {}) {
  if (frozen || !process.env.DATABASE_URL) return { snapshot: localSnapshot(), frozen: true, workspaceId: null };

  const [{ getDb }, { getOrCreateWorkspace }, { loadWorkspaceSnapshot }] = await Promise.all([
    import("./db/client.js"),
    import("./db/workspace.js"),
    import("./db/queries.js"),
  ]);

  const db = await getDb();
  const workspaceId = (await headers()).get(WORKSPACE_HEADER);
  if (!workspaceId) {
    // Middleware tidak jalan (mis. route diabaikan matcher). Jangan diam-diam
    // menampilkan workspace orang lain — tampilkan seed saja.
    return { snapshot: localSnapshot(), frozen: true, workspaceId: null };
  }

  await getOrCreateWorkspace(db, workspaceId);

  return { snapshot: await loadWorkspaceSnapshot(workspaceId, db), frozen: false, workspaceId };
}

/**
 * Mengembalikan sandbox pengunjung ke kondisi awal — `?reset=1`.
 *
 * Tidak ada layar yang punya tombol reset, dan layar tidak boleh diubah, jadi
 * URL adalah afordansi yang benar untuk ini.
 *
 * Berkas yang diunggah ikut dibuang. Tanpa itu, byte-nya tertinggal tanpa baris
 * pemilik dan tidak ada lagi yang bisa menghapusnya — baris `materials` yang
 * menunjuknya sudah hilang.
 */
export async function resetSandbox() {
  if (!process.env.DATABASE_URL) return false;

  const workspaceId = (await headers()).get(WORKSPACE_HEADER);
  if (!workspaceId) return false;

  const [{ getDb }, { getOrCreateWorkspace, resetWorkspace }, { deletePrefix }] = await Promise.all([
    import("./db/client.js"),
    import("./db/workspace.js"),
    import("./storage/index.js"),
  ]);

  const db = await getDb();
  await getOrCreateWorkspace(db, workspaceId);
  await resetWorkspace(db, workspaceId);
  await deletePrefix(workspaceId);
  return true;
}
