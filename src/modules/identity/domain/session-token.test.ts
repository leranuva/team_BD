import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  hashSessionToken,
  sessionCookieOptions,
  sessionExpiresAt,
} from "./session-token";

describe("sesión", () => {
  it("resume el token con SHA-256 y no conserva el valor original", () => {
    expect(hashSessionToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(hashSessionToken("abc")).not.toContain("abc");
  });

  it("emite un token opaco de 32 bytes", () => {
    const token = createSessionToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("caduca a las doce horas y marca la cookie como inaccesible para el script", () => {
    const now = new Date("2026-11-16T15:00:00.000Z");
    const expiresAt = sessionExpiresAt(now);

    expect(expiresAt.toISOString()).toBe("2026-11-17T03:00:00.000Z");
    expect(sessionCookieOptions(expiresAt, true)).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      expires: expiresAt,
    });
  });
});
