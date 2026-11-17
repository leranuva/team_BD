import { createHash, randomBytes } from "node:crypto";

export const SESSION_COOKIE_NAME = "team_bd_session";

export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionExpiresAt(now: Date): Date {
  return new Date(now.getTime() + SESSION_TTL_MS);
}

export function sessionCookieOptions(expiresAt: Date, secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    expires: expiresAt,
  };
}
