import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl === undefined || databaseUrl.length === 0) {
  throw new Error("DATABASE_URL no está definida.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/shared/persistence/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
});
