CREATE TABLE "activity_log" (
	"workspace_id" uuid NOT NULL,
	"id" text NOT NULL,
	"text" text NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "activity_log_workspace_id_id_pk" PRIMARY KEY("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"workspace_id" uuid NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"level" text NOT NULL,
	"major" text NOT NULL,
	"homeroom_teacher_id" text,
	"room_name" text,
	"new_materials" smallint DEFAULT 0 NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "classes_workspace_id_id_pk" PRIMARY KEY("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"workspace_id" uuid NOT NULL,
	"id" text NOT NULL,
	"subject_id" text NOT NULL,
	"name" text NOT NULL,
	"ext" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"storage_path" text,
	"uploaded_by_teacher_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "materials_workspace_id_id_pk" PRIMARY KEY("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"workspace_id" uuid NOT NULL,
	"id" text NOT NULL,
	"kind" text NOT NULL,
	"text" text NOT NULL,
	"target" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"read_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "notifications_workspace_id_id_pk" PRIMARY KEY("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"capacity" smallint NOT NULL,
	"floor" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"workspace_id" uuid NOT NULL,
	"id" text NOT NULL,
	"class_id" text NOT NULL,
	"name" text NOT NULL,
	"nis" text NOT NULL,
	"nisn" text,
	"initials" text NOT NULL,
	"is_me" boolean DEFAULT false NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "students_workspace_id_id_pk" PRIMARY KEY("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "subject_slots" (
	"workspace_id" uuid NOT NULL,
	"id" text NOT NULL,
	"class_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"day_index" smallint NOT NULL,
	"start_min" smallint NOT NULL,
	"end_min" smallint NOT NULL,
	"room_name" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "subject_slots_workspace_id_id_pk" PRIMARY KEY("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"workspace_id" uuid NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"abbr" text NOT NULL,
	"color" text NOT NULL,
	"on_color" text NOT NULL,
	"tint" text NOT NULL,
	"border" text NOT NULL,
	"ink" text NOT NULL,
	"attendance" text NOT NULL,
	"room" text,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "subjects_workspace_id_id_pk" PRIMARY KEY("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"workspace_id" uuid NOT NULL,
	"id" text NOT NULL,
	"task_id" text NOT NULL,
	"student_id" text NOT NULL,
	"checked_off_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"file_name" text,
	"storage_path" text,
	"note" text,
	"score" smallint,
	"feedback" text,
	"graded_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "submissions_workspace_id_id_pk" PRIMARY KEY("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"workspace_id" uuid NOT NULL,
	"id" text NOT NULL,
	"class_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"created_by_teacher_id" text,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"kind" text NOT NULL,
	"group_size" smallint,
	"weight_pct" numeric(5, 2) NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"legacy_no" smallint,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "tasks_workspace_id_id_pk" PRIMARY KEY("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "teachers" (
	"workspace_id" uuid NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"degree" text,
	"email" text NOT NULL,
	"initials" text NOT NULL,
	"nip" text,
	"phone" text,
	"status" text,
	"since" smallint,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "teachers_workspace_id_id_pk" PRIMARY KEY("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "teaching_assignments" (
	"workspace_id" uuid NOT NULL,
	"teacher_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"class_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "teaching_assignments_workspace_id_teacher_id_subject_id_class_id_pk" PRIMARY KEY("workspace_id","teacher_id","subject_id","class_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text DEFAULT 'demo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "students_nis_per_class" ON "students" USING btree ("workspace_id","class_id","nis");--> statement-breakpoint
CREATE UNIQUE INDEX "submissions_one_per_student" ON "submissions" USING btree ("workspace_id","task_id","student_id");