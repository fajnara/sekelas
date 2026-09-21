"use client";

import { NavIcon } from "@/lib/icons";

/**
 * Phone chrome — 390×844 with the design's exact radius and shadow.
 * `frameRef` receives the frame element so sheets and menus can portal into it
 * instead of the viewport, keeping them clipped to the phone.
 */
export function PhoneFrame({ children, frameRef }) {
  return (
    <div
      ref={frameRef}
      className="sk-phone-frame relative h-[844px] w-[390px] overflow-hidden rounded-[44px] bg-app text-ink shadow-phone"
    >
      {children}
    </div>
  );
}

/**
 * Faux iOS status bar. Non-interactive, sits above every screen.
 *
 * Disembunyikan di ponsel sungguhan lewat `.sk-status-bar` — di sana OS sudah
 * menggambar status bar aslinya. Alasan lengkap ada di `globals.css`.
 */
export function StatusBar() {
  return (
    <div className="sk-status-bar pointer-events-none absolute inset-x-0 top-0 z-40 flex h-[52px] items-end justify-between px-[28px] pb-[8px] text-[12px] font-bold tracking-[.2px]">
      <span>09:41</span>
      <span className="flex items-center gap-[4px]">
        <span className="h-[8px] w-[16px] rounded-[2px] bg-ink opacity-75" />
        <span className="h-[8px] w-[6px] rounded-[2px] bg-ink opacity-35" />
        <span className="h-[9px] w-[20px] rounded-[3px] border-[1.5px] border-[rgba(20,18,31,.55)]" />
      </span>
    </div>
  );
}

export function BottomNav({ v }) {
  if (!v.showNav) return null;
  return (
    <div
      className="sk-bottom-nav absolute inset-x-[14px] bottom-[14px] z-50 grid grid-flow-col auto-cols-fr gap-[2px] rounded-[26px] border p-[9px_8px] shadow-[0_14px_34px_-14px_rgba(24,18,54,.35)] backdrop-blur-[12px]"
      style={{ background: v.navBg, borderColor: v.navBorder }}
    >
      {v.navItems.map((n) => (
        <button
          key={n.label}
          onClick={n.go}
          className="flex cursor-pointer flex-col items-center gap-[4px] rounded-[19px] border-0 px-0 pt-[8px] pb-[7px]"
          style={{ background: n.bg, color: n.ink }}
        >
          <NavIcon name={n.icon} />
          <span className="text-[10px] font-bold tracking-[-.1px]" style={{ color: n.ink }}>
            {n.label}
          </span>
        </button>
      ))}
    </div>
  );
}

export function Toast({ v }) {
  if (!v.toast) return null;
  return (
    <div
      key={v.toast}
      className="absolute inset-x-[22px] bottom-[110px] z-[60] flex items-center gap-[10px] rounded-[17px] bg-ink px-[16px] py-[14px] text-[13px] font-bold text-white shadow-[0_18px_34px_-16px_rgba(0,0,0,.55)]"
      style={{ animation: "skToast 2.4s ease-out" }}
    >
      <span className="block h-[6px] w-[11px] border-b-[2.4px] border-l-[2.4px] border-lime [transform:rotate(-45deg)_translate(1px,-2px)]" />
      {v.toast}
    </div>
  );
}
