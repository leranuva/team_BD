import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decideAuthorization, grantsActiveAt } from "../modules/identity/domain/authorization";
import type { RoleCode } from "../modules/identity/domain/permissions";
import { PERMISSION_DESCRIPTIONS } from "../modules/identity/domain/permissions";
import { loadCurrentSession } from "../modules/identity/application/sessions";
import { logoutAction } from "../modules/identity/presentation/logout-action";
import { SESSION_COOKIE_NAME } from "../modules/identity/domain/session-token";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<RoleCode, string> = {
  ADMIN: "Administración",
  SUPERVISOR: "Supervisión",
  EMPLOYEE: "Empleado",
};

const SHOWN_OPERATIONS = ["AUDIT_VIEW", "WORK_PERIOD_CLOSE", "EMPLOYEE_MANAGE"] as const;

export default async function HomePage() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (token === undefined || token.length === 0) {
    redirect("/login");
  }

  let session: Awaited<ReturnType<typeof loadCurrentSession>>;

  try {
    session = await loadCurrentSession(token, new Date());
  } catch {
    console.error("No se pudo cargar la sesión.");
    return (
      <main className="content">
        <section className="panel">
          <h1>team_BD</h1>
          <p role="alert">No se ha podido cargar la sesión.</p>
          <form action={logoutAction}>
            <button type="submit">Cerrar sesión</button>
          </form>
        </section>
      </main>
    );
  }

  if (session === null) {
    redirect("/login");
  }

  const now = new Date();
  const activeGrants = grantsActiveAt(session.grants, now);

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <h1>team_BD</h1>
          <p>{session.email}</p>
        </div>
        <form action={logoutAction}>
          <button type="submit">Cerrar sesión</button>
        </form>
      </header>
      <main className="content">
        <section className="panel">
          <h2>Cuenta</h2>
          <dl>
            <dt>Empleado</dt>
            <dd>
              {session.employee === null
                ? "Esta cuenta no está vinculada a un empleado."
                : `${session.employee.fullName} (${session.employee.status})`}
            </dd>
            <dt>Roles de interfaz</dt>
            <dd>
              {session.roles.length === 0
                ? "Sin rol de interfaz."
                : session.roles.map((role) => ROLE_LABELS[role.role]).join(", ")}
            </dd>
            <dt>Concesiones vigentes</dt>
            <dd>
              {activeGrants.length === 0 ? (
                "Sin concesiones vigentes."
              ) : (
                <ul className="permission-list">
                  {activeGrants.map((grant) => (
                    <li key={grant.permission}>
                      {grant.permission}: {PERMISSION_DESCRIPTIONS[grant.permission]}
                    </li>
                  ))}
                </ul>
              )}
            </dd>
          </dl>
          <h2>Comprobaciones de autorización</h2>
          <ul className="permission-list">
            {SHOWN_OPERATIONS.map((operation) => {
              const decision = decideAuthorization({
                operation,
                at: now,
                grants: session.grants,
                roles: session.roles,
              });

              return (
                <li key={operation}>
                  {operation}: {decision.outcome === "allow" ? "autorizada" : "denegada"}
                </li>
              );
            })}
          </ul>
          <p>Esta fase no incluye fichajes, obras, incidencias ni aprobaciones.</p>
        </section>
      </main>
    </div>
  );
}
