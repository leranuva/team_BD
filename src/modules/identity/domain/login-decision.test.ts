import { describe, expect, it } from "vitest";
import { decideLogin, normalizeEmail } from "./login-decision";

describe("decideLogin", () => {
  it("rechaza un correo desconocido, una cuenta deshabilitada y una contraseña incorrecta", () => {
    expect(decideLogin({ candidate: null, passwordMatches: false })).toEqual({
      outcome: "failure",
    });
    expect(decideLogin({ candidate: null, passwordMatches: true })).toEqual({ outcome: "failure" });
    expect(
      decideLogin({
        candidate: { id: "user-1", status: "DISABLED" },
        passwordMatches: true,
      }),
    ).toEqual({ outcome: "failure" });
    expect(
      decideLogin({
        candidate: { id: "user-1", status: "ACTIVE" },
        passwordMatches: false,
      }),
    ).toEqual({ outcome: "failure" });
  });

  it("acepta una cuenta activa cuando la contraseña coincide", () => {
    expect(
      decideLogin({
        candidate: { id: "user-1", status: "ACTIVE" },
        passwordMatches: true,
      }),
    ).toEqual({ outcome: "success", userId: "user-1" });
  });
});

describe("normalizeEmail", () => {
  it("recorta espacios y usa minúsculas", () => {
    expect(normalizeEmail("  Ana@Empresa.COM ")).toBe("ana@empresa.com");
  });
});
