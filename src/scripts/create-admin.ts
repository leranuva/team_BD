import { eq } from "drizzle-orm";
import { z } from "zod";
import { appendAuditEvent } from "../modules/audit/application/append-audit-event";
import { hashPassword } from "../modules/identity/application/password";
import { normalizeEmail } from "../modules/identity/domain/login-decision";
import { GLOBAL_PERMISSIONS } from "../modules/identity/domain/permissions";
import { userPermissionGrants, userRoles, users } from "../modules/identity/persistence/schema";
import { closeDb, getDb } from "../shared/persistence/client";

const adminSchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, "ADMIN_EMAIL no es un correo válido.")
    .max(320, "ADMIN_EMAIL no es un correo válido.")
    .pipe(z.email("ADMIN_EMAIL no es un correo válido.")),
  password: z
    .string()
    .min(12, "ADMIN_PASSWORD debe tener al menos 12 caracteres.")
    .max(200, "ADMIN_PASSWORD es demasiado larga."),
});

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

async function main(): Promise<void> {
  const parsed = adminSchema.safeParse({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    console.error(issue === undefined ? "Revisa ADMIN_EMAIL y ADMIN_PASSWORD." : issue.message);
    process.exitCode = 1;
    return;
  }

  const email = normalizeEmail(parsed.data.email);
  const db = getDb();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing[0] !== undefined) {
    console.error("Ya existe un usuario con ese correo.");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const now = new Date();

  try {
    await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(users)
        .values({
          email,
          passwordHash,
          status: "ACTIVE",
        })
        .returning({ id: users.id });

      const user = inserted[0];

      if (user === undefined) {
        throw new Error("No se pudo crear el usuario.");
      }

      await tx.insert(userRoles).values({
        userId: user.id,
        role: "ADMIN",
        assignedById: user.id,
      });

      await tx.insert(userPermissionGrants).values(
        GLOBAL_PERMISSIONS.map((permission) => ({
          userId: user.id,
          permissionCode: permission,
          validFrom: now,
          validUntil: null,
          grantedById: user.id,
        })),
      );

      await appendAuditEvent(tx, {
        actorUserId: user.id,
        action: "identity.admin_bootstrap",
        resourceType: "user",
        resourceId: user.id,
        reason: "Alta inicial mediante el script local.",
        authorizationReference: null,
        correlationId: null,
        beforeData: null,
        afterData: {
          email,
          roles: ["ADMIN"],
          permissionCodes: [...GLOBAL_PERMISSIONS],
        },
      });
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      console.error("Ya existe un usuario con ese correo.");
    } else {
      console.error(
        "No se pudo crear el administrador. Comprueba la base de datos y las migraciones.",
      );
    }

    process.exitCode = 1;
    return;
  }

  console.log(
    `Administrador creado para ${email}. El rol ADMIN no autoriza operaciones por sí solo.`,
  );
}

main()
  .catch(() => {
    console.error("No se pudo crear el administrador.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
