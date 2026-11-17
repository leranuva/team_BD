import { eq } from "drizzle-orm";
import { getDb } from "../../../shared/persistence/client";
import { decideLogin, normalizeEmail, type LoginDecision } from "../domain/login-decision";
import { users } from "../persistence/schema";
import { passwordMatches } from "./password";

export async function authenticate(email: string, password: string): Promise<LoginDecision> {
  const rows = await getDb()
    .select({
      id: users.id,
      status: users.status,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, normalizeEmail(email)))
    .limit(1);

  const candidate = rows[0];
  const matches = await passwordMatches(candidate?.passwordHash ?? null, password);

  return decideLogin({
    candidate: candidate === undefined ? null : { id: candidate.id, status: candidate.status },
    passwordMatches: matches,
  });
}
