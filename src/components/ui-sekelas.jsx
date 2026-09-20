"use client";

import { createContext, useContext, useRef } from "react";

import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";

/**
 * shadcn/ui primitives re-skinned to the Sekelas design.
 * Behaviour comes from shadcn (Radix); every visual value — padding, radius,
 * border width, colour, font size — comes from the design file.
 */

/** Sheets and dialogs portal into the phone frame, not the viewport. */
export const PhoneContainer = createContext(null);
export const usePhoneContainer = () => useContext(PhoneContainer);

/* The caret the design paints into every select, as a background image. */
const caretUrl = (hex) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1.6 1.6 6 6l4.4-4.4' stroke='%23${hex}' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

export function FieldLabel({ children, className }) {
  return <span className={cn("text-[11.5px] font-bold text-ink-4", className)}>{children}</span>;
}

/** Text input as styled inside sheets: 16px radius, 1.5px hairline, #FBFAFE fill. */
export function SkInput({ className, ...props }) {
  return (
    <Input
      className={cn(
        "mt-[6px] h-auto w-full rounded-[16px] border-[1.5px] border-line-09 bg-[#FBFAFE] px-[16px] py-[14px] text-[14px] font-semibold text-ink shadow-none outline-none transition-colors md:text-[14px]",
        "placeholder:font-semibold placeholder:text-ink-7",
        "focus-visible:border-brand focus-visible:bg-white focus-visible:ring-0",
        className,
      )}
      {...props}
    />
  );
}

export function SkTextarea({ className, ...props }) {
  return (
    <Textarea
      className={cn(
        "mt-[6px] w-full resize-none rounded-[16px] border-[1.5px] border-line-09 bg-[#FBFAFE] px-[16px] py-[14px] text-[13.5px] leading-[1.55] font-medium text-ink shadow-none outline-none transition-colors md:text-[13.5px]",
        "placeholder:font-medium placeholder:text-ink-7",
        "focus-visible:border-brand focus-visible:bg-white focus-visible:ring-0",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Select built on Radix so it works on touch and with the keyboard, painted to
 * look exactly like the design's native `<select>` (caret included).
 */
export function SkSelect({
  value,
  onValueChange,
  options,
  className,
  placeholder,
  caretColor = "6B6880",
  caretInset = "16px",
}) {
  const container = usePhoneContainer();
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn(
          "mt-[6px] flex h-auto w-full items-center justify-start rounded-[16px] border-[1.5px] border-line-09 bg-[#FBFAFE] py-[14px] pr-[42px] pl-[15px] text-[14px] font-semibold text-ink shadow-none outline-none",
          "cursor-pointer bg-[length:12px_8px] bg-no-repeat",
          "focus-visible:border-brand focus-visible:ring-0 data-placeholder:text-ink-7 [&_svg]:hidden",
          className,
        )}
        style={{ backgroundImage: caretUrl(caretColor), backgroundPosition: `right ${caretInset} center` }}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        className="max-h-[260px] rounded-[16px] border-[1.5px] border-line-09 bg-white p-[6px] shadow-[0_18px_44px_-18px_rgba(16,12,32,.4)] ring-0"
        container={container ?? undefined}
      >
        {options.map((o) => (
          <SelectItem
            key={o.value}
            value={o.value}
            className="rounded-[11px] px-[12px] py-[10px] text-[13.5px] font-semibold text-ink focus:bg-brand-tint focus:text-brand-strong"
          >
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * The bottom sheet: rounded 30/30/44/44, white, rises over a blurred scrim,
 * anchored to the bottom of the phone frame.
 */
export function BottomSheet({ open, onOpenChange, title, description, children }) {
  const container = usePhoneContainer();
  const content = useRef(null);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={content}
        side="bottom"
        container={container ?? undefined}
        showCloseButton={false}
        /* Radix memindahkan fokus ke kontrol pertama saat sheet terbuka; desain
           tidak melakukannya, jadi kolom pertama di setiap sheet akan tampil
           dalam keadaan `:focus` — border ungu, latar putih — padahal desain
           menggambarnya netral. Fokusnya dipindah ke panel sheet: jebakan fokus
           dan pembacaan judul oleh screen reader tetap utuh, tapi tidak ada
           kolom yang menyala, dan di ponsel papan ketik tidak ikut muncul. */
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          content.current?.focus({ preventScroll: true });
        }}
        overlayClassName="absolute inset-0 z-[70] bg-[rgba(16,12,32,.42)] backdrop-blur-[2px] supports-backdrop-filter:backdrop-blur-[2px]"
        className={cn(
          "sk-scroll absolute inset-x-0 bottom-0 z-[70] block h-auto max-h-[78%] gap-0 overflow-y-auto",
          // `outline-none` karena panel inilah yang menerima fokus saat sheet
          // terbuka, dan tanpa ini Chromium menggambar cincin fokus bawaannya
          // di sekeliling panel. shadcn sudah memasangnya di `dialog`, tapi
          // tidak di `sheet`.
          "rounded-t-[30px] rounded-b-[44px] border-0 bg-white px-[22px] pt-[10px] pb-[26px] outline-none",
          "text-ink shadow-[0_-18px_44px_-18px_rgba(16,12,32,.4)]",
        )}
      >
        <div className="mx-auto mb-[16px] h-[5px] w-[44px] rounded-[99px] bg-[rgba(20,18,31,.12)]" />
        {/* Radix requires a title/description for screen readers; the design
            draws its own heading, so these stay visually hidden. */}
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <SheetDescription className="sr-only">{description || title}</SheetDescription>
        {children}
      </SheetContent>
    </Sheet>
  );
}

/** Sheet footer pair: ghost "Batal" + solid primary action. */
export function SheetActions({ onCancel, cancelLabel = "Batal", onConfirm, confirmLabel, className }) {
  return (
    <div className={cn("flex gap-[10px]", className)}>
      <button
        type="button"
        onClick={onCancel}
        className="flex-none cursor-pointer rounded-[17px] border-[1.5px] border-line-10 bg-white px-[20px] py-[16px] text-[14.5px] font-bold text-ink"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="flex-1 cursor-pointer rounded-[17px] border-0 bg-brand py-[16px] text-[14.5px] font-bold text-white shadow-[0_14px_26px_-14px_rgba(109,74,255,.9)] hover:bg-brand-strong"
      >
        {confirmLabel}
      </button>
    </div>
  );
}

export function SheetHeading({ title, subtitle, subtitleClassName }) {
  return (
    <>
      <div className="text-[19px] font-extrabold tracking-[-.5px]">{title}</div>
      <div className={cn("mt-[3px] text-[12px] font-semibold text-ink-5", subtitleClassName)}>
        {subtitle}
      </div>
    </>
  );
}
