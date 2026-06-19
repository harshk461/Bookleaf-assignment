-- 007: Ticket file attachments
CREATE TABLE ticket_attachments (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_ref  UUID          NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  file_name   VARCHAR(255)  NOT NULL,
  mime_type   VARCHAR(100)  NOT NULL,
  size_bytes  INTEGER       NOT NULL,
  storage_key VARCHAR(500)  NOT NULL,
  uploaded_by UUID          NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_attachments_ticket ON ticket_attachments (ticket_ref);
