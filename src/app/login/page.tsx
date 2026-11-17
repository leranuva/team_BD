import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loadCurrentSession } from "../../modules/identity/application/sessions";
import { LoginForm } from "../../modules/identity/presentation/login-form";
import { SESSION_COOKIE_NAME } from "../../modules/identity/domain/session-token";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (token !== undefined && token.length > 0) {
    try {
      const session = await loadCurrentSession(token, new Date());

      if (session !== null) {
        redirect("/");
      }
    } catch {
      console.error("No se pudo comprobar la sesión en el acceso.");
    }
  }

  return (
    <main className="login-screen">
      <section>
        <h1>team_BD</h1>
        <p>Acceso interno</p>
        <LoginForm />
      </section>
    </main>
  );
}
