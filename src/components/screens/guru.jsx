"use client";

import { FieldLabel, SkInput, SkSelect, SkTextarea } from "@/components/ui-sekelas";
import { DetailHeader, Screen } from "./siswa";

const LOGOUT_BUTTON =
  "w-full cursor-pointer rounded-[18px] border-[1.5px] border-[rgba(255,77,79,.28)] bg-[#FFF1F0] p-[16px] text-[14.5px] font-bold text-[#D93438] hover:bg-[#FFE4E3]";

/* ---------- Tugas baru / ubah tugas ---------- */

export function AdminTaskFormScreen({ v }) {
  return (
    <Screen className="flex flex-col bg-white pt-[56px]">
      <DetailHeader onBack={v.goAdminTasks} label={v.taskFormEyebrow} />
      <div className="mx-[22px] mt-[20px] text-[24px] font-extrabold tracking-[-.8px]">{v.taskFormTitle}</div>
      <div className="mx-[22px] mt-[5px] text-[12.5px] font-semibold text-ink-5">{v.taskFormNote}</div>

      <div className="mx-[22px] mt-[20px] flex flex-col gap-[14px]">
        <label className="block">
          <FieldLabel>Mata pelajaran</FieldLabel>
          <SkSelect
            value={v.taskForm.subjectId}
            onValueChange={v.onTaskSubject}
            options={v.taskFormSubjects.map((o) => ({ value: o.id, label: o.name }))}
          />
        </label>
        <label className="block">
          <FieldLabel>Judul tugas</FieldLabel>
          <SkInput value={v.taskForm.title} onChange={v.onTaskTitle} placeholder="mis. Laporan praktikum optik" />
        </label>
        <label className="block">
          <FieldLabel>Deskripsi</FieldLabel>
          <SkTextarea
            value={v.taskForm.desc}
            onChange={v.onTaskDesc}
            rows={4}
            placeholder="Jelaskan instruksi pengerjaan, format, dan cara pengumpulan."
          />
        </label>
        <div>
          <FieldLabel>Jenis tugas</FieldLabel>
          <div className="mt-[8px] flex gap-[8px]">
            {v.kindChips.map((k) => (
              <button
                key={k.label}
                type="button"
                onClick={k.pick}
                className="flex-1 cursor-pointer rounded-[14px] border-[1.5px] px-[6px] py-[11px] text-[12.5px] font-bold whitespace-nowrap"
                style={{ borderColor: k.border, background: k.bg, color: k.ink }}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>
        {v.isGroupTask && (
          <label className="block animate-sk-rise">
            <FieldLabel>Jumlah anggota per kelompok</FieldLabel>
            <SkInput
              type="number"
              value={v.taskForm.groupSize}
              onChange={v.onTaskGroupSize}
              min="2"
              max="10"
              className="border-[rgba(109,74,255,.35)] bg-[#FAF8FF] font-bold"
            />
          </label>
        )}
        <div className="grid grid-cols-[1.3fr_1fr] gap-[10px]">
          <label className="block">
            <FieldLabel>Tanggal deadline</FieldLabel>
            <SkInput
              type="date"
              value={v.taskForm.date}
              onChange={v.onTaskDate}
              className="px-[12px] text-[13.5px] md:text-[13.5px]"
            />
          </label>
          <label className="block">
            <FieldLabel>Jam</FieldLabel>
            <SkInput value={v.taskForm.time} onChange={v.onTaskTime} placeholder="23.59" />
          </label>
        </div>
        <label className="block">
          <FieldLabel>Bobot nilai (%)</FieldLabel>
          <SkInput type="number" value={v.taskForm.weight} onChange={v.onTaskWeight} min="0" max="100" />
        </label>
        <div>
          <FieldLabel>Lampiran file</FieldLabel>
          <div className="mt-[8px] rounded-[18px] border-[1.5px] border-dashed border-[rgba(109,74,255,.3)] bg-[#FAF8FF] p-[22px] text-center">
            <div className="text-[13px] font-bold text-brand-strong">Pilih file dari perangkat</div>
            <div className="mt-[4px] text-[11.5px] font-medium text-ink-5">
              Galeri, Files, atau Google Drive · PDF, DOCX, PPT · maks 25 MB
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 mt-auto flex gap-[10px] bg-[linear-gradient(180deg,rgba(255,255,255,0),#fff_30%)] px-[22px] pt-[14px] pb-[26px]">
        <button
          type="button"
          onClick={v.goAdminTasks}
          className="flex-none cursor-pointer rounded-[17px] border-[1.5px] border-line-10 bg-white px-[20px] py-[16px] text-[14.5px] font-bold text-ink"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={v.saveTask}
          className="flex-1 cursor-pointer rounded-[17px] border-0 bg-brand py-[16px] text-[14.5px] font-bold text-white shadow-[0_14px_26px_-14px_rgba(109,74,255,.9)] hover:bg-brand-strong"
        >
          Simpan
        </button>
      </div>
    </Screen>
  );
}

/* ---------- Dashboard guru ---------- */

export function GuruHomeScreen({ v }) {
  return (
    <Screen className="bg-app pt-[60px] pb-[104px]">
      <div className="flex items-start justify-between gap-[12px] px-[22px]">
        <div>
          <div className="text-[11.5px] font-bold tracking-[.4px] text-ink-5 uppercase">Panel Guru</div>
          <div className="mt-[4px] text-[24px] font-extrabold tracking-[-.7px]">Halo, {v.guruName}</div>
          <div className="mt-[3px] text-[12.5px] font-semibold text-ink-5">Senin, 7 September · Semester Ganjil</div>
        </div>
        <button
          type="button"
          onClick={v.goGuruProfile}
          className="h-[44px] w-[44px] flex-none cursor-pointer rounded-[15px] border-[1.5px] border-line-08 bg-white text-[14px] font-extrabold text-brand"
        >
          {v.guruInitials}
        </button>
      </div>

      <div className="mx-[22px] mt-[18px] grid grid-cols-3 gap-[10px]">
        <div className="rounded-[20px] border border-[rgba(109,74,255,.14)] bg-brand-tint px-[14px] py-[15px]">
          <div className="text-[24px] font-extrabold tracking-[-.7px] text-brand-strong">{v.guruTaskCount}</div>
          <div className="mt-[2px] text-[10.5px] leading-[1.3] font-semibold text-ink-3">
            Tugas
            <br />
            aktif
          </div>
        </div>
        <div className="rounded-[20px] border border-[rgba(16,185,129,.16)] bg-green-tint px-[14px] py-[15px]">
          <div className="text-[24px] font-extrabold tracking-[-.7px] text-green-ink">{v.guruClassCount}</div>
          <div className="mt-[2px] text-[10.5px] leading-[1.3] font-semibold text-ink-3">
            Kelas
            <br />
            diampu
          </div>
        </div>
        <div className="rounded-[20px] border border-[rgba(250,204,21,.28)] bg-yellow-tint px-[14px] py-[15px]">
          <div className="text-[24px] font-extrabold tracking-[-.7px] text-yellow-ink">{v.guruMaterialCount}</div>
          <div className="mt-[2px] text-[10.5px] leading-[1.3] font-semibold text-ink-3">
            Materi
            <br />
            terupload
          </div>
        </div>
      </div>

      <div className="mx-[22px] mt-[24px] text-[15.5px] font-extrabold tracking-[-.3px]">
        Mata pelajaran yang diampu
      </div>
      <div className="mx-[22px] mt-[6px] text-[11.5px] font-semibold text-ink-5">
        Pilih kelas untuk membuka Kelola Tugas kelas itu.
      </div>
      <div className="mx-[22px] mt-[14px] flex flex-col gap-[11px]">
        {v.guruAssignmentCards.map((a) => (
          <div
            key={a.name}
            className="rounded-[22px] border border-line-06 bg-white p-[16px] shadow-[0_2px_8px_-5px_rgba(24,18,54,.14)]"
          >
            <div className="flex items-center gap-[12px]">
              <div
                className="flex h-[40px] w-[40px] flex-none items-center justify-center rounded-[14px] text-[13.5px] font-extrabold"
                style={{ background: a.color, color: a.onColor }}
              >
                {a.abbr}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15.5px] font-extrabold tracking-[-.2px]">{a.name}</div>
                <div className="mt-[2px] text-[11.5px] font-semibold text-ink-5">{a.classLabel}</div>
              </div>
            </div>
            <div className="mt-[13px] flex flex-col gap-[7px]">
              {a.classes.map((c) => (
                <div
                  key={c.name}
                  onClick={c.open}
                  className="flex cursor-pointer items-center justify-between gap-[10px] rounded-[15px] px-[14px] py-[12px] hover:brightness-[.97]"
                  style={{ background: a.tint }}
                >
                  <div className="text-[13.5px] font-bold" style={{ color: a.ink }}>
                    {c.name}
                  </div>
                  <div className="flex items-center gap-[9px]">
                    <span className="text-[11px] font-bold text-ink-3">{c.taskLabel}</span>
                    <span className="block h-[7px] w-[7px] rotate-45 border-t-2 border-r-2 border-ink-5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ---------- Jadwal mengajar (read-only) ---------- */

export function GuruScheduleScreen({ v }) {
  return (
    <Screen className="bg-app pt-[56px] pb-[104px]">
      <DetailHeader onBack={v.goGuruHome} label="Panel Guru" />
      <div className="mx-[22px] mt-[20px]">
        <div className="text-[24px] font-extrabold tracking-[-.8px]">Jadwal mengajar</div>
        <div className="mt-[3px] text-[12.5px] font-semibold text-ink-5">{v.guruScheduleNote}</div>
      </div>
      <div className="mx-[22px] mt-[18px] flex flex-col gap-[10px]">
        {v.guruDayGroups.map((g) => (
          <div key={g.day} className="rounded-[20px] border border-line-06 bg-white px-[16px] py-[15px]">
            <div className="flex items-center gap-[10px]">
              <div className="flex-1 text-[14.5px] font-extrabold tracking-[-.2px]">{g.day}</div>
              <div className="rounded-[99px] bg-line-05 px-[9px] py-[4px] text-[11px] font-bold text-ink-5">
                {g.countLabel}
              </div>
            </div>
            {g.hasItems && (
              <div className="mt-[12px] flex flex-col gap-[8px]">
                {g.items.map((i) => (
                  <div
                    key={i.className + i.time}
                    className="flex items-center gap-[11px] rounded-[16px] p-[12px]"
                    style={{ background: i.tint }}
                  >
                    <div className="w-[3px] flex-none self-stretch rounded-[99px]" style={{ background: i.color }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-bold" style={{ color: i.ink }}>
                        {i.name} · {i.className}
                      </div>
                      <div className="mt-[2px] text-[11.5px] font-semibold text-ink-3">
                        {i.time} · {i.room}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {g.isEmpty && (
              <div className="mt-[10px] text-[12px] font-semibold text-ink-7">Tidak ada jadwal mengajar</div>
            )}
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ---------- Profil guru ---------- */

export function GuruProfileScreen({ v }) {
  return (
    <Screen className="bg-app pt-[60px] pb-[104px]">
      <div className="px-[22px] text-[25px] font-extrabold tracking-[-.8px]">Profil</div>
      <div className="mx-[22px] mt-[18px] rounded-[26px] border border-line-05 bg-white p-[22px] text-center">
        <div className="mx-auto flex h-[74px] w-[74px] items-center justify-center rounded-[26px] bg-brand-tint text-[25px] font-extrabold text-brand">
          {v.guruInitials}
        </div>
        <div className="mt-[14px] text-[19px] font-extrabold tracking-[-.4px]">{v.guruName}</div>
        <div className="mt-[3px] text-[12.5px] font-semibold text-ink-5">{v.guruEmail}</div>
        <div className="mt-[3px] text-[11.5px] font-semibold text-[#A8A4B6]">
          NIP {v.guruNip} · {v.guruStatus}
        </div>
        <div className="mt-[14px] flex flex-wrap justify-center gap-[7px]">
          <span className="rounded-[99px] bg-brand-tint px-[11px] py-[6px] text-[11px] font-bold text-brand-strong">
            {v.guruSubjectLabel}
          </span>
          <span className="rounded-[99px] bg-green-tint px-[11px] py-[6px] text-[11px] font-bold text-green-ink">
            {v.guruClassCount} kelas
          </span>
        </div>
      </div>
      <div className="mx-[22px] mt-[18px] text-[13px] font-extrabold">Penugasan</div>
      <div className="mx-[22px] mt-[10px] overflow-hidden rounded-[22px] border border-line-05 bg-white">
        {v.guruProfileRows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between gap-[12px] border-b border-line-05 px-[16px] py-[15px]"
          >
            <div className="text-[13.5px] font-bold">{r.label}</div>
            <div className="text-right text-[12px] font-semibold text-ink-5">{r.value}</div>
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

/* ---------- Daftar pengumpulan ---------- */

export function SubmissionsScreen({ v }) {
  const s = v.submission;
  if (!s) return null;
  return (
    <Screen className="bg-app pt-[56px] pb-[30px]">
      <DetailHeader
        onBack={v.goSubmissionsBack}
        label="Pengumpulan"
        size={44}
        radius="rounded-[14px]"
        labelClassName="text-ink-4"
      />
      <div className="mx-[22px] mt-[20px]">
        <span
          className="rounded-[99px] px-[9px] py-[4px] text-[10.5px] font-bold"
          style={{ background: s.tint, color: s.ink }}
        >
          {s.subject} · {s.className}
        </span>
        <div className="mt-[11px] text-[21px] leading-[1.22] font-extrabold tracking-[-.7px] text-pretty">
          {s.title}
        </div>
        <div className="mt-[5px] text-[12px] font-semibold text-ink-4">
          Deadline {s.deadline} · bobot {s.weight}
        </div>
      </div>

      <div className="mx-[22px] mt-[16px] grid grid-cols-3 gap-[9px]">
        <div className="rounded-[18px] border border-[rgba(16,185,129,.16)] bg-green-tint px-[12px] py-[14px]">
          <div className="text-[21px] font-extrabold tracking-[-.5px] text-green-ink">{s.sent}</div>
          <div className="mt-[1px] text-[10.5px] font-bold text-ink-3">Terkumpul</div>
        </div>
        <div className="rounded-[18px] border border-line-06 bg-white px-[12px] py-[14px]">
          <div className="text-[21px] font-extrabold tracking-[-.5px]">{s.open}</div>
          <div className="mt-[1px] text-[10.5px] font-bold text-ink-3">Belum</div>
        </div>
        <div className="rounded-[18px] border border-[rgba(109,74,255,.14)] bg-brand-tint px-[12px] py-[14px]">
          <div className="text-[21px] font-extrabold tracking-[-.5px] text-brand-strong">{s.graded}</div>
          <div className="mt-[1px] text-[10.5px] font-bold text-ink-3">Dinilai</div>
        </div>
      </div>

      {s.hasOpen && (
        <div className="mx-[22px] mt-[12px]">
          <button
            type="button"
            onClick={s.remindAll}
            className="w-full cursor-pointer rounded-[16px] border-[1.5px] border-[rgba(109,74,255,.25)] bg-[#F5F2FF] p-[14px] text-[13px] font-bold text-brand-strong hover:bg-[#EBE5FF]"
          >
            {s.remindLabel}
          </button>
        </div>
      )}

      <div className="mx-[22px] mt-[20px] text-[13px] font-extrabold">{s.countLabel}</div>
      <div className="mx-[22px] mt-[12px] flex flex-col gap-[8px]">
        {s.rows.map((r) => (
          <div
            key={r.key}
            className="flex items-center gap-[11px] rounded-[17px] border border-line-06 bg-white px-[13px] py-[12px]"
          >
            <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[12px] bg-app text-[11.5px] font-extrabold text-ink-3">
              {r.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold">{r.name}</div>
              <div
                className="mt-[3px] inline-block rounded-[99px] px-[8px] py-[3px] text-[10.5px] font-bold"
                style={{ background: r.stateBg, color: r.stateInk }}
              >
                {r.stateLabel}
              </div>
            </div>
            {r.isOpen && (
              <button
                type="button"
                onClick={r.remind}
                className="flex-none cursor-pointer rounded-[13px] border-[1.5px] border-line-10 bg-white px-[13px] py-[11px] text-[11.5px] font-bold whitespace-nowrap text-ink hover:border-brand hover:text-brand-strong"
              >
                Ingatkan
              </button>
            )}
            {r.isSent && (
              <button
                type="button"
                onClick={r.grade}
                className="flex-none cursor-pointer rounded-[13px] border-0 bg-brand px-[13px] py-[11px] text-[11.5px] font-bold whitespace-nowrap text-white hover:bg-brand-strong"
              >
                Beri nilai
              </button>
            )}
            {r.isGraded && (
              <button
                type="button"
                onClick={r.grade}
                className="flex-none cursor-pointer rounded-[13px] border-[1.5px] border-[rgba(16,185,129,.35)] bg-green-tint px-[13px] py-[11px] text-[11.5px] font-bold whitespace-nowrap text-green-ink hover:bg-[#DDF7EC]"
              >
                Ubah nilai
              </button>
            )}
          </div>
        ))}
      </div>
    </Screen>
  );
}

export { LOGOUT_BUTTON };
