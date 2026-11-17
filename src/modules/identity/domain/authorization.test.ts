import { describe, expect, it } from "vitest";
import { decideAuthorization, grantsActiveAt, type PermissionGrant } from "./authorization";

const at = new Date("2026-11-16T15:00:00.000Z");

function grant(
  overrides: Partial<PermissionGrant> & Pick<PermissionGrant, "permission">,
): PermissionGrant {
  return {
    validFrom: new Date("2026-11-01T00:00:00.000Z"),
    validUntil: null,
    ...overrides,
  };
}

describe("decideAuthorization", () => {
  it("deniega cuando no hay concesión para la operación", () => {
    const decision = decideAuthorization({
      operation: "AUDIT_VIEW",
      at,
      grants: [],
      roles: [],
    });

    expect(decision).toEqual({ outcome: "deny", reason: "no_matching_grant" });
  });

  it("deniega un rol ADMIN que no tiene concesión", () => {
    const decision = decideAuthorization({
      operation: "WORK_PERIOD_CLOSE",
      at,
      grants: [],
      roles: [{ role: "ADMIN" }, { role: "SUPERVISOR" }],
    });

    expect(decision).toEqual({ outcome: "deny", reason: "no_matching_grant" });
  });

  it("deniega una concesión que todavía no ha empezado", () => {
    const decision = decideAuthorization({
      operation: "EMPLOYEE_MANAGE",
      at,
      grants: [
        grant({
          permission: "EMPLOYEE_MANAGE",
          validFrom: new Date("2026-11-17T00:00:00.000Z"),
        }),
      ],
      roles: [{ role: "ADMIN" }],
    });

    expect(decision).toEqual({ outcome: "deny", reason: "grant_not_active" });
  });

  it("deniega una concesión vencida en el extremo final del intervalo", () => {
    const decision = decideAuthorization({
      operation: "EMPLOYEE_MANAGE",
      at,
      grants: [
        grant({
          permission: "EMPLOYEE_MANAGE",
          validFrom: new Date("2026-11-01T00:00:00.000Z"),
          validUntil: at,
        }),
      ],
      roles: [],
    });

    expect(decision).toEqual({ outcome: "deny", reason: "grant_not_active" });
  });

  it("autoriza en el instante inicial de la concesión", () => {
    const decision = decideAuthorization({
      operation: "USER_MANAGE",
      at,
      grants: [grant({ permission: "USER_MANAGE", validFrom: at, validUntil: null })],
      roles: [],
    });

    expect(decision).toEqual({ outcome: "allow" });
  });

  it("autoriza solo la operación concedida", () => {
    const grants = [grant({ permission: "AUDIT_VIEW" })];

    expect(
      decideAuthorization({
        operation: "AUDIT_VIEW",
        at,
        grants,
        roles: [{ role: "EMPLOYEE" }],
      }),
    ).toEqual({ outcome: "allow" });

    expect(
      decideAuthorization({
        operation: "PERMISSION_GRANT",
        at,
        grants,
        roles: [{ role: "EMPLOYEE" }],
      }),
    ).toEqual({ outcome: "deny", reason: "no_matching_grant" });
  });

  it("autoriza cuando una concesión vigente convive con otra vencida de la misma operación", () => {
    const decision = decideAuthorization({
      operation: "TIME_SETTINGS_MANAGE",
      at,
      grants: [
        grant({
          permission: "TIME_SETTINGS_MANAGE",
          validUntil: new Date("2026-11-10T00:00:00.000Z"),
        }),
        grant({ permission: "TIME_SETTINGS_MANAGE" }),
      ],
      roles: [],
    });

    expect(decision).toEqual({ outcome: "allow" });
  });
});

describe("grantsActiveAt", () => {
  it("conserva las concesiones abiertas y descarta las que quedan fuera del intervalo", () => {
    const active = grantsActiveAt(
      [
        grant({ permission: "AUDIT_VIEW" }),
        grant({
          permission: "USER_MANAGE",
          validUntil: new Date("2026-11-16T15:00:00.000Z"),
        }),
        grant({
          permission: "ROLE_ASSIGN",
          validFrom: new Date("2026-12-01T00:00:00.000Z"),
        }),
      ],
      at,
    );

    expect(active.map((item) => item.permission)).toEqual(["AUDIT_VIEW"]);
  });
});
