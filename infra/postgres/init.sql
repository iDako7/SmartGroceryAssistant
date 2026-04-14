-- =============================================================
-- SmartGroceryAssistant — PostgreSQL init
-- Creates user_db and list_db with full Phase 1 schemas
-- =============================================================

-- ---- user_db ------------------------------------------------
CREATE DATABASE user_db;
\c user_db;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language_preference  VARCHAR(20) NOT NULL DEFAULT 'en',
  dietary_restrictions TEXT[]      NOT NULL DEFAULT '{}',
  household_size       SMALLINT    NOT NULL DEFAULT 1,
  taste_preferences    TEXT        NOT NULL DEFAULT '',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Transactional outbox for reliable event publishing (Layer 3)
CREATE TABLE outbox (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   VARCHAR(100) NOT NULL,
  payload      JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ           -- NULL = not yet published
);

CREATE INDEX idx_outbox_unpublished ON outbox (created_at)
  WHERE published_at IS NULL;

-- ---- list_db ------------------------------------------------
CREATE DATABASE list_db;
\c list_db;

CREATE TABLE sections (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL,
  name       VARCHAR(255) NOT NULL,
  position   INTEGER     NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sections_user_id ON sections(user_id);

CREATE TABLE items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id     UUID         NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  name_en        VARCHAR(255) NOT NULL,
  name_secondary VARCHAR(255),
  quantity       INTEGER      NOT NULL DEFAULT 1,
  checked        BOOLEAN      NOT NULL DEFAULT FALSE,
  deleted_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_items_section_id ON items(section_id);
