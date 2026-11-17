export const GLOBAL_PERMISSIONS = [
  "EMPLOYEE_MANAGE",
  "USER_MANAGE",
  "ROLE_ASSIGN",
  "PERMISSION_GRANT",
  "SUPERVISOR_ASSIGN",
  "DELEGATION_AUTHORIZE",
  "PROJECT_MANAGE",
  "PROJECT_STATUS_CHANGE",
  "PROJECT_SUPERVISOR_ASSIGN",
  "PROJECT_EXCEPTION_AUTHORIZE",
  "ALERT_VIEW",
  "ALERT_ACKNOWLEDGE",
  "INCIDENT_ADMIN_CLOSE",
  "WORK_PERIOD_CLOSE",
  "POST_CLOSURE_ADJUST",
  "TIME_SETTINGS_MANAGE",
  "AUDIT_VIEW",
  "REPORT_VIEW_GLOBAL",
  "APPROVAL_ADMIN_EXCEPTION",
] as const;

export type GlobalPermission = (typeof GLOBAL_PERMISSIONS)[number];

export const ROLE_CODES = ["ADMIN", "SUPERVISOR", "EMPLOYEE"] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

const permissionSet: ReadonlySet<string> = new Set(GLOBAL_PERMISSIONS);

export function isGlobalPermission(value: string): value is GlobalPermission {
  return permissionSet.has(value);
}

const roleSet: ReadonlySet<string> = new Set(ROLE_CODES);

export function isRoleCode(value: string): value is RoleCode {
  return roleSet.has(value);
}

export const PERMISSION_DESCRIPTIONS: Record<GlobalPermission, string> = {
  EMPLOYEE_MANAGE: "Gestionar empleados",
  USER_MANAGE: "Gestionar usuarios",
  ROLE_ASSIGN: "Asignar roles de interfaz",
  PERMISSION_GRANT: "Conceder o revocar permisos globales",
  SUPERVISOR_ASSIGN: "Asignar el supervisor responsable de un empleado",
  DELEGATION_AUTHORIZE: "Autorizar delegaciones de supervisión",
  PROJECT_MANAGE: "Gestionar obras",
  PROJECT_STATUS_CHANGE: "Cambiar el estado de una obra",
  PROJECT_SUPERVISOR_ASSIGN: "Asignar supervisores de obra",
  PROJECT_EXCEPTION_AUTHORIZE: "Autorizar una excepción de supervisor de obra",
  ALERT_VIEW: "Consultar alertas administrativas",
  ALERT_ACKNOWLEDGE: "Acusar la lectura de una alerta administrativa",
  INCIDENT_ADMIN_CLOSE: "Cerrar administrativamente una incidencia",
  WORK_PERIOD_CLOSE: "Cerrar un periodo semanal",
  POST_CLOSURE_ADJUST: "Rectificar un periodo cerrado",
  TIME_SETTINGS_MANAGE: "Cambiar la configuración temporal de la compañía",
  AUDIT_VIEW: "Consultar la auditoría",
  REPORT_VIEW_GLOBAL: "Consultar informes globales de horas",
  APPROVAL_ADMIN_EXCEPTION: "Aprobar una jornada por excepción administrativa",
};
