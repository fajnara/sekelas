import { redirect } from "next/navigation";

import { SekelasApp } from "@/components/sekelas-app";
import { loadSnapshot, resetSandbox } from "@/lib/load-snapshot";
import { savedPersona } from "@/lib/persona-server";

// Snapshot terikat pada sandbox pengunjung, jadi halaman ini tidak boleh pernah
// di-cache — satu shell yang ter-cache akan menyajikan data orang lain.
export const dynamic = "force-dynamic";

/**
 * The design is a 390×844 phone frame on a #EDEBF3 canvas, so the app renders
 * at that size and is centred on larger screens.
 *
 * Every "Prototype" prop the design file exposes is accepted as a query param,
 * which is how the frames in `Sekelas Screens.dc.html` are addressed — e.g.
 * `/?screen=submissions&role=guru&guruId=t1&subTaskId=a1`.
 */
export default async function Page({ searchParams }) {
  const q = await searchParams;
  const pick = (key) => (Array.isArray(q?.[key]) ? q[key][0] : q?.[key]);

  // Persona yang tersimpan dipakai kalau URL-nya tidak menyebut peran, supaya
  // muat ulang tidak mengembalikan guru atau TU ke layar siswa. Query param
  // tetap menang: tautan langsung di README harus selalu merender apa yang
  // ditulisnya, siapa pun yang membukanya.
  const persona = await savedPersona({ frozen: pick("frozen") === "1" });

  const props = {
    screen: pick("screen"),
    role: pick("role") || persona?.role,
    guruId: pick("guruId") || persona?.teacherId,
    adminClass: pick("adminClass"),
    taskKind: pick("taskKind"),
    statusFilter: pick("statusFilter"),
    subjectFilter: pick("subjectFilter"),
    dayIndex: pick("dayIndex"),
    subjectId: pick("subjectId"),
    taskId: pick("taskId"),
    subTaskId: pick("subTaskId"),
    sheet: pick("sheet"),
    studentName: pick("studentName"),
    streak: pick("streak") ? Number(pick("streak")) : undefined,
  };

  // `reset=1` mengembalikan sandbox ke kondisi awal, lalu **dibuang dari URL**:
  // kalau parameternya tetap menempel, tiap muat ulang akan mereset lagi dan
  // pengunjung tidak akan pernah bisa mencoba apa pun. Mode frozen tidak punya
  // apa pun untuk direset, jadi URL frame tidak ikut terpengaruh.
  if (pick("reset") === "1" && pick("frozen") !== "1") {
    await resetSandbox();
    redirect("/");
  }

  // `frozen=1` merender dari seed lokal tanpa menyentuh database — itu yang
  // dipakai harness fidelitas.
  const { snapshot, workspaceId, frozen } = await loadSnapshot({ frozen: pick("frozen") === "1" });

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas p-0 sm:p-[16px]">
      {/* `key` memaksa remount setelah reset: state klien diinisialisasi sekali,
          jadi snapshot baru akan diabaikan tanpa ini. */}
      {/* `frozen` mematikan penulisan ke server: perubahan cukup hidup di
          memori, persis seperti sebelum ada database. */}
      <SekelasApp key={workspaceId || "local"} {...props} frozen={frozen} snapshot={snapshot} />
    </main>
  );
}
