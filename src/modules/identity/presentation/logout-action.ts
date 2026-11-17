"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { deleteSessionByToken } from "../application/sessions";
import { SESSION_COOKIE_NAME } from "../domain/session-token";

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token !== undefined && token.length > 0) {
    try {
      await deleteSessionByToken(token);
    } catch {
      console.error("No se pudo eliminar la sesión almacenada.");
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
