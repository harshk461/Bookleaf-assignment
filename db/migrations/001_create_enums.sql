-- 001: PostgreSQL ENUM types
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS schema_migrations (
  id          SERIAL PRIMARY KEY,
  filename    VARCHAR(255) NOT NULL UNIQUE,
  applied_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TYPE user_role AS ENUM ('author', 'admin');

CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

CREATE TYPE ticket_category AS ENUM (
  'royalty_payments',
  'isbn_metadata',
  'printing_quality',
  'distribution_availability',
  'book_status_production',
  'general_inquiry'
);

CREATE TYPE ticket_priority AS ENUM ('critical', 'high', 'medium', 'low');

CREATE TYPE message_sender_type AS ENUM ('author', 'admin');

CREATE TYPE sale_payout_status AS ENUM (
  'pending',
  'included',
  'paid',
  'rolled_over'
);

CREATE TYPE ai_task_type AS ENUM ('classify_prioritize', 'draft_response');

CREATE TYPE ai_log_status AS ENUM ('success', 'failed', 'fallback');
