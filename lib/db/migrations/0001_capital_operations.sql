CREATE TABLE IF NOT EXISTS deposits (
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
);
CREATE INDEX IF NOT EXISTS deposits_user_id_idx ON deposits(user_id);
CREATE INDEX IF NOT EXISTS deposits_status_idx ON deposits(status);

CREATE TABLE IF NOT EXISTS withdrawals (
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
);
CREATE INDEX IF NOT EXISTS withdrawals_user_id_idx ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS withdrawals_status_idx ON withdrawals(status);

CREATE TABLE IF NOT EXISTS kyc_requests (
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
);
CREATE INDEX IF NOT EXISTS kyc_requests_user_id_idx ON kyc_requests(user_id);
CREATE INDEX IF NOT EXISTS kyc_requests_status_idx ON kyc_requests(status);

CREATE TABLE IF NOT EXISTS transactions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id),
  type text NOT NULL,
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  reference text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);

CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by text,
  updated_at timestamp NOT NULL DEFAULT now()
);