import { expect, test } from "@playwright/test";

import {
  DEMO_NOW,
  addDays,
  calendarDaysUntil,
  dayOfMonth,
  formatDeadline,
  formatDue,
  formatStamp,
  fromDateAndTime,
  hhmm,
  isoDate,
  jkt,
  shortDate,
  startOfWeekMonday,
} from "../src/lib/clock.js";
import { ME_STUDENT_ID, SUBJECTS, SUBMISSIONS, TASKS, taskType } from "../src/lib/data.js";

/**
 * Menguji bahwa nilai yang **diturunkan** mereproduksi persis apa yang dulu
 * ditulis tangan di file desain — label waktu, status pengumpulan, jumlah
 * submit, dan urutan riwayat nilai.
 *
 * Ini gerbang Fase 1 + Fase 2: kalau satu string atau satu angka bergeser,
 * klaim "identik dengan desain" ikut runtuh, dan di sinilah ketahuannya.
 */

const meSub = (taskId) => SUBMISSIONS.find((s) => s.taskId === taskId && s.studentId === ME_STUDENT_ID);
const byLegacy = (n) => TASKS.find((t) => t.legacyNo === n);
const byId = (id) => TASKS.find((t) => t.id === id);

const meDone = (t) => {
  const sub = meSub(t.id);
  return !!(sub && (sub.checkedOffAt || sub.submittedAt));
};
const meDue = (t) => {
  const sub = meSub(t.id);
  return formatDue({ ...t, done: meDone(t), submittedAt: sub && sub.submittedAt });
};
const meState = (t) => {
  const sub = meSub(t.id);
  if (!sub) return "open";
  if (sub.score != null) return "graded";
  if (!sub.submittedAt) return "open";
  return sub.submittedAt > t.dueAt ? "late" : "sent";
};

test.describe("jam demo", () => {
  test("dipatok ke Senin 7 September 2026, 09.41 WIB", () => {
    expect(shortDate(DEMO_NOW)).toBe("7 Sep");
    expect(hhmm(DEMO_NOW)).toBe("09.41");
    expect(isoDate(DEMO_NOW)).toBe("2026-09-07");
    // Awal minggu = hari itu sendiri, jadi 7 Sep memang Senin.
    expect(isoDate(startOfWeekMonday(DEMO_NOW))).toBe("2026-09-07");
  });

  test("selisih hari dihitung per kalender, bukan per 24 jam", () => {
    // Jebakan aslinya: 8 Sep 08.00 hanya 22,3 jam dari 7 Sep 09.41, jadi
    // pembagian 24 jam memberi 0 ("Hari ini") padahal desain bilang "Besok".
    const besokPagi = jkt(2026, 9, 8, 8, 0);
    expect(Math.floor((besokPagi - DEMO_NOW) / 86_400_000)).toBe(0); // yang salah
    expect(calendarDaysUntil(besokPagi)).toBe(1); // yang benar
  });

  test("tidak bergantung pada timezone mesin", () => {
    expect(hhmm(jkt(2026, 9, 7, 23, 59))).toBe("23.59");
    expect(shortDate(jkt(2026, 8, 29))).toBe("29 Agu");
  });

  test("fromDateAndTime membalik isoDate + hhmm", () => {
    const d = jkt(2026, 9, 18, 23, 59);
    expect(fromDateAndTime(isoDate(d), hhmm(d)).getTime()).toBe(d.getTime());
    expect(hhmm(fromDateAndTime("2026-09-18", ""))).toBe("23.59");
  });
});

test.describe("tugas sisi siswa", () => {
  // Angka & string yang persis dari `design/Sekelas App v2.dc.html`.
  const EXPECTED = {
    1: { days: 0, due: "Hari ini · 23.59", state: "open", type: "Tugas individu", weight: "10%" },
    2: { days: 1, due: "Besok · 12.00", state: "open", type: "Kelompok (4 orang)", weight: "20%" },
    3: { days: 2, due: "9 Sep · 08.00", state: "open", type: "Tugas individu", weight: "10%" },
    4: { days: 4, due: "11 Sep · 23.59", state: "open", type: "Tugas individu", weight: "15%" },
    5: { days: 7, due: "14 Sep · 10.00", state: "open", type: "Tugas individu", weight: "10%" },
    6: { days: 9, due: "16 Sep · 15.00", state: "open", type: "Kuis", weight: "5%" },
    7: { days: -1, due: "Selesai · 5 Sep", state: "graded", type: "Tugas individu", weight: "10%" },
    8: { days: 0, due: "Selesai · hari ini", state: "sent", type: "Tugas individu", weight: "5%" },
  };

  test("delapan tugas, semuanya di kelas Alya dan bukan arsip", () => {
    const mine = TASKS.filter((t) => t.legacyNo);
    expect(mine).toHaveLength(8);
    for (const t of mine) {
      expect(t.classId).toBe("11ipa2");
      expect(t.isArchived).toBeFalsy();
    }
  });

  for (const no of Object.keys(EXPECTED).map(Number)) {
    test(`tugas ${no} — ${EXPECTED[no].due}`, () => {
      const t = byLegacy(no);
      const e = EXPECTED[no];
      expect(calendarDaysUntil(t.dueAt)).toBe(e.days);
      expect(meDue(t)).toBe(e.due);
      expect(meState(t)).toBe(e.state);
      expect(taskType(t)).toBe(e.type);
      expect(t.weightPct + "%").toBe(e.weight);
    });
  }

  test("tugas selesai memakai tanggal pengumpulan, bukan deadline", () => {
    const t7 = byLegacy(7);
    // Deadline 6 Sep tapi label "5 Sep" — keduanya benar, artinya berbeda.
    expect(shortDate(t7.dueAt)).toBe("6 Sep");
    expect(meDue(t7)).toBe("Selesai · 5 Sep");
    expect(formatStamp(meSub(t7.id).submittedAt)).toBe("5 Sep · 19.24");
    expect(meSub(t7.id).score).toBe(88);

    const t8 = byLegacy(8);
    expect(formatStamp(meSub(t8.id).submittedAt)).toBe("Hari ini · 08.10");
    expect(meSub(t8.id).score).toBeNull();
  });

  test("pengumpulan baru berlabel 09.41, sama seperti string hardcode desain", () => {
    expect(formatStamp(DEMO_NOW)).toBe("Hari ini · 09.41");
  });

  test("ringkasan status cocok dengan label desain", () => {
    const mine = TASKS.filter((t) => t.legacyNo);
    const count = (s) => mine.filter((t) => meState(t) === s).length;
    // "6 belum dikumpulkan · 1 terkumpul · 1 dinilai"
    expect(count("open")).toBe(6);
    expect(count("sent") + count("late")).toBe(1);
    expect(count("graded")).toBe(1);
    // Progress hari ini: 1 dari 2 → 50%
    const today = mine.filter((t) => calendarDaysUntil(t.dueAt) === 0);
    expect(today).toHaveLength(2);
    expect(today.filter(meDone)).toHaveLength(1);
  });
});

test.describe("tugas sisi guru", () => {
  const DEADLINE = {
    a1: "7 Sep · 23.59",
    a2: "8 Sep · 12.00",
    a3: "9 Sep · 08.00",
    a4: "16 Sep · 15.00",
    a5: "8 Sep · 23.59",
    a6: "12 Sep · 10.00",
    a7: "10 Sep · 23.59",
    a8: "11 Sep · 23.59",
    a9: "9 Sep · 13.00",
    a10: "13 Sep · 09.00",
    a11: "15 Sep · 23.59",
  };

  for (const id of Object.keys(DEADLINE)) {
    test(`${id} — ${DEADLINE[id]}`, () => {
      expect(formatDeadline(byId(id).dueAt)).toBe(DEADLINE[id]);
    });
  }

  /**
   * Kolom hitungan `submitted` desain sekarang jadi baris pengumpulan sungguhan.
   * Angkanya harus tetap sama, walau Alya dikecualikan dari tebakan posisional.
   */
  test("jumlah pengumpulan tetap seperti desain", () => {
    const SUBMITTED = { a1: 18, a2: 6, a3: 11, a4: 0, a5: 22, a6: 4, a7: 19, a8: 12, a9: 0, a10: 3, a11: 8 };
    for (const [id, n] of Object.entries(SUBMITTED)) {
      const count = SUBMISSIONS.filter((s) => s.taskId === id && s.submittedAt).length;
      expect(count, `tugas ${id}`).toBe(n);
    }
  });

  test("tampilan guru dan siswa sepakat soal Alya", () => {
    // Inilah kontradiksi yang ditinggalkan desain: tebakan posisional membuat
    // sisi guru menyatakan Alya sudah mengumpulkan a1, sisi siswa bilang belum.
    for (const no of [1, 2, 3, 6]) {
      const t = byLegacy(no);
      const teacherSide = SUBMISSIONS.find((s) => s.taskId === t.id && s.studentId === ME_STUDENT_ID);
      expect(teacherSide, `tugas ${no} tidak boleh punya pengumpulan Alya`).toBeUndefined();
      expect(meState(t)).toBe("open");
    }
  });
});

test.describe("riwayat nilai", () => {
  /**
   * Urutan di dalam satu mapel yang menentukan tampilan layar Nilai, bukan
   * urutan global — jadi itu yang diuji.
   */
  test("tiap mapel memakai tanggal dan nilai desain, urut sama", () => {
    const EXPECTED = {
      mat: [["29 Agu", 85], ["22 Agu", 92]],
      fis: [["5 Sep", 88], ["27 Agu", 76]],
      bin: [["7 Sep", 90], ["25 Agu", 81]],
      sej: [["2 Sep", 74]],
      ing: [["1 Sep", 95], ["24 Agu", 89]],
    };

    const graded = SUBMISSIONS.filter((s) => s.studentId === ME_STUDENT_ID && s.score != null).map((s) => {
      const t = byId(s.taskId);
      return { subjectId: t.subjectId, date: shortDate(s.gradedAt), score: s.score, weight: t.weightPct };
    });

    expect(graded).toHaveLength(9);
    for (const s of SUBJECTS) {
      const mine = graded.filter((g) => g.subjectId === s.id).map((g) => [g.date, g.score]);
      expect(mine, s.name).toEqual(EXPECTED[s.id]);
    }
  });

  test("rata-rata berbobot menghasilkan angka yang sama dengan desain", () => {
    const graded = SUBMISSIONS.filter((s) => s.studentId === ME_STUDENT_ID && s.score != null).map((s) => ({
      subjectId: byId(s.taskId).subjectId,
      score: s.score,
      weight: byId(s.taskId).weightPct,
    }));
    const avgOf = (items) => {
      const w = items.reduce((a, i) => a + i.weight, 0) || 1;
      return Math.round(items.reduce((a, i) => a + i.score * i.weight, 0) / w);
    };
    // Per mapel, seperti yang tampil di kartu layar Nilai.
    expect(avgOf(graded.filter((g) => g.subjectId === "mat"))).toBe(88);
    expect(avgOf(graded.filter((g) => g.subjectId === "fis"))).toBe(84);
    // "Rata-rata 87" di baris Profil.
    expect(avgOf(graded)).toBe(87);
    // Rata-rata semester = rata-rata dari rata-rata mapel.
    const perSubject = SUBJECTS.map((s) => graded.filter((g) => g.subjectId === s.id))
      .filter((items) => items.length)
      .map(avgOf);
    expect(Math.round(perSubject.reduce((a, v) => a + v, 0) / perSubject.length)).toBe(84);
  });
});

test.describe("grid kalender", () => {
  test("minggu berjalan 7–13 September", () => {
    const start = startOfWeekMonday(DEMO_NOW);
    expect([0, 1, 2, 3, 4, 5, 6].map((i) => dayOfMonth(addDays(start, i)))).toEqual([7, 8, 9, 10, 11, 12, 13]);
  });

  test("panah minggu bergeser tepat tujuh hari", () => {
    const start = startOfWeekMonday(DEMO_NOW);
    expect(dayOfMonth(addDays(start, -7))).toBe(31); // 31 Agustus
    expect(dayOfMonth(addDays(start, 7))).toBe(14);
  });
});
