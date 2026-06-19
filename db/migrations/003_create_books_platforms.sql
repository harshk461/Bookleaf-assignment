-- 003: print_partners, platforms, books, book_platforms
CREATE TABLE print_partners (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            VARCHAR(50)   NOT NULL UNIQUE,
  name            VARCHAR(100)  NOT NULL UNIQUE,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE platforms (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            VARCHAR(50)   NOT NULL UNIQUE,
  name            VARCHAR(100)  NOT NULL UNIQUE,
  region          VARCHAR(50),
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE books (
  id                        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id                   VARCHAR(20)   NOT NULL UNIQUE,
  author_ref                UUID          NOT NULL REFERENCES authors(id),
  title                     VARCHAR(500)  NOT NULL,
  isbn                      VARCHAR(20)   NOT NULL,
  genre                     VARCHAR(100),
  publication_date          DATE,
  status                    VARCHAR(100)  NOT NULL,
  mrp                       NUMERIC(10,2),
  author_royalty_per_copy   NUMERIC(10,2),
  total_copies_sold         INTEGER       NOT NULL DEFAULT 0,
  total_royalty_earned      NUMERIC(12,2) NOT NULL DEFAULT 0,
  royalty_paid              NUMERIC(12,2) NOT NULL DEFAULT 0,
  royalty_pending           NUMERIC(12,2) NOT NULL DEFAULT 0,
  last_royalty_payout_date  DATE,
  print_partner_ref         UUID          REFERENCES print_partners(id),
  created_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at                TIMESTAMPTZ,

  CONSTRAINT books_isbn_unique UNIQUE (isbn)
);

CREATE TABLE book_platforms (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  book_ref        UUID          NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  platform_ref    UUID          NOT NULL REFERENCES platforms(id),
  is_available    BOOLEAN       NOT NULL DEFAULT TRUE,
  listed_at       TIMESTAMPTZ,
  last_synced_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT book_platforms_unique UNIQUE (book_ref, platform_ref)
);

CREATE INDEX idx_books_author_ref ON books (author_ref);
CREATE INDEX idx_books_status ON books (status);
CREATE INDEX idx_book_platforms_platform_ref ON book_platforms (platform_ref);
