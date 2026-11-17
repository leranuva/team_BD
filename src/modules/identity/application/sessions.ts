import { and, eq, gt } from "drizzle-orm";
import { getDb } from "../../../shared/persistence/client";
import type { PermissionGrant, RoleLabel } from "../domain/authorization";
import { isGlobalPermission, isRoleCode } from "../domain/permissions";
import { createSessionToken, hashSessionToken, sessionExpiresAt } from "../domain/session-token";
import { employees, sessions, userPermissionGrants, userRoles, users } from "../persistence/schema";

export interface CurrentSession {
  readonly userId: string;
  readonly email: string;
  readonly employee: {
    readonly id: string;
    readonly fullName: string;
    readonly status: "ACTIVE" | "INACTIVE";
  } | null;
  readonly roles: readonly RoleLabel[];
  readonly grants: readonly PermissionGrant[];
}

export async function createSessionRecord(
  userId: string,
  now: Date,
): Promise<{ readonly token: string; readonly expiresAt: Date }> {
  const token = createSessionToken();
  const expiresAt = sessionExpiresAt(now);

  await getDb()
    .insert(sessions)
    .values({
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
    });

  return { token, expiresAt };
}

export async function deleteSessionByToken(token: string): Promise<void> {
  await getDb()
    .delete(sessions)
    .where(eq(sessions.tokenHash, hashSessionToken(token)));
}

export async function loadCurrentSession(token: string, at: Date): Promise<CurrentSession | null> {
  const db = getDb();
  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      userStatus: users.status,
      employeeId: employees.id,
      employeeFullName: employees.fullName,
      employeeStatus: employees.status,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .leftJoin(employees, eq(users.employeeId, employees.id))
    .where(and(eq(sessions.tokenHash, hashSessionToken(token)), gt(sessions.expiresAt, at)))
    .limit(1);

  const row = rows[0];

  if (row === undefined || row.userStatus !== "ACTIVE") {
    return null;
  }

  const roleRows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, row.userId));

  const grantRows = await db
    .select({
      permissionCode: userPermissionGrants.permissionCode,
      validFrom: userPermissionGrants.validFrom,
      validUntil: userPermissionGrants.validUntil,
    })
    .from(userPermissionGrants)
    .where(eq(userPermissionGrants.userId, row.userId));

  const roles: RoleLabel[] = [];

  for (const roleRow of roleRows) {
    if (isRoleCode(roleRow.role)) {
      roles.push({ role: roleRow.role });
    }
  }

  const grants: PermissionGrant[] = [];

  for (const grantRow of grantRows) {
    if (!isGlobalPermission(grantRow.permissionCode)) {
      continue;
    }

    grants.push({
      permission: grantRow.permissionCode,
      validFrom: grantRow.validFrom,
      validUntil: grantRow.validUntil,
    });
  }

  const employee =
    row.employeeId === null || row.employeeFullName === null || row.employeeStatus === null
      ? null
      : {
          id: row.employeeId,
          fullName: row.employeeFullName,
          status: row.employeeStatus,
        };

  return {
    userId: row.userId,
    email: row.email,
    employee,
    roles,
    grants,
  };
}
