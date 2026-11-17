import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GLOBAL_PERMISSIONS, PERMISSION_DESCRIPTIONS } from "./permissions";

function readMigrationSql(directory: string): string {
  const entries = readdirSync(directory);
  const chunks: string[] = [];

  for (const entry of entries) {
    const path = join(directory, entry);
    const info = statSync(path);

    if (info.isDirectory()) {
      chunks.push(readMigrationSql(path));
      continue;
    }

    if (entry.endsWith(".sql")) {
      chunks.push(readFileSync(path, "utf8"));
    }
  }

  return chunks.join("\n");
}

describe("catálogo de permisos en las migraciones", () => {
  const sql = readMigrationSql("drizzle").toLowerCase();

  it("inserta cada permiso global y no siembra la zona horaria", () => {
    for (const permission of GLOBAL_PERMISSIONS) {
      expect(sql).toContain(permission.toLowerCase());
      expect(sql).toContain(PERMISSION_DESCRIPTIONS[permission].toLowerCase());
    }

    expect(new Set(GLOBAL_PERMISSIONS).size).toBe(GLOBAL_PERMISSIONS.length);
    expect(sql).not.toContain("america/new_york");
    expect(sql).not.toContain('insert into "company_time_settings"');
    expect(sql).not.toContain("insert into company_time_settings");
  });

  it("impide modificar o vaciar la auditoría", () => {
    expect(sql).toContain("audit_events_append_only");
    expect(sql).toContain("audit_events_append_only_truncate");
    expect(sql).toContain("team_bd_reject_audit_mutation");
  });
});
