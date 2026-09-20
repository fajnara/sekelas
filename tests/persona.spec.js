import { expect, test } from "@playwright/test";

import {
  PERSONA_COOKIE,
  ROLES,
  denyReason,
  formatPersona,
  parsePersona,
  personaFromParams,
} from "../src/lib/persona.js";

/**
 * Persona pengunjung dan penjaga aksi.
 *
 * Keputusan "boleh atau tidak" ada di satu fungsi murni, jadi ia diuji langsung
 * di sini; jalannya lewat HTTP sungguhan diuji di `tests/e2e.spec.js`.
 */

test.describe("bentuk cookie persona", () => {
  test("ketiga peran bolak-balik utuh", () => {
    expect(parsePersona(formatPersona({ role: "siswa" }))).toEqual({ role: "siswa", teacherId: null });
    expect(parsePersona(formatPersona({ role: "tu" }))).toEqual({ role: "tu", teacherId: null });
    expect(parsePersona(formatPersona({ role: "guru", teacherId: "t2" }))).toEqual({
      role: "guru",
      teacherId: "t2",
    });
  });

  test("id guru ikut disimpan, karena peran saja tidak cukup", () => {
    // Materi dan tugas milik guru tertentu, bukan milik "guru" secara umum.
    expect(formatPersona({ role: "guru", teacherId: "t3" })).toBe("guru:t3");
    // Peran lain tidak membawa id, walau dikirim.
    expect(formatPersona({ role: "tu", teacherId: "t3" })).toBe("tu");
  });

  test("nilai yang tidak dikenal ditolak, bukan ditebak", () => {
    expect(formatPersona({ role: "kepsek" })).toBeNull();
    expect(formatPersona({})).toBeNull();
    expect(parsePersona("kepsek")).toBeNull();
    expect(parsePersona("")).toBeNull();
    expect(parsePersona(null)).toBeNull();
    expect(parsePersona("guru:../../etc")).toEqual({ role: "guru", teacherId: "t1" });
  });

  test("guru tanpa id jatuh ke t1, sama seperti view-model", () => {
    expect(parsePersona("guru")).toEqual({ role: "guru", teacherId: "t1" });
  });

  test("persona awal diambil dari query param, default siswa", () => {
    expect(personaFromParams({ role: "tu" })).toBe("tu");
    expect(personaFromParams({ role: "guru", guruId: "t2" })).toBe("guru:t2");
    expect(personaFromParams({ role: "guru" })).toBe("guru:t1");
    expect(personaFromParams({})).toBe("siswa");
    expect(personaFromParams({ role: "bukan-peran" })).toBe("siswa");
  });

  test("nama cookie-nya tetap, karena pengunjung lama membawanya", () => {
    expect(PERSONA_COOKIE).toBe("sk_as");
  });
});

test.describe("penjaga aksi", () => {
  test("peran yang cocok lolos", () => {
    for (const role of ROLES) expect(denyReason({ role, teacherId: null }, role), role).toBeNull();
    expect(denyReason({ role: "guru", teacherId: "t1" }, ["guru", "tu"])).toBeNull();
  });

  test("peran yang tidak cocok ditolak, dengan menyebut siapa yang berhak", () => {
    expect(denyReason({ role: "siswa", teacherId: null }, "tu")).toBe("Aksi ini hanya untuk staf TU.");
    expect(denyReason({ role: "siswa", teacherId: null }, "guru")).toBe("Aksi ini hanya untuk guru.");
    expect(denyReason({ role: "tu", teacherId: null }, "siswa")).toBe("Aksi ini hanya untuk siswa.");
    expect(denyReason({ role: "tu", teacherId: null }, ["guru", "siswa"])).toBe(
      "Aksi ini hanya untuk guru atau siswa.",
    );
  });

  test("tanpa persona, aksi berperan tetap ditolak", () => {
    // Cookie hilang atau dikarang: jangan diam-diam dianggap peran default.
    expect(denyReason(null, "tu")).toBe("Aksi ini hanya untuk staf TU.");
    expect(denyReason(parsePersona("kepsek"), "guru")).toBe("Aksi ini hanya untuk guru.");
  });

  test("aksi tanpa daftar peran tidak dijaga", () => {
    // Masuk harus bisa dipanggil justru saat personanya belum benar.
    expect(denyReason(null, undefined)).toBeNull();
    expect(denyReason(null, null)).toBeNull();
  });
});
