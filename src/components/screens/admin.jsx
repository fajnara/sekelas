"use client";

import { NavIcon } from "@/lib/icons";
import { FieldLabel, SkInput, SkSelect } from "@/components/ui-sekelas";
import { DetailHeader, Screen } from "./siswa";

/* Buttons the admin screens reuse verbatim. */
const PRIMARY_PILL =
  "flex-none cursor-pointer rounded-[15px] border-0 bg-brand px-[15px] py-[11px] text-[12.5px] font-bold text-white shadow-[0_12px_24px_-14px_rgba(109,74,255,.9)] hover:bg-brand-strong";

function EmptyCard({ title, body, children }) {
  return (
    <div className="mt-[14px] animate-sk-rise rounded-[24px] border border-dashed border-[rgba(20,18,31,.14)] bg-white px-[24px] py-[32px] text-center">
      <div className="mx-auto h-[58px] w-[58px] rounded-[20px] bg-brand-tint" />
      <div className="mt-[14px] text-[15.5px] font-extrabold tracking-[-.3px]">{title}</div>
      <div className="mt-[6px] text-[12.5px] leading-[1.55] text-ink-5">{body}</div>
      {children}
    </div>
  );
}

/* ---------- TU dashboard ---------- */

export function AdminHomeScreen({ v }) {
  return (
    <Screen className="bg-app pt-[60px] pb-[104px] text-ink">
      <div className="flex items-start justify-between px-[22px]">
        <div>
          <div className="text-[11.5px] font-bold tracking-[.4px] text-ink-5 uppercase">Panel TU</div>
          <div className="mt-[4px] text-[24px] font-extrabold tracking-[-.7px]">{v.schoolName}</div>
          <div className="mt-[3px] text-[11px] font-semibold text-ink-5">
            NPSN {v.schoolNpsn} · T.A. {v.schoolYear}
          </div>
        </div>
        <button
          type="button"
          onClick={v.goTuProfile}
          className="h-[44px] w-[44px] flex-none cursor-pointer rounded-[15px] border-[1.5px] border-line-09 bg-white text-[14px] font-extrabold text-brand-strong hover:border-brand"
        >
          {v.tuInitials}
        </button>
      </div>

      <div className="mx-[22px] mt-[18px] grid grid-cols-4 gap-[8px]">
        {v.tuStats.map((s) => (
          <div key={s.label} className="rounded-[16px] px-[10px] py-[12px]" style={{ background: s.bg }}>
            <div className="text-[19px] font-extrabold tracking-[-.5px]" style={{ color: s.ink }}>
              {s.value}
            </div>
            <div className="mt-[1px] text-[10.5px] font-bold text-ink-3">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mx-[22px] mt-[14px] rounded-[22px] border border-line-06 bg-white p-[14px] shadow-[0_2px_8px_-4px_rgba(24,18,54,.12)]">
        <div className="text-[10.5px] font-bold tracking-[.4px] text-ink-4 uppercase">Kelas aktif</div>
        <div className="mt-[11px] flex items-center justify-between gap-[12px]">
          <div className="min-w-0">
            <div className="text-[15px] font-extrabold tracking-[-.3px]">{v.activeClassName}</div>
            <div className="mt-[2px] truncate text-[11.5px] font-semibold text-ink-4">{v.activeClassMeta}</div>
          </div>
          <SkSelect
            value={v.adminClass}
            onValueChange={v.onClassChange}
            options={v.classOptions.map((c) => ({ value: c.id, label: c.name }))}
            caretColor="5334E0"
            caretInset="15px"
            className="mt-0 w-auto flex-none rounded-[14px] border-[rgba(109,74,255,.3)] bg-[#F5F2FF] py-[11px] pr-[40px] pl-[15px] text-[14px] font-extrabold text-brand-strong"
          />
        </div>
        <button
          type="button"
          onClick={v.openActiveClass}
          className="mt-[12px] w-full cursor-pointer rounded-[15px] border-[1.5px] border-[rgba(109,74,255,.25)] bg-[#F5F2FF] p-[13px] text-[12.5px] font-bold text-brand-strong hover:bg-[#EBE5FF]"
        >
          Buka detail kelas
        </button>
      </div>

      <div className="mx-[22px] mt-[12px] grid grid-cols-3 gap-[10px]">
        <div className="rounded-[20px] border border-[rgba(109,74,255,.14)] bg-brand-tint px-[14px] py-[15px]">
          <div className="text-[24px] font-extrabold tracking-[-.7px] text-brand-strong">{v.classStudents}</div>
          <div className="mt-[2px] text-[10.5px] leading-[1.3] font-semibold text-ink-3">
            Siswa
            <br />
            aktif
          </div>
        </div>
        <div className="rounded-[20px] border border-[rgba(250,204,21,.28)] bg-yellow-tint px-[14px] py-[15px]">
          <div className="text-[24px] font-extrabold tracking-[-.7px] text-yellow-ink">{v.classSubjectCount}</div>
          <div className="mt-[2px] text-[10.5px] leading-[1.3] font-semibold text-ink-3">
            Mata
            <br />
            pelajaran
          </div>
        </div>
        <div className="rounded-[20px] border border-[rgba(16,185,129,.16)] bg-green-tint px-[14px] py-[15px]">
          <div className="text-[24px] font-extrabold tracking-[-.7px] text-green-ink">{v.classTeacherCount}</div>
          <div className="mt-[2px] text-[10.5px] leading-[1.3] font-semibold text-ink-3">
            Guru
            <br />
            mengajar
          </div>
        </div>
      </div>

      <div className="mx-[22px] mt-[24px] text-[15.5px] font-extrabold tracking-[-.3px]">Kelola konten</div>
      <div className="mx-[22px] mt-[12px] flex flex-col gap-[9px]">
        {v.adminActions.map((a) => (
          <div
            key={a.label}
            onClick={a.open}
            className="flex cursor-pointer items-center gap-[13px] rounded-[19px] border border-line-06 bg-white p-[15px] shadow-[0_2px_8px_-5px_rgba(24,18,54,.14)] hover:border-[rgba(109,74,255,.35)]"
          >
            <div
              className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[13px] text-[14px] font-extrabold"
              style={{ background: a.color, color: a.onColor }}
            >
              {a.abbr}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-bold">{a.label}</div>
              <div className="text-[11.5px] font-medium text-ink-5">{a.meta}</div>
            </div>
            <span className="block h-[7px] w-[7px] rotate-45 border-t-2 border-r-2 border-[#C2BFD0]" />
          </div>
        ))}
      </div>

      <div className="mx-[22px] mt-[24px] text-[15.5px] font-extrabold tracking-[-.3px]">Aktivitas terbaru</div>
      <div className="mx-[22px] mt-[12px] rounded-[20px] border border-line-06 bg-white px-[16px] py-[6px]">
        {v.activity.map((a) => (
          <div key={a.text} className="flex gap-[12px] border-b border-line-06 py-[13px]">
            <div className="mt-[6px] h-[7px] w-[7px] flex-none rounded-full" style={{ background: a.color }} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] leading-[1.45] font-semibold text-pretty">{a.text}</div>
              <div className="mt-[2px] text-[11px] font-medium text-ink-5">{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ---------- Kelola mata pelajaran ---------- */

export function AdminListScreen({ v }) {
  return (
    <Screen className="bg-app pt-[56px] pb-[104px]">
      <DetailHeader onBack={v.goAdminHome} label="Kelola Mata Pelajaran" />
      <div className="mx-[22px] mt-[20px] flex items-center justify-between gap-[12px]">
        <div>
          <div className="text-[22px] font-extrabold tracking-[-.7px]">Mata pelajaran</div>
          <div className="mt-[2px] text-[12px] font-semibold text-ink-5">{v.subjectRegistryLabel}</div>
        </div>
        <button
          type="button"
          onClick={v.goAddForm}
          className="flex-none cursor-pointer rounded-[15px] border-0 bg-brand px-[15px] py-[12px] text-[13px] font-bold text-white shadow-[0_12px_24px_-14px_rgba(109,74,255,.9)] hover:bg-brand-strong"
        >
          + Tambah
        </button>
      </div>
      <div className="mx-[22px] mt-[16px] flex flex-col gap-[9px]">
        {v.adminSubjectList.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-[12px] rounded-[19px] border border-line-06 bg-white p-[14px]"
          >
            <div
              className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[13px] text-[13px] font-extrabold"
              style={{ background: s.color, color: s.onColor }}
            >
              {s.abbr}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-bold">{s.name}</div>
              <div className="truncate text-[11.5px] font-medium text-ink-5">{s.slotLabel}</div>
            </div>
            <div className="flex flex-none gap-[6px]">
              <button
                type="button"
                onClick={s.edit}
                className="cursor-pointer rounded-[12px] border-[1.5px] border-[rgba(109,74,255,.25)] bg-[#F5F2FF] p-[12px] text-[11.5px] font-bold whitespace-nowrap text-brand-strong hover:bg-[#EBE5FF]"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={s.remove}
                title="Hapus mata pelajaran"
                className="h-[44px] w-[44px] cursor-pointer rounded-[12px] border-[1.5px] border-[rgba(217,52,56,.22)] bg-[#FFF1F0] text-[12px] font-bold text-[#D93438] hover:bg-[#FFE4E3]"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ---------- Form mata pelajaran ---------- */

export function AdminFormScreen({ v }) {
  return (
    <Screen className="flex flex-col bg-white pt-[56px]">
      <DetailHeader onBack={v.goAdminList} label={v.formMode} />
      <div className="mx-[22px] mt-[20px] text-[24px] font-extrabold tracking-[-.8px]">{v.formTitle}</div>
      <div className="mx-[22px] mt-[6px] text-[12.5px] font-semibold text-ink-5">
        Pengajar &amp; jadwal diatur di Kelola Guru dan Kelola Jadwal.
      </div>

      <div className="mx-[22px] mt-[20px] flex flex-col gap-[16px]">
        <label className="block">
          <FieldLabel>Nama mata pelajaran</FieldLabel>
          <SkInput value={v.form.name} onChange={v.onFormName} placeholder="mis. Fisika" />
        </label>
        <div>
          <FieldLabel>Warna kategori</FieldLabel>
          <div className="mt-[8px] flex gap-[9px]">
            {v.colorChoices.map((c) => (
              <button
                key={c.color}
                type="button"
                onClick={c.pick}
                className="h-[38px] w-[38px] cursor-pointer rounded-[13px] border-[3px]"
                style={{ background: c.color, borderColor: c.ring }}
              />
            ))}
          </div>
          <div className="mt-[10px] text-[11.5px] leading-[1.5] font-medium text-ink-5">
            Warna ini dipakai untuk badge tugas, blok jadwal, dan daftar materi di sisi siswa.
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 mt-auto flex gap-[10px] bg-[linear-gradient(180deg,rgba(255,255,255,0),#fff_30%)] px-[22px] pt-[14px] pb-[26px]">
        <button
          type="button"
          onClick={v.goAdminList}
          className="flex-none cursor-pointer rounded-[17px] border-[1.5px] border-line-10 bg-white px-[20px] py-[16px] text-[14.5px] font-bold text-ink"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={v.saveForm}
          className="flex-1 cursor-pointer rounded-[17px] border-0 bg-brand py-[16px] text-[14.5px] font-bold text-white shadow-[0_14px_26px_-14px_rgba(109,74,255,.9)] hover:bg-brand-strong"
        >
          Simpan
        </button>
      </div>
    </Screen>
  );
}

/* ---------- Kelola jadwal ---------- */

export function AdminScheduleScreen({ v }) {
  return (
    <Screen className="bg-app pt-[56px] pb-[104px]">
      <DetailHeader onBack={v.goAdminHome} label="Panel TU" />
      <div className="mx-[22px] mt-[20px]">
        <div className="text-[24px] font-extrabold tracking-[-.8px]">Jadwal Kelas</div>
        <div className="mt-[3px] text-[12.5px] font-semibold text-ink-5">
          Semester Ganjil 2026/2027 · pilih kelas yang mau diatur
        </div>
      </div>
      <label className="mx-[22px] mt-[14px] block">
        <FieldLabel>Kelas</FieldLabel>
        <SkSelect
          value={v.adminClass}
          onValueChange={v.onScheduleClass}
          options={v.scheduleClassOptions.map((o) => ({ value: o.id, label: o.name }))}
          className="bg-white text-[14.5px] font-bold"
        />
      </label>
      <div className="mx-[22px] mt-[8px] text-[11px] font-semibold text-ink-5">{v.scheduleRoomNote}</div>
      <div className="mx-[22px] mt-[14px] flex items-center justify-between gap-[12px]">
        <div className="text-[11.5px] font-bold text-ink-5">{v.slotCountLabel}</div>
        <button type="button" onClick={v.addSlot} className={PRIMARY_PILL}>
          + Tambah jadwal
        </button>
      </div>

      <div className="mx-[22px] mt-[16px] flex flex-col gap-[10px]">
        {v.scheduleGroups.map((g) => (
          <div key={g.day} className="overflow-hidden rounded-[20px] border border-line-06 bg-white">
            <div
              onClick={g.toggle}
              className="flex cursor-pointer items-center gap-[10px] px-[16px] py-[15px] hover:bg-[#FAF9FE]"
            >
              <div className="flex-1 text-[14.5px] font-extrabold tracking-[-.2px]">{g.day}</div>
              <div className="rounded-[99px] bg-line-05 px-[9px] py-[4px] text-[11px] font-bold text-ink-5">
                {g.countLabel}
              </div>
              {g.isOpen ? (
                <span className="block h-[8px] w-[8px] border-b-2 border-l-2 border-ink-5 [transform:rotate(135deg)_translate(-2px,2px)]" />
              ) : (
                <span className="block h-[8px] w-[8px] rotate-[-45deg] border-b-2 border-l-2 border-ink-5" />
              )}
            </div>
            {g.isOpen && (
              <div className="flex flex-col gap-[8px] px-[12px] pb-[12px]">
                {g.items.map((i) => (
                  <div
                    key={i.name + i.time}
                    className="flex items-center gap-[11px] rounded-[16px] p-[12px]"
                    style={{ background: i.tint }}
                  >
                    <div className="w-[3px] flex-none self-stretch rounded-[99px]" style={{ background: i.color }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-bold" style={{ color: i.ink }}>
                        {i.name}
                      </div>
                      <div className="mt-[2px] text-[11.5px] font-semibold text-ink-3">
                        {i.time} · di {i.room}
                      </div>
                      <div className="text-[11px] font-medium text-ink-4">Guru: {i.teacher}</div>
                    </div>
                    <button
                      type="button"
                      onClick={i.edit}
                      className="flex-none cursor-pointer rounded-[11px] border-[1.5px] border-line-10 bg-white/85 px-[11px] py-[8px] text-[11px] font-bold text-ink hover:border-brand hover:text-brand-strong"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ---------- Materi & file ---------- */

export function AdminMaterialsScreen({ v }) {
  return (
    <Screen className="bg-app pt-[56px] pb-[104px]">
      <DetailHeader onBack={v.goAdminHome} label={v.adminBackLabel} />
      <div className="mx-[22px] mt-[20px] flex items-end justify-between gap-[12px]">
        <div>
          <div className="text-[24px] font-extrabold tracking-[-.8px]">Materi &amp; File</div>
          <div className="mt-[3px] text-[12.5px] font-semibold text-ink-5">
            {v.materialOwnerLabel} · {v.storageLabel}
          </div>
        </div>
        <button type="button" onClick={v.openUpload} className={PRIMARY_PILL}>
          + Upload
        </button>
      </div>

      {v.showMaterialFilter && (
        <div className="sk-scroll mt-[16px] flex gap-[8px] overflow-x-auto px-[22px] pb-[2px]">
          {v.materialFilters.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={f.pick}
              className="flex-none cursor-pointer rounded-[99px] border-[1.5px] px-[14px] py-[9px] text-[12.5px] font-bold whitespace-nowrap"
              style={{ borderColor: f.border, background: f.bg, color: f.ink }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="mx-[22px] mt-[16px] flex flex-col gap-[9px]">
        {v.materialList.map((m) => (
          <div key={m.id} className="flex items-center gap-[11px] rounded-[19px] border border-line-06 bg-white p-[13px]">
            <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[13px] bg-brand-tint text-[9.5px] font-extrabold text-brand">
              {m.ext}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold">{m.name}</div>
              <div className="mt-[4px] flex items-center gap-[7px]">
                <span
                  className="rounded-[99px] px-[7px] py-[3px] text-[10px] font-bold whitespace-nowrap"
                  style={{ background: m.tint, color: m.ink }}
                >
                  {m.subject}
                </span>
                <span className="text-[10.5px] font-semibold whitespace-nowrap text-ink-5">{m.meta}</span>
              </div>
            </div>
            <div className="flex flex-none gap-[6px]">
              <button
                type="button"
                onClick={m.open}
                title="Lihat file"
                className="flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-[11px] border-[1.5px] border-line-09 bg-white text-ink-3 hover:border-brand hover:text-brand-strong"
              >
                <NavIcon name="eye" />
              </button>
              <button
                type="button"
                onClick={m.remove}
                title="Hapus file"
                className="flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-[11px] border-[1.5px] border-[rgba(217,52,56,.22)] bg-[#FFF1F0] text-[#D93438] hover:bg-[#FFE4E3]"
              >
                <NavIcon name="trash" />
              </button>
            </div>
          </div>
        ))}
        {v.materialEmpty && (
          <EmptyCard title="Belum ada materi" body="Upload file pertama untuk mata pelajaran ini." />
        )}
      </div>
    </Screen>
  );
}

/* ---------- Kelola tugas ---------- */

export function AdminTasksScreen({ v }) {
  return (
    <Screen className="bg-app pt-[56px] pb-[104px]">
      <DetailHeader onBack={v.goAdminHome} label="Kelola Tugas" />

      {v.isGuru && (
        <div className="sk-scroll mt-[18px] flex gap-[8px] overflow-x-auto px-[22px] pb-[2px]">
          {v.guruClassChips.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={c.pick}
              className="flex-none cursor-pointer rounded-[99px] border-[1.5px] px-[14px] py-[9px] text-[12.5px] font-bold whitespace-nowrap"
              style={{ borderColor: c.border, background: c.bg, color: c.ink }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      <div className="mx-[22px] mt-[16px] flex items-end justify-between gap-[12px]">
        <div>
          <div className="text-[23px] font-extrabold tracking-[-.8px]">Tugas — {v.className}</div>
          <div className="mt-[3px] text-[12.5px] font-semibold text-ink-5">{v.adminTaskCountLabel}</div>
        </div>
        <button type="button" onClick={v.goTaskForm} className={PRIMARY_PILL}>
          + Tugas baru
        </button>
      </div>

      <div className="mx-[22px] mt-[16px] flex flex-col gap-[10px]">
        {v.adminTaskList.map((t) => (
          <div key={t.id} className="rounded-[20px] border border-line-06 bg-white p-[15px]">
            <div className="flex flex-wrap items-center gap-[6px]">
              <span
                className="rounded-[99px] px-[8px] py-[3px] text-[10.5px] font-bold whitespace-nowrap"
                style={{ background: t.tint, color: t.ink }}
              >
                {t.subject}
              </span>
              <span className="rounded-[99px] bg-fill-055 px-[8px] py-[3px] text-[10.5px] font-bold whitespace-nowrap text-ink-3">
                {t.kind}
              </span>
              <span className="rounded-[99px] bg-yellow-tint-2 px-[8px] py-[3px] text-[10.5px] font-bold whitespace-nowrap text-yellow-ink">
                Bobot {t.weight}
              </span>
            </div>
            <div className="mt-[9px] text-[14.5px] leading-[1.35] font-bold text-pretty">{t.title}</div>
            <div className="mt-[4px] text-[11.5px] font-semibold text-ink-5">Deadline {t.deadline}</div>
            <div className="mt-[12px] flex items-center gap-[10px]">
              <div className="h-[6px] flex-1 overflow-hidden rounded-[99px] bg-[#F0EEF7]">
                <div className="h-[6px] rounded-[99px]" style={{ background: t.barColor, width: t.barWidth }} />
              </div>
              <div className="flex-none text-[11px] font-bold whitespace-nowrap text-ink-3">{t.submitLabel}</div>
            </div>
            <div className="mt-[13px] flex gap-[8px] border-t border-line-06 pt-[12px]">
              <button
                type="button"
                onClick={t.openSubs}
                className="flex-1 cursor-pointer rounded-[13px] border-0 bg-[#F5F2FF] p-[10px] text-[12px] font-bold whitespace-nowrap text-brand-strong hover:bg-[#EBE5FF]"
              >
                Lihat pengumpulan
              </button>
              <button
                type="button"
                onClick={t.edit}
                className="flex-none cursor-pointer rounded-[13px] border-[1.5px] border-[rgba(20,18,31,.12)] bg-white px-[13px] py-[10px] text-[12px] font-bold whitespace-nowrap text-ink hover:border-brand hover:text-brand-strong"
              >
                Ubah tugas
              </button>
              <button
                type="button"
                onClick={t.remove}
                className="flex-none cursor-pointer rounded-[13px] border-[1.5px] border-[rgba(217,52,56,.22)] bg-[#FFF1F0] px-[14px] py-[10px] text-[12px] font-bold whitespace-nowrap text-[#D93438] hover:bg-[#FFE4E3]"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
        {v.adminTasksEmpty && (
          <EmptyCard title="Belum ada tugas" body="Kelas ini belum punya tugas aktif. Buat yang pertama.">
            <button
              type="button"
              onClick={v.goTaskForm}
              className="mt-[16px] cursor-pointer rounded-[14px] border-0 bg-brand px-[18px] py-[11px] text-[12.5px] font-bold text-white"
            >
              + Tugas baru
            </button>
          </EmptyCard>
        )}
      </div>
    </Screen>
  );
}
