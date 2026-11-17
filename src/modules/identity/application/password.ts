import { hash, verify } from "@node-rs/argon2";

const argonOptions = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

let timingHash: string | undefined;

async function dummyHash(): Promise<string> {
  timingHash ??= await hash("team-bd-timing-placeholder", argonOptions);
  return timingHash;
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, argonOptions);
}

export async function passwordMatches(
  passwordHash: string | null,
  password: string,
): Promise<boolean> {
  const candidate = passwordHash ?? (await dummyHash());
  const matches = await verify(candidate, password);
  return passwordHash !== null && matches;
}
