import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GLOBAL_PERMISSIONS } from "../../identity/domain/permissions";

const configuredDatabaseUrl = process.env.DATABASE_URL;
const testDatabase = "team_bd_phase1_test";

if (configuredDatabaseUrl === undefined || configuredDatabaseUrl.length === 0) {
  throw new Error("DATABASE_URL no está definida.");
}

const databaseUrl: string = configuredDatabaseUrl;

function databaseUrlFor(name: string): string {
  const url = new URL(databaseUrl);
  url.pathname = `/${name}`;
  return url.toString();
}

describe("auditoría append-only", () => {
  let sql: ReturnType<typeof postgres> | undefined;

  beforeAll(async () => {
    const admin = postgres(databaseUrl, { max: 1 });

    await admin.unsafe(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${testDatabase}'
        AND pid <> pg_backend_pid()
    `);
    await admin.unsafe(`DROP DATABASE IF EXISTS ${testDatabase} WITH (FORCE)`);
    await admin.unsafe(`CREATE DATABASE ${testDatabase}`);
    await admin.end();

    sql = postgres(databaseUrlFor(testDatabase), { max: 1 });
    await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
  });

  afterAll(async () => {
    await sql?.end();

    const admin = postgres(databaseUrl, { max: 1 });
    await admin.unsafe(`DROP DATABASE IF EXISTS ${testDatabase} WITH (FORCE)`);
    await admin.end();
  });

  it("conserva el catálogo de permisos y deja vacía la configuración temporal", async () => {
    if (sql === undefined) {
      throw new Error("La conexión de prueba no está abierta.");
    }

    const permissions = await sql<{ code: string }[]>`select code from permissions order by code`;
    const settings = await sql<
      { count: string }[]
    >`select count(*)::text as count from company_time_settings`;
    const settingCount = settings[0];

    expect(permissions.map((row) => row.code).sort()).toEqual([...GLOBAL_PERMISSIONS].sort());
    expect(settingCount?.count).toBe("0");
  });

  it("rechaza la modificación y el borrado de un evento", async () => {
    if (sql === undefined) {
      throw new Error("La conexión de prueba no está abierta.");
    }

    const inserted = await sql<{ id: string }[]>`
      insert into audit_events (action, resource_type, resource_id)
      values ('test.audit', 'audit_event', 'phase1')
      returning id
    `;
    const event = inserted[0];

    if (event === undefined) {
      throw new Error("No se insertó el evento de auditoría.");
    }

    await expect(
      sql`update audit_events set action = 'mutated' where id = ${event.id}`,
    ).rejects.toThrow(/append-only/);
    await expect(sql`delete from audit_events where id = ${event.id}`).rejects.toThrow(
      /append-only/,
    );
    await expect(sql`truncate audit_events`).rejects.toThrow(/append-only/);

    const remaining = await sql<{ action: string }[]>`
      select action from audit_events where id = ${event.id}
    `;

    expect(remaining[0]?.action).toBe("test.audit");
  });
});
