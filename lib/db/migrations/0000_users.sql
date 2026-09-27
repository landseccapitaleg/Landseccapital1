CREATE TABLE IF NOT EXISTS users (
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
);

CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at);