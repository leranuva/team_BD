import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const employeeStatus = pgEnum("employee_status", ["ACTIVE", "INACTIVE"]);
export const userStatus = pgEnum("user_status", ["ACTIVE", "DISABLED"]);
export const roleCode = pgEnum("role_code", ["ADMIN", "SUPERVISOR", "EMPLOYEE"]);

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("full_name").notNull(),
    status: employeeStatus("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    check("employees_full_name_not_blank", sql`char_length(btrim(${table.fullName})) > 0`),
  ],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employeeId: uuid("employee_id").unique(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    status: userStatus("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: "users_employee_id_employees_id_fk",
    }),
    check("users_email_length", sql`char_length(${table.email}) between 3 and 320`),
    check("users_password_hash_not_blank", sql`char_length(${table.passwordHash}) > 0`),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
  ],
);

export const permissions = pgTable("permissions", {
  code: text("code").primaryKey(),
  description: text("description").notNull(),
});

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: roleCode("role").notNull(),
    assignedAt: timestamp("assigned_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    assignedById: uuid("assigned_by_id").references(() => users.id),
  },
  (table) => [primaryKey({ columns: [table.userId, table.role], name: "user_roles_pkey" })],
);

export const userPermissionGrants = pgTable(
  "user_permission_grants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    permissionCode: text("permission_code")
      .notNull()
      .references(() => permissions.code),
    validFrom: timestamp("valid_from", { withTimezone: true, mode: "date" }).notNull(),
    validUntil: timestamp("valid_until", { withTimezone: true, mode: "date" }),
    grantedById: uuid("granted_by_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("user_permission_grants_user_id_idx").on(table.userId),
    check(
      "user_permission_grants_valid_interval",
      sql`${table.validUntil} is null or ${table.validUntil} > ${table.validFrom}`,
    ),
  ],
);
