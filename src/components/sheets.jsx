"use client";

import { ACCEPT_ATTRIBUTE } from "@/lib/storage/rules";
import {
  BottomSheet,
  FieldLabel,
  SheetActions,
  SheetHeading,
  SkInput,
  SkSelect,
  SkTextarea,
} from "@/components/ui-sekelas";

const FIELD_STACK = "mt-[18px] flex flex-col gap-[13px]";

function SlotSheet({ v }) {
  return (
    <div>
      <SheetHeading
        title={v.sheetTitle}
        subtitle={`${v.sheetSubjectName} · perubahan langsung tampil di app siswa`}
      />
      <div className={FIELD_STACK}>
        {v.slotIsNew && (
          <label className="block">
            <FieldLabel>Mata pelajaran</FieldLabel>
            <SkSelect
              value={v.slotForm.subjectId}
              onValueChange={v.onSlotSubject}
              options={v.subjectOptions.map((o) => ({ value: o.id, label: o.name }))}
            />
          </label>
        )}
        <label className="block">
          <FieldLabel>Hari</FieldLabel>
          <SkSelect
            value={v.slotForm.day}
            onValueChange={v.onSlotDay}
            options={v.dayOptions.slice(0, 5).map((d) => ({ value: d, label: d }))}
          />
        </label>
        <div className="grid grid-cols-2 gap-[10px]">
          <label className="block">
            <FieldLabel>Jam mulai</FieldLabel>
            <SkInput value={v.slotForm.start} onChange={v.onSlotStart} placeholder="07.30" />
          </label>
          <label className="block">
            <FieldLabel>Jam selesai</FieldLabel>
            <SkInput value={v.slotForm.end} onChange={v.onSlotEnd} placeholder="09.00" />
          </label>
        </div>
        <label className="block">
          <FieldLabel>Ruangan</FieldLabel>
          <SkSelect
            value={v.slotForm.room}
            onValueChange={v.onSlotRoom}
            options={v.roomOptions.map((r) => ({ value: r.name, label: r.label }))}
          />
        </label>
      </div>

      {v.hasSlotError && (
        <div className="mt-[14px] animate-sk-rise rounded-[16px] border-[1.5px] border-[rgba(217,52,56,.25)] bg-[#FFF1F0] px-[15px] py-[13px]">
          <div className="text-[12px] font-extrabold text-red-ink">Tidak bisa disimpan</div>
          <div className="mt-[3px] text-[12px] leading-[1.5] font-semibold text-pretty text-[#8A3A38]">
            {v.slotError}
          </div>
        </div>
      )}

      {v.slotIsEdit && (
        <button
          type="button"
          onClick={v.deleteSlot}
          className="mt-[14px] w-full cursor-pointer rounded-[17px] border-[1.5px] border-[rgba(217,52,56,.25)] bg-[#FFF1F0] p-[15px] text-[14px] font-bold text-[#D93438] hover:bg-[#FFE4E3]"
        >
          Hapus slot jadwal ini
        </button>
      )}

      <SheetActions className="mt-[14px]" onCancel={v.closeSheet} onConfirm={v.saveSlot} confirmLabel="Simpan" />
    </div>
  );
}

function ClassSheet({ v }) {
  return (
    <div>
      <SheetHeading title={v.classSheetTitle} subtitle="Perubahan langsung berlaku di seluruh panel." />
      <div className={FIELD_STACK}>
        <label className="block">
          <FieldLabel>Nama kelas</FieldLabel>
          <SkInput value={v.classForm.name} onChange={v.onClassName} placeholder="mis. XI IPA 3" />
        </label>
        <div className="grid grid-cols-2 gap-[10px]">
          <label className="block">
            <FieldLabel>Tingkat</FieldLabel>
            <SkSelect
              value={v.classForm.level}
              onValueChange={v.onClassLevel}
              options={v.levelOptions.map((l) => ({ value: l, label: l }))}
            />
          </label>
          <label className="block">
            <FieldLabel>Jurusan</FieldLabel>
            <SkSelect
              value={v.classForm.major}
              onValueChange={v.onClassMajor}
              options={v.majorOptions.map((m) => ({ value: m, label: m }))}
            />
          </label>
        </div>
        <label className="block">
          <FieldLabel>Wali kelas</FieldLabel>
          <SkSelect
            value={v.classForm.homeroom}
            onValueChange={v.onClassHomeroom}
            options={v.teacherOptions.map((t) => ({ value: t.id, label: t.name }))}
          />
        </label>
      </div>
      <SheetActions className="mt-[20px]" onCancel={v.closeSheet} onConfirm={v.saveClass} confirmLabel="Simpan" />
    </div>
  );
}

function AssignSheet({ v }) {
  return (
    <div>
      <SheetHeading
        title={v.assignSheetTitle}
        subtitle="Satu mata pelajaran bisa ditugaskan ke beberapa kelas."
      />
      <div className={FIELD_STACK}>
        <label className="block">
          <FieldLabel>Guru</FieldLabel>
          <SkSelect
            value={v.assignForm.teacherId}
            onValueChange={v.onAssignTeacher}
            options={v.assignTeacherOptions.map((t) => ({ value: t.id, label: t.name }))}
          />
        </label>
        <label className="block">
          <FieldLabel>Mata pelajaran</FieldLabel>
          <SkSelect
            value={v.assignForm.subjectId}
            onValueChange={v.onAssignSubject}
            options={v.assignSubjectOptions.map((s) => ({ value: s.id, label: s.name }))}
          />
        </label>
        <div>
          <FieldLabel>Kelas (bisa lebih dari satu)</FieldLabel>
          <div className="mt-[8px] flex flex-wrap gap-[8px]">
            {v.assignClassChips.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={c.pick}
                className="cursor-pointer rounded-[99px] border-[1.5px] px-[13px] py-[9px] text-[12px] font-bold whitespace-nowrap"
                style={{ borderColor: c.border, background: c.bg, color: c.ink }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <SheetActions className="mt-[20px]" onCancel={v.closeSheet} onConfirm={v.saveAssign} confirmLabel="Simpan" />
    </div>
  );
}

function UploadSheet({ v }) {
  return (
    <div>
      <SheetHeading title="Upload materi" subtitle="Pilih mata pelajaran dulu, lalu tarik file." />
      <div className="mt-[16px] flex flex-wrap gap-[8px]">
        {v.uploadChips.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={c.pick}
            className="cursor-pointer rounded-[99px] border-[1.5px] px-[13px] py-[9px] text-[12px] font-bold whitespace-nowrap"
            style={{ borderColor: c.border, background: c.bg, color: c.ink }}
          >
            {c.label}
          </button>
        ))}
      </div>
      {/* Dropzone desain jadi `label` dengan input file transparan di dalamnya.
          Kelas-kelasnya persis sama — `div` dan `label block` sama-sama blok —
          jadi tidak ada piksel yang bergeser, tapi seluruh area jadi bisa
          diklik dan bisa dijangkau keyboard. */}
      <label className="relative mt-[16px] block rounded-[20px] border-[1.5px] border-dashed border-[rgba(109,74,255,.3)] bg-[#FAF8FF] px-[22px] py-[30px] text-center">
        <input
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          onChange={v.onPickMaterial}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <div className="text-[13.5px] font-bold text-brand-strong">{v.materialFileLabel}</div>
        <div className="mt-[4px] text-[11.5px] font-medium text-ink-5">
          Galeri, Files, atau Google Drive · PDF, DOCX, PPT · maks 25 MB
        </div>
      </label>
      <SheetActions className="mt-[18px]" onCancel={v.closeSheet} onConfirm={v.doUpload} confirmLabel="Upload" />
    </div>
  );
}

function SubmitSheet({ v }) {
  return (
    <div>
      <SheetHeading title="Kumpulkan tugas" subtitle={v.submitDeadlineNote} subtitleClassName="text-ink-4" />
      <label className="relative mt-[16px] block rounded-[20px] border-[1.5px] border-dashed border-[rgba(109,74,255,.3)] bg-[#FAF8FF] px-[22px] py-[30px] text-center">
        <input
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          onChange={v.onPickSubmission}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <div className="text-[13.5px] font-bold text-brand-strong">{v.submitFileLabel}</div>
        <div className="mt-[4px] text-[11.5px] font-medium text-ink-4">Foto, PDF, atau DOCX · maks 25 MB</div>
      </label>
      <label className="mt-[14px] block">
        <FieldLabel>Catatan untuk guru (opsional)</FieldLabel>
        <SkTextarea
          value={v.submitForm.note}
          onChange={v.onSubmitNote}
          rows={3}
          placeholder="mis. nomor 12 saya kerjakan dengan cara lain"
        />
      </label>
      <SheetActions className="mt-[16px]" onCancel={v.closeSheet} onConfirm={v.doSubmit} confirmLabel="Kirim tugas" />
    </div>
  );
}

function GradeSheet({ v }) {
  return (
    <div>
      <SheetHeading
        title="Beri nilai"
        subtitle={`${v.gradeSheetName} · nilai langsung terlihat siswa`}
        subtitleClassName="text-ink-4"
      />
      <label className="mt-[16px] block">
        <FieldLabel>Nilai (0–100)</FieldLabel>
        <SkInput
          type="number"
          value={v.gradeForm.score}
          onChange={v.onGradeScore}
          min="0"
          max="100"
          placeholder="85"
          className="text-[15px] font-extrabold md:text-[15px]"
        />
      </label>
      <label className="mt-[13px] block">
        <FieldLabel>Catatan untuk siswa</FieldLabel>
        <SkTextarea
          value={v.gradeForm.note}
          onChange={v.onGradeNote}
          rows={3}
          placeholder="mis. analisis sudah tajam, perbaiki format tabel"
        />
      </label>
      <SheetActions className="mt-[16px]" onCancel={v.closeSheet} onConfirm={v.saveGrade} confirmLabel="Simpan nilai" />
    </div>
  );
}

function StudentSheet({ v }) {
  return (
    <div>
      <SheetHeading
        title="Tambah siswa"
        subtitle={`Masuk ke daftar ${v.studentSheetClass}`}
        subtitleClassName="text-ink-4"
      />
      <label className="mt-[16px] block">
        <FieldLabel>Nama lengkap</FieldLabel>
        <SkInput value={v.studentForm.name} onChange={v.onStudentName} placeholder="mis. Nadia Syaputri" />
      </label>
      <label className="mt-[13px] block">
        <FieldLabel>NIS (opsional — dibuat otomatis)</FieldLabel>
        <SkInput value={v.studentForm.nis} onChange={v.onStudentNis} placeholder="2210501" />
      </label>
      <SheetActions className="mt-[18px]" onCancel={v.closeSheet} onConfirm={v.saveStudent} confirmLabel="Simpan" />
    </div>
  );
}

function FileSheet({ v }) {
  return (
    <div>
      <div className="flex items-center gap-[12px]">
        <div className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[15px] bg-brand-tint text-[11px] font-extrabold text-brand-strong">
          {v.fileView.ext}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-extrabold tracking-[-.3px] text-pretty">{v.fileView.name}</div>
          <div className="mt-[2px] text-[11.5px] font-semibold text-ink-4">{v.fileView.meta}</div>
        </div>
      </div>
      <div className="mt-[16px] flex h-[220px] flex-col items-center justify-center gap-[8px] rounded-[20px] border border-line-07 bg-app">
        <div className="h-[70px] w-[54px] rounded-[8px] border border-line-10 bg-white shadow-[0_8px_18px_-12px_rgba(24,18,54,.4)]" />
        <div className="text-[11.5px] font-semibold text-ink-4">Pratinjau halaman 1</div>
      </div>
      <SheetActions
        className="mt-[16px]"
        onCancel={v.closeSheet}
        cancelLabel="Tutup"
        onConfirm={v.downloadFile}
        confirmLabel="Unduh file"
      />
    </div>
  );
}

const SHEETS = [
  { when: "sheetSlot", title: "Jadwal", Body: SlotSheet },
  { when: "sheetClass", title: "Kelas", Body: ClassSheet },
  { when: "sheetAssign", title: "Penugasan", Body: AssignSheet },
  { when: "sheetUpload", title: "Upload materi", Body: UploadSheet },
  { when: "sheetSubmit", title: "Kumpulkan tugas", Body: SubmitSheet },
  { when: "sheetGrade", title: "Beri nilai", Body: GradeSheet },
  { when: "sheetStudent", title: "Tambah siswa", Body: StudentSheet },
  { when: "sheetFile", title: "Pratinjau file", Body: FileSheet },
];

export function Sheets({ v }) {
  const active = SHEETS.find((s) => v[s.when]);
  if (!active) return null;
  const { Body, title } = active;
  return (
    <BottomSheet open onOpenChange={(open) => !open && v.closeSheet()} title={title}>
      <Body v={v} />
    </BottomSheet>
  );
}
