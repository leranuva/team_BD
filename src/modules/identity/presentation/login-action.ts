"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authenticate } from "../application/authenticate";
import { createSessionRecord } from "../application/sessions";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "../domain/session-token";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, "Introduce un correo válido.")
    .max(320, "Introduce un correo válido.")
    .pipe(z.email("Introduce un correo válido.")),
  password: z.string().min(1, "Introduce la contraseña.").max(200, "Introduce la contraseña."),
});

export interface LoginState {
  readonly error: string | null;
}

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue === undefined ? "Revisa los datos introducidos." : issue.message };
  }

  let created: Awaited<ReturnType<typeof createSessionRecord>>;

  try {
    const decision = await authenticate(parsed.data.email, parsed.data.password);

    if (decision.outcome === "failure") {
      return { error: "Credenciales incorrectas." };
    }

    created = await createSessionRecord(decision.userId, new Date());
    const cookieStore = await cookies();
    cookieStore.set(
      SESSION_COOKIE_NAME,
      created.token,
      sessionCookieOptions(created.expiresAt, process.env.NODE_ENV === "production"),
    );
  } catch {
    console.error("No se pudo iniciar sesión.");
    return { error: "El servicio no está disponible." };
  }

  redirect("/");
}
