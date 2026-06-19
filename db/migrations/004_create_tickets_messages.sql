-- 004: tickets, ticket_messages, internal_notes
CREATE TABLE tickets (
  id                        UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number             VARCHAR(20)       NOT NULL UNIQUE,
  author_ref                UUID              NOT NULL REFERENCES authors(id),
  book_ref                  UUID              REFERENCES books(id),
  subject                   VARCHAR(500)      NOT NULL,
  description               TEXT              NOT NULL,
  status                    ticket_status     NOT NULL DEFAULT 'open',
  category                  ticket_category,
  priority                  ticket_priority,
  ai_category               ticket_category,
  ai_priority               ticket_priority,
  category_overridden       BOOLEAN           NOT NULL DEFAULT FALSE,
  priority_overridden       BOOLEAN           NOT NULL DEFAULT FALSE,
  assigned_admin_ref        UUID              REFERENCES users(id),
  ai_classification_failed  BOOLEAN           NOT NULL DEFAULT FALSE,
  ai_classified_at          TIMESTAMPTZ,
  created_at                TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  deleted_at                TIMESTAMPTZ
);

CREATE TABLE ticket_messages (
  id              UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_ref      UUID                  NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_type     message_sender_type   NOT NULL,
  sender_ref      UUID                  NOT NULL REFERENCES users(id),
  content         TEXT                  NOT NULL,
  is_initial      BOOLEAN               NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE internal_notes (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_ref      UUID          NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  admin_ref       UUID          NOT NULL REFERENCES users(id),
  content         TEXT          NOT NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_tickets_author_ref ON tickets (author_ref);
CREATE INDEX idx_tickets_queue ON tickets (status, priority, created_at DESC);
CREATE INDEX idx_tickets_category ON tickets (category);
CREATE INDEX idx_tickets_assigned_admin ON tickets (assigned_admin_ref);
CREATE INDEX idx_tickets_created_at ON tickets (created_at);
CREATE INDEX idx_ticket_messages_ticket ON ticket_messages (ticket_ref, created_at);
CREATE INDEX idx_internal_notes_ticket ON internal_notes (ticket_ref);
