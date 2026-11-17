import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "../../identity/persistence/schema";

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  reason: text("reason"),
  authorizationReference: text("authorization_reference"),
  correlationId: text("correlation_id"),
  beforeData: jsonb("before_data"),
  afterData: jsonb("after_data"),
});
