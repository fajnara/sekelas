"use client";

import { SkInput, SkTextarea } from "@/components/ui-sekelas";
import { cn } from "cn";

/* ---------- small pieces the design repeats across screens ---------- */

export function Screen({ className, children }) {
  return <div className={cn("sk-scroll absolute inset-0", className)}>{children}</div>;
}

/** 9×9 chevron drawn with two borders, exactly as the design does it. */
export function Caret({ className }) {
  return <span className={cn("block h-[9px] w-[9px] rotate-45 border-b-2 border-l-2 border-ink", className)} />;
}

export function BackButton({ onClick, className, size = 38 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ width: size, height: size }}
      className={cn(
        "flex cursor-pointer items-center justify-center rounded-[13px] border-[1.5px] border-line-08 bg-white hover:border-brand",
        className,
      )}
    >
      <Caret />
    </button>
  );
}

/** Header row used by the detail screens: back button, centred label, spacer. */
export function DetailHeader({ onBack, label, size = 38, labelClassName, radius = "rounded-[13px]" }) {
  return (
    <div className="flex items-center justify-between px-[22px]">
      <BackButton onClick={onBack} size={size} className={radius} />
      <div className={cn("text-[12.5px] font-bold text-ink-5", labelClassName)}>{label}</div>
      <div style={{ width: size }} />
    </div>
  );
}

/* ---------- 01 · Login ---------- */

export function LoginScreen({ v }) {
  return (
    <Screen className="bg-[linear-gradient(180deg,#F3F0FF_0%,#F7F6FB_46%)] px-[28px] pt-[96px] pb-[40px]">
      <div className="flex items-center gap-[10px]">
        <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[13px] bg-brand text-[19px] font-extrabold text-white">
          S
        </div>
        <div className="text-[26px] font-extrabold tracking-[-.6px]">Sekelas</div>
      </div>
      <div className="mt-[26px] text-[30px] leading-[1.16] font-extrabold tracking-[-1px] text-pretty">
        Tugas kelas,
        <br />
        tanpa drama.
      </div>
      <div className="mt-[10px] text-[14px] leading-[1.55] text-ink-4">
        Satu tempat buat tugas, jadwal, dan materi kelasmu.
      </div>

      <div className="mt-[28px] text-[12px] font-bold tracking-[.4px] text-ink-4 uppercase">Masuk sebagai</div>
      <div className="mt-[10px] grid grid-cols-3 gap-[10px]">
        {v.roleCards.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={r.pick}
            className="cursor-pointer rounded-[18px] border-[1.5px] px-[12px] py-[14px] text-left"
            style={{ borderColor: r.border, background: r.bg, color: r.ink, boxShadow: r.shadow }}
          >
            <div className="h-[24px] w-[24px] rounded-[8px]" style={{ background: r.dotBg }} />
            <div className="mt-[12px] text-[14.5px] font-bold">{r.label}</div>
            <div className="mt-[2px] text-[10.5px] leading-[1.3] font-semibold" style={{ color: r.metaInk }}>
              {r.meta}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-[22px] flex flex-col gap-[12px]">
        <label className="block">
          <span className="text-[11.5px] font-bold text-ink-4">{v.loginEmailLabel}</span>
          <SkInput
            value={v.loginEmail}
            onChange={v.onLoginEmail}
            placeholder="nama@sekolah.sch.id"
            className="bg-white font-normal md:text-[14px]"
          />
        </label>
        <label className="block">
          <span className="text-[11.5px] font-bold text-ink-4">Password</span>
          <SkInput
            type="password"
            value={v.loginPass}
            onChange={v.onLoginPass}
            placeholder="••••••••"
            className="bg-white font-normal md:text-[14px]"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={v.doLogin}
        className="mt-[20px] w-full cursor-pointer rounded-[18px] border-0 bg-ink p-[17px] text-[15px] font-bold text-white hover:bg-brand"
      >
        Masuk
      </button>
      <div className="mt-[14px] text-center text-[12px] text-ink-5">
        Lupa password?{" "}
        <a href="#reset" className="text-brand hover:text-brand-strong">
          Reset di sini
        </a>
      </div>
    </Screen>
  );
}

/* ---------- 02 · Home ---------- */

export function HomeScreen({ v }) {
  return (
    <Screen className="pt-[60px] pb-[104px]">
      <div className="px-[22px]">
        <div className="flex items-start justify-between gap-[12px]">
          <div>
            <div className="text-[12.5px] font-semibold text-ink-5">Senin, 7 September</div>
            <div className="mt-[3px] text-[25px] font-extrabold tracking-[-.8px]">Hai, {v.firstName} 👋</div>
          </div>
          <div className="flex flex-none items-center gap-[9px]">
            <button
              type="button"
              onClick={v.goNotifs}
              title="Notifikasi"
              className="relative flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-[15px] border-[1.5px] border-line-08 bg-white"
            >
              <svg
                viewBox="0 0 24 24"
                width="19"
                height="19"
                fill="none"
                stroke="#14121F"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3.6a5.4 5.4 0 0 0-5.4 5.4c0 4.2-1.6 5.6-1.6 5.6h14s-1.6-1.4-1.6-5.6A5.4 5.4 0 0 0 12 3.6z" />
                <path d="M10.2 18a2 2 0 0 0 3.6 0" />
              </svg>
              <span
                className="absolute top-[9px] right-[10px] h-[8px] w-[8px] rounded-full border-2 border-white"
                style={{ background: v.notifDot }}
              />
            </button>
            <button
              type="button"
              onClick={v.goProfile}
              className="h-[44px] w-[44px] cursor-pointer rounded-[15px] border-[1.5px] border-line-08 bg-white text-[15px] font-extrabold text-brand"
            >
              {v.initials}
            </button>
          </div>
        </div>
      </div>

      <div className="relative mx-[22px] mt-[18px] overflow-hidden rounded-[26px] bg-brand p-[20px] text-white shadow-[0_18px_34px_-18px_rgba(109,74,255,.95)]">
        <div className="absolute -top-[40px] -right-[40px] h-[150px] w-[150px] rounded-full bg-white/10" />
        <div className="relative flex items-center gap-[18px]">
          <div className="relative h-[78px] w-[78px] flex-none">
            <svg viewBox="0 0 78 78" className="h-[78px] w-[78px] -rotate-90">
              <circle cx="39" cy="39" r="33" fill="none" stroke="rgba(255,255,255,.24)" strokeWidth="9" />
              <circle
                cx="39"
                cy="39"
                r="33"
                fill="none"
                stroke="#C8F169"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={v.ringDash}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[17px] font-extrabold">
              {v.todayPct}%
            </div>
          </div>
          <div>
            <div className="text-[12px] font-bold tracking-[.3px] uppercase opacity-75">Progress hari ini</div>
            <div className="mt-[5px] text-[17px] leading-[1.35] font-bold text-pretty">
              {v.doneToday} dari {v.totalToday} tugas selesai
            </div>
            <div className="mt-[9px] inline-flex items-center gap-[6px] rounded-[99px] bg-white/[.18] px-[10px] py-[5px] text-[11.5px] font-bold">
              🔥 {v.streak} hari tanpa telat
            </div>
          </div>
        </div>
      </div>

      <div className="mx-[22px] mt-[14px] grid grid-cols-3 gap-[10px]">
        <div className="rounded-[18px] border border-line-05 bg-white p-[14px]">
          <div className="text-[21px] font-extrabold tracking-[-.5px]">{v.dueSoonCount}</div>
          <div className="mt-[1px] text-[10.5px] leading-[1.3] font-semibold text-ink-5">
            Deadline
            <br />
            dekat
          </div>
        </div>
        <div className="rounded-[18px] border border-line-05 bg-white p-[14px]">
          <div className="text-[21px] font-extrabold tracking-[-.5px] text-green-solid">{v.doneCount}</div>
          <div className="mt-[1px] text-[10.5px] leading-[1.3] font-semibold text-ink-5">
            Tugas
            <br />
            selesai
          </div>
        </div>
        <div className="rounded-[18px] border border-line-05 bg-white p-[14px]">
          <div className="text-[21px] font-extrabold tracking-[-.5px]">{v.subjectCount}</div>
          <div className="mt-[1px] text-[10.5px] leading-[1.3] font-semibold text-ink-5">
            Mata
            <br />
            pelajaran
          </div>
        </div>
      </div>

      <div className="mx-[22px] mt-[24px] flex items-baseline justify-between">
        <div className="text-[16.5px] font-extrabold tracking-[-.3px]">Tugas terdekat</div>
        <button
          type="button"
          onClick={v.goTasks}
          className="cursor-pointer border-0 bg-transparent p-0 text-[12.5px] font-bold text-brand"
        >
          Lihat semua
        </button>
      </div>
      <div className="mx-[22px] mt-[12px] flex flex-col gap-[10px]">
        {v.upcoming.map((t) => (
          <div
            key={t.id}
            onClick={t.open}
            className="flex cursor-pointer items-start gap-[12px] rounded-[20px] border border-line-05 bg-white p-[14px] hover:border-[rgba(109,74,255,.35)]"
          >
            <div className="w-[4px] flex-none self-stretch rounded-[99px]" style={{ background: t.color }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-[8px]">
                <span
                  className="rounded-[99px] px-[8px] py-[3px] text-[10.5px] font-bold"
                  style={{ background: t.tint, color: t.ink }}
                >
                  {t.subject}
                </span>
                <span
                  className="rounded-[99px] px-[8px] py-[3px] text-[10.5px] font-bold"
                  style={{ background: t.dlBg, color: t.dlInk }}
                >
                  {t.dlLabel}
                </span>
              </div>
              <div className="mt-[7px] text-[14.5px] leading-[1.35] font-bold text-pretty">{t.title}</div>
              <div className="mt-[3px] text-[11.5px] font-medium text-ink-5">{t.due}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-[22px] mt-[24px] text-[16.5px] font-extrabold tracking-[-.3px]">Jadwal hari ini</div>
      <div className="mx-[22px] mt-[12px] flex flex-col gap-[8px]">
        {v.todaySchedule.map((s) => (
          <div
            key={s.time + s.name}
            onClick={s.open}
            className="flex cursor-pointer items-center gap-[12px] rounded-[18px] border border-line-05 bg-white px-[14px] py-[12px] hover:border-[rgba(109,74,255,.35)]"
          >
            <div className="w-[46px] flex-none text-[12px] leading-[1.25] font-extrabold text-ink-4">{s.time}</div>
            <div
              className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[12px] text-[13px] font-extrabold"
              style={{ background: s.tint, color: s.ink }}
            >
              {s.abbr}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-bold">{s.name}</div>
              <div className="text-[11px] font-medium text-ink-5">
                {s.room} · {s.teacher}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ---------- 03 · Task list ---------- */

export function TasksScreen({ v }) {
  return (
    <Screen className="pt-[60px] pb-[104px]">
      <div className="px-[22px]">
        <div className="text-[25px] font-extrabold tracking-[-.8px]">Tugas</div>
        <div className="mt-[3px] text-[12.5px] font-semibold text-ink-5">{v.taskCountLabel}</div>
      </div>
      <div className="sk-scroll mt-[16px] flex gap-[8px] overflow-x-auto px-[22px] pb-[2px]">
        {v.statusFilters.map((f) => (
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
      <div className="sk-scroll mt-[8px] flex gap-[8px] overflow-x-auto px-[22px] pb-[2px]">
        {v.subjectFilters.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={f.pick}
            className="flex-none cursor-pointer rounded-[99px] border-0 px-[13px] py-[8px] text-[12px] font-bold whitespace-nowrap"
            style={{ background: f.bg, color: f.ink }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mx-[22px] mt-[16px] flex flex-col gap-[10px]">
        {v.filteredTasks.map((t) => (
          <div
            key={t.id}
            onClick={t.open}
            className="flex cursor-pointer items-stretch gap-[12px] rounded-[20px] border border-line-05 bg-white p-[14px] hover:border-[rgba(109,74,255,.35)]"
          >
            <div className="w-[4px] flex-none rounded-[99px]" style={{ background: t.color }} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-[6px]">
                <span
                  className="rounded-[99px] px-[8px] py-[3px] text-[10.5px] font-bold whitespace-nowrap"
                  style={{ background: t.tint, color: t.ink }}
                >
                  {t.subject}
                </span>
                <span
                  className="rounded-[99px] px-[8px] py-[3px] text-[10.5px] font-bold whitespace-nowrap"
                  style={{ background: t.statusBg, color: t.statusInk }}
                >
                  {t.statusLabel}
                </span>
                <span className="rounded-[99px] bg-fill-055 px-[8px] py-[3px] text-[10.5px] font-bold whitespace-nowrap text-ink-3">
                  {t.kind}
                </span>
              </div>
              <div className="mt-[7px] text-[14.5px] leading-[1.35] font-bold text-pretty">{t.title}</div>
              <div className="mt-[3px] text-[11.5px] font-semibold text-ink-4">{t.due}</div>
            </div>
          </div>
        ))}

        {v.tasksEmpty && (
          <div className="mt-[18px] animate-sk-rise rounded-[24px] border border-dashed border-[rgba(20,18,31,.14)] bg-white px-[24px] py-[34px] text-center">
            <div className="mx-auto flex h-[64px] w-[64px] items-center justify-center rounded-[22px] bg-brand-tint">
              <span className="block h-[11px] w-[20px] border-b-[3px] border-l-[3px] border-brand [transform:rotate(-45deg)_translate(2px,-3px)]" />
            </div>
            <div className="mt-[16px] text-[16px] font-extrabold tracking-[-.3px]">{v.emptyTitle}</div>
            <div className="mt-[6px] text-[12.5px] leading-[1.55] text-ink-5">{v.emptyBody}</div>
            <button
              type="button"
              onClick={v.resetFilters}
              className="mt-[16px] cursor-pointer rounded-[14px] border-0 bg-ink px-[18px] py-[11px] text-[12.5px] font-bold text-white hover:bg-brand"
            >
              Lihat semua tugas
            </button>
          </div>
        )}
      </div>
    </Screen>
  );
}

/* ---------- 04 · Task detail ---------- */

export function TaskDetailScreen({ v }) {
  const t = v.task;
  return (
    <Screen className="flex flex-col bg-white pt-[56px]">
      <DetailHeader onBack={v.goTasks} label="Detail tugas" />
      <div className="mx-[22px] mt-[22px]">
        <div className="flex gap-[8px]">
          <span
            className="rounded-[99px] px-[10px] py-[5px] text-[11px] font-bold"
            style={{ background: t.tint, color: t.ink }}
          >
            {t.subject}
          </span>
          <span
            className="rounded-[99px] px-[10px] py-[5px] text-[11px] font-bold"
            style={{ background: t.dlBg, color: t.dlInk }}
          >
            {t.dlLabel}
          </span>
        </div>
        <div className="mt-[14px] text-[26px] leading-[1.2] font-extrabold tracking-[-.8px] text-pretty">
          {t.title}
        </div>
        <div className="mt-[18px] grid grid-cols-2 gap-[14px] rounded-[20px] bg-app p-[16px]">
          {[
            ["Deadline", t.due],
            ["Pengajar", t.teacher],
            ["Jenis", t.type],
            ["Bobot nilai", t.weight],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="text-[10.5px] font-bold tracking-[.4px] text-ink-5 uppercase">{label}</div>
              <div className="mt-[4px] text-[13.5px] font-bold">{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-[22px] text-[13px] font-extrabold tracking-[-.2px]">Deskripsi</div>
        <div className="mt-[8px] text-[13.5px] leading-[1.65] text-ink-2 text-pretty">{t.desc}</div>
        <div className="mt-[20px] text-[13px] font-extrabold tracking-[-.2px]">Lampiran</div>
        <div className="mt-[10px] flex flex-col gap-[8px]">
          {t.files.map((f) => (
            <div key={f.name} className="flex items-center gap-[11px] rounded-[16px] border border-line-07 p-[12px]">
              <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[11px] bg-brand-tint text-[9.5px] font-extrabold text-brand">
                {f.ext}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold">{f.name}</div>
                <div className="text-[11px] font-medium text-ink-5">{f.size}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 mt-auto bg-[linear-gradient(180deg,rgba(255,255,255,0),#fff_30%)] px-[22px] pt-[16px] pb-[30px]">
        {v.taskIsOpen && (
          <button
            type="button"
            onClick={v.openSubmit}
            className="w-full cursor-pointer rounded-[18px] border-0 bg-brand p-[17px] text-[15px] font-bold text-white shadow-[0_14px_28px_-14px_rgba(109,74,255,.9)] hover:bg-brand-strong"
          >
            Kumpulkan tugas
          </button>
        )}
        {v.taskIsSent && (
          <div className="animate-sk-pop">
            <div className="flex items-center gap-[11px] rounded-[18px] border-[1.5px] border-[rgba(16,185,129,.35)] bg-green-tint px-[16px] py-[14px]">
              <span className="block h-[7px] w-[12px] flex-none border-b-[2.6px] border-l-[2.6px] border-green-ink [transform:rotate(-45deg)_translate(1px,-2px)]" />
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-extrabold text-green-ink">{v.taskSubmitLabel}</div>
                <div className="mt-[2px] truncate text-[11.5px] font-semibold text-[#3C6B58]">{v.taskSubmitMeta}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={v.unsubmit}
              className="mt-[10px] w-full cursor-pointer rounded-[17px] border-[1.5px] border-[rgba(20,18,31,.12)] bg-white p-[15px] text-[14px] font-bold text-ink hover:border-brand hover:text-brand-strong"
            >
              Tarik kembali &amp; kumpulkan ulang
            </button>
          </div>
        )}
        {v.taskIsGraded && (
          <div className="animate-sk-pop rounded-[20px] bg-green-solid p-[16px] text-white">
            <div className="flex items-end gap-[10px]">
              <div className="text-[34px] leading-none font-extrabold tracking-[-1.2px]">{t.grade}</div>
              <div className="pb-[5px] text-[12px] font-bold opacity-85">/ 100 · sudah dinilai</div>
            </div>
            <div className="mt-[9px] text-[12.5px] leading-[1.55] font-semibold text-pretty">{t.feedback}</div>
          </div>
        )}
      </div>
    </Screen>
  );
}

/* ---------- 05 · Subject list ---------- */

export function SubjectsScreen({ v }) {
  return (
    <Screen className="pt-[60px] pb-[104px]">
      <div className="px-[22px]">
        <div className="text-[25px] font-extrabold tracking-[-.8px]">Mata pelajaran</div>
        <div className="mt-[3px] text-[12.5px] font-semibold text-ink-5">{v.semesterLabel}</div>
      </div>
      <div className="mx-[22px] mt-[18px] flex flex-col gap-[12px]">
        {v.subjects.map((s) => (
          <div
            key={s.id}
            onClick={s.open}
            className="cursor-pointer rounded-[22px] border border-line-05 border-l-4 bg-white p-[16px] hover:border-[rgba(109,74,255,.35)]"
            style={{ borderLeftColor: s.color }}
          >
            <div className="flex items-start gap-[12px]">
              <div
                className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[14px] text-[14px] font-extrabold"
                style={{ background: s.color, color: s.onColor }}
              >
                {s.abbr}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-extrabold tracking-[-.3px]">{s.name}</div>
                <div className="mt-[2px] text-[12px] font-semibold text-ink-3">{s.teacher}</div>
              </div>
              <div className="flex-none text-right">
                <div className="text-[11px] font-bold text-ink-3">{s.taskLabel}</div>
              </div>
            </div>
            <div className="mt-[14px] flex flex-wrap gap-[7px]">
              {s.slots.map((sl) => (
                <span
                  key={sl}
                  className="rounded-[99px] bg-app px-[10px] py-[5px] text-[11px] font-bold text-[#3C3853]"
                >
                  {sl}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ---------- 06 · Subject detail ---------- */

export function SubjectDetailScreen({ v }) {
  const s = v.subject;
  return (
    <Screen className="bg-white pb-[104px]">
      <div className="px-[22px] pt-[56px] pb-[22px]" style={{ background: s.tint }}>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={v.goSubjects}
            className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-[13px] border-0 bg-white/80"
          >
            <Caret />
          </button>
          <div className="text-[12.5px] font-bold text-ink-3">Mata pelajaran</div>
          <div className="w-[38px]" />
        </div>
        <div className="mt-[20px] flex items-center gap-[14px]">
          <div
            className="flex h-[54px] w-[54px] flex-none items-center justify-center rounded-[18px] text-[18px] font-extrabold"
            style={{ background: s.color, color: s.onColor }}
          >
            {s.abbr}
          </div>
          <div>
            <div className="text-[23px] leading-[1.15] font-extrabold tracking-[-.7px]">{s.name}</div>
            <div className="mt-[3px] text-[12.5px] font-semibold text-ink-3">
              {s.teacher} · {s.room}
            </div>
          </div>
        </div>
        <div className="mt-[18px] grid grid-cols-3 gap-[9px]">
          {[
            [s.taskOpen, "Tugas aktif"],
            [s.materialCount, "Materi"],
            [s.attendance, "Kehadiran"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-[16px] bg-white/80 p-[12px]">
              <div className="text-[18px] font-extrabold">{value}</div>
              <div className="text-[10.5px] font-semibold text-ink-3">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-[22px]">
        <div className="text-[13px] font-extrabold">Jadwal</div>
        <div className="mt-[10px] flex flex-col gap-[8px]">
          {s.schedule.map((row) => (
            <div
              key={row.day + row.time}
              className="flex items-center justify-between rounded-[16px] bg-app px-[15px] py-[13px]"
            >
              <div className="text-[13.5px] font-bold">{row.day}</div>
              <div className="text-[12.5px] font-semibold text-ink-3">
                {row.time} · {row.room}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-[22px] text-[13px] font-extrabold">Materi &amp; file</div>
        <div className="mt-[10px] flex flex-col gap-[8px]">
          {s.materials.map((m) => (
            <div
              key={m.name}
              onClick={m.open}
              className="flex cursor-pointer items-center gap-[11px] rounded-[16px] border border-line-07 p-[13px] hover:border-[rgba(109,74,255,.35)]"
            >
              <div className="flex h-[36px] w-[36px] flex-none items-center justify-center rounded-[12px] bg-brand-tint text-[9.5px] font-extrabold text-brand">
                {m.ext}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold">{m.name}</div>
                <div className="text-[11px] font-medium text-ink-5">{m.meta}</div>
              </div>
              <div className="flex-none text-[11.5px] font-bold text-brand">Buka</div>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

/* ---------- 07 · Calendar ---------- */

export function CalendarScreen({ v }) {
  return (
    <Screen className="pt-[60px] pb-[104px]">
      <div className="flex items-end justify-between px-[22px]">
        <div>
          <div className="text-[25px] font-extrabold tracking-[-.8px]">Kalender</div>
          <div className="mt-[3px] text-[12.5px] font-semibold text-ink-4">{v.weekLabel}</div>
        </div>
        <div className="flex gap-[7px]">
          <button
            type="button"
            onClick={v.prevWeek}
            title="Minggu sebelumnya"
            className="flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-[14px] border-[1.5px] border-line-08 bg-white hover:border-brand"
          >
            <span className="block h-[8px] w-[8px] rotate-45 border-b-2 border-l-2 border-ink" />
          </button>
          <button
            type="button"
            onClick={v.nextWeek}
            title="Minggu berikutnya"
            className="flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-[14px] border-[1.5px] border-line-08 bg-white hover:border-brand"
          >
            <span className="block h-[8px] w-[8px] rotate-[-135deg] border-b-2 border-l-2 border-ink" />
          </button>
        </div>
      </div>

      <div className="mx-[22px] mt-[18px] grid grid-cols-7 gap-[4px] rounded-[24px] border border-line-05 bg-white px-[10px] py-[14px]">
        {v.week.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={d.pick}
            className="flex cursor-pointer flex-col items-center gap-[5px] rounded-[16px] border-0 pt-[9px] pb-[8px]"
            style={{ background: d.bg, color: d.ink }}
          >
            <span className="text-[10.5px] font-bold opacity-70">{d.dow}</span>
            <span className="text-[15px] font-extrabold">{d.date}</span>
            <span className="h-[5px] w-[5px] rounded-full" style={{ background: d.dot }} />
          </button>
        ))}
      </div>

      <div className="mx-[22px] mt-[22px] text-[16.5px] font-extrabold tracking-[-.3px]">{v.selectedDayLabel}</div>
      <div className="mx-[22px] mt-[12px] flex flex-col gap-[9px]">
        {v.dayItems.map((s) => (
          <div
            key={s.time + s.name}
            onClick={s.open}
            className="flex cursor-pointer items-stretch gap-[12px] rounded-[18px] border border-line-05 bg-white px-[14px] py-[13px] hover:border-[rgba(109,74,255,.35)]"
          >
            <div className="w-[46px] flex-none text-[12px] leading-[1.25] font-extrabold text-ink-4">{s.time}</div>
            <div className="w-[3px] flex-none rounded-[99px]" style={{ background: s.color }} />
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-bold">{s.name}</div>
              <div className="text-[11px] font-medium text-ink-5">
                {s.room} · {s.teacher}
              </div>
            </div>
          </div>
        ))}
        {v.dayEmpty && (
          <div className="animate-sk-rise rounded-[24px] border border-dashed border-[rgba(20,18,31,.14)] bg-white px-[24px] py-[32px] text-center">
            <div className="mx-auto flex h-[58px] w-[58px] items-center justify-center rounded-[20px] bg-yellow-tint text-[22px]">
              ☕
            </div>
            <div className="mt-[14px] text-[15.5px] font-extrabold tracking-[-.3px]">Tidak ada kelas</div>
            <div className="mt-[6px] text-[12.5px] leading-[1.55] text-ink-5">Libur akhir pekan. Nikmati waktumu.</div>
          </div>
        )}
      </div>
    </Screen>
  );
}

/* ---------- 08 · Profile ---------- */

export function ProfileScreen({ v }) {
  return (
    <Screen className="pt-[60px] pb-[104px]">
      <div className="px-[22px] text-[25px] font-extrabold tracking-[-.8px]">Profil</div>
      <div className="mx-[22px] mt-[18px] rounded-[26px] border border-line-05 bg-white p-[22px] text-center">
        <div className="mx-auto flex h-[74px] w-[74px] items-center justify-center rounded-[26px] bg-brand-tint text-[25px] font-extrabold text-brand">
          {v.initials}
        </div>
        <div className="mt-[14px] text-[19px] font-extrabold tracking-[-.4px]">{v.studentName}</div>
        <div className="mt-[3px] text-[12.5px] font-semibold text-ink-5">{v.studentMeta}</div>
        <div className="mt-[14px] flex flex-wrap justify-center gap-[7px]">
          <span className="rounded-[99px] bg-brand-tint px-[11px] py-[6px] text-[11px] font-bold whitespace-nowrap text-brand-strong">
            {v.schoolName}
          </span>
          <span className="rounded-[99px] bg-green-tint px-[11px] py-[6px] text-[11px] font-bold whitespace-nowrap text-green-ink">
            🔥 {v.streak} hari beruntun
          </span>
        </div>
        <div className="mt-[12px] text-[11px] leading-[1.5] font-semibold text-ink-5">
          Hari beruntun = jumlah hari berturut-turut kamu menyelesaikan semua tugas sebelum deadline.
        </div>
      </div>

      <div className="mx-[22px] mt-[14px] grid grid-cols-2 gap-[10px]">
        {[
          [v.doneCount, "Tugas selesai", "text-green-solid"],
          [v.openCount, "Belum dikerjakan", ""],
          [v.subjectCount, "Mata pelajaran", ""],
          [v.attendancePct, "Kehadiran", ""],
        ].map(([value, label, tone]) => (
          <div key={label} className="rounded-[20px] border border-line-05 bg-white p-[16px]">
            <div className={cn("text-[24px] font-extrabold tracking-[-.6px]", tone)}>{value}</div>
            <div className="mt-[2px] text-[11.5px] font-semibold text-ink-5">{label}</div>
          </div>
        ))}
      </div>

      <div className="mx-[22px] mt-[18px] overflow-hidden rounded-[22px] border border-line-05 bg-white">
        {v.profileRows.map((r) => (
          <div
            key={r.label}
            onClick={r.open}
            className="flex cursor-pointer items-center justify-between border-b border-line-05 p-[16px] hover:bg-[#FAF9FE]"
          >
            <div className="text-[13.5px] font-semibold">{r.label}</div>
            <div className="flex items-center gap-[9px]">
              <span className="text-[12px] font-semibold text-ink-4">{r.value}</span>
              <span className="block h-[7px] w-[7px] rotate-45 border-t-2 border-r-2 border-[#C2BFD0]" />
            </div>
          </div>
        ))}
      </div>

      <div className="mx-[22px] mt-[16px]">
        <button
          type="button"
          onClick={v.logout}
          className="w-full cursor-pointer rounded-[18px] border-[1.5px] border-[rgba(255,77,79,.28)] bg-[#FFF1F0] p-[16px] text-[14.5px] font-bold text-[#D93438] hover:bg-[#FFE4E3]"
        >
          Keluar
        </button>
      </div>
    </Screen>
  );
}

/* ---------- v2 · Nilai ---------- */

export function GradesScreen({ v }) {
  const g = v.gradeSummary;
  return (
    <Screen className="bg-app pt-[56px] pb-[104px]">
      <DetailHeader
        onBack={v.goProfile}
        label="Nilai & rapor"
        size={44}
        radius="rounded-[14px]"
        labelClassName="text-ink-4"
      />
      <div className="mx-[22px] mt-[20px] rounded-[26px] bg-ink p-[20px] text-white">
        <div className="text-[11.5px] font-bold tracking-[.4px] uppercase opacity-70">Rata-rata semester</div>
        <div className="mt-[8px] flex items-end gap-[10px]">
          <div className="text-[44px] leading-none font-extrabold tracking-[-1.8px]">{g.average}</div>
          <div className="pb-[7px] text-[12.5px] font-bold opacity-75">/ 100</div>
        </div>
        <div className="mt-[10px] text-[11.5px] leading-[1.5] font-semibold text-pretty opacity-80">{g.note}</div>
      </div>
      <div className="mx-[22px] mt-[20px] text-[15.5px] font-extrabold tracking-[-.3px]">Per mata pelajaran</div>
      <div className="mx-[22px] mt-[12px] flex flex-col gap-[10px]">
        {g.rows.map((r) => (
          <div
            key={r.id}
            className="rounded-[20px] border border-line-05 border-l-4 bg-white p-[16px]"
            style={{ borderLeftColor: r.color }}
          >
            <div className="flex items-center gap-[11px]">
              <div
                className="flex h-[36px] w-[36px] flex-none items-center justify-center rounded-[12px] text-[12.5px] font-extrabold"
                style={{ background: r.tint, color: r.ink }}
              >
                {r.abbr}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-extrabold tracking-[-.2px]">{r.name}</div>
                <div className="mt-[2px] text-[11.5px] font-semibold text-ink-4">{r.count}</div>
              </div>
              <div className="flex-none text-[22px] font-extrabold tracking-[-.6px]" style={{ color: r.avgInk }}>
                {r.avg}
              </div>
            </div>
            <div className="mt-[12px] h-[6px] overflow-hidden rounded-[99px] bg-[#F0EEF7]">
              <div className="h-[6px] rounded-[99px]" style={{ background: r.avgInk, width: r.barWidth }} />
            </div>
            <div className="mt-[12px] flex flex-col gap-[7px]">
              {r.items.map((i) => (
                <div key={i.title} className="flex items-center gap-[10px] rounded-[14px] bg-app px-[13px] py-[11px]">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] leading-[1.35] font-bold text-pretty">{i.title}</div>
                    <div className="mt-[2px] text-[11px] font-semibold text-ink-4">
                      {i.weightLabel} · {i.date}
                    </div>
                  </div>
                  <div className="flex-none text-[14.5px] font-extrabold" style={{ color: i.scoreInk }}>
                    {i.score}
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

/* ---------- v2 · Kelas & wali kelas ---------- */

export function MyClassScreen({ v }) {
  const c = v.myClass;
  return (
    <Screen className="bg-white pt-[56px] pb-[104px]">
      <DetailHeader
        onBack={v.goProfile}
        label="Kelas & wali kelas"
        size={44}
        radius="rounded-[14px]"
        labelClassName="text-ink-4"
      />

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
    </Screen>
  );
}

/* ---------- v2 · Data diri ---------- */

export function MyDataScreen({ v }) {
  const d = v.myData;
  return (
    <Screen className="bg-white pt-[56px] pb-[104px]">
      <DetailHeader
        onBack={v.goProfile}
        label="Data diri"
        size={44}
        radius="rounded-[14px]"
        labelClassName="text-ink-4"
      />

      <div className="mx-[22px] mt-[22px] flex items-center gap-[13px]">
        <div className="flex h-[54px] w-[54px] flex-none items-center justify-center rounded-[19px] bg-brand-tint text-[18px] font-extrabold text-brand">
          {v.initials}
        </div>
        <div className="min-w-0">
          <div className="text-[19px] font-extrabold tracking-[-.5px]">{v.studentName}</div>
          <div className="mt-[2px] text-[12.5px] font-semibold text-ink-5">
            {d.className} · {v.schoolName}
          </div>
        </div>
      </div>

      {/* Baris di sini tidak menuju ke mana pun, jadi sengaja tanpa tanda panah
          dan tanpa gaya "bisa ditekan". */}
      <div className="mx-[22px] mt-[18px] overflow-hidden rounded-[22px] border border-line-05">
        {d.rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-[14px] border-b border-line-05 p-[16px] last:border-b-0"
          >
            <div className="flex-none text-[12.5px] font-semibold text-ink-5">{label}</div>
            <div className="min-w-0 text-right text-[13px] font-bold">{value}</div>
          </div>
        ))}
      </div>

      <div className="mx-[22px] mt-[14px] text-[11.5px] leading-[1.55] font-semibold text-ink-5">
        Data ini dikelola tata usaha sekolah. Ada yang keliru? Sampaikan lewat Bantuan &amp; masukan.
      </div>
    </Screen>
  );
}

/* ---------- v2 · Bantuan & masukan ---------- */

export function HelpScreen({ v }) {
  const h = v.help;
  return (
    <Screen className="bg-white pt-[56px] pb-[104px]">
      <DetailHeader
        onBack={v.goProfile}
        label="Bantuan & masukan"
        size={44}
        radius="rounded-[14px]"
        labelClassName="text-ink-4"
      />

      <div className="mx-[22px] mt-[22px]">
        <div className="text-[24px] font-extrabold tracking-[-.8px]">Butuh bantuan?</div>
        <div className="mt-[4px] text-[12.5px] leading-[1.5] font-semibold text-ink-5">
          Hubungi tata usaha {h.school}, atau kirim masukan lewat formulir di bawah.
        </div>
      </div>

      <div className="mx-[22px] mt-[16px] overflow-hidden rounded-[22px] border border-line-05">
        {h.rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-[14px] border-b border-line-05 p-[16px] last:border-b-0"
          >
            <div className="flex-none text-[12.5px] font-semibold text-ink-5">{label}</div>
            <div className="min-w-0 text-right text-[13px] font-bold">{value}</div>
          </div>
        ))}
      </div>

      <div className="mx-[22px] mt-[20px]">
        <div className="text-[13px] font-extrabold">Kirim masukan</div>
        <SkTextarea rows={4} value={h.note} onChange={v.setHelpNote} placeholder="Tulis kendala atau saranmu di sini…" />
        <button
          type="button"
          onClick={v.sendHelp}
          disabled={!h.canSend}
          className="mt-[10px] w-full cursor-pointer rounded-[18px] bg-brand p-[15px] text-[14px] font-bold text-white shadow-brand hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          Kirim masukan
        </button>
      </div>
    </Screen>
  );
}

/* ---------- v2 · Notifikasi ---------- */

export function NotifsScreen({ v }) {
  return (
    <Screen className="bg-white pt-[56px] pb-[30px]">
      <DetailHeader
        onBack={v.goHome}
        label="Notifikasi"
        size={44}
        radius="rounded-[14px]"
        labelClassName="text-ink-4"
      />
      <div className="mx-[22px] mt-[20px]">
        <div className="text-[24px] font-extrabold tracking-[-.8px]">Pemberitahuan</div>
        <div className="mt-[3px] text-[12.5px] font-semibold text-ink-4">
          Tugas baru, deadline, nilai, dan perubahan jadwal kelasmu
        </div>
      </div>
      <div className="mx-[22px] mt-[18px] flex flex-col gap-[9px]">
        {v.notifItems.map((n) => (
          <div
            key={n.text}
            onClick={n.open}
            className="cursor-pointer rounded-[20px] border border-line-06 p-[15px] hover:border-[rgba(109,74,255,.35)]"
            style={{ background: n.unreadBg }}
          >
            <div className="flex items-center gap-[8px]">
              <span
                className="rounded-[99px] px-[9px] py-[4px] text-[10.5px] font-extrabold whitespace-nowrap"
                style={{ background: n.tint, color: n.ink }}
              >
                {n.kind}
              </span>
              <span className="text-[11px] font-semibold text-ink-4">{n.time}</span>
            </div>
            <div className="mt-[9px] text-[13.5px] leading-[1.5] font-semibold text-pretty">{n.text}</div>
          </div>
        ))}
      </div>
    </Screen>
  );
}
