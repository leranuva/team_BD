import type { GlobalPermission, RoleCode } from "./permissions";

export interface PermissionGrant {
  readonly permission: GlobalPermission;
  readonly validFrom: Date;
  readonly validUntil: Date | null;
}

export interface RoleLabel {
  readonly role: RoleCode;
}

export type AuthorizationDenialReason = "no_matching_grant" | "grant_not_active";

export type AuthorizationDecision =
  | { readonly outcome: "allow" }
  | { readonly outcome: "deny"; readonly reason: AuthorizationDenialReason };

export interface AuthorizationInput {
  readonly operation: GlobalPermission;
  readonly at: Date;
  readonly grants: readonly PermissionGrant[];
  readonly roles: readonly RoleLabel[];
}

function isGrantActive(grant: PermissionGrant, at: Date): boolean {
  if (Number.isNaN(at.getTime()) || Number.isNaN(grant.validFrom.getTime())) {
    return false;
  }

  if (at.getTime() < grant.validFrom.getTime()) {
    return false;
  }

  if (grant.validUntil !== null) {
    if (Number.isNaN(grant.validUntil.getTime())) {
      return false;
    }

    if (at.getTime() >= grant.validUntil.getTime()) {
      return false;
    }
  }

  return true;
}

export function grantsActiveAt(
  grants: readonly PermissionGrant[],
  at: Date,
): readonly PermissionGrant[] {
  return grants.filter((grant) => isGrantActive(grant, at));
}

export function decideAuthorization(input: AuthorizationInput): AuthorizationDecision {
  // El rol solo etiqueta la interfaz. La concesión vigente es la autorización.
  void input.roles;

  const matching = input.grants.filter((grant) => grant.permission === input.operation);

  if (matching.length === 0) {
    return { outcome: "deny", reason: "no_matching_grant" };
  }

  const active = matching.some((grant) => isGrantActive(grant, input.at));

  if (!active) {
    return { outcome: "deny", reason: "grant_not_active" };
  }

  return { outcome: "allow" };
}
