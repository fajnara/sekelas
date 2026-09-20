/**
 * Every design frame that must stay pixel-identical, addressed by query param.
 *
 * `frozen=1` is already on every URL even though nothing reads it yet: from
 * Fase 4 onward it means "hydrate from the local seed, never touch the DB", so
 * the harness keeps working unchanged once the backend lands. Today the param
 * is simply ignored by `src/app/page.js`.
 */
const q = (params) => "/?" + new URLSearchParams({ ...params, frozen: "1" }).toString();

export const FRAMES = [
  // ---- Siswa ----
  { id: "siswa-01-login", url: q({ screen: "login" }) },
  { id: "siswa-02-home", url: q({ screen: "home" }) },
  { id: "siswa-03-tasks", url: q({ screen: "tasks" }) },
  { id: "siswa-04-tasks-terkumpul", url: q({ screen: "tasks", statusFilter: "Terkumpul" }) },
  { id: "siswa-05-tasks-empty", url: q({ screen: "tasks", statusFilter: "Dinilai", subjectFilter: "sej" }) },
  { id: "siswa-06-task-detail-open", url: q({ screen: "taskDetail", taskId: "2" }) },
  { id: "siswa-07-task-detail-sheet-submit", url: q({ screen: "taskDetail", taskId: "2", sheet: "submit" }) },
  { id: "siswa-08-task-detail-graded", url: q({ screen: "taskDetail", taskId: "7" }) },
  { id: "siswa-09-subjects", url: q({ screen: "subjects" }) },
  { id: "siswa-10-subject-detail", url: q({ screen: "subjectDetail", subjectId: "fis" }) },
  { id: "siswa-11-calendar", url: q({ screen: "calendar" }) },
  { id: "siswa-12-calendar-weekend", url: q({ screen: "calendar", dayIndex: "5" }) },
  { id: "siswa-13-profile", url: q({ screen: "profile" }) },
  { id: "siswa-14-grades", url: q({ screen: "grades" }) },
  { id: "siswa-15-notifs", url: q({ screen: "notifs" }) },

  // ---- Guru ----
  { id: "guru-01-login", url: q({ screen: "login", role: "guru" }) },
  { id: "guru-02-home-t1", url: q({ screen: "guruHome", role: "guru", guruId: "t1" }) },
  { id: "guru-03-home-t2", url: q({ screen: "guruHome", role: "guru", guruId: "t2" }) },
  { id: "guru-04-tasks", url: q({ screen: "adminTasks", role: "guru", guruId: "t1" }) },
  { id: "guru-05-task-form", url: q({ screen: "adminTaskForm", role: "guru", guruId: "t1" }) },
  { id: "guru-06-task-form-kelompok", url: q({ screen: "adminTaskForm", role: "guru", guruId: "t1", taskKind: "Kelompok" }) },
  { id: "guru-07-materials", url: q({ screen: "adminMaterials", role: "guru", guruId: "t1" }) },
  { id: "guru-08-materials-sheet-upload", url: q({ screen: "adminMaterials", role: "guru", guruId: "t1", sheet: "upload" }) },
  { id: "guru-09-schedule", url: q({ screen: "guruSchedule", role: "guru", guruId: "t1" }) },
  { id: "guru-10-profile", url: q({ screen: "guruProfile", role: "guru", guruId: "t1" }) },
  { id: "guru-11-submissions", url: q({ screen: "submissions", role: "guru", guruId: "t1", subTaskId: "a1" }) },

  // ---- TU ----
  { id: "tu-01-login", url: q({ screen: "login", role: "tu" }) },
  { id: "tu-02-home", url: q({ screen: "adminHome", role: "tu" }) },
  { id: "tu-03-home-other-class", url: q({ screen: "adminHome", role: "tu", adminClass: "12ips1" }) },
  { id: "tu-04-classes", url: q({ screen: "tuClasses", role: "tu" }) },
  { id: "tu-05-classes-sheet-class", url: q({ screen: "tuClasses", role: "tu", sheet: "class" }) },
  { id: "tu-06-class-detail", url: q({ screen: "tuClassDetail", role: "tu", adminClass: "10ipa1" }) },
  { id: "tu-07-class-detail-sheet-student", url: q({ screen: "tuClassDetail", role: "tu", adminClass: "10ipa1", sheet: "student" }) },
  { id: "tu-08-subjects", url: q({ screen: "adminList", role: "tu" }) },
  { id: "tu-09-subject-form", url: q({ screen: "adminForm", role: "tu" }) },
  { id: "tu-10-teachers", url: q({ screen: "tuTeachers", role: "tu" }) },
  { id: "tu-11-teacher-detail", url: q({ screen: "tuTeacherDetail", role: "tu" }) },
  { id: "tu-12-teacher-detail-sheet-assign", url: q({ screen: "tuTeacherDetail", role: "tu", sheet: "assign" }) },
  { id: "tu-13-schedule", url: q({ screen: "adminSchedule", role: "tu" }) },
  { id: "tu-14-schedule-sheet-slot", url: q({ screen: "adminSchedule", role: "tu", sheet: "slot" }) },
  { id: "tu-15-profile", url: q({ screen: "tuProfile", role: "tu" }) },
];
