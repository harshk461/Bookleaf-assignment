-- 002: authors and users
CREATE TABLE authors (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       VARCHAR(20)   NOT NULL UNIQUE,
  name            VARCHAR(255)  NOT NULL,
  email           VARCHAR(255)  NOT NULL UNIQUE,
  phone           VARCHAR(50),
  city            VARCHAR(100),
  joined_date     DATE          NOT NULL,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE users (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255)  NOT NULL,
  role            user_role     NOT NULL,
  author_ref      UUID          REFERENCES authors(id),
  name            VARCHAR(255)  NOT NULL,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT users_author_role_check
    CHECK (
      (role = 'author' AND author_ref IS NOT NULL) OR
      (role = 'admin'  AND author_ref IS NULL)
    )
);

CREATE INDEX idx_authors_deleted_at ON authors (deleted_at);
CREATE INDEX idx_users_author_ref ON users (author_ref);
CREATE INDEX idx_users_role ON users (role);
