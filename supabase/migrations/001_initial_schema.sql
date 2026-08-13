-- =============================================================================
-- Keep Tabs - Initial Schema
-- =============================================================================
-- Run this in your Supabase SQL Editor or via supabase db push

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE fine_status AS ENUM ('unpaid', 'paid', 'disputed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'successful', 'failed', 'refunded');
CREATE TYPE dispute_status AS ENUM ('pending', 'approved', 'cancelled', 'modified');
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member');

-- =============================================================================
-- TABLES
-- =============================================================================

-- profiles: extends auth.users with display info
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- groups
CREATE TABLE groups (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  description         TEXT,
  invite_code         TEXT UNIQUE NOT NULL,
  created_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  currency            TEXT NOT NULL DEFAULT 'INR',
  default_fine_amount NUMERIC(10,2) NOT NULL DEFAULT 10,
  icon_url            TEXT,
  settings            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 50)
);

-- group_members
CREATE TABLE group_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       member_role NOT NULL DEFAULT 'member',
  joined_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(group_id, user_id)
);

-- rules
CREATE TABLE rules (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id       UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  default_amount NUMERIC(10,2) NOT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  CONSTRAINT amount_positive CHECK (default_amount > 0)
);

-- fines
CREATE TABLE fines (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id       UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  rule_id        UUID REFERENCES rules(id) ON DELETE SET NULL,
  fined_user_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_by    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount         NUMERIC(10,2) NOT NULL,
  description    TEXT,
  evidence_url   TEXT,
  status         fine_status NOT NULL DEFAULT 'unpaid',
  created_at     TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT amount_positive CHECK (amount > 0)
);

-- payments
CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id            UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount              NUMERIC(10,2) NOT NULL,
  razorpay_order_id   TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  status              payment_status NOT NULL DEFAULT 'pending',
  created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT amount_positive CHECK (amount > 0)
);

-- payment_fines: which fines are covered by a payment
CREATE TABLE payment_fines (
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  fine_id    UUID NOT NULL REFERENCES fines(id) ON DELETE CASCADE,
  amount     NUMERIC(10,2) NOT NULL,
  PRIMARY KEY (payment_id, fine_id)
);

-- disputes
CREATE TABLE disputes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fine_id       UUID NOT NULL REFERENCES fines(id) ON DELETE CASCADE,
  submitted_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason        TEXT NOT NULL,
  status        dispute_status NOT NULL DEFAULT 'pending',
  reviewed_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- notifications
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  type       TEXT NOT NULL DEFAULT 'general',
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT false,
  metadata   JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- achievements
CREATE TABLE achievements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  description      TEXT NOT NULL,
  icon             TEXT NOT NULL DEFAULT '🏆',
  condition_type   TEXT NOT NULL,
  condition_value  INTEGER NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- user_achievements: many-to-many with group context
CREATE TABLE user_achievements (
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id       UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, group_id, achievement_id)
);

-- audit_logs
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  actor_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- processed_webhook_events: Razorpay idempotency
CREATE TABLE processed_webhook_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     TEXT UNIQUE NOT NULL,
  event_type   TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- rate_limit_log
CREATE TABLE rate_limit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action     TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- group_members - the most queried table for RLS
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);

-- fines
CREATE INDEX idx_fines_group_id ON fines(group_id);
CREATE INDEX idx_fines_fined_user_id ON fines(fined_user_id);
CREATE INDEX idx_fines_reported_by ON fines(reported_by);
CREATE INDEX idx_fines_status ON fines(status);
CREATE INDEX idx_fines_created_at ON fines(created_at DESC);
CREATE INDEX idx_fines_rule_id ON fines(rule_id);

-- payments
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_group_id ON payments(group_id);
CREATE INDEX idx_payments_razorpay_order_id ON payments(razorpay_order_id);

-- notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_id_read ON notifications(user_id, read);

-- audit_logs
CREATE INDEX idx_audit_logs_group_id ON audit_logs(group_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- rate_limit_log
CREATE INDEX idx_rate_limit_log_user_action ON rate_limit_log(user_id, action, created_at);

-- =============================================================================
-- HELPER FUNCTIONS (SECURITY DEFINER - runs as superuser, bypasses RLS)
-- =============================================================================

-- Returns the list of group_ids the current user belongs to
CREATE OR REPLACE FUNCTION public.get_my_groups()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT group_id FROM group_members WHERE user_id = auth.uid();
$$;

-- Returns true if current user is admin or owner of the given group
CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'owner')
  );
$$;

-- Returns true if current user is a member of the given group
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
      AND user_id = auth.uid()
  );
$$;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at triggers
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER rules_updated_at
  BEFORE UPDATE ON rules
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER fines_updated_at
  BEFORE UPDATE ON fines
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_log ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- profiles policies
-- -----------------------------------------------------------------------------
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Group members can see each other's profiles
CREATE POLICY "profiles_select_group_members"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT gm.user_id FROM group_members gm
      WHERE gm.group_id IN (SELECT get_my_groups())
    )
  );

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- groups policies
-- -----------------------------------------------------------------------------
CREATE POLICY "groups_select_members"
  ON groups FOR SELECT
  USING (id IN (SELECT get_my_groups()));

CREATE POLICY "groups_insert_authenticated"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "groups_update_admins"
  ON groups FOR UPDATE
  USING (is_group_admin(id))
  WITH CHECK (is_group_admin(id));

-- Only owner can delete group
CREATE POLICY "groups_delete_owner"
  ON groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = id AND user_id = auth.uid() AND role = 'owner'
    )
  );

-- -----------------------------------------------------------------------------
-- group_members policies
-- -----------------------------------------------------------------------------
CREATE POLICY "group_members_select"
  ON group_members FOR SELECT
  USING (group_id IN (SELECT get_my_groups()));

-- Users can insert themselves (join via invite code)
CREATE POLICY "group_members_insert_self"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can insert others (admin adds member)
CREATE POLICY "group_members_insert_admin"
  ON group_members FOR INSERT
  WITH CHECK (is_group_admin(group_id));

CREATE POLICY "group_members_update_admin"
  ON group_members FOR UPDATE
  USING (is_group_admin(group_id))
  WITH CHECK (is_group_admin(group_id));

-- Admins can remove members, or members can remove themselves
CREATE POLICY "group_members_delete"
  ON group_members FOR DELETE
  USING (
    is_group_admin(group_id) OR auth.uid() = user_id
  );

-- -----------------------------------------------------------------------------
-- rules policies
-- -----------------------------------------------------------------------------
CREATE POLICY "rules_select"
  ON rules FOR SELECT
  USING (group_id IN (SELECT get_my_groups()));

CREATE POLICY "rules_insert_admin"
  ON rules FOR INSERT
  WITH CHECK (is_group_admin(group_id) AND auth.uid() = created_by);

CREATE POLICY "rules_update_admin"
  ON rules FOR UPDATE
  USING (is_group_admin(group_id))
  WITH CHECK (is_group_admin(group_id));

CREATE POLICY "rules_delete_admin"
  ON rules FOR DELETE
  USING (is_group_admin(group_id));

-- -----------------------------------------------------------------------------
-- fines policies
-- -----------------------------------------------------------------------------
CREATE POLICY "fines_select"
  ON fines FOR SELECT
  USING (group_id IN (SELECT get_my_groups()));

CREATE POLICY "fines_insert_member"
  ON fines FOR INSERT
  WITH CHECK (
    is_group_member(group_id) AND auth.uid() = reported_by
  );

-- Only admins can update fines (status changes happen server-side via service role for payments)
CREATE POLICY "fines_update_admin"
  ON fines FOR UPDATE
  USING (is_group_admin(group_id))
  WITH CHECK (is_group_admin(group_id));

CREATE POLICY "fines_delete_admin"
  ON fines FOR DELETE
  USING (is_group_admin(group_id));

-- -----------------------------------------------------------------------------
-- payments policies
-- -----------------------------------------------------------------------------
CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "payments_select_admin"
  ON payments FOR SELECT
  USING (is_group_admin(group_id));

CREATE POLICY "payments_insert_own"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_group_member(group_id));

-- Updates only via server (webhook). Users cannot update their own payment status.
-- Service role bypasses RLS.

-- -----------------------------------------------------------------------------
-- payment_fines policies
-- -----------------------------------------------------------------------------
CREATE POLICY "payment_fines_select"
  ON payment_fines FOR SELECT
  USING (
    payment_id IN (
      SELECT id FROM payments WHERE user_id = auth.uid()
    )
    OR
    payment_id IN (
      SELECT p.id FROM payments p
      WHERE is_group_admin(p.group_id)
    )
  );

CREATE POLICY "payment_fines_insert_own"
  ON payment_fines FOR INSERT
  WITH CHECK (
    payment_id IN (
      SELECT id FROM payments WHERE user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- disputes policies
-- -----------------------------------------------------------------------------
CREATE POLICY "disputes_select"
  ON disputes FOR SELECT
  USING (
    submitted_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM fines f
      WHERE f.id = fine_id AND is_group_admin(f.group_id)
    )
  );

CREATE POLICY "disputes_insert_own"
  ON disputes FOR INSERT
  WITH CHECK (
    auth.uid() = submitted_by
    AND
    EXISTS (
      SELECT 1 FROM fines
      WHERE id = fine_id AND fined_user_id = auth.uid()
    )
  );

CREATE POLICY "disputes_update_admin"
  ON disputes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM fines f
      WHERE f.id = fine_id AND is_group_admin(f.group_id)
    )
  );

-- -----------------------------------------------------------------------------
-- notifications policies
-- -----------------------------------------------------------------------------
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Insert via service role (server-side) only

-- -----------------------------------------------------------------------------
-- achievements policies
-- -----------------------------------------------------------------------------
CREATE POLICY "achievements_select_all"
  ON achievements FOR SELECT
  USING (true); -- achievements are public/static data

-- -----------------------------------------------------------------------------
-- user_achievements policies
-- -----------------------------------------------------------------------------
CREATE POLICY "user_achievements_select"
  ON user_achievements FOR SELECT
  USING (group_id IN (SELECT get_my_groups()));

-- Insert via service role only (server-side achievement check)

-- -----------------------------------------------------------------------------
-- audit_logs policies
-- -----------------------------------------------------------------------------
CREATE POLICY "audit_logs_select_admin"
  ON audit_logs FOR SELECT
  USING (is_group_admin(group_id));

-- Insert via service role only

-- -----------------------------------------------------------------------------
-- processed_webhook_events - no user access
-- -----------------------------------------------------------------------------
-- All operations via service role only

-- -----------------------------------------------------------------------------
-- rate_limit_log policies
-- -----------------------------------------------------------------------------
CREATE POLICY "rate_limit_log_own"
  ON rate_limit_log FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "rate_limit_log_insert_own"
  ON rate_limit_log FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- SEED: Default Achievements
-- =============================================================================

INSERT INTO achievements (name, description, icon, condition_type, condition_value) VALUES
  ('First Fine', 'You received your very first fine. Welcome to the club! 🎉', '🏆', 'fines_received', 1),
  ('Repeat Offender', 'Got fined 5 times. You never learn, do you?', '🔁', 'fines_received', 5),
  ('Fine Connoisseur', 'Got fined 10 times. A true professional criminal.', '💀', 'fines_received', 10),
  ('Walking ATM', 'Received fines worth ₹500 total. Your wallet is crying.', '💸', 'fines_amount_received', 500),
  ('Walking ATM Pro', 'Received fines worth ₹1,000 total. Congratulations, I think?', '🏧', 'fines_amount_received', 1000),
  ('Debt Clearer', 'Paid your very first fine. Good start!', '✅', 'fines_paid', 1),
  ('Responsible Adult', 'Paid ₹500 in fines. The group salutes you.', '🎖️', 'amount_paid', 500),
  ('Big Spender', 'Paid ₹1,000 in fines. Your bank account is officially scared.', '💰', 'amount_paid', 1000),
  ('7-Day Clean Streak', 'Went 7 days without a fine. Actual miracle.', '🔥', 'clean_streak_days', 7),
  ('30-Day Clean Streak', '30 days without a fine. Are you even in this group?', '🌟', 'clean_streak_days', 30),
  ('First Reporter', 'Reported your first fine. Snitches get riches!', '🚨', 'fines_reported', 1),
  ('Sheriff', 'Reported 10 fines. The group cop is busy today.', '🚔', 'fines_reported', 10),
  ('Fine King', 'Had the highest outstanding balance in the group.', '👑', 'most_owed', 1),
  ('Most Responsible', 'Had the lowest outstanding balance in the group.', '🕊️', 'least_owed', 1),
  ('Dispute Warrior', 'Successfully disputed a fine.', '⚖️', 'disputes_won', 1);
