import pg from "pg";

const { Pool } = pg;

const databaseUrl =
  process.env.DATABASE_URL || process.env.DATABASE_POSTGRES_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or DATABASE_POSTGRES_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: databaseUrl });