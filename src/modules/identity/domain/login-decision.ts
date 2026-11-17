export type AccountStatus = "ACTIVE" | "DISABLED";

export interface LoginCandidate {
  readonly id: string;
  readonly status: AccountStatus;
}

export type LoginDecision =
  { readonly outcome: "success"; readonly userId: string } | { readonly outcome: "failure" };

export function decideLogin(input: {
  readonly candidate: LoginCandidate | null;
  readonly passwordMatches: boolean;
}): LoginDecision {
  if (input.candidate === null || input.candidate.status !== "ACTIVE" || !input.passwordMatches) {
    return { outcome: "failure" };
  }

  return { outcome: "success", userId: input.candidate.id };
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
