import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { schema } from "./db";

export function connectDatabase(c: { env: { DATABASE_URL: string } }) {
  const pool = new Pool({
    connectionString: c.env.DATABASE_URL,
  });

  return drizzle(pool, { schema });
}
