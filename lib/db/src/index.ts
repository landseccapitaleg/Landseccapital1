import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { pool } from "./connection";
import { ensureDatabase } from "./bootstrap";

export const db = drizzle(pool, { schema });

export { ensureDatabase, pool };
export * from "./schema";
