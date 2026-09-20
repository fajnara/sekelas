"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";

import * as api from "@/app/actions";
import { extensionLabel, validateUpload } from "@/lib/storage/rules";
import { newId } from "./ids.js";
import {
  COLORS,
  DAY_NAMES,
  LAB_ROOMS,
  LEVELS,
  MAJORS,
  ME,
  PRIMARY,
  ROOMS,
  SCHOOL,
  TASK_KINDS,
  TU_ACCOUNT,
  formatSize,
  formatTotalSize,
  initialsOf,
  makeStudentId,
  mins,
  roomInfo,
  taskType,
  uniq,
} from "./data.js";
import {
  addDays,
  calendarDaysUntil,
  dayOfMonth,
  isToday,
  formatDeadline,
  formatDue,
  formatStamp,
  fromDateAndTime,
  hhmm,
  isoDate,
  monthLong,
  now,
  padTime,
  relativeTime,
  shortDate,
  startOfWeekMonday,
  yearOf,
} from "./clock.js";

/**
 * Mengunggah berkas, lalu mencatat barisnya.
 *
 * Byte-nya **tidak** lewat Server Action: badan request di Vercel dibatasi
 * 4,5 MB di semua paket, dan batas itu memotong sebelum kode aplikasi
 * dijalankan — sementara dua dropzone desain menjanjikan 25 MB. Jadi server
 * hanya mencetak alamat unggah berumur pendek, dan berkasnya dikirim langsung
 * ke penyimpanan.
 *
 * Dijalankan di dalam `mutate()`, jadi kegagalan di langkah mana pun
 * mengembalikan `{error}` — dan patch optimistiknya ikut di-rollback.
 */
async function uploadThenRecord(file, { kind, id }, record) {
  const signed = await api.signUploadAction({
    kind,
    id,
    fileName: file.name,
    sizeBytes: file.size,
    contentType: file.type,
  });
  if (signed?.error) return signed;

  // Tanpa penyimpanan yang dikonfigurasi, tidak ada alamat unggah: barisnya
  // tetap dicatat tanpa byte, persis seperti mode default sebelumnya.
  if (signed.url) {
    // Bentuknya mengikuti signed upload URL Supabase: PUT, multipart, berkas di
    // field tanpa nama. Driver folder lokal menerima bentuk yang sama, jadi
    // jalur ini yang benar-benar dijalankan uji end-to-end.
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);

    const response = await fetch(signed.url, { method: signed.method || "PUT", body }).catch(() => null);
    if (!response || !response.ok) return { error: "Gagal mengunggah. Coba lagi." };
  }

  return record(signed.storagePath);
}

/** Warna badge notifikasi diturunkan dari jenisnya, tidak disimpan per baris. */
const NOTIF_TONE = {
  "Tugas baru": { tint: "#F1EEFF", ink: "#5334E0" },
  Deadline: { tint: "#FFE9E7", ink: "#C2302F" },
  "Nilai keluar": { tint: "#E9FBF3", ink: "#0B7A55" },
  "Jadwal berubah": { tint: "#FFF7DB", ink: "#8A6100" },
};

/**
 * Port dari class `Component` di `design/Sekelas App v2.dc.html`. Bentuk state,
 * nama helper, dan value-bag yang dikembalikan tetap memakai nama desain supaya
 * tiap layar bisa diadu satu-per-satu dengan mockup-nya.
 *
 * Datanya datang dari sebuah **snapshot** (lihat `snapshot.js`), bukan dari
 * konstanta modul — itulah yang membuat sumbernya bisa ditukar antara seed
 * lokal dan Postgres tanpa menyentuh satu layar pun.
 */
function initialState(props, snapshot) {
  const firstClass = snapshot.classes.find((c) => c.id === (props.adminClass || ME.classId)) || snapshot.classes[0];
  const taskByLegacy = (n) => (snapshot.tasks.find((t) => t.legacyNo === Number(n)) || {}).id;
  const role =
    props.role ||
    (String(props.screen || "").indexOf("guru") === 0
      ? "guru"
      : /^(admin|tu)/.test(String(props.screen || ""))
        ? "tu"
        : "siswa");

  return {
    // Layar awal mengikuti peran, sama seperti tujuan tombol Masuk. Tanpa ini,
    // guru atau TU yang memuat ulang akan mendarat di Home siswa dengan peran
    // yang masih guru atau TU.
    screen: props.screen || (role === "guru" ? "guruHome" : role === "tu" ? "adminHome" : "home"),
    role,
    guruId: props.guruId || "t1",
    // ---- data domain, seluruhnya dari snapshot ----
    teachers: snapshot.teachers,
    teachingAssignments: snapshot.teachingAssignments,
    classes: snapshot.classes,
    tasks: snapshot.tasks,
    submissions: snapshot.submissions,
    subjects: snapshot.subjects,
    students: snapshot.students,
    slots: snapshot.slots,
    materials: snapshot.materials,
    notifications: snapshot.notifications,
    activity: snapshot.activity,
    // ---- state UI ----
    tuLevel: "XI",
    tuTeacherId: "t1",
    classForm: { name: "", level: "XI", major: "IPA", homeroom: "t1" },
    assignForm: { teacherId: "t1", subjectId: "mat", classIds: [] },
    weekOffset: 0,
    notifRead: false,
    slotError: null,
    subTaskId: props.subTaskId || "a1",
    submitForm: { note: "" },
    gradeForm: { taskId: null, studentId: null, student: "", score: "", note: "" },
    studentForm: { name: "", nis: "" },
    fileView: null,
    status: props.statusFilter || "Semua",
    subjectFilter: props.subjectFilter || "Semua",
    // Katalog desain menunjuk tugas dengan nomor 1–8; id-nya sekarang teks.
    taskId: taskByLegacy(props.taskId) || taskByLegacy(1),
    subjectId: props.subjectId || "mat",
    dayIndex: Number(props.dayIndex) || 0,
    editing: null,
    colorIndex: 0,
    form: { name: "" },
    adminClass: firstClass.id,
    adminMajor: firstClass.major,
    taskForm: {
      subjectId: "mat",
      title: "",
      desc: "",
      kind: props.taskKind || "Individu",
      groupSize: "4",
      date: "2026-09-18",
      time: "23.59",
      weight: "10",
      files: [],
    },
    expanded: { Senin: true, Selasa: true, Rabu: false, Kamis: false, Jumat: false },
    sheet: props.sheet || null,
    slotForm: { id: "11ipa2-fis0", subjectId: "fis", day: "Jumat", start: "07.30", end: "09.00", room: "Lab Fisika" },
    materialFilter: "Semua",
    uploadSubject: "mat",
    // Berkas pilihan hidup di state klien saja — `File` tidak bisa diserialisasi.
    uploadFile: null,
    submitFile: null,
    loginEmail: "alya.p@nusantara1.sch.id",
    loginPass: "••••••••",
    toast: null,
    // Bumped whenever a toast is raised, so re-flashing restarts the timer.
    toastSeq: 0,
  };
}

export function useSekelas(props = {}, snapshot) {
  const [st, setSt] = useState(() => initialState(props, snapshot));
  const frozen = !!props.frozen;

  const setState = useCallback((patch) => {
    setSt((prev) => ({ ...prev, ...patch }));
  }, []);

  const flash = useCallback(
    (msg) => {
      setSt((prev) => ({ ...prev, toast: msg, toastSeq: prev.toastSeq + 1 }));
    },
    [setSt],
  );

  /**
   * Snapshot untuk rollback, disimpan lewat effect — bukan ditulis saat render.
   * Effect-nya jalan setelah commit dan sebelum interaksi berikutnya mungkin
   * terjadi, jadi saat sebuah handler dipanggil isinya sudah state terkini.
   */
  const rollbackRef = useRef(st);
  useEffect(() => {
    rollbackRef.current = st;
  }, [st]);

  /**
   * Satu jalur untuk semua perubahan: patch optimistik + tulis di belakang.
   *
   * Toast-nya dinaikkan di dalam `setState` yang **sama** dengan patch-nya, jadi
   * waktunya identik dengan versi tanpa database — muncul saat diklik, bukan
   * setelah server menjawab. Toast validasi tidak lewat sini sama sekali; ia
   * tetap murni di klien dan tidak pernah menyentuh jaringan.
   *
   * Kalau server menolak, state dikembalikan dari ref — bukan dari closure,
   * yang bisa sudah basi saat jawabannya datang.
   */
  const mutate = useCallback(
    (patch, action, toastMsg) => {
      const before = rollbackRef.current;
      setSt((s) => ({
        ...s,
        ...patch,
        toast: toastMsg ?? s.toast,
        toastSeq: toastMsg ? s.toastSeq + 1 : s.toastSeq,
      }));

      if (frozen || !action) return;
      startTransition(async () => {
        const result = await action().catch(() => ({ error: "Gagal menyimpan. Coba lagi." }));
        if (result?.error) {
          setSt(() => ({ ...before, toast: result.error, toastSeq: before.toastSeq + 1 }));
        }
      });
    },
    [frozen],
  );

  // The design clears its toast after 2.3s.
  const { toast, toastSeq } = st;
  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setState({ toast: null }), 2300);
    return () => clearTimeout(id);
  }, [toast, toastSeq, setState]);

  return useMemo(() => {
    // Satu "sekarang" untuk seluruh render, supaya tidak ada dua label yang
    // dihitung dari instant berbeda di tengah satu pass.
    const clockNow = now();
    const weekStart = startOfWeekMonday(clockNow);
    const meId = (st.students.find((s) => s.isMe) || {}).id;
    const taskByLegacyNo = (n) => (st.tasks.find((t) => t.legacyNo === Number(n)) || {}).id;
    const unreadNotifs = st.notifications.filter((n) => !n.readAt).length;

    /**
     * Membuka layar notifikasi sekaligus menandainya terbaca. `notifRead` tetap
     * ada sebagai state UI karena desain memakainya untuk badge; `readAt` yang
     * menentukan latar tiap baris, dan itulah yang dipersisten.
     */
    const openNotifs = () =>
      mutate(
        {
          screen: "notifs",
          notifRead: true,
          notifications: st.notifications.map((n) => (n.readAt ? n : { ...n, readAt: clockNow })),
        },
        unreadNotifs ? () => api.markNotificationsReadAction({}) : null,
      );

    // ---- helper methods (were class methods on the design's Component) ----
    const nav = (screen) => setState({ screen });
    // Dulu ini membaca konstanta modul, bukan state — akibatnya "hapus mata
    // pelajaran" di panel TU hanya menghilangkan barisnya dari daftar itu dan
    // tidak berpengaruh ke layar lain. Sekarang satu sumber.
    const subj = (id) => st.subjects.find((s) => s.id === id) || st.subjects[0];
    const cls = (id) => st.classes.find((c) => c.id === id) || st.classes[0];
    const teacher = (id) => st.teachers.find((t) => t.id === id) || st.teachers[0];
    const tAssignments = (teacherId) => st.teachingAssignments.filter((a) => a.teacherId === teacherId);
    const tSubjectIds = (t) => uniq(tAssignments(t.id).map((a) => a.subjectId));
    const tClassIds = (t) => uniq(tAssignments(t.id).map((a) => a.classId));
    const teacherOf = (subjectId, classId) => {
      const hit = st.teachingAssignments.find((a) => a.subjectId === subjectId && a.classId === classId);
      const t = hit && st.teachers.find((x) => x.id === hit.teacherId);
      return t ? t.name : "—";
    };
    /** Mapel yang diajarkan di satu kelas, mengikuti penugasan di state. */
    const classSubjects = (classId) =>
      st.subjects.filter((s) => st.teachingAssignments.some((a) => a.subjectId === s.id && a.classId === classId));
    /** Wali kelas disimpan sebagai id guru; namanya selalu dilihat dari tabel guru. */
    const homeroomOf = (c) => st.teachers.find((t) => t.id === (c && c.homeroomTeacherId)) || null;
    const homeroomName = (c) => (homeroomOf(c) || {}).name || "—";
    /**
     * Mengelompokkan kembali baris datar jadi bentuk yang dipakai layar:
     * satu kartu per mapel, berisi daftar kelasnya.
     */
    const groupedAssignments = (teacherId) => {
      const out = [];
      for (const a of tAssignments(teacherId)) {
        let g = out.find((x) => x.subjectId === a.subjectId);
        if (!g) out.push((g = { subjectId: a.subjectId, classIds: [] }));
        g.classIds.push(a.classId);
      }
      return out;
    };
    const roster = (c) =>
      st.students.filter((s) => s.classId === c.id).sort((a, b) => a.name.localeCompare(b.name));
    /** Jumlah siswa selalu dihitung, tidak pernah disimpan. */
    const studentCount = (classId) => st.students.filter((s) => s.classId === classId).length;
    /** "2,4 MB · 3 Sep" — dan "hari ini" untuk yang baru diunggah, seperti desain. */
    const materialMeta = (m) =>
      formatSize(m.sizeBytes) + " · " + (isToday(m.createdAt, clockNow) ? "hari ini" : shortDate(m.createdAt));
    const closeSheet = () => setState({ sheet: null, slotError: null });
    const openFile = (m) =>
      setState({
        sheet: "file",
        fileView: { name: m.name, ext: m.ext, meta: m.meta || m.size || "", path: m.storagePath || null },
      });

    const deadline = (t) => {
      if (t.done) return { dlLabel: "Selesai", dlBg: "#E9FBF3", dlInk: "#0B7A55" };
      if (t.days <= 0) return { dlLabel: "Hari ini", dlBg: "#FFE9E7", dlInk: "#C2302F" };
      if (t.days === 1) return { dlLabel: "Besok", dlBg: "#FFE9E7", dlInk: "#C2302F" };
      if (t.days <= 3) return { dlLabel: t.days + " hari lagi", dlBg: "#FFF3D1", dlInk: "#8A6100" };
      return { dlLabel: t.days + " hari lagi", dlBg: "#E9FBF3", dlInk: "#0B7A55" };
    };

    const subStatus = (t) => {
      if (t.sub === "graded") return { statusLabel: "Nilai " + t.grade, statusBg: "#0E9F6E", statusInk: "#fff" };
      if (t.sub === "late") return { statusLabel: "Terlambat", statusBg: "#FFE9E7", statusInk: "#C2302F" };
      if (t.sub === "sent") return { statusLabel: "Terkumpul", statusBg: "#E9FBF3", statusInk: "#0B7A55" };
      return { statusLabel: "Belum dikumpulkan", statusBg: "rgba(20,18,31,.055)", statusInk: "#5C5872" };
    };

    /** Pengumpulan satu siswa untuk satu tugas, kalau ada. */
    const subFor = (taskId, studentId) =>
      st.submissions.find((s) => s.taskId === taskId && s.studentId === studentId) || null;

    /** Status pengumpulan, diturunkan dari kolom — bukan disimpan sebagai enum. */
    const subState = (sub, task) => {
      if (!sub) return "open";
      if (sub.score != null) return "graded";
      if (!sub.submittedAt) return "open";
      return task && sub.submittedAt > task.dueAt ? "late" : "sent";
    };

    /**
     * Menggabungkan tugas dengan pengumpulan Alya, lalu menurunkan semua label.
     * Inilah yang dulu tersebar di kolom `done`/`sub`/`grade`/`submittedAt`.
     */
    const deco = (raw) => {
      const s = subj(raw.subjectId);
      const sub = subFor(raw.id, meId);
      const state = subState(sub, raw);
      const done = !!(sub && (sub.checkedOffAt || sub.submittedAt));
      const t = {
        ...raw,
        sub: state,
        done,
        grade: sub ? sub.score : null,
        feedback: sub ? sub.feedback : null,
        file: sub ? sub.fileName : null,
        type: taskType(raw),
        weight: raw.weightPct + "%",
        days: calendarDaysUntil(raw.dueAt, clockNow),
        due: formatDue({ ...raw, done, submittedAt: sub && sub.submittedAt }, clockNow),
        submittedLabel:
          sub && sub.submittedAt
            ? (state === "late" ? "Terlambat · " : "") + formatStamp(sub.submittedAt, clockNow)
            : "",
      };
      return {
        ...t,
        ...deadline(t),
        ...subStatus(t),
        subject: s.name,
        color: s.color,
        tint: s.tint,
        ink: s.ink,
        teacher: teacherOf(raw.subjectId, ME.classId),
        kind: raw.kind,
        notDone: !done,
        cardBg: "#fff",
        cardBorder: "rgba(20,18,31,.05)",
        strike: "none",
        titleInk: "#14121F",
        open: () => setState({ screen: "taskDetail", taskId: t.id }),
      };
    };

    /**
     * Menulis satu baris pengumpulan di memori, membuatnya kalau belum ada.
     * `rowId` dibuat pemanggil supaya baris lokal dan baris database memakai id
     * yang sama — kalau server yang membuatnya, keduanya berbeda sampai halaman
     * dimuat ulang.
     */
    const upsertSubmission = (taskId, studentId, rowId, patch) => {
      const existing = subFor(taskId, studentId);
      if (existing) return st.submissions.map((s) => (s === existing ? { ...s, ...patch } : s));
      return st.submissions.concat([
        {
          id: rowId,
          taskId,
          studentId,
          checkedOffAt: null,
          submittedAt: null,
          fileName: null,
          note: null,
          score: null,
          feedback: null,
          gradedAt: null,
          ...patch,
        },
      ]);
    };

    const toggle = (id) => {
      const sub = subFor(id, meId);
      const wasDone = !!(sub && (sub.checkedOffAt || sub.submittedAt));
      const rowId = sub ? sub.id : newId("sub");
      mutate(
        { submissions: upsertSubmission(id, meId, rowId, { checkedOffAt: wasDone ? null : clockNow }) },
        () => api.toggleTaskAction({ id: rowId, taskId: id, studentId: meId, done: !wasDone }),
        wasDone ? null : "Mantap! Tugas ditandai selesai.",
      );
    };

    const daySchedule = (dayName) =>
      st.slots
        .filter((sl) => sl.day === dayName && sl.classId === "11ipa2")
        .map((sl) => {
          const s = subj(sl.subjectId);
          return {
            time: sl.start + "–" + sl.end,
            name: s.name,
            room: sl.room,
            teacher: teacherOf(sl.subjectId, sl.classId),
            abbr: s.abbr,
            tint: s.tint,
            ink: s.ink,
            color: s.color,
            open: () => setState({ screen: "subjectDetail", subjectId: s.id }),
          };
        })
        .sort((a, b) => a.time.localeCompare(b.time));

    /**
     * Daftar pengumpulan satu tugas: roster kelas di-join ke baris pengumpulan.
     * Dulu status ditebak posisional dari kolom hitungan `submitted`; sekarang
     * setiap baris punya keberadaannya sendiri.
     */
    const submissionsFor = (t) =>
      roster(cls(t.classId)).map((r) => {
        const sub = subFor(t.id, r.id);
        const state = subState(sub, t);
        return {
          ...r,
          key: t.id + ":" + r.id,
          state,
          score: sub ? sub.score : null,
          note: (sub && sub.note) || "",
          isOpen: state === "open",
          isSent: state === "sent",
          isGraded: state === "graded",
        };
      });

    /** Berapa yang sudah mengumpulkan — dihitung, bukan disimpan. */
    const submittedCount = (taskId) =>
      st.submissions.filter((s) => s.taskId === taskId && s.submittedAt).length;

    /** Tugas aktif (bukan arsip) di sebuah kelas. */
    const activeTasks = (classId) => st.tasks.filter((t) => t.classId === classId && !t.isArchived);

    // Bentrok jadwal: kelas sama, guru sama, atau ruangan sama di jam yang bertumpuk
    const slotConflict = (f) => {
      const t = teacherOf(f.subjectId, f.classId || st.adminClass);
      const a1 = mins(f.start);
      const a2 = mins(f.end);
      if (a2 <= a1) return "Jam selesai harus setelah jam mulai.";
      const hit = st.slots.find((s) => {
        if (s.id === f.id || s.day !== f.day) return false;
        if (mins(s.end) <= a1 || mins(s.start) >= a2) return false;
        const sameClass = s.classId === (f.classId || st.adminClass);
        const sameRoom = s.room && f.room && s.room.toLowerCase() === f.room.toLowerCase();
        const sameTeacher = teacherOf(s.subjectId, s.classId) === t;
        return sameClass || sameRoom || sameTeacher;
      });
      if (!hit) return null;
      const hs = subj(hit.subjectId);
      const hc = cls(hit.classId);
      if (hit.classId === (f.classId || st.adminClass))
        return "Bentrok: " + hc.name + " sudah ada " + hs.name + " " + hit.start + "–" + hit.end + ".";
      if (hit.room && f.room && hit.room.toLowerCase() === f.room.toLowerCase())
        return (
          "Bentrok ruangan: " + hit.room + " dipakai " + hc.name + " (" + hs.name + ") " + hit.start + "–" + hit.end + "."
        );
      return (
        "Bentrok guru: " + teacherOf(hit.subjectId, hit.classId) + " mengajar " + hc.name + " " + hit.start + "–" + hit.end + "."
      );
    };

    const saveSlot = () => {
      const f = st.slotForm;
      // Diperiksa di klien supaya pesannya muncul seketika; server memeriksanya
      // lagi, dan itu yang menentukan — di sini hanya slot yang ada di memori
      // yang terlihat.
      const err = slotConflict(f);
      if (err) {
        setState({ slotError: err });
        return;
      }
      const classId = f.classId || st.adminClass;
      const normalized = { ...f, classId, start: padTime(f.start), end: padTime(f.end) };
      const id = f.id || newId("slot");
      const slots = f.id
        ? st.slots.map((s) => (s.id === f.id ? { ...s, ...normalized } : s))
        : st.slots.concat([{ ...normalized, id }]);

      mutate(
        { slots, sheet: null, slotError: null },
        () => api.saveSlotAction({ id, form: normalized }),
        f.id ? "Jadwal diperbarui." : "Slot jadwal ditambahkan.",
      );
    };

    const deleteSlot = () => {
      const f = st.slotForm;
      mutate(
        { slots: st.slots.filter((s) => s.id !== f.id), sheet: null },
        () => api.deleteSlotAction({ id: f.id }),
        "Jadwal dihapus.",
      );
    };

    const saveClass = () => {
      const f = st.classForm;
      const name =
        f.name ||
        f.level + " " + f.major + " " + (st.classes.filter((c) => c.level === f.level && c.major === f.major).length + 1);
      const payload = { name, level: f.level, major: f.major, homeroomTeacherId: f.homeroom };

      if (f.editId) {
        mutate(
          {
            sheet: null,
            classes: st.classes.map((c) => (c.id === f.editId ? { ...c, ...payload } : c)),
          },
          () => api.saveClassAction({ editId: f.editId, ...payload }),
          "Kelas " + name + " diperbarui.",
        );
        return;
      }

      const id = newId("c");
      mutate(
        {
          sheet: null,
          classes: st.classes.concat([{ id, roomName: null, newMaterials: 0, ...payload }]),
        },
        () => api.saveClassAction({ id, ...payload }),
        "Kelas " + name + " ditambahkan.",
      );
    };

    const saveAssign = () => {
      const f = st.assignForm;
      if (!f.classIds.length) {
        flash("Pilih minimal satu kelas.");
        return;
      }
      const mine = (a) => a.teacherId === f.teacherId && a.subjectId === f.subjectId;
      const existing = st.teachingAssignments.filter(mine).map((a) => a.classId);
      const classIds = f.replace ? f.classIds.slice() : uniq(existing.concat(f.classIds));
      mutate(
        {
          sheet: null,
          tuTeacherId: f.teacherId,
          teachingAssignments: st.teachingAssignments
            .filter((a) => !mine(a))
            .concat(classIds.map((classId) => ({ teacherId: f.teacherId, subjectId: f.subjectId, classId }))),
        },
        () =>
          api.saveAssignmentAction({
            teacherId: f.teacherId,
            subjectId: f.subjectId,
            classIds,
            replace: !!f.replace,
          }),
        "Penugasan disimpan.",
      );
    };

    // ---- derived values (renderVals) ----
    const name = props.studentName || "Alya Pratiwi";
    // Yang dilihat siswa: tugas kelasnya sendiri, arsip nilai dikecualikan.
    const tasks = activeTasks(ME.classId).map((t) => deco(t));
    const open = tasks.filter((t) => !t.done);
    const doneCount = tasks.filter((t) => t.done).length;
    const todayAll = tasks.filter((t) => t.days === 0);
    const doneToday = todayAll.filter((t) => t.done).length;
    const pct = todayAll.length ? Math.round((doneToday / todayAll.length) * 100) : 0;
    const C = 2 * Math.PI * 33;

    /**
     * Semua nilai Alya yang sudah keluar — dari pengumpulan bernilai, termasuk
     * tugas arsip. Menggantikan array `PAST_GRADES` terpisah, sehingga rapor
     * dan daftar tugas tidak bisa lagi bercerita berbeda.
     */
    const gradedItems = st.submissions
      .filter((s) => s.studentId === meId && s.score != null)
      .map((s) => {
        const t = st.tasks.find((x) => x.id === s.taskId);
        return t && { subjectId: t.subjectId, title: t.title, weight: t.weightPct, score: s.score, gradedAt: s.gradedAt };
      })
      .filter(Boolean);

    let filtered = tasks;
    if (st.status === "Belum dikumpulkan") filtered = filtered.filter((t) => t.sub === "open");
    if (st.status === "Terkumpul") filtered = filtered.filter((t) => t.sub === "sent" || t.sub === "late");
    if (st.status === "Dinilai") filtered = filtered.filter((t) => t.sub === "graded");
    if (st.status === "Deadline dekat") filtered = filtered.filter((t) => t.sub === "open" && t.days <= 2);
    if (st.subjectFilter !== "Semua") filtered = filtered.filter((t) => t.subjectId === st.subjectFilter);

    const statusFilters = ["Semua", "Belum dikumpulkan", "Deadline dekat", "Terkumpul", "Dinilai"].map((l) => ({
      label: l,
      pick: () => setState({ status: l }),
      bg: st.status === l ? "#14121F" : "#fff",
      ink: st.status === l ? "#fff" : "#5C5872",
      border: st.status === l ? "#14121F" : "rgba(20,18,31,.09)",
    }));

    const subjectFilters = [{ id: "Semua", name: "Semua mapel" }]
      .concat(st.subjects.map((s) => ({ id: s.id, name: s.name })))
      .map((s) => ({
        label: s.name,
        pick: () => setState({ subjectFilter: s.id }),
        bg: st.subjectFilter === s.id ? "#EFEBFF" : "rgba(20,18,31,.045)",
        ink: st.subjectFilter === s.id ? "#5334E0" : "#6B6880",
      }));

    const task = tasks.find((t) => t.id === st.taskId) || tasks[0];
    const sRaw = subj(st.subjectId);
    const subjectTaskCount = (id) => tasks.filter((t) => t.subjectId === id && !t.done).length;
    const mySlots = (id) =>
      st.slots
        .filter((sl) => sl.classId === "11ipa2" && sl.subjectId === id)
        .sort((a, b) => DAY_NAMES.indexOf(a.day) - DAY_NAMES.indexOf(b.day) || a.start.localeCompare(b.start));

    const subjectMaterials = st.materials
      .filter((m) => m.subjectId === sRaw.id)
      .map((m) => ({ ...m, meta: materialMeta(m) }));

    const subject = {
      ...sRaw,
      teacher: teacherOf(sRaw.id, ME.classId),
      taskOpen: subjectTaskCount(sRaw.id),
      materialCount: subjectMaterials.length,
      materials: subjectMaterials.map((m) => ({ ...m, open: () => openFile(m) })),
      room: (mySlots(sRaw.id)[0] || {}).room || sRaw.room,
      schedule: mySlots(sRaw.id).map((sl) => ({ day: sl.day, time: sl.start + "–" + sl.end, room: sl.room })),
    };

    const subjects = st.subjects.map((s) => ({
      ...s,
      teacher: teacherOf(s.id, ME.classId),
      slots: mySlots(s.id).map((sl) => sl.day + " · " + sl.start + "–" + sl.end),
      slotLabel: mySlots(s.id)
        .map((sl) => sl.day)
        .join(", "),
      taskLabel: subjectTaskCount(s.id) + " tugas",
      open: () => setState({ screen: "subjectDetail", subjectId: s.id }),
      edit: () =>
        setState({
          screen: "adminForm",
          editing: s.name,
          colorIndex: COLORS.findIndex((c) => c.color === s.color),
          form: { name: s.name },
        }),
    }));

    const wk = st.weekOffset;
    const week = DAY_NAMES.map((d, i) => {
      const items = daySchedule(d);
      const sel = st.dayIndex === i;
      return {
        dow: d.slice(0, 3),
        date: dayOfMonth(addDays(weekStart, i + wk * 7)),
        pick: () => setState({ dayIndex: i }),
        bg: sel ? PRIMARY : "transparent",
        ink: sel ? "#fff" : i > 4 ? "#B4B0C2" : "#14121F",
        dot: items.length ? (sel ? "rgba(255,255,255,.85)" : "#C8CBD6") : "transparent",
      };
    });
    const dayItems = daySchedule(DAY_NAMES[st.dayIndex]);

    const activeCls = cls(st.adminClass);
    const activeClassSize = studentCount(activeCls.id);
    const guru = teacher(st.guruId);
    const isGuru = st.role === "guru";
    const isTU = st.role === "tu";
    const guruSubjectIds = tSubjectIds(guru);
    const guruClassIds = tClassIds(guru);
    const clsSubjects = classSubjects(activeCls.id);
    const scopeSubjects = isGuru ? st.subjects.filter((s) => guruSubjectIds.indexOf(s.id) !== -1) : clsSubjects;
    const clsTasks = activeTasks(activeCls.id).filter(
      (t) => !isGuru || guruSubjectIds.indexOf(t.subjectId) !== -1,
    );
    const formSubjects = isGuru
      ? st.subjects.filter((s) =>
          st.teachingAssignments.some(
            (a) => a.teacherId === guru.id && a.subjectId === s.id && a.classId === activeCls.id,
          ),
        )
      : clsSubjects;

    const navDefs = isGuru
      ? [
          { label: "Dashboard", s: "guruHome", i: "grid" },
          { label: "Tugas", s: "adminTasks", i: "clipboard" },
          { label: "Materi", s: "adminMaterials", i: "folder" },
          { label: "Jadwal", s: "guruSchedule", i: "calendar" },
          { label: "Profil", s: "guruProfile", i: "user" },
        ]
      : isTU
        ? [
            { label: "Home", s: "adminHome", i: "grid" },
            { label: "Kelas", s: "tuClasses", i: "layers" },
            { label: "Mapel", s: "adminList", i: "book" },
            { label: "Guru", s: "tuTeachers", i: "users" },
            { label: "Jadwal", s: "adminSchedule", i: "calendar" },
            { label: "Profil", s: "tuProfile", i: "user" },
          ]
        : [
            { label: "Home", s: "home", i: "home" },
            { label: "Tugas", s: "tasks", i: "clipboard" },
            { label: "Jadwal", s: "calendar", i: "calendar" },
            { label: "Materi", s: "subjects", i: "book" },
            { label: "Profil", s: "profile", i: "user" },
          ];

    const activeMap = {
      taskDetail: "tasks",
      subjectDetail: "subjects",
      adminTaskForm: "adminTasks",
      adminForm: "adminList",
      tuTeacherDetail: "tuTeachers",
      tuClassDetail: "tuClasses",
      submissions: "adminTasks",
      grades: "profile",
      notifs: "home",
    };
    const active = activeMap[st.screen] || st.screen;
    const navItems = navDefs.map((n) => ({
      label: n.label,
      go: () => nav(n.s),
      icon: n.i,
      bg: active === n.s ? "#F1EEFF" : "transparent",
      ink: active === n.s ? "#5334E0" : "#9B98A8",
    }));

    return {
      state: st,
      setState,
      flash,

      studentName: name,
      firstName: name.split(" ")[0],
      initials: name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2),
      studentMeta: cls(ME.classId).name + " · NIS " + ME.nis,
      schoolName: SCHOOL.name,
      schoolNpsn: SCHOOL.npsn,
      schoolYear: SCHOOL.year,
      semesterLabel: "Semester " + SCHOOL.semester + " " + SCHOOL.year + " · Kelas " + cls(ME.classId).name,
      attendancePct:
        Math.round(st.subjects.reduce((a, s) => a + parseInt(s.attendance, 10), 0) / st.subjects.length) + "%",
      streak: props.streak ?? 12,

      isLogin: st.screen === "login",
      isHome: st.screen === "home",
      isTasks: st.screen === "tasks",
      isTaskDetail: st.screen === "taskDetail",
      isSubjects: st.screen === "subjects",
      isSubjectDetail: st.screen === "subjectDetail",
      isCalendar: st.screen === "calendar",
      isProfile: st.screen === "profile",
      isAdminHome: st.screen === "adminHome",
      isAdminList: st.screen === "adminList",
      isAdminForm: st.screen === "adminForm",
      isAdminSchedule: st.screen === "adminSchedule",
      isAdminMaterials: st.screen === "adminMaterials",
      isAdminTasks: st.screen === "adminTasks",
      isAdminTaskForm: st.screen === "adminTaskForm",
      isGuruHome: st.screen === "guruHome",
      isGuruSchedule: st.screen === "guruSchedule",
      isGuruProfile: st.screen === "guruProfile",
      isTuClasses: st.screen === "tuClasses",
      isTuTeachers: st.screen === "tuTeachers",
      isTuTeacherDetail: st.screen === "tuTeacherDetail",
      isGrades: st.screen === "grades",
      isNotifs: st.screen === "notifs",
      isSubmissions: st.screen === "submissions",
      isTuProfile: st.screen === "tuProfile",
      isTuClassDetail: st.screen === "tuClassDetail",

      showNav:
        ["login", "taskDetail", "adminForm", "adminTaskForm", "notifs", "submissions"].indexOf(st.screen) === -1,
      navItems,
      navBg: "rgba(255,255,255,.94)",
      navBorder: "rgba(20,18,31,.06)",

      todayPct: pct,
      ringDash: (C * pct) / 100 + " " + C,
      doneToday,
      totalToday: todayAll.length,
      dueSoonCount: open.filter((t) => t.days <= 2).length,
      doneCount,
      openCount: open.length,
      subjectCount: classSubjects(ME.classId).length,
      upcoming: open.slice(0, 3),
      todaySchedule: daySchedule("Senin"),

      statusFilters,
      subjectFilters,
      filteredTasks: filtered,
      tasksEmpty: filtered.length === 0,
      taskCountLabel:
        tasks.filter((t) => t.sub === "open").length +
        " belum dikumpulkan · " +
        tasks.filter((t) => t.sub === "sent" || t.sub === "late").length +
        " terkumpul · " +
        tasks.filter((t) => t.sub === "graded").length +
        " dinilai",
      emptyTitle:
        st.status === "Dinilai"
          ? "Belum ada nilai masuk"
          : st.status === "Terkumpul"
            ? "Belum ada yang dikumpulkan"
            : "Belum ada tugas di sini",
      emptyBody:
        st.status === "Dinilai"
          ? "Nilai muncul di sini setelah guru menilai tugasmu."
          : st.status === "Terkumpul"
            ? "Tugas yang sudah kamu kirim akan muncul di sini."
            : "Coba ubah filter mata pelajaran atau statusnya.",
      resetFilters: () => setState({ status: "Semua", subjectFilter: "Semua" }),

      task,
      taskNotDone: !task.done,
      taskIsDone: task.done,
      toggleCurrent: () => toggle(task.id),
      taskIsOpen: task.sub === "open",
      taskIsSent: task.sub === "sent" || task.sub === "late",
      taskIsGraded: task.sub === "graded",
      taskSubmitLabel: task.sub === "late" ? "Terkumpul terlambat" : "Terkumpul",
      taskSubmitMeta: task.submittedLabel + " · " + (task.file || ""),
      openSubmit: () => setState({ sheet: "submit", submitForm: { note: "" } }),
      unsubmit: () => {
        const rowId = (subFor(task.id, meId) || {}).id || newId("sub");
        mutate(
          {
            submissions: upsertSubmission(task.id, meId, rowId, {
              checkedOffAt: null,
              submittedAt: null,
              fileName: null,
              note: null,
            }),
          },
          () => api.unsubmitTaskAction({ id: rowId, taskId: task.id, studentId: meId }),
          "Pengumpulan ditarik kembali.",
        );
      },
      sheetSubmit: st.sheet === "submit",
      submitForm: st.submitForm,
      onSubmitNote: (e) => setState({ submitForm: { ...st.submitForm, note: e.target.value } }),
      submitDeadlineNote:
        task.days < 0 ? "Sudah melewati deadline — akan ditandai terlambat." : "Deadline " + task.due,
      submitFileLabel: st.submitFile ? st.submitFile.name : "Pilih file jawaban",
      onPickSubmission: (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const problem = validateUpload(file);
        if (problem) {
          flash(problem);
          return;
        }
        setState({ submitFile: file });
      },
      doSubmit: () => {
        const file = st.submitFile;
        if (!file) {
          flash("Pilih file jawaban dulu.");
          return;
        }
        const late = task.days < 0;
        const rowId = (subFor(task.id, meId) || {}).id || newId("sub");
        mutate(
          {
            sheet: null,
            submitFile: null,
            submissions: upsertSubmission(task.id, meId, rowId, {
              checkedOffAt: clockNow,
              submittedAt: clockNow,
              fileName: file.name,
              note: st.submitForm.note,
            }),
          },
          () =>
            uploadThenRecord(file, { kind: "submissions", id: rowId }, (storagePath) =>
              api.submitTaskAction({
                id: rowId,
                taskId: task.id,
                studentId: meId,
                note: st.submitForm.note,
                fileName: file.name,
                sizeBytes: file.size,
                storagePath,
              }),
            ),
          late ? "Terkumpul, ditandai terlambat." : "Tugas berhasil dikumpulkan.",
        );
      },

      subject,
      subjects,
      week,
      dayItems,
      dayEmpty: dayItems.length === 0,
      selectedDayLabel: (() => {
        const d = addDays(weekStart, st.dayIndex + st.weekOffset * 7);
        return DAY_NAMES[st.dayIndex] + ", " + dayOfMonth(d) + " " + monthLong(d);
      })(),

      profileRows: [
        {
          label: "Nilai & rapor",
          value:
            "Rata-rata " +
            (() => {
              const w = gradedItems.reduce((a, i) => a + i.weight, 0) || 1;
              return Math.round(gradedItems.reduce((a, i) => a + i.score * i.weight, 0) / w);
            })(),
          open: () => nav("grades"),
        },
        {
          label: "Notifikasi",
          value: st.notifRead ? "Terbaca" : unreadNotifs + " baru",
          open: openNotifs,
        },
        {
          label: "Kelas & wali kelas",
          value: cls(ME.classId).name + " · " + homeroomName(cls(ME.classId)),
          open: () => nav("subjects"),
        },
        { label: "Data diri", value: "NISN " + ME.nisn, open: () => flash(ME.name + " · " + ME.birth) },
        { label: "Bantuan & masukan", value: "", open: () => flash("Formulir bantuan dibuka.") },
      ],

      adminActions: [
        { abbr: "KL", label: "Kelas & jurusan", meta: st.classes.length + " kelas · 3 jurusan", color: PRIMARY, onColor: "#fff", open: () => nav("tuClasses") },
        { abbr: "MP", label: "Mata pelajaran", meta: st.subjects.length + " mapel terdaftar", color: "#38BDF8", onColor: "#04364A", open: () => nav("adminList") },
        { abbr: "GR", label: "Guru & penugasan", meta: st.teachers.length + " akun guru", color: "#FF6B5A", onColor: "#fff", open: () => nav("tuTeachers") },
        { abbr: "JD", label: "Jadwal kelas", meta: st.slots.filter((s) => s.classId === activeCls.id).length + " slot · " + activeCls.name, color: "#C8F169", onColor: "#26320A", open: () => nav("adminSchedule") },
      ],
      activity: st.activity.map((a) => ({ ...a, time: relativeTime(a.createdAt, clockNow) })),

      formMode: st.editing ? "Edit mata pelajaran" : "Tambah baru",
      formTitle: st.editing ? st.editing : "Mata pelajaran baru",
      form: st.form,
      colorChoices: COLORS.map((c, i) => ({
        color: c.color,
        ring: st.colorIndex === i ? "#14121F" : "transparent",
        pick: () => setState({ colorIndex: i }),
      })),
      onFormName: (e) => setState({ form: { ...st.form, name: e.target.value } }),
      saveForm: () => {
        nav("adminList");
        flash("Perubahan tersimpan.");
      },
      goAddForm: () =>
        setState({
          screen: "adminForm",
          editing: null,
          colorIndex: 0,
          form: { name: "" },
        }),
      goAdminList: () => nav("adminList"),
      goAdminHome: () => nav(isGuru ? "guruHome" : "adminHome"),
      goHome: () => nav("home"),
      goTasks: () => nav("tasks"),
      goSubjects: () => nav("subjects"),
      goProfile: () => nav("profile"),
      // Keluar melepas persona, bukan sandbox: data pengunjung harus masih ada
      // saat ia masuk lagi, termasuk sebagai peran yang berbeda.
      logout: () => mutate({ screen: "login" }, () => api.logoutAction()),

      roleCards: [
        { id: "siswa", label: "Siswa", meta: "Tugas & jadwal", tint: "#EFEBFF" },
        { id: "guru", label: "Guru", meta: "Tugas & materi", tint: "#E9FBF3" },
        { id: "tu", label: "TU", meta: "Data sekolah", tint: "#FFF7DB" },
      ].map((r) => ({
        ...r,
        pick: () => setState({ role: r.id }),
        bg: st.role === r.id ? "#6D4AFF" : "#fff",
        border: st.role === r.id ? "#6D4AFF" : "rgba(20,18,31,.08)",
        ink: st.role === r.id ? "#fff" : "#14121F",
        metaInk: st.role === r.id ? "rgba(255,255,255,.8)" : "#8B8799",
        dotBg: st.role === r.id ? "rgba(255,255,255,.24)" : r.tint,
        shadow: st.role === r.id ? "0 10px 24px -12px rgba(109,74,255,.9)" : "none",
      })),
      isGuruLogin: isGuru,
      guruAccounts: st.teachers.slice(0, 2).map((t) => ({
        name: t.name,
        email: t.email,
        initials: t.initials,
        subjectLabel:
          tSubjectIds(t)
            .map((id) => subj(id).name)
            .join(", ") +
          " · " +
          tClassIds(t)
            .map((id) => cls(id).name)
            .join(", "),
        pick: () => setState({ guruId: t.id, loginEmail: t.email }),
        bg: st.guruId === t.id ? "#F1EEFF" : "#fff",
        border: st.guruId === t.id ? "#6D4AFF" : "rgba(20,18,31,.08)",
        ink: st.guruId === t.id ? "#5334E0" : "#14121F",
      })),
      loginEmail: st.loginTouched
        ? st.loginEmail
        : isTU
          ? TU_ACCOUNT.email
          : isGuru
            ? guru.email
            : "alya.p@nusantara1.sch.id",
      loginPass: st.loginPass,
      loginEmailLabel: isTU ? "Email staf TU" : isGuru ? "Email guru" : "Email siswa",
      onLoginEmail: (e) => setState({ loginEmail: e.target.value, loginTouched: true }),
      onLoginPass: (e) => setState({ loginPass: e.target.value }),
      /**
       * Tombol Masuk hanya memilih peran — desainnya tidak pernah memeriksa
       * password, dan itu dipertahankan. Yang baru: perannya juga dikirim ke
       * server, supaya aksi tulis bisa dicocokkan dengan peran yang dipakai dan
       * muat ulang tidak mengembalikan pengunjung ke layar siswa.
       *
       * Lewat `mutate()` seperti tulisan lain: pindah layarnya seketika, dan
       * kalau server menolak, layarnya kembali ke login dengan alasannya.
       */
      doLogin: () => {
        const patch = { screen: "home" };
        if (st.role === "tu") patch.screen = "adminHome";
        if (st.role === "guru") {
          const c = cls(tClassIds(guru)[0]);
          patch.screen = "guruHome";
          patch.adminClass = c.id;
          patch.adminMajor = c.major;
          patch.tuLevel = c.level;
        }
        mutate(patch, () => api.loginAction({ role: st.role, guruId: guru.id }));
      },
      toast: st.toast,

      // ===== v2: Nilai siswa =====
      goGrades: () => nav("grades"),
      goTuProfile: () => nav("tuProfile"),
      gradeSummary: (() => {
        const items = gradedItems;
        const ink = (v) => (v >= 85 ? "#0E9F6E" : v >= 70 ? "#8A6100" : "#C2302F");
        const rows = st.subjects.map((s) => {
          const mine = items.filter((i) => i.subjectId === s.id);
          const wsum = mine.reduce((a, i) => a + i.weight, 0) || 1;
          const avg = Math.round(mine.reduce((a, i) => a + i.score * i.weight, 0) / wsum);
          return {
            id: s.id,
            name: s.name,
            abbr: s.abbr,
            color: s.color,
            tint: s.tint,
            ink: s.ink,
            avg,
            avgInk: ink(avg),
            barWidth: avg + "%",
            count: mine.length + " tugas dinilai",
            items: mine.map((i) => ({
              ...i,
              // Selalu absolut. Desain sendiri tidak konsisten di sini — nilai
              // bawaan memakai tanggal, nilai yang baru masuk memakai
              // "Hari ini" — dan satu aturan menjaga keduanya sama.
              date: shortDate(i.gradedAt),
              weightLabel: "Bobot " + i.weight + "%",
              scoreInk: ink(i.score),
            })),
          };
        }).filter((r) => r.items.length);
        const all = rows.length ? Math.round(rows.reduce((a, r) => a + r.avg, 0) / rows.length) : 0;
        return {
          rows,
          average: all,
          averageInk: ink(all),
          note: "Rata-rata berbobot dari " + items.length + " tugas yang sudah dinilai guru · Semester Ganjil",
          best: rows.slice().sort((a, b) => b.avg - a.avg)[0] || { name: "—", avg: 0 },
        };
      })(),

      // ===== v2: Notifikasi siswa =====
      goNotifs: openNotifs,
      notifUnread: st.notifRead ? 0 : unreadNotifs,
      notifHasUnread: !st.notifRead,
      notifDot: st.notifRead ? "transparent" : "#FF6B5A",
      notifItems: st.notifications.map((n) => ({
        ...n,
        time: relativeTime(n.createdAt, clockNow),
        ...(NOTIF_TONE[n.kind] || NOTIF_TONE.Deadline),
        // Latar baris ditentukan `readAt`, bukan flag global "sudah dibuka" —
        // supaya membuka layar notifikasi tidak mengubah tampilan tiap baris.
        unreadBg: n.readAt ? "#fff" : "#FBFAFE",
        open: () => {
          const target = n.target || {};
          // Notifikasi dari aksi nyata menunjuk id tugas langsung; yang dari
          // seed memakai nomor 1–8 seperti katalog desain.
          const taskId = target.taskId || (target.legacyTaskNo && taskByLegacyNo(target.legacyTaskNo));
          if (taskId) {
            setState({ screen: "taskDetail", taskId });
            return;
          }
          nav(target.screen || "home");
        },
      })),

      // ===== v2: Kalender berpindah minggu =====
      prevWeek: () => setState({ weekOffset: st.weekOffset - 1 }),
      nextWeek: () => setState({ weekOffset: st.weekOffset + 1 }),
      weekLabel: (() => {
        const from = addDays(weekStart, st.weekOffset * 7);
        return (
          monthLong(from) +
          " " +
          yearOf(from) +
          " · minggu " +
          dayOfMonth(from) +
          "–" +
          dayOfMonth(addDays(from, 6))
        );
      })(),

      // ===== v2: Buka file materi =====
      sheetFile: st.sheet === "file",
      fileView: st.fileView || { name: "", ext: "", meta: "" },
      downloadFile: () => {
        const path = st.fileView && st.fileView.path;
        setState({ sheet: null });
        flash("File diunduh ke perangkat.");
        // Tanpa penyimpanan (mode default), barisnya ada tapi byte-nya tidak —
        // toast-nya tetap muncul, tapi tidak ada yang bisa diunduh.
        if (!path || frozen) return;
        api
          .fileUrlAction({ path })
          .then((res) => {
            if (res && res.url) window.open(res.url, "_blank", "noopener");
          })
          .catch(() => {});
      },

      // ===== v2: Pengumpulan & penilaian (guru) =====
      submission: (() => {
        const t = st.tasks.find((x) => x.id === st.subTaskId) || clsTasks[0] || st.tasks[0];
        if (!t) return null;
        const s = subj(t.subjectId);
        const rows = submissionsFor(t);
        const sent = rows.filter((r) => r.isSent).length;
        const graded = rows.filter((r) => r.isGraded).length;
        const opens = rows.filter((r) => r.isOpen);
        return {
          title: t.title,
          subject: s.name,
          tint: s.tint,
          ink: s.ink,
          color: s.color,
          className: cls(t.classId).name,
          deadline: formatDeadline(t.dueAt),
          weight: t.weightPct + "%",
          sent,
          graded,
          open: opens.length,
          total: rows.length,
          countLabel: sent + graded + " dari " + rows.length + " siswa sudah mengumpulkan",
          hasOpen: opens.length > 0,
          remindLabel: "Ingatkan " + opens.length + " siswa yang belum",
          remindAll: () => flash("Pengingat dikirim ke " + opens.length + " siswa."),
          rows: rows.map((r) => ({
            ...r,
            stateLabel: r.isGraded ? "Nilai " + r.score : r.isSent ? "Terkumpul" : "Belum",
            stateBg: r.isGraded ? "#0E9F6E" : r.isSent ? "#E9FBF3" : "rgba(20,18,31,.055)",
            stateInk: r.isGraded ? "#fff" : r.isSent ? "#0B7A55" : "#5C5872",
            grade: () =>
              setState({
                sheet: "grade",
                gradeForm: {
                  taskId: t.id,
                  // Nama siswa tidak unik antar kelas, jadi yang dibawa id-nya.
                  studentId: r.id,
                  student: r.name,
                  score: r.score != null ? String(r.score) : "",
                  note: r.note || "",
                },
              }),
            remind: () => flash("Pengingat dikirim ke " + r.name.split(" ")[0] + "."),
          })),
        };
      })(),
      sheetGrade: st.sheet === "grade",
      gradeForm: st.gradeForm,
      gradeSheetName: st.gradeForm.student,
      onGradeScore: (e) => setState({ gradeForm: { ...st.gradeForm, score: e.target.value } }),
      onGradeNote: (e) => setState({ gradeForm: { ...st.gradeForm, note: e.target.value } }),
      saveGrade: () => {
        const f = st.gradeForm;
        const n = Math.max(0, Math.min(100, Number(f.score)));
        // Validasi tetap murni di klien: tidak ada gunanya bolak-balik ke server
        // untuk memberi tahu bahwa kolomnya kosong.
        if (!f.score || isNaN(n)) {
          flash("Masukkan nilai 0–100.");
          return;
        }
        const existing = subFor(f.taskId, f.studentId);
        const rowId = existing ? existing.id : newId("sub");
        mutate(
          {
            sheet: null,
            submissions: upsertSubmission(f.taskId, f.studentId, rowId, {
              score: n,
              note: f.note,
              gradedAt: clockNow,
              // Menilai berarti tugasnya memang masuk, walau belum tercatat.
              submittedAt: (existing || {}).submittedAt || clockNow,
            }),
          },
          () =>
            api.gradeSubmissionAction({
              id: rowId,
              taskId: f.taskId,
              studentId: f.studentId,
              score: n,
              note: f.note,
            }),
          "Nilai " + f.student.split(" ")[0] + " disimpan: " + n + ".",
        );
      },
      goSubmissionsBack: () => nav("adminTasks"),

      // ===== v2: Kelola kelas & siswa =====
      classSheetTitle: st.classForm.editId ? "Ubah kelas" : "Tambah kelas",
      editClass: () =>
        setState({
          sheet: "class",
          classForm: {
            editId: activeCls.id,
            name: activeCls.name,
            level: activeCls.level,
            major: activeCls.major,
            homeroom: activeCls.homeroomTeacherId,
          },
        }),
      deleteClass: () => {
        const nm = activeCls.name;
        const gone = activeCls.id;
        const rest = st.classes.filter((c) => c.id !== gone);
        const keptTasks = st.tasks.filter((t) => t.classId !== gone);
        const keptStudents = st.students.filter((s) => s.classId !== gone);
        const keptTaskIds = new Set(keptTasks.map((t) => t.id));
        const keptStudentIds = new Set(keptStudents.map((s) => s.id));
        mutate(
          {
            screen: "tuClasses",
            classes: rest,
            adminClass: (rest[0] || { id: "" }).id,
            slots: st.slots.filter((s) => s.classId !== gone),
            tasks: keptTasks,
            students: keptStudents,
            // Pengumpulan yang induknya hilang ikut dibuang, supaya tidak ada
            // baris menggantung yang membuat hitungan jadi salah.
            submissions: st.submissions.filter(
              (s) => keptTaskIds.has(s.taskId) && keptStudentIds.has(s.studentId),
            ),
            teachingAssignments: st.teachingAssignments.filter((a) => a.classId !== gone),
          },
          () => api.deleteClassAction({ id: gone }),
          "Kelas " + nm + " dihapus.",
        );
      },
      addStudent: () => setState({ sheet: "student", studentForm: { name: "", nis: "" } }),
      sheetStudent: st.sheet === "student",
      studentForm: st.studentForm,
      studentSheetClass: activeCls.name,
      onStudentName: (e) => setState({ studentForm: { ...st.studentForm, name: e.target.value } }),
      onStudentNis: (e) => setState({ studentForm: { ...st.studentForm, nis: e.target.value } }),
      saveStudent: () => {
        const f = st.studentForm;
        if (!f.name.trim()) {
          flash("Nama siswa belum diisi.");
          return;
        }
        const list = st.students.filter((s) => s.classId === activeCls.id);
        const nm = f.name.trim();
        const row = {
          id: newId("s"),
          classId: activeCls.id,
          name: nm,
          nis: f.nis || "22" + (10400 + list.length + 1),
          initials: initialsOf(nm),
        };
        mutate(
          {
            sheet: null,
            students: st.students.concat([{ ...row, nisn: null, isMe: false, sortOrder: st.students.length }]),
          },
          () => api.addStudentAction(row),
          nm + " ditambahkan ke " + activeCls.name + ".",
        );
      },

      // ===== v2: Profil TU =====
      tuName: TU_ACCOUNT.degree,
      tuEmail: TU_ACCOUNT.email,
      tuRole: TU_ACCOUNT.role,
      tuIdentityRows: [
        { label: "NIP", value: TU_ACCOUNT.nip },
        { label: "Telepon", value: TU_ACCOUNT.phone },
        { label: "Unit kerja", value: SCHOOL.full },
        { label: "Bertugas sejak", value: String(TU_ACCOUNT.since) },
      ],
      tuInitials: TU_ACCOUNT.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2),
      tuProfileRows: [
        { label: "Kelas terdaftar", value: st.classes.length + " kelas" },
        { label: "Mata pelajaran", value: st.subjects.length + " mapel" },
        { label: "Akun guru", value: st.teachers.length + " guru" },
        { label: "Slot jadwal", value: st.slots.length + " slot" },
      ],
      slotError: st.slotError,
      hasSlotError: !!st.slotError,

      goAdminSchedule: () => nav("adminSchedule"),
      goAdminMaterials: () => nav("adminMaterials"),
      goAdminTasks: () => nav("adminTasks"),
      goGuruHome: () => nav("guruHome"),
      goGuruProfile: () => nav("guruProfile"),
      showMaterialFilter: !isGuru || scopeSubjects.length > 1,
      guruScheduleNote: "Ditetapkan oleh TU · tidak bisa diubah dari sini",
      goTuClasses: () => nav("tuClasses"),
      goTuTeachers: () => nav("tuTeachers"),
      isGuru,
      isTU,
      adminBackLabel: isGuru ? "Panel Guru" : "Panel TU",
      backHome: () => nav(isGuru ? "guruHome" : "adminHome"),

      guruName: guru.degree || guru.name,
      guruEmail: guru.email,
      guruInitials: guru.initials,
      guruNip: guru.nip || "—",
      guruStatus: guru.status || "—",
      guruSubjectLabel: guruSubjectIds.map((id) => subj(id).name).join(" · "),
      guruLevelLabel: uniq(guruClassIds.map((id) => cls(id).level))
        .map((l) => "Kelas " + l)
        .join(" · "),
      materialOwnerLabel: isGuru ? guru.name : "Semua mata pelajaran",
      guruClassCount: guruClassIds.length,
      guruSubjectCount: guruSubjectIds.length,
      guruTaskCount: st.tasks.filter(
        (t) =>
          !t.isArchived &&
          guruSubjectIds.indexOf(t.subjectId) !== -1 &&
          guruClassIds.indexOf(t.classId) !== -1,
      ).length,
      guruMaterialCount: st.materials.filter((m) => guruSubjectIds.indexOf(m.subjectId) !== -1).length,
      guruAssignmentCards: groupedAssignments(guru.id).map((a) => {
        const s = subj(a.subjectId);
        return {
          name: s.name,
          abbr: s.abbr,
          color: s.color,
          onColor: s.onColor,
          tint: s.tint,
          ink: s.ink,
          classLabel: a.classIds.map((id) => cls(id).name).join(", "),
          classes: a.classIds.map((id) => {
            const c = cls(id);
            const n = activeTasks(id).filter((t) => t.subjectId === a.subjectId).length;
            return {
              name: c.name,
              taskLabel: n + " tugas",
              open: () => setState({ screen: "adminTasks", adminClass: id, adminMajor: c.major, tuLevel: c.level }),
            };
          }),
        };
      }),
      guruClassChips: guruClassIds.map((id) => {
        const c = cls(id);
        return {
          label: c.name,
          pick: () => setState({ adminClass: id, adminMajor: c.major, tuLevel: c.level }),
          bg: st.adminClass === id ? "#14121F" : "#fff",
          ink: st.adminClass === id ? "#fff" : "#5C5872",
          border: st.adminClass === id ? "#14121F" : "rgba(20,18,31,.09)",
        };
      }),
      guruDayGroups: DAY_NAMES.slice(0, 5).map((day) => {
        const items = st.slots
          .filter(
            (sl) =>
              sl.day === day &&
              guruClassIds.indexOf(sl.classId) !== -1 &&
              guruSubjectIds.indexOf(sl.subjectId) !== -1,
          )
          .sort((a, b) => a.start.localeCompare(b.start));
        return {
          day,
          countLabel: items.length + " kelas",
          hasItems: items.length > 0,
          isEmpty: items.length === 0,
          items: items.map((sl) => {
            const s = subj(sl.subjectId);
            return {
              name: s.name,
              abbr: s.abbr,
              color: s.color,
              tint: s.tint,
              ink: s.ink,
              className: cls(sl.classId).name,
              time: sl.start + "–" + sl.end,
              room: sl.room,
            };
          }),
        };
      }),
      guruProfileRows: groupedAssignments(guru.id).map((a) => ({
        label: subj(a.subjectId).name,
        value: a.classIds.map((id) => cls(id).name).join(", "),
      })),

      tuLevelGroups: LEVELS.map((level) => {
        const items = st.classes.filter((c) => c.level === level);
        return {
          level: "Tingkat " + level,
          countLabel: items.length + " kelas",
          items: items.map((c) => ({
            name: c.name,
            major: c.major,
            homeroom: homeroomName(c),
            students: studentCount(c.id) + " siswa",
            tint: c.major === "IPA" ? "#F1EEFF" : c.major === "IPS" ? "#E9FBF3" : "#FFF7DB",
            ink: c.major === "IPA" ? "#5334E0" : c.major === "IPS" ? "#0B7A55" : "#8A6100",
            open: () =>
              setState({ screen: "tuClassDetail", adminClass: c.id, adminMajor: c.major, tuLevel: c.level }),
          })),
        };
      }),
      tuClass: (() => {
        const homeroomT = homeroomOf(activeCls);
        const slots = st.slots.filter((s) => s.classId === activeCls.id);
        const list = roster(activeCls);
        return {
          name: activeCls.name,
          level: "Tingkat " + activeCls.level,
          major: activeCls.major,
          tint: activeCls.major === "IPA" ? "#F1EEFF" : activeCls.major === "IPS" ? "#E9FBF3" : "#FFF7DB",
          ink: activeCls.major === "IPA" ? "#5334E0" : activeCls.major === "IPS" ? "#0B7A55" : "#8A6100",
          room: activeCls.roomName || "Ruang kelas",
          roomLabel: (() => {
            const rn = activeCls.roomName || "Ruang kelas";
            const ri = roomInfo(rn);
            return ri ? rn + " (" + ri.code + " · lantai " + ri.floor + ")" : rn;
          })(),
          homeroom: homeroomName(activeCls),
          homeroomInitials: homeroomT ? homeroomT.initials : "—",
          homeroomEmail: homeroomT ? homeroomT.email : "—",
          homeroomSubject: homeroomT
            ? tSubjectIds(homeroomT)
                .map((id) => subj(id).name)
                .join(", ")
            : "—",
          students: list.length,
          subjectCount: classSubjects(activeCls.id).length,
          teacherCount: st.teachers.filter((t) => tClassIds(t).indexOf(activeCls.id) !== -1).length,
          slotLabel: slots.length + " slot jadwal · 5 hari",
          roster: list.map((r) => ({
            ...r,
            remove: () => {
              mutate(
                {
                  students: st.students.filter((x) => x.id !== r.id),
                  submissions: st.submissions.filter((x) => x.studentId !== r.id),
                },
                () => api.removeStudentAction({ id: r.id }),
                r.name + " dikeluarkan dari " + activeCls.name + ".",
              );
            },
          })),
          rosterLabel: list.length + " siswa · urut abjad",
          subjectRows: classSubjects(activeCls.id).map((s) => ({
            name: s.name,
            abbr: s.abbr,
            color: s.color,
            onColor: s.onColor,
            tint: s.tint,
            ink: s.ink,
            teacher: teacherOf(s.id, activeCls.id),
            meta: st.slots
              .filter((x) => x.classId === activeCls.id && x.subjectId === s.id)
              .map((x) => x.day + " " + x.start)
              .join(" · "),
          })),
          openSchedule: () => nav("adminSchedule"),
        };
      })(),
      tuClassChips: st.classes.map((c) => ({
        label: c.name,
        pick: () => setState({ adminClass: c.id, adminMajor: c.major, tuLevel: c.level }),
        bg: st.adminClass === c.id ? "#14121F" : "#fff",
        ink: st.adminClass === c.id ? "#fff" : "#5C5872",
        border: st.adminClass === c.id ? "#14121F" : "rgba(20,18,31,.09)",
      })),
      deleteSlot,
      classCountLabel: st.classes.length + " kelas · " + MAJORS.length + " jurusan",
      addClass: () =>
        setState({
          sheet: "class",
          classForm: { name: "", level: st.tuLevel, major: st.adminMajor, homeroom: st.teachers[0].id },
        }),
      classForm: st.classForm,
      onClassName: (e) => setState({ classForm: { ...st.classForm, name: e.target.value } }),
      onClassLevel: (v) => setState({ classForm: { ...st.classForm, level: v } }),
      onClassMajor: (v) => setState({ classForm: { ...st.classForm, major: v } }),
      onClassHomeroom: (v) => setState({ classForm: { ...st.classForm, homeroom: v } }),
      saveClass,
      levelOptions: LEVELS,
      majorOptions: MAJORS,
      teacherOptions: st.teachers.map((t) => ({ id: t.id, name: t.name })),

      teacherList: st.teachers.map((t) => ({
        name: t.name,
        email: t.email,
        initials: t.initials,
        meta:
          tSubjectIds(t)
            .map((id) => subj(id).name)
            .join(", ") +
          " · " +
          tClassIds(t).length +
          " kelas",
        open: () => setState({ screen: "tuTeacherDetail", tuTeacherId: t.id }),
      })),
      teacherCountLabel: st.teachers.length + " akun guru terdaftar",
      tuTeacher: (() => {
        const t = teacher(st.tuTeacherId);
        const homerooms = st.classes.filter((c) => c.homeroomTeacherId === t.id).map((c) => c.name);
        return {
          name: t.degree || t.name,
          email: t.email,
          initials: t.initials,
          info: [
            { label: "NIP", value: t.nip || "—" },
            { label: "Status", value: (t.status || "—") + " · sejak " + (t.since || "—") },
            { label: "Telepon", value: t.phone || "—" },
            { label: "Wali kelas", value: homerooms.length ? homerooms.join(", ") : "Tidak menjadi wali kelas" },
          ],
          subjectCount: tSubjectIds(t).length,
          classCount: tClassIds(t).length,
          assignments: groupedAssignments(t.id).map((a) => {
            const s = subj(a.subjectId);
            return {
              name: s.name,
              abbr: s.abbr,
              color: s.color,
              onColor: s.onColor,
              tint: s.tint,
              ink: s.ink,
              classes: a.classIds.map((id) => cls(id).name),
              classLabel: a.classIds.length + " kelas",
              edit: () =>
                setState({
                  sheet: "assign",
                  assignForm: { teacherId: t.id, subjectId: a.subjectId, classIds: a.classIds.slice(), replace: true },
                }),
              remove: () =>
                mutate(
                  {
                    teachingAssignments: st.teachingAssignments.filter(
                      (x) => !(x.teacherId === t.id && x.subjectId === a.subjectId),
                    ),
                  },
                  () => api.removeAssignmentAction({ teacherId: t.id, subjectId: a.subjectId }),
                  "Penugasan " + s.name + " dihapus.",
                ),
            };
          }),
        };
      })(),
      addAssign: () =>
        setState({ sheet: "assign", assignForm: { teacherId: st.tuTeacherId, subjectId: "mat", classIds: [] } }),
      assignForm: st.assignForm,
      assignSheetTitle: st.assignForm.replace ? "Ubah penugasan" : "Tambah penugasan",
      assignTeacherName: teacher(st.assignForm.teacherId).name,
      assignTeacherOptions: st.teachers.map((t) => ({ id: t.id, name: t.name })),
      assignSubjectOptions: st.subjects.map((s) => ({ id: s.id, name: s.name })),
      assignClassChips: st.classes.map((c) => ({
        label: c.name,
        on: st.assignForm.classIds.indexOf(c.id) !== -1,
        pick: () => {
          const ids = st.assignForm.classIds;
          setState({
            assignForm: {
              ...st.assignForm,
              classIds: ids.indexOf(c.id) !== -1 ? ids.filter((x) => x !== c.id) : ids.concat([c.id]),
            },
          });
        },
        bg: st.assignForm.classIds.indexOf(c.id) !== -1 ? "#F1EEFF" : "#F7F6FB",
        ink: st.assignForm.classIds.indexOf(c.id) !== -1 ? "#5334E0" : "#6B6880",
        border: st.assignForm.classIds.indexOf(c.id) !== -1 ? "#6D4AFF" : "rgba(20,18,31,.09)",
      })),
      onAssignTeacher: (v) => setState({ assignForm: { ...st.assignForm, teacherId: v } }),
      onAssignSubject: (v) => setState({ assignForm: { ...st.assignForm, subjectId: v } }),
      saveAssign,
      sheetClass: st.sheet === "class",
      sheetAssign: st.sheet === "assign",

      className: activeCls.name,
      classHomeroom: "Wali kelas " + homeroomName(activeCls),
      classStudents: activeClassSize,
      classNewMaterials: activeCls.newMaterials,
      classSubjectCount: clsSubjects.length,
      classTaskCount: clsTasks.length,
      classOptions: st.classes.map((c) => ({ id: c.id, name: c.name + " · " + c.major })),
      tuStats: [
        { value: st.classes.length, label: "Kelas", bg: "#F1EEFF", ink: "#5334E0" },
        { value: st.students.length, label: "Siswa", bg: "#E9FBF3", ink: "#0B7A55" },
        { value: st.teachers.length, label: "Guru", bg: "#FFF7DB", ink: "#8A6100" },
        { value: st.subjects.length, label: "Mapel", bg: "#E6F6FE", ink: "#0A6D91" },
      ],
      activeClassName: activeCls.name,
      activeClassMeta:
        "Wali kelas " +
        homeroomName(activeCls) +
        " · " +
        activeClassSize +
        " siswa · " +
        (activeCls.roomName || "ruang kelas"),
      openActiveClass: () => setState({ screen: "tuClassDetail" }),
      classTeacherCount: st.teachers.filter((t) => tClassIds(t).indexOf(activeCls.id) !== -1).length,

      adminSubjectList: st.subjects.map((s) => ({
        ...s,
        slotLabel: st.teachers.filter((t) => tSubjectIds(t).indexOf(s.id) !== -1).length + " guru mengampu",
        edit: () =>
          setState({
            screen: "adminForm",
            editing: s.name,
            colorIndex: COLORS.findIndex((c) => c.color === s.color),
            form: { ...st.form, name: s.name },
          }),
        remove: () => {
          // Menghapus mapel yang masih terpakai akan meninggalkan slot jadwal
          // dan tugas tanpa induk, jadi ditolak dengan alasannya — bukan
          // dihapus diam-diam seperti sebelumnya.
          const slotUses = st.slots.filter((x) => x.subjectId === s.id).length;
          const taskUses = st.tasks.filter((x) => x.subjectId === s.id && !x.isArchived).length;
          if (slotUses || taskUses) {
            flash(
              "Masih dipakai di " +
                [slotUses && slotUses + " slot jadwal", taskUses && taskUses + " tugas"].filter(Boolean).join(" · ") +
                ".",
            );
            return;
          }
          mutate(
            {
              subjects: st.subjects.filter((x) => x.id !== s.id),
              teachingAssignments: st.teachingAssignments.filter((a) => a.subjectId !== s.id),
            },
            () => api.deleteSubjectAction({ id: s.id }),
            "Mata pelajaran " + s.name + " dihapus.",
          );
        },
      })),
      subjectRegistryLabel: st.subjects.length + " mata pelajaran terdaftar",
      onClassChange: (v) => setState({ adminClass: v }),
      adminClass: st.adminClass,

      adminTaskList: clsTasks.map((t) => {
        const s = subj(t.subjectId);
        const submitted = submittedCount(t.id);
        return {
          ...t,
          subject: s.name,
          tint: s.tint,
          ink: s.ink,
          color: s.color,
          weight: t.weightPct + "%",
          deadline: formatDeadline(t.dueAt),
          edit: () =>
            setState({
              screen: "adminTaskForm",
              taskForm: {
                ...st.taskForm,
                editId: t.id,
                subjectId: t.subjectId,
                title: t.title,
                desc: t.desc || "",
                kind: t.kind,
                groupSize: t.groupSize || "4",
                date: isoDate(t.dueAt),
                time: hhmm(t.dueAt),
                weight: String(t.weightPct),
              },
            }),
          remove: () => {
            mutate(
              {
                tasks: st.tasks.filter((x) => x.id !== t.id),
                submissions: st.submissions.filter((x) => x.taskId !== t.id),
              },
              () => api.deleteTaskAction({ id: t.id }),
              'Tugas "' + t.title + '" dihapus.',
            );
          },
          submitLabel: submitted + "/" + activeClassSize + " siswa submit",
          barWidth: Math.round((submitted / activeClassSize) * 100) + "%",
          barColor: submitted === 0 ? "#E4E1EF" : submitted / activeClassSize > 0.5 ? "#10B981" : "#FACC15",
          openSubs: () => setState({ screen: "submissions", subTaskId: t.id }),
        };
      }),
      adminTasksEmpty: clsTasks.length === 0,
      adminTaskCountLabel: clsTasks.length + " tugas aktif · " + activeClassSize + " siswa",
      goTaskForm: () =>
        setState({
          screen: "adminTaskForm",
          taskForm: {
            ...st.taskForm,
            editId: null,
            subjectId: (formSubjects[0] || st.subjects[0]).id,
            title: "",
            desc: "",
          },
        }),
      taskForm: st.taskForm,
      taskFormEyebrow: st.taskForm.editId ? "Ubah Tugas" : "Tugas Baru",
      taskFormTitle: st.taskForm.editId ? "Ubah tugas" : "Tugas baru",
      taskFormNote: st.taskForm.editId
        ? "Perubahan langsung terlihat oleh siswa " + activeCls.name + ". Progres pengumpulan tetap tersimpan."
        : "Akan di-assign ke " +
          activeCls.name +
          " · " +
          (isGuru
            ? "Hanya mata pelajaran yang kamu ampu di kelas ini."
            : "Mata pelajaran yang diajarkan di kelas ini."),
      taskFormSubjects: formSubjects.map((s) => ({ id: s.id, name: s.name })),
      taskFormScopeNote: isGuru
        ? "Hanya mata pelajaran yang kamu ampu di kelas ini."
        : "Mata pelajaran yang diajarkan di kelas ini.",
      taskFormClass: activeCls.name,
      kindChips: TASK_KINDS.map((k) => ({
        label: k,
        pick: () => setState({ taskForm: { ...st.taskForm, kind: k } }),
        bg: st.taskForm.kind === k ? "#14121F" : "#fff",
        ink: st.taskForm.kind === k ? "#fff" : "#5C5872",
        border: st.taskForm.kind === k ? "#14121F" : "rgba(20,18,31,.1)",
      })),
      isGroupTask: st.taskForm.kind === "Kelompok",
      onTaskSubject: (v) => setState({ taskForm: { ...st.taskForm, subjectId: v } }),
      onTaskTitle: (e) => setState({ taskForm: { ...st.taskForm, title: e.target.value } }),
      onTaskDesc: (e) => setState({ taskForm: { ...st.taskForm, desc: e.target.value } }),
      onTaskGroupSize: (e) => setState({ taskForm: { ...st.taskForm, groupSize: e.target.value } }),
      onTaskDate: (e) => setState({ taskForm: { ...st.taskForm, date: e.target.value } }),
      onTaskTime: (e) => setState({ taskForm: { ...st.taskForm, time: e.target.value } }),
      onTaskWeight: (e) => setState({ taskForm: { ...st.taskForm, weight: e.target.value } }),
      saveTask: () => {
        const f = st.taskForm;
        const fields = {
          subjectId: f.subjectId,
          title: f.title || "Tugas baru tanpa judul",
          desc: f.desc,
          kind: f.kind,
          groupSize: Number(f.groupSize) || 4,
          dueAt: fromDateAndTime(f.date, f.time) || clockNow,
          weightPct: Number(f.weight) || 0,
        };
        const teacherId = isGuru ? guru.id : null;
        if (f.editId) {
          mutate(
            {
              screen: "adminTasks",
              tasks: st.tasks.map((t) => (t.id === f.editId ? { ...t, ...fields } : t)),
            },
            () => api.saveTaskAction({ editId: f.editId, classId: activeCls.id, teacherId, fields }),
            "Perubahan tugas disimpan",
          );
        } else {
          const id = newId("t");
          mutate(
            {
              screen: "adminTasks",
              tasks: st.tasks.concat([
                { id, classId: activeCls.id, teacherId, isArchived: false, files: [], legacyNo: null, ...fields },
              ]),
            },
            () => api.saveTaskAction({ id, classId: activeCls.id, teacherId, fields }),
            "Tugas berhasil ditambahkan",
          );
        }
      },

      scheduleGroups: DAY_NAMES.slice(0, 5).map((day) => {
        const items = st.slots
          .filter((sl) => sl.day === day && sl.classId === st.adminClass)
          .sort((a, b) => a.start.localeCompare(b.start));
        const isOpen = !!st.expanded[day];
        return {
          day,
          isOpen,
          isClosed: !isOpen,
          countLabel: items.length + " jadwal",
          toggle: () => setState({ expanded: { ...st.expanded, [day]: !isOpen } }),
          items: items.map((sl) => {
            const s = subj(sl.subjectId);
            return {
              name: s.name,
              color: s.color,
              tint: s.tint,
              ink: s.ink,
              abbr: s.abbr,
              teacher: teacherOf(sl.subjectId, sl.classId),
              time: sl.start + "–" + sl.end,
              room: sl.room,
              edit: () =>
                setState({
                  sheet: "slot",
                  slotForm: {
                    id: sl.id,
                    subjectId: sl.subjectId,
                    day: sl.day,
                    start: sl.start,
                    end: sl.end,
                    room: sl.room,
                  },
                }),
            };
          }),
        };
      }),
      slotCountLabel: st.slots.filter((s) => s.classId === st.adminClass).length + " slot jadwal · 5 hari aktif",
      scheduleClassOptions: st.classes.map((c) => ({ id: c.id, name: c.name + " · " + c.major })),
      onScheduleClass: (v) => {
        const c = st.classes.find((x) => x.id === v);
        setState({ adminClass: c.id, adminMajor: c.major, tuLevel: c.level });
      },
      scheduleRoomNote: "Ruang kelas: " + (activeCls.roomName || "belum ditetapkan"),
      addSlot: () =>
        setState({
          sheet: "slot",
          slotForm: {
            id: null,
            classId: st.adminClass,
            subjectId: "mat",
            day: "Senin",
            start: "",
            end: "",
            room: LAB_ROOMS["mat"] || activeCls.roomName || ROOMS[0].name,
          },
        }),
      slotForm: st.slotForm,
      sheetSlot: st.sheet === "slot",
      sheetUpload: st.sheet === "upload",
      sheetOpen: !!st.sheet,
      closeSheet,
      sheetTitle: st.slotForm.id ? "Ubah jam & ruangan" : "Tambah slot jadwal",
      sheetSubjectName: subj(st.slotForm.subjectId).name,
      slotIsEdit: !!st.slotForm.id,
      slotIsNew: !st.slotForm.id,
      onSlotSubject: (v) =>
        setState({
          slotForm: {
            ...st.slotForm,
            subjectId: v,
            room: st.slotForm.id
              ? st.slotForm.room
              : LAB_ROOMS[v] || cls(st.slotForm.classId || st.adminClass).roomName || ROOMS[0].name,
          },
        }),
      onSlotDay: (v) => setState({ slotForm: { ...st.slotForm, day: v } }),
      onSlotStart: (e) => setState({ slotForm: { ...st.slotForm, start: e.target.value } }),
      onSlotEnd: (e) => setState({ slotForm: { ...st.slotForm, end: e.target.value } }),
      onSlotRoom: (v) => setState({ slotForm: { ...st.slotForm, room: v } }),
      roomOptions: ROOMS.map((r) => ({ name: r.name, label: r.name + " · " + r.code + " · " + r.capacity + " kursi" })),
      saveSlot,
      subjectOptions: st.subjects.map((s) => ({ id: s.id, name: s.name })),
      dayOptions: DAY_NAMES,

      materialFilters: [{ id: "Semua", name: "Semua mapel" }]
        .concat(scopeSubjects.map((s) => ({ id: s.id, name: s.name })))
        .map((s) => ({
          label: s.name,
          pick: () => setState({ materialFilter: s.id }),
          bg: st.materialFilter === s.id ? "#14121F" : "#fff",
          ink: st.materialFilter === s.id ? "#fff" : "#5C5872",
          border: st.materialFilter === s.id ? "#14121F" : "rgba(20,18,31,.09)",
        })),
      materialList: st.materials
        .filter(
          (m) =>
            (!isGuru || guruSubjectIds.indexOf(m.subjectId) !== -1) &&
            (st.materialFilter === "Semua" || m.subjectId === st.materialFilter),
        )
        .map((m) => {
          const s = subj(m.subjectId);
          return {
            ...m,
            subject: s.name,
            tint: s.tint,
            ink: s.ink,
            meta: materialMeta(m),
            open: () => openFile({ ...m, meta: materialMeta(m) }),
            remove: () =>
              mutate(
                { materials: st.materials.filter((x) => x.id !== m.id) },
                () => api.deleteMaterialAction({ id: m.id }),
                "File dihapus.",
              ),
          };
        }),
      materialEmpty:
        st.materials.filter(
          (m) =>
            (!isGuru || guruSubjectIds.indexOf(m.subjectId) !== -1) &&
            (st.materialFilter === "Semua" || m.subjectId === st.materialFilter),
        ).length === 0,
      storageLabel: (() => {
        const scoped = st.materials.filter((m) => !isGuru || guruSubjectIds.indexOf(m.subjectId) !== -1);
        return (
          scoped.length + " file · " + formatTotalSize(scoped.reduce((a, m) => a + m.sizeBytes, 0)) + " terpakai"
        );
      })(),
      openUpload: () => setState({ sheet: "upload" }),
      uploadChips: scopeSubjects.map((s) => ({
        label: s.name,
        pick: () => setState({ uploadSubject: s.id }),
        bg: st.uploadSubject === s.id ? s.tint : "rgba(20,18,31,.045)",
        ink: st.uploadSubject === s.id ? s.ink : "#6B6880",
        border: st.uploadSubject === s.id ? s.color : "transparent",
      })),
      // Nama berkas pilihan menggantikan teks statis dropzone, supaya jelas
      // apa yang akan diunggah. Sebelum ada pilihan, teksnya sama dengan desain.
      materialFileLabel: st.uploadFile ? st.uploadFile.name : "Pilih file dari perangkat",
      onPickMaterial: (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        // Diperiksa di klien supaya penolakannya seketika; server memeriksa lagi.
        const problem = validateUpload(file);
        if (problem) {
          flash(problem);
          return;
        }
        setState({ uploadFile: file });
      },
      doUpload: () => {
        const file = st.uploadFile;
        if (!file) {
          flash("Pilih file dulu.");
          return;
        }
        const s = subj(st.uploadSubject);
        const id = newId("m");
        const row = { id, subjectId: s.id, name: file.name, ext: extensionLabel(file.name), sizeBytes: file.size };
        mutate(
          {
            sheet: null,
            uploadFile: null,
            materialFilter: st.uploadSubject,
            materials: st.materials.concat([{ ...row, createdAt: clockNow }]),
          },
          () =>
            uploadThenRecord(file, { kind: "materials", id }, (storagePath) =>
              api.addMaterialAction({ ...row, teacherId: isGuru ? guru.id : null, storagePath }),
            ),
          "Materi diunggah ke " + s.name + ".",
        );
      },
    };
  }, [st, props.studentName, props.streak, frozen, setState, flash, mutate]);
}
