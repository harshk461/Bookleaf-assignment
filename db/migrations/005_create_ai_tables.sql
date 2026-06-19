-- 005: AI tables + supporting sales/payouts
CREATE TABLE ai_draft_responses (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_ref        UUID          NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  content           TEXT          NOT NULL,
  model             VARCHAR(100),
  prompt_tokens     INTEGER,
  completion_tokens INTEGER,
  is_current        BOOLEAN       NOT NULL DEFAULT TRUE,
  generated_by      UUID          REFERENCES users(id),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE ticket_ai_logs (
  id                UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_ref        UUID            NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  task_type         ai_task_type    NOT NULL,
  status            ai_log_status   NOT NULL,
  model             VARCHAR(100),
  input_tokens      INTEGER,
  output_tokens     INTEGER,
  latency_ms        INTEGER,
  request_payload   JSONB,
  response_payload  JSONB,
  error_message     TEXT,
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE book_sales (
  id                UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  book_ref          UUID                NOT NULL REFERENCES books(id),
  platform_ref      UUID                REFERENCES platforms(id),
  sale_date         DATE                NOT NULL,
  quantity          INTEGER             NOT NULL DEFAULT 1,
  unit_mrp          NUMERIC(10,2),
  royalty_per_copy  NUMERIC(10,2)       NOT NULL,
  royalty_amount    NUMERIC(12,2)       NOT NULL,
  payout_status     sale_payout_status  NOT NULL DEFAULT 'pending',
  payout_ref        UUID,
  order_reference   VARCHAR(100),
  created_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE TABLE royalty_payouts (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  book_ref          UUID          NOT NULL REFERENCES books(id),
  author_ref        UUID          NOT NULL REFERENCES authors(id),
  quarter_label     VARCHAR(10)   NOT NULL,
  period_start      DATE          NOT NULL,
  period_end        DATE          NOT NULL,
  gross_amount      NUMERIC(12,2) NOT NULL,
  net_amount        NUMERIC(12,2) NOT NULL,
  payout_date       DATE,
  status            VARCHAR(20)   NOT NULL DEFAULT 'pending',
  bank_reference    VARCHAR(100),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT royalty_payouts_book_quarter_unique UNIQUE (book_ref, quarter_label)
);

CREATE INDEX idx_ai_draft_ticket_current ON ai_draft_responses (ticket_ref, is_current);
CREATE INDEX idx_ticket_ai_logs_ticket ON ticket_ai_logs (ticket_ref);
CREATE INDEX idx_book_sales_book_date ON book_sales (book_ref, sale_date);
CREATE INDEX idx_book_sales_payout_status ON book_sales (payout_status);
CREATE INDEX idx_royalty_payouts_author ON royalty_payouts (author_ref);
