"use client";

import { useMemo, useState } from "react";

import { reviveSnapshot } from "@/lib/snapshot";
import { useSekelas } from "@/lib/useSekelas";
import { BottomNav, PhoneFrame, StatusBar, Toast } from "@/components/shell";
import { Sheets } from "@/components/sheets";
import { PhoneContainer } from "@/components/ui-sekelas";

import {
  CalendarScreen,
  GradesScreen,
  HelpScreen,
  HomeScreen,
  LoginScreen,
  MyClassScreen,
  MyDataScreen,
  NotifsScreen,
  ProfileScreen,
  SubjectDetailScreen,
  SubjectsScreen,
  TaskDetailScreen,
  TasksScreen,
} from "@/components/screens/siswa";
import {
  AdminFormScreen,
  AdminHomeScreen,
  AdminListScreen,
  AdminMaterialsScreen,
  AdminScheduleScreen,
  AdminTasksScreen,
} from "@/components/screens/admin";
import {
  AdminTaskFormScreen,
  GuruHomeScreen,
  GuruProfileScreen,
  GuruScheduleScreen,
  SubmissionsScreen,
} from "@/components/screens/guru";
import {
  TuClassDetailScreen,
  TuClassesScreen,
  TuProfileScreen,
  TuTeacherDetailScreen,
  TuTeachersScreen,
} from "@/components/screens/tu";

/**
 * One screen is mounted at a time, matching the design's `sc-if` chain.
 * The flag names are the design's own (`isHome`, `isTuClassDetail`, …).
 */
const SCREENS = [
  ["isLogin", LoginScreen],
  ["isHome", HomeScreen],
  ["isTasks", TasksScreen],
  ["isTaskDetail", TaskDetailScreen],
  ["isSubjects", SubjectsScreen],
  ["isSubjectDetail", SubjectDetailScreen],
  ["isCalendar", CalendarScreen],
  ["isProfile", ProfileScreen],
  ["isGrades", GradesScreen],
  ["isMyClass", MyClassScreen],
  ["isMyData", MyDataScreen],
  ["isHelp", HelpScreen],
  ["isNotifs", NotifsScreen],
  ["isAdminHome", AdminHomeScreen],
  ["isAdminList", AdminListScreen],
  ["isAdminForm", AdminFormScreen],
  ["isAdminSchedule", AdminScheduleScreen],
  ["isAdminMaterials", AdminMaterialsScreen],
  ["isAdminTasks", AdminTasksScreen],
  ["isAdminTaskForm", AdminTaskFormScreen],
  ["isGuruHome", GuruHomeScreen],
  ["isGuruSchedule", GuruScheduleScreen],
  ["isGuruProfile", GuruProfileScreen],
  ["isSubmissions", SubmissionsScreen],
  ["isTuClasses", TuClassesScreen],
  ["isTuClassDetail", TuClassDetailScreen],
  ["isTuTeachers", TuTeachersScreen],
  ["isTuTeacherDetail", TuTeacherDetailScreen],
  ["isTuProfile", TuProfileScreen],
];

export function SekelasApp({ snapshot, ...props }) {
  // Snapshot datang dari Server Component lewat JSON, jadi tanggalnya perlu
  // dihidupkan kembali sebelum masuk ke view-model.
  const revived = useMemo(() => reviveSnapshot(snapshot), [snapshot]);
  const v = useSekelas(props, revived);
  // Sheets and select menus portal into the frame so they stay inside the phone.
  const [frame, setFrame] = useState(null);

  return (
    <PhoneContainer.Provider value={frame}>
      <PhoneFrame frameRef={setFrame}>
        <StatusBar />
        {SCREENS.map(([flag, ScreenComponent]) => (v[flag] ? <ScreenComponent key={flag} v={v} /> : null))}
        <Sheets v={v} />
        <Toast v={v} />
        <BottomNav v={v} />
      </PhoneFrame>
    </PhoneContainer.Provider>
  );
}
