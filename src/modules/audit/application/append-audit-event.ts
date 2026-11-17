import type { AppDatabase } from "../../../shared/persistence/client";
import { auditEvents } from "../persistence/schema";

export interface AuditEventDraft {
  readonly actorUserId: string | null;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly reason: string | null;
  readonly authorizationReference: string | null;
  readonly correlationId: string | null;
  readonly beforeData: unknown;
  readonly afterData: unknown;
}

type AuditWriter = Pick<AppDatabase, "insert">;

export async function appendAuditEvent(writer: AuditWriter, draft: AuditEventDraft): Promise<void> {
  await writer.insert(auditEvents).values({
    actorUserId: draft.actorUserId,
    action: draft.action,
    resourceType: draft.resourceType,
    resourceId: draft.resourceId,
    reason: draft.reason,
    authorizationReference: draft.authorizationReference,
    correlationId: draft.correlationId,
    beforeData: draft.beforeData,
    afterData: draft.afterData,
  });
}
