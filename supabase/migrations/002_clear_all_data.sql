-- =============================================================================
-- Keep Tabs — Clear All Data (Run once to reset before going live)
-- =============================================================================
-- Run this in Supabase SQL Editor to wipe all test users and data.
-- This deletes everything: users, groups, fines, payments, etc.
-- After running this the app is clean and ready for real users.
--
-- WARNING: This is irreversible. Only run once before launch.
-- =============================================================================

-- 1. Clear all app data (cascades handle related records)
DELETE FROM processed_webhook_events;
DELETE FROM rate_limit_log;
DELETE FROM audit_logs;
DELETE FROM user_achievements;
DELETE FROM notifications;
DELETE FROM disputes;
DELETE FROM payment_fines;
DELETE FROM payments;
DELETE FROM fines;
DELETE FROM rules;
DELETE FROM group_members;
DELETE FROM groups;
DELETE FROM profiles;

-- 2. Delete all auth users (this removes everyone from auth.users)
-- Supabase doesn't allow direct DELETE on auth.users from SQL editor
-- so we use the admin API instead. Run this after the above:
--
-- Option A: Go to Supabase Dashboard → Authentication → Users
--           Select all users → Delete
--
-- Option B: Use this function if available:
DO $$
DECLARE
  uid uuid;
BEGIN
  FOR uid IN SELECT id FROM auth.users
  LOOP
    PERFORM auth.uid(); -- just to check we're in right context
    DELETE FROM auth.users WHERE id = uid;
  END LOOP;
END $$;

-- Confirm everything is clean
SELECT 'profiles' as table_name, COUNT(*) as rows FROM profiles
UNION ALL SELECT 'groups', COUNT(*) FROM groups
UNION ALL SELECT 'fines', COUNT(*) FROM fines
UNION ALL SELECT 'payments', COUNT(*) FROM payments;
