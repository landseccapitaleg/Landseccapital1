import { pool } from "./connection";

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id text PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    country text NOT NULL DEFAULT '',
    phone text NOT NULL DEFAULT '',
    plan text NOT NULL DEFAULT 'Foundation Plan',
    invested_amount numeric(14,2) NOT NULL DEFAULT 0,
    withdrawable_profit numeric(14,2) NOT NULL DEFAULT 0,
    total_returns numeric(14,2) NOT NULL DEFAULT 0,
    investment_start_date text NOT NULL,
    maturity_date text NOT NULL,
    join_date text NOT NULL,
    last_profit_at bigint NOT NULL,
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at)`,
  `CREATE TABLE IF NOT EXISTS deposits (
    id text PRIMARY KEY,
    user_id text NOT NULL REFERENCES users(id),
    amount numeric(14,2) NOT NULL,
    currency text NOT NULL DEFAULT 'USD',
    method text NOT NULL,
    reference text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    note text,
    reviewed_by text,
    reviewed_at timestamp,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS deposits_user_id_idx ON deposits(user_id)`,
  `CREATE INDEX IF NOT EXISTS deposits_status_idx ON deposits(status)`,
  `CREATE TABLE IF NOT EXISTS withdrawals (
    id text PRIMARY KEY,
    user_id text NOT NULL REFERENCES users(id),
    amount numeric(14,2) NOT NULL,
    currency text NOT NULL DEFAULT 'USD',
    method text NOT NULL,
    destination text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    note text,
    reviewed_by text,
    reviewed_at timestamp,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS withdrawals_user_id_idx ON withdrawals(user_id)`,
  `CREATE INDEX IF NOT EXISTS withdrawals_status_idx ON withdrawals(status)`,
  `CREATE TABLE IF NOT EXISTS kyc_requests (
    id text PRIMARY KEY,
    user_id text NOT NULL REFERENCES users(id),
    document_type text NOT NULL,
    dob text NOT NULL,
    nationality text NOT NULL,
    phone text NOT NULL,
    documents jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'pending',
    rejection_reason text,
    reviewed_by text,
    reviewed_at timestamp,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS kyc_requests_user_id_idx ON kyc_requests(user_id)`,
  `CREATE INDEX IF NOT EXISTS kyc_requests_status_idx ON kyc_requests(status)`,
  `CREATE TABLE IF NOT EXISTS transactions (
    id text PRIMARY KEY,
    user_id text NOT NULL REFERENCES users(id),
    type text NOT NULL,
    amount numeric(14,2) NOT NULL,
    currency text NOT NULL DEFAULT 'USD',
    reference text,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id)`,
  `CREATE TABLE IF NOT EXISTS site_settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_by text,
    updated_at timestamp NOT NULL DEFAULT now()
  )`,
] as const;

let initialization: Promise<void> | null = null;

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const statement of schemaStatements) {
      await client.query(statement);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Creates the application schema on first use.
 *
 * This is intentionally idempotent so a fresh Neon database only needs
 * DATABASE_URL; no separate SQL-editor or migration command is required.
 */
export function ensureDatabase() {
  if (!initialization) {
    initialization = initializeDatabase().catch((error) => {
      initialization = null;
      throw error;
    });
  }
  return initialization;
}