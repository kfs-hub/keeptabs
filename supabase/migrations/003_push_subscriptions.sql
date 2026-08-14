-- =============================================================================
-- KEEP TABS - Migration 003: Push Subscriptions Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for speedy lookups by user_id
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users manage their own push subscriptions
CREATE POLICY "push_subscriptions_select_own"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_insert_own"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_delete_own"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);
