"use client";

import { DetailHeader, Screen } from "./siswa";
import { LOGOUT_BUTTON } from "./guru";

const PRIMARY_PILL =
  "flex-none cursor-pointer rounded-[15px] border-0 bg-brand px-[15px] py-[11px] text-[12.5px] font-bold text-white shadow-[0_12px_24px_-14px_rgba(109,74,255,.9)] hover:bg-brand-strong";

/* ---------- Kelas & jurusan ---------- */

export function TuClassesScreen({ v }) {
  return (
    <Screen className="bg-app pt-[56px] pb-[104px]">
      <DetailHeader onBack={v.goAdminHome} label="Panel TU" />
      <div className="mx-[22px] mt-[20px] flex items-end justify-between gap-[12px]">
        <div>
          <div className="text-[24px] font-extrabold tracking-[-.8px]">Kelas &amp; Jurusan</div>
          <div className="mt-[3px] text-[12.5px] font-semibold text-ink-5">{v.classCountLabel}</div>
        </div>
        <button type="button" onClick={v.addClass} className={PRIMARY_PILL}>
          + Tambah Kelas
        </button>
      </div>
      <div className="mx-[22px] mt-[18px] flex flex-col gap-[12px]">
        {v.tuLevelGroups.map((g) => (
          <div key={g.level}>
            <div className="flex items-center gap-[10px]">
              <div className="flex-1 text-[14px] font-extrabold tracking-[-.2px]">{g.level}</div>
              <div className="text-[11px] font-bold text-ink-5">{g.countLabel}</div>
            </div>
            <div className="mt-[9px] flex flex-col gap-[8px]">
              {g.items.map((c) => (
                <div
                  key={c.name}
                  onClick={c.open}
                  className="flex cursor-pointer items-center gap-[12px] rounded-[19px] border border-line-06 bg-white p-[14px] hover:border-[rgba(109,74,255,.35)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[14.5px] font-extrabold tracking-[-.2px]">{c.name}</div>
                    <div className="mt-[3px] text-[11.5px] font-semibold text-ink-5">
                      Wali kelas {c.homeroom} · {c.students}
                    </div>
                  </div>
                  <span
                    className="flex-none rounded-[99px] px-[10px] py-[5px] text-[11px] font-bold whitespace-nowrap"
                    style={{ background: c.tint, color: c.ink }}
                  >
                    {c.major}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ---------- Detail kelas ---------- */

export function TuClassDetailScreen({ v }) {
  const c = v.tuClass;
  return (
    <Screen className="bg-white pt-[56px] pb-[104px]">
      <DetailHeader onBack={v.goTuClasses} label="Detail kelas" />

      <div className="mx-[22px] mt-[22px] flex items-start justify-between gap-[12px]">
        <div className="min-w-0">
          <div className="text-[26px] font-extrabold tracking-[-.9px]">{c.name}</div>
          <div className="mt-[3px] text-[12.5px] font-semibold text-ink-5">
            {c.level} · {c.roomLabel}
          </div>
        </div>
        <span
          className="flex-none rounded-[99px] px-[11px] py-[6px] text-[11px] font-bold whitespace-nowrap"
          style={{ background: c.tint, color: c.ink }}
        >
          {c.major}
        </span>
      </div>

      <div className="mx-[22px] mt-[14px] flex gap-[8px]">
        <button
          type="button"
          onClick={v.editClass}
          className="flex-1 cursor-pointer rounded-[15px] border-[1.5px] border-[rgba(20,18,31,.12)] bg-white p-[13px] text-[12.5px] font-bold text-ink hover:border-brand hover:text-brand-strong"
        >
          Ubah kelas
        </button>
        <button
          type="button"
          onClick={v.deleteClass}
          className="flex-none cursor-pointer rounded-[15px] border-[1.5px] border-[rgba(217,52,56,.22)] bg-[#FFF1F0] px-[16px] py-[13px] text-[12.5px] font-bold text-[#D93438] hover:bg-[#FFE4E3]"
        >
          Hapus
        </button>
      </div>

      <div className="mx-[22px] mt-[18px] flex items-center gap-[13px] rounded-[22px] bg-app p-[16px]">
        <div className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[16px] bg-brand-tint text-[14.5px] font-extrabold text-brand-strong">
          {c.homeroomInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10.5px] font-extrabold tracking-[.4px] text-ink-5 uppercase">Wali kelas</div>
          <div className="mt-[3px] text-[15px] font-extrabold tracking-[-.3px]">{c.homeroom}</div>
          <div className="mt-[2px] truncate text-[11.5px] font-semibold text-ink-5">
            Mengajar {c.homeroomSubject} · {c.homeroomEmail}
          </div>
        </div>
      </div>

      <div className="mx-[22px] mt-[12px] grid grid-cols-3 gap-[10px]">
        {[
          [c.students, "Siswa"],
          [c.subjectCount, "Mapel"],
          [c.teacherCount, "Guru"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-[18px] bg-app p-[14px]">
            <div className="text-[22px] font-extrabold tracking-[-.6px]">{value}</div>
            <div className="mt-[2px] text-[11px] font-semibold text-ink-5">{label}</div>
          </div>
        ))}
      </div>

      <div className="mx-[22px] mt-[22px] flex items-center justify-between gap-[12px]">
        <div className="text-[13px] font-extrabold">Mata pelajaran &amp; guru</div>
        <button
          type="button"
          onClick={c.openSchedule}
          className="flex-none cursor-pointer rounded-[13px] border-[1.5px] border-[rgba(109,74,255,.25)] bg-[#F5F2FF] px-[13px] py-[10px] text-[11.5px] font-bold whitespace-nowrap text-brand-strong hover:bg-[#EBE5FF]"
        >
          Atur jadwal
        </button>
      </div>
      <div className="mx-[22px] mt-[12px] flex flex-col gap-[8px]">
        {c.subjectRows.map((s) => (
          <div
            key={s.name}
            className="flex items-center gap-[11px] rounded-[18px] border border-line-06 border-l-4 bg-white p-[13px]"
            style={{ borderLeftColor: s.color }}
          >
            <div
              className="flex h-[36px] w-[36px] flex-none items-center justify-center rounded-[12px] text-[12.5px] font-extrabold"
              style={{ background: s.color, color: s.onColor }}
            >
              {s.abbr}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-extrabold tracking-[-.2px]">{s.name}</div>
              <div className="mt-[2px] text-[11.5px] font-semibold text-ink-3">{s.teacher}</div>
              <div className="text-[11px] font-medium text-ink-4">{s.meta}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-[22px] mt-[24px] flex items-end justify-between gap-[12px]">
        <div className="min-w-0">
          <div className="text-[13px] font-extrabold">Data siswa</div>
          <div className="mt-[3px] text-[11.5px] font-semibold text-ink-4">{c.rosterLabel}</div>
        </div>
        <button
          type="button"
          onClick={v.addStudent}
          className="flex-none cursor-pointer rounded-[14px] border-0 bg-brand px-[14px] py-[11px] text-[12px] font-bold whitespace-nowrap text-white shadow-[0_12px_24px_-14px_rgba(109,74,255,.9)] hover:bg-brand-strong"
        >
          + Tambah siswa
        </button>
      </div>
      <div className="mx-[22px] mt-[12px] overflow-hidden rounded-[20px] border border-line-07">
        {c.roster.map((r) => (
          <div key={r.id} className="flex items-center gap-[11px] border-t border-line-05 px-[14px] py-[12px]">
            <div className="flex h-[32px] w-[32px] flex-none items-center justify-center rounded-[11px] bg-app text-[11.5px] font-extrabold text-ink-3">
              {r.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold">{r.name}</div>
              <div className="mt-[1px] text-[11px] font-semibold text-ink-4">NIS {r.nis}</div>
            </div>
            <button
              type="button"
              onClick={r.remove}
              title="Keluarkan dari kelas"
              className="h-[44px] w-[44px] flex-none cursor-pointer rounded-[13px] border-[1.5px] border-line-09 bg-white text-[12px] font-bold text-ink-5 hover:border-[rgba(217,52,56,.35)] hover:bg-[#FFF1F0] hover:text-[#D93438]"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ---------- Guru & penugasan ---------- */

export function TuTeachersScreen({ v }) {
  return (
    <Screen className="bg-app pt-[56px] pb-[104px]">
      <DetailHeader onBack={v.goAdminHome} label="Panel TU" />
      <div className="mx-[22px] mt-[20px] flex items-end justify-between gap-[12px]">
        <div>
          <div className="text-[24px] font-extrabold tracking-[-.8px]">Guru &amp; Penugasan</div>
          <div className="mt-[3px] text-[12.5px] font-semibold text-ink-5">{v.teacherCountLabel}</div>
        </div>
        <button type="button" onClick={v.addAssign} className={PRIMARY_PILL}>
          + Penugasan
        </button>
      </div>
      <div className="mx-[22px] mt-[18px] flex flex-col gap-[9px]">
        {v.teacherList.map((t) => (
          <div
            key={t.email}
            onClick={t.open}
            className="flex cursor-pointer items-center gap-[12px] rounded-[19px] border border-line-06 bg-white p-[14px] hover:border-[rgba(109,74,255,.35)]"
          >
            <div className="flex h-[40px] w-[40px] flex-none items-center justify-center rounded-[14px] bg-brand-tint text-[13px] font-extrabold text-brand-strong">
              {t.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-bold">{t.name}</div>
              <div className="mt-[2px] truncate text-[11.5px] font-medium text-ink-5">{t.email}</div>
              <div className="mt-[3px] truncate text-[11px] font-bold text-ink-3">{t.meta}</div>
            </div>
            <span className="block h-[7px] w-[7px] flex-none rotate-45 border-t-2 border-r-2 border-[#C2BFD0]" />
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ---------- Detail guru ---------- */

export function TuTeacherDetailScreen({ v }) {
  const t = v.tuTeacher;
  return (
    <Screen className="bg-white pt-[56px] pb-[104px]">
      <DetailHeader onBack={v.goTuTeachers} label="Detail guru" />
      <div className="mx-[22px] mt-[22px] flex items-center gap-[14px]">
        <div className="flex h-[54px] w-[54px] flex-none items-center justify-center rounded-[18px] bg-brand-tint text-[17px] font-extrabold text-brand-strong">
          {t.initials}
        </div>
        <div className="min-w-0">
          <div className="text-[21px] font-extrabold tracking-[-.6px]">{t.name}</div>
          <div className="mt-[2px] text-[12.5px] font-semibold text-ink-5">{t.email}</div>
        </div>
      </div>

      <div className="mx-[22px] mt-[16px] overflow-hidden rounded-[20px] bg-app">
        {t.info.map((i) => (
          <div
            key={i.label}
            className="flex items-center justify-between gap-[12px] border-b border-line-05 px-[16px] py-[13px]"
          >
            <div className="text-[12px] font-bold text-ink-5">{i.label}</div>
            <div className="text-right text-[12.5px] font-bold">{i.value}</div>
          </div>
        ))}
      </div>

      <div className="mx-[22px] mt-[18px] grid grid-cols-2 gap-[10px]">
        <div className="rounded-[20px] bg-app p-[16px]">
          <div className="text-[24px] font-extrabold tracking-[-.6px]">{t.subjectCount}</div>
          <div className="mt-[2px] text-[11.5px] font-semibold text-ink-5">Mata pelajaran</div>
        </div>
        <div className="rounded-[20px] bg-app p-[16px]">
          <div className="text-[24px] font-extrabold tracking-[-.6px]">{t.classCount}</div>
          <div className="mt-[2px] text-[11.5px] font-semibold text-ink-5">Kelas diajar</div>
        </div>
      </div>

      <div className="mx-[22px] mt-[22px] flex items-center justify-between gap-[12px]">
        <div className="text-[13px] font-extrabold">Penugasan</div>
        <button
          type="button"
          onClick={v.addAssign}
          className="flex-none cursor-pointer rounded-[13px] border-[1.5px] border-[rgba(109,74,255,.25)] bg-[#F5F2FF] px-[13px] py-[10px] text-[11.5px] font-bold text-brand-strong hover:bg-[#EBE5FF]"
        >
          + Tambah
        </button>
      </div>
      <div className="mx-[22px] mt-[12px] flex flex-col gap-[9px]">
        {t.assignments.map((a) => (
          <div key={a.name} className="rounded-[19px] p-[15px]" style={{ background: a.tint }}>
            <div className="flex items-center gap-[11px]">
              <div
                className="flex h-[36px] w-[36px] flex-none items-center justify-center rounded-[12px] text-[12.5px] font-extrabold"
                style={{ background: a.color, color: a.onColor }}
              >
                {a.abbr}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-extrabold tracking-[-.2px]" style={{ color: a.ink }}>
                  {a.name}
                </div>
                <div className="mt-[2px] text-[11px] font-semibold text-ink-3">{a.classLabel}</div>
              </div>
              <div className="flex flex-none gap-[6px]">
                <button
                  type="button"
                  onClick={a.edit}
                  className="cursor-pointer rounded-[11px] border-[1.5px] border-[rgba(20,18,31,.12)] bg-white/85 px-[11px] py-[8px] text-[11px] font-bold whitespace-nowrap text-ink hover:border-brand hover:text-brand-strong"
                >
                  Ubah
                </button>
                <button
                  type="button"
                  onClick={a.remove}
                  title="Hapus penugasan"
                  className="h-[32px] w-[32px] cursor-pointer rounded-[11px] border-[1.5px] border-[rgba(217,52,56,.22)] bg-[#FFF1F0] text-[11px] font-bold text-[#D93438] hover:bg-[#FFE4E3]"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="mt-[12px] flex flex-wrap gap-[7px]">
              {a.classes.map((name) => (
                <span
                  key={name}
                  className="rounded-[99px] bg-white/80 px-[11px] py-[6px] text-[11.5px] font-bold whitespace-nowrap text-[#3C3853]"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ---------- Profil TU ---------- */

export function TuProfileScreen({ v }) {
  return (
    <Screen className="bg-app pt-[60px] pb-[104px]">
      <div className="px-[22px] text-[25px] font-extrabold tracking-[-.8px]">Profil</div>
      <div className="mx-[22px] mt-[18px] rounded-[26px] border border-line-05 bg-white p-[22px] text-center">
        <div className="mx-auto flex h-[74px] w-[74px] items-center justify-center rounded-[26px] bg-brand-tint text-[25px] font-extrabold text-brand">
          {v.tuInitials}
        </div>
        <div className="mt-[14px] text-[19px] font-extrabold tracking-[-.4px]">{v.tuName}</div>
        <div className="mt-[3px] text-[12.5px] font-semibold text-ink-4">{v.tuEmail}</div>
        <div className="mt-[14px] flex flex-wrap justify-center gap-[7px]">
          <span className="rounded-[99px] bg-brand-tint px-[11px] py-[6px] text-[11px] font-bold whitespace-nowrap text-brand-strong">
            {v.tuRole}
          </span>
          <span className="rounded-[99px] bg-yellow-tint px-[11px] py-[6px] text-[11px] font-bold whitespace-nowrap text-yellow-ink">
            {v.schoolName}
          </span>
        </div>
      </div>
      <div className="mx-[22px] mt-[14px] overflow-hidden rounded-[22px] border border-line-05 bg-white">
        {v.tuIdentityRows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between gap-[12px] border-b border-line-05 px-[16px] py-[14px]"
          >
            <div className="text-[12px] font-bold text-ink-5">{r.label}</div>
            <div className="text-right text-[12.5px] font-bold">{r.value}</div>
          </div>
        ))}
      </div>
      <div className="mx-[22px] mt-[18px] text-[13px] font-extrabold">Data yang kamu kelola</div>
      <div className="mx-[22px] mt-[10px] overflow-hidden rounded-[22px] border border-line-05 bg-white">
        {v.tuProfileRows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-[12px] border-b border-line-05 p-[16px]">
            <div className="text-[13.5px] font-semibold">{r.label}</div>
            <div className="text-[12.5px] font-bold text-ink-3">{r.value}</div>
          </div>
        ))}
      </div>
      <div className="mx-[22px] mt-[16px]">
        <button type="button" onClick={v.logout} className={LOGOUT_BUTTON}>
          Keluar
        </button>
      </div>
    </Screen>
  );
}
