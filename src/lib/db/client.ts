import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

let client: postgres.Sql | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function db() {
  if (!dbInstance) {
    client = postgres(env().DATABASE_URL, {
      // Keep the pool small in dev/serverless. Vercel Functions reuse instances
      // (Fluid Compute) so we don't need a large pool per invocation.
      max: 5,
      prepare: false,
    });
    dbInstance = drizzle(client, { schema });
  }
  return dbInstance;
}
