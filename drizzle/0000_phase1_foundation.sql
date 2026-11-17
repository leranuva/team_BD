CREATE TYPE "public"."employee_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."role_code" AS ENUM('ADMIN', 'SUPERVISOR', 'EMPLOYEE');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'DISABLED');--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"reason" text,
	"authorization_reference" text,
	"correlation_id" text,
	"before_data" jsonb,
	"after_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "company_time_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"time_zone" text NOT NULL,
	"week_starts_on" smallint NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_time_settings_week_starts_on_monday" CHECK ("company_time_settings"."week_starts_on" = 1),
	CONSTRAINT "company_time_settings_time_zone_not_blank" CHECK (char_length(btrim("company_time_settings"."time_zone")) > 0)
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"status" "employee_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employees_full_name_not_blank" CHECK (char_length(btrim("employees"."full_name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"code" text PRIMARY KEY NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_permission_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"permission_code" text NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone,
	"granted_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_permission_grants_valid_interval" CHECK ("user_permission_grants"."valid_until" is null or "user_permission_grants"."valid_until" > "user_permission_grants"."valid_from")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role" "role_code" NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_by_id" uuid,
	CONSTRAINT "user_roles_pkey" PRIMARY KEY("user_id","role")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"status" "user_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_employee_id_unique" UNIQUE("employee_id"),
	CONSTRAINT "users_email_length" CHECK (char_length("users"."email") between 3 and 320),
	CONSTRAINT "users_password_hash_not_blank" CHECK (char_length("users"."password_hash") > 0)
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_time_settings" ADD CONSTRAINT "company_time_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permission_grants" ADD CONSTRAINT "user_permission_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permission_grants" ADD CONSTRAINT "user_permission_grants_permission_code_permissions_code_fk" FOREIGN KEY ("permission_code") REFERENCES "public"."permissions"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permission_grants" ADD CONSTRAINT "user_permission_grants_granted_by_id_users_id_fk" FOREIGN KEY ("granted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_unique" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_permission_grants_user_id_idx" ON "user_permission_grants" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE OR REPLACE FUNCTION team_bd_reject_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_events es append-only';
END;
$$;--> statement-breakpoint
CREATE TRIGGER audit_events_append_only
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW
EXECUTE FUNCTION team_bd_reject_audit_mutation();--> statement-breakpoint
CREATE TRIGGER audit_events_append_only_truncate
BEFORE TRUNCATE ON audit_events
FOR EACH STATEMENT
EXECUTE FUNCTION team_bd_reject_audit_mutation();--> statement-breakpoint
INSERT INTO "permissions" ("code", "description") VALUES
  ('EMPLOYEE_MANAGE', 'Gestionar empleados'),
  ('USER_MANAGE', 'Gestionar usuarios'),
  ('ROLE_ASSIGN', 'Asignar roles de interfaz'),
  ('PERMISSION_GRANT', 'Conceder o revocar permisos globales'),
  ('SUPERVISOR_ASSIGN', 'Asignar el supervisor responsable de un empleado'),
  ('DELEGATION_AUTHORIZE', 'Autorizar delegaciones de supervisión'),
  ('PROJECT_MANAGE', 'Gestionar obras'),
  ('PROJECT_STATUS_CHANGE', 'Cambiar el estado de una obra'),
  ('PROJECT_SUPERVISOR_ASSIGN', 'Asignar supervisores de obra'),
  ('PROJECT_EXCEPTION_AUTHORIZE', 'Autorizar una excepción de supervisor de obra'),
  ('ALERT_VIEW', 'Consultar alertas administrativas'),
  ('ALERT_ACKNOWLEDGE', 'Acusar la lectura de una alerta administrativa'),
  ('INCIDENT_ADMIN_CLOSE', 'Cerrar administrativamente una incidencia'),
  ('WORK_PERIOD_CLOSE', 'Cerrar un periodo semanal'),
  ('POST_CLOSURE_ADJUST', 'Rectificar un periodo cerrado'),
  ('TIME_SETTINGS_MANAGE', 'Cambiar la configuración temporal de la compañía'),
  ('AUDIT_VIEW', 'Consultar la auditoría'),
  ('REPORT_VIEW_GLOBAL', 'Consultar informes globales de horas'),
  ('APPROVAL_ADMIN_EXCEPTION', 'Aprobar una jornada por excepción administrativa')
ON CONFLICT ("code") DO NOTHING;