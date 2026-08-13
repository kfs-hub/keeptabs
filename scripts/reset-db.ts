/**
 * Keep Tabs — Reset Script
 *
 * Deletes all non-auth application data so you can re-seed cleanly.
 * Auth users are NOT deleted — only app data tables are cleared.
 *
 * Usage:
 *   npx tsx scripts/reset-db.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function resetDb() {
  console.log('\n🗑️   Resetting app data (auth users preserved)…\n')

  const tables = [
    'processed_webhook_events',
    'rate_limit_log',
    'audit_logs',
    'user_achievements',
    'notifications',
    'disputes',
    'payment_fines',
    'payments',
    'fines',
    'rules',
    'group_members',
    'groups',
  ]

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error && !error.message.includes('no rows')) {
      // Some tables use composite PKs — try a different approach
      const { error: e2 } = await supabase.rpc('exec_sql', { sql: `DELETE FROM ${table}` }).single()
      if (e2) console.error(`  ⚠️  ${table}: ${error.message}`)
      else console.log(`  ✅ ${table} cleared`)
    } else {
      console.log(`  ✅ ${table} cleared`)
    }
  }

  console.log('\n✨  Done! Run "npm run seed" to re-populate.\n')
}

resetDb().catch((e) => {
  console.error('\n❌  Reset failed:', e.message)
  process.exit(1)
})
