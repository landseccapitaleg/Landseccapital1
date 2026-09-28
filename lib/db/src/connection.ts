import pg from "pg";

const { Pool } = pg;

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.DATABASE_POSTGRES_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

const missingDatabaseError = () =>
  new Error(
    "A PostgreSQL connection string is not configured. Set DATABASE_URL or a supported POSTGRES_* deployment variable.",
  );

/**
 * Keep the module loadable when a deployment is missing its database
 * environment variable. The request handler can then return a useful 503
 * response instead of Vercel reporting FUNCTION_INVOCATION_FAILED before the
 * handler starts.
 */
export const pool = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : ({
      connect: async () => {
        throw missingDatabaseError();
      },
      query: async () => {
        throw missingDatabaseError();
      },
      end: async () => undefined,
    } as unknown as InstanceType<typeof Pool>);