import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type AppDatabase = PostgresJsDatabase<typeof schema>;

declare global {
  var teamBdPostgres: ReturnType<typeof postgres> | undefined;
}

export function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("DATABASE_URL no está definida.");
  }

  return databaseUrl;
}

export function getDb(): AppDatabase {
  const connection = globalThis.teamBdPostgres ?? postgres(getDatabaseUrl(), { max: 10 });

  if (process.env.NODE_ENV !== "production") {
    globalThis.teamBdPostgres = connection;
  }

  return drizzle(connection, { schema });
}

export async function closeDb(): Promise<void> {
  const connection = globalThis.teamBdPostgres;

  if (connection === undefined) {
    return;
  }

  globalThis.teamBdPostgres = undefined;
  await connection.end();
}
