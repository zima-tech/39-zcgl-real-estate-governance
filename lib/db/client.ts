import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "@/lib/db/schema";

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl) {
  throw new Error("TURSO_DATABASE_URL is required.");
}

if (!authToken) {
  throw new Error("TURSO_AUTH_TOKEN is required.");
}

const globalForAdminDb = globalThis as typeof globalThis & {
  __adminLibsqlClient__?: ReturnType<typeof createClient>;
};

const client =
  globalForAdminDb.__adminLibsqlClient__ ??
  createClient({
    authToken,
    url: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForAdminDb.__adminLibsqlClient__ = client;
}

const db = drizzle(client, { schema });

export { client, db };
