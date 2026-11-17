import { sql } from "drizzle-orm";
import { check, pgTable, smallint, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "../../identity/persistence/schema";

export const companyTimeSettings = pgTable(
  "company_time_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    timeZone: text("time_zone").notNull(),
    weekStartsOn: smallint("week_starts_on").notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true, mode: "date" }).notNull(),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    check("company_time_settings_week_starts_on_monday", sql`${table.weekStartsOn} = 1`),
    check(
      "company_time_settings_time_zone_not_blank",
      sql`char_length(btrim(${table.timeZone})) > 0`,
    ),
  ],
);
