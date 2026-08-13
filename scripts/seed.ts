/**
 * Keep Tabs — Development Seed Script
 *
 * Creates a complete dev dataset:
 *   - 4 users (1 owner, 1 admin, 2 members)
 *   - 1 group "The Gang" with invite code THEGANG42
 *   - 6 rules
 *   - 15 fines (mix of unpaid/paid/disputed)
 *   - 3 payments (successful)
 *   - 1 dispute (pending)
 *   - 8 notifications
 *   - Achievements awarded
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as crypto from 'crypto'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceKey) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// Service role client — bypasses RLS for seeding
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const log = (msg: string) => console.log(`  ${msg}`)
const ok  = (msg: string) => console.log(`  ✅ ${msg}`)
const err = (msg: string) => console.error(`  ❌ ${msg}`)

// ── Helpers ───────────────────────────────────────────────────────────────────

function uuid() {
  return crypto.randomUUID()
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

async function upsertAuthUser(email: string, password: string, meta: { display_name: string; username: string }) {
  // Try to create; if already exists, fetch the existing id
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: meta,
  })

  if (error?.message?.includes('already registered') || error?.message?.includes('already been registered')) {
    const { data: existing } = await supabase.auth.admin.listUsers()
    const found = existing?.users?.find((u) => u.email === email)
    if (found) return found.id
    throw new Error(`User ${email} exists but cannot be found`)
  }

  if (error) throw new Error(`createUser ${email}: ${error.message}`)
  return data.user!.id
}

// ── Main seed function ────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱  Keep Tabs — Seeding development data\n')

  // ── 1. Create users ──────────────────────────────────────────────────────────
  log('Creating users…')

  const users = [
    { email: 'kaif@keeptabs.dev',  password: 'password123', display_name: 'Kaif',  username: 'kaif42'  },
    { email: 'alex@keeptabs.dev',  password: 'password123', display_name: 'Alex',  username: 'alex_dev' },
    { email: 'rahul@keeptabs.dev', password: 'password123', display_name: 'Rahul', username: 'rahul_r' },
    { email: 'sara@keeptabs.dev',  password: 'password123', display_name: 'Sara',  username: 'sara_x'  },
  ]

  const userIds: string[] = []
  for (const u of users) {
    const id = await upsertAuthUser(u.email, u.password, {
      display_name: u.display_name,
      username: u.username,
    })
    userIds.push(id)

    // Upsert profile (auth trigger usually does this, but be explicit in seed)
    await supabase.from('profiles').upsert({
      id,
      username: u.username,
      display_name: u.display_name,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`,
    }, { onConflict: 'id' })
  }

  const [kaifId, alexId, rahulId, saraId] = userIds
  ok(`Created 4 users: kaif (${kaifId.slice(0,8)}…), alex, rahul, sara`)

  // ── 2. Create group ──────────────────────────────────────────────────────────
  log('Creating group "The Gang"…')

  const INVITE_CODE = 'THEGANG42'
  const GROUP_ID = uuid()

  // Delete existing group with same invite code to allow re-seeding
  await supabase.from('groups').delete().eq('invite_code', INVITE_CODE)

  const { error: groupErr } = await supabase.from('groups').insert({
    id: GROUP_ID,
    name: 'The Gang',
    description: 'The official fine-tracking group for the boys.',
    invite_code: INVITE_CODE,
    created_by: kaifId,
    currency: 'INR',
    default_fine_amount: 10,
    settings: {
      leaderboard_labels: {
        first: '💀 Biggest Criminal',
        second: '😭 Bro Owes Everyone',
        third: '💸 Walking ATM',
      },
    },
  })
  if (groupErr) { err(groupErr.message); process.exit(1) }
  ok(`Group created: THEGANG42 (${GROUP_ID.slice(0,8)}…)`)

  // ── 3. Add members ───────────────────────────────────────────────────────────
  log('Adding group members…')
  const memberships = [
    { group_id: GROUP_ID, user_id: kaifId,  role: 'owner'  },
    { group_id: GROUP_ID, user_id: alexId,  role: 'admin'  },
    { group_id: GROUP_ID, user_id: rahulId, role: 'member' },
    { group_id: GROUP_ID, user_id: saraId,  role: 'member' },
  ]
  const { error: memErr } = await supabase.from('group_members').insert(memberships)
  if (memErr) { err(memErr.message); process.exit(1) }
  ok('4 members added (kaif=owner, alex=admin, rahul & sara=member)')

  // ── 4. Create rules ──────────────────────────────────────────────────────────
  log('Creating rules…')
  const ruleRows = [
    { id: uuid(), group_id: GROUP_ID, name: 'Saying "Bro"',          description: 'Classic. Unacceptable.',                  default_amount: 10,  created_by: kaifId },
    { id: uuid(), group_id: GROUP_ID, name: 'Being Late',            description: 'More than 10 minutes = fine.',             default_amount: 20,  created_by: kaifId },
    { id: uuid(), group_id: GROUP_ID, name: 'Cancelling Plans',      description: 'Less than 2 hours notice.',               default_amount: 50,  created_by: kaifId },
    { id: uuid(), group_id: GROUP_ID, name: 'Losing a Challenge',    description: 'You lose, you pay.',                      default_amount: 25,  created_by: alexId },
    { id: uuid(), group_id: GROUP_ID, name: 'Spoiling a Movie/Show', description: 'How dare you.',                           default_amount: 30,  created_by: alexId },
    { id: uuid(), group_id: GROUP_ID, name: 'Ghosting the Group Chat',description: 'Seen. No reply. Fine.',                  default_amount: 15,  created_by: kaifId },
  ]
  const { error: rulesErr } = await supabase.from('rules').insert(ruleRows)
  if (rulesErr) { err(rulesErr.message); process.exit(1) }
  ok(`6 rules created`)

  const [broRule, lateRule, cancelRule, challengeRule, spoilerRule, ghostRule] = ruleRows

  // ── 5. Create fines ──────────────────────────────────────────────────────────
  log('Creating 15 fines…')
  const fineRows = [
    // Rahul's fines (biggest criminal)
    { id: uuid(), group_id: GROUP_ID, rule_id: broRule.id,       fined_user_id: rahulId, reported_by: kaifId,  amount: 10,  status: 'unpaid',   description: 'Said "bro" 3 times in one sentence.', created_at: daysAgo(1) },
    { id: uuid(), group_id: GROUP_ID, rule_id: lateRule.id,      fined_user_id: rahulId, reported_by: alexId,  amount: 20,  status: 'unpaid',   description: '25 minutes late to dinner.',           created_at: daysAgo(3) },
    { id: uuid(), group_id: GROUP_ID, rule_id: cancelRule.id,    fined_user_id: rahulId, reported_by: kaifId,  amount: 50,  status: 'unpaid',   description: 'Cancelled 1 hour before the plan.',   created_at: daysAgo(5) },
    { id: uuid(), group_id: GROUP_ID, rule_id: broRule.id,       fined_user_id: rahulId, reported_by: saraId,  amount: 10,  status: 'paid',     description: null,                                   created_at: daysAgo(10) },
    { id: uuid(), group_id: GROUP_ID, rule_id: challengeRule.id, fined_user_id: rahulId, reported_by: alexId,  amount: 25,  status: 'paid',     description: 'Lost the pushup challenge.',           created_at: daysAgo(15) },
    { id: uuid(), group_id: GROUP_ID, rule_id: ghostRule.id,     fined_user_id: rahulId, reported_by: kaifId,  amount: 15,  status: 'disputed', description: 'Seen but no reply for 3 hours.',       created_at: daysAgo(2) },

    // Alex's fines
    { id: uuid(), group_id: GROUP_ID, rule_id: spoilerRule.id,   fined_user_id: alexId,  reported_by: kaifId,  amount: 30,  status: 'unpaid',   description: 'Spoiled Oppenheimer ending.',          created_at: daysAgo(4) },
    { id: uuid(), group_id: GROUP_ID, rule_id: lateRule.id,      fined_user_id: alexId,  reported_by: rahulId, amount: 20,  status: 'unpaid',   description: 'Late again. Classic Alex.',            created_at: daysAgo(6) },
    { id: uuid(), group_id: GROUP_ID, rule_id: broRule.id,       fined_user_id: alexId,  reported_by: saraId,  amount: 10,  status: 'paid',     description: null,                                   created_at: daysAgo(20) },

    // Sara's fines
    { id: uuid(), group_id: GROUP_ID, rule_id: cancelRule.id,    fined_user_id: saraId,  reported_by: alexId,  amount: 50,  status: 'paid',     description: 'Last minute cancel. Shocking.',        created_at: daysAgo(8) },
    { id: uuid(), group_id: GROUP_ID, rule_id: ghostRule.id,     fined_user_id: saraId,  reported_by: kaifId,  amount: 15,  status: 'unpaid',   description: 'Group chat ghost mode for 2 days.',   created_at: daysAgo(1) },

    // Kaif's fines (owner isn't immune)
    { id: uuid(), group_id: GROUP_ID, rule_id: lateRule.id,      fined_user_id: kaifId,  reported_by: alexId,  amount: 20,  status: 'paid',     description: 'The owner himself was late.',          created_at: daysAgo(12) },
    { id: uuid(), group_id: GROUP_ID, rule_id: challengeRule.id, fined_user_id: kaifId,  reported_by: rahulId, amount: 25,  status: 'unpaid',   description: 'Lost the darts challenge badly.',      created_at: daysAgo(3) },
    { id: uuid(), group_id: GROUP_ID, rule_id: broRule.id,       fined_user_id: kaifId,  reported_by: saraId,  amount: 10,  status: 'unpaid',   description: null,                                   created_at: daysAgo(2) },

    // Hall of shame special
    { id: uuid(), group_id: GROUP_ID, rule_id: cancelRule.id,    fined_user_id: rahulId, reported_by: kaifId,  amount: 200, status: 'paid',     description: 'Somehow managed to break 4 rules in one night. Legendary.',  created_at: daysAgo(30) },
  ]
  const { error: finesErr } = await supabase.from('fines').insert(fineRows)
  if (finesErr) { err(finesErr.message); process.exit(1) }
  ok('15 fines created (mix of unpaid/paid/disputed)')

  // ── 6. Create payments ───────────────────────────────────────────────────────
  log('Creating 3 payments…')

  const paidFines = fineRows.filter((f) => f.status === 'paid')

  // Payment 1: Rahul paid 2 fines
  const pay1Id = uuid()
  const rahulPaidFines = paidFines.filter((f) => f.fined_user_id === rahulId).slice(0, 2)
  const pay1Amount = rahulPaidFines.reduce((s, f) => s + f.amount, 0)
  await supabase.from('payments').insert({
    id: pay1Id,
    group_id: GROUP_ID,
    user_id: rahulId,
    amount: pay1Amount,
    razorpay_order_id: `order_test_rahul_001`,
    razorpay_payment_id: `pay_test_rahul_001`,
    status: 'successful',
    created_at: daysAgo(14),
  })
  await supabase.from('payment_fines').insert(
    rahulPaidFines.map((f) => ({ payment_id: pay1Id, fine_id: f.id, amount: f.amount }))
  )

  // Payment 2: Alex paid 1 fine
  const pay2Id = uuid()
  const alexPaidFines = paidFines.filter((f) => f.fined_user_id === alexId)
  if (alexPaidFines.length) {
    await supabase.from('payments').insert({
      id: pay2Id,
      group_id: GROUP_ID,
      user_id: alexId,
      amount: alexPaidFines[0].amount,
      razorpay_order_id: `order_test_alex_001`,
      razorpay_payment_id: `pay_test_alex_001`,
      status: 'successful',
      created_at: daysAgo(19),
    })
    await supabase.from('payment_fines').insert([{
      payment_id: pay2Id,
      fine_id: alexPaidFines[0].id,
      amount: alexPaidFines[0].amount,
    }])
  }

  // Payment 3: Rahul big payment (hall of shame fine)
  const hallFine = fineRows.find((f) => f.amount === 200 && f.fined_user_id === rahulId)
  if (hallFine) {
    const pay3Id = uuid()
    await supabase.from('payments').insert({
      id: pay3Id,
      group_id: GROUP_ID,
      user_id: rahulId,
      amount: 200,
      razorpay_order_id: `order_test_rahul_002`,
      razorpay_payment_id: `pay_test_rahul_002`,
      status: 'successful',
      created_at: daysAgo(29),
    })
    await supabase.from('payment_fines').insert([{
      payment_id: pay3Id,
      fine_id: hallFine.id,
      amount: 200,
    }])
  }
  ok('3 payments created')

  // ── 7. Create dispute ────────────────────────────────────────────────────────
  log('Creating 1 pending dispute…')
  const disputedFine = fineRows.find((f) => f.status === 'disputed')
  if (disputedFine) {
    await supabase.from('disputes').insert({
      id: uuid(),
      fine_id: disputedFine.id,
      submitted_by: rahulId,
      reason: 'I DID NOT ghost. My phone died. I have receipts. This is a miscarriage of justice.',
      status: 'pending',
      created_at: daysAgo(2),
    })
    ok('1 dispute created (pending review)')
  }

  // ── 8. Create notifications ──────────────────────────────────────────────────
  log('Creating notifications…')
  await supabase.from('notifications').insert([
    {
      user_id: rahulId, group_id: GROUP_ID, type: 'fine_received',
      title: '🚨 You just got fined!', read: false,
      message: 'You were fined ₹50 for: Cancelling Plans',
      metadata: { fine_id: fineRows[2].id }, created_at: daysAgo(5),
    },
    {
      user_id: rahulId, group_id: GROUP_ID, type: 'payment_successful',
      title: '🎉 Payment Successful!', read: true,
      message: 'Your payment was confirmed. Debt cleared! 🏆',
      metadata: {}, created_at: daysAgo(14),
    },
    {
      user_id: kaifId, group_id: GROUP_ID, type: 'dispute_submitted',
      title: '⚖️ Fine Disputed', read: false,
      message: 'Rahul is disputing their ₹15 fine',
      metadata: { fine_id: fineRows[5].id }, created_at: daysAgo(2),
    },
    {
      user_id: alexId, group_id: GROUP_ID, type: 'dispute_submitted',
      title: '⚖️ Fine Disputed', read: false,
      message: 'Rahul is disputing their ₹15 fine',
      metadata: { fine_id: fineRows[5].id }, created_at: daysAgo(2),
    },
    {
      user_id: rahulId, group_id: GROUP_ID, type: 'fine_received',
      title: '🚨 Another fine!', read: false,
      message: 'You were fined ₹10 for: Saying "Bro"',
      metadata: { fine_id: fineRows[0].id }, created_at: daysAgo(1),
    },
    {
      user_id: saraId, group_id: GROUP_ID, type: 'payment_received',
      title: '💸 Payment Received!', read: true,
      message: 'Rahul has paid their fines.',
      metadata: {}, created_at: daysAgo(14),
    },
    {
      user_id: kaifId, group_id: GROUP_ID, type: 'fine_received',
      title: '🚨 You got fined!', read: false,
      message: 'You were fined ₹25 for: Losing a Challenge',
      metadata: { fine_id: fineRows[12].id }, created_at: daysAgo(3),
    },
    {
      user_id: saraId, group_id: GROUP_ID, type: 'fine_received',
      title: '🚨 You got fined!', read: false,
      message: 'You were fined ₹15 for: Ghosting the Group Chat',
      metadata: { fine_id: fineRows[10].id }, created_at: daysAgo(1),
    },
  ])
  ok('8 notifications created')

  // ── 9. Award achievements ────────────────────────────────────────────────────
  log('Awarding achievements…')
  const { data: achievements } = await supabase.from('achievements').select('id, name, condition_type, condition_value')

  if (achievements?.length) {
    const achievementMap = Object.fromEntries(achievements.map((a) => [a.condition_type + '_' + a.condition_value, a.id]))

    const awards = [
      // Rahul: First Fine, 10 Fines Received (has 6), Debt Clearer, Reporter
      { user_id: rahulId, achievement_id: achievementMap['fines_received_1'] },
      { user_id: rahulId, achievement_id: achievementMap['fines_received_5'] },
      { user_id: rahulId, achievement_id: achievementMap['fines_paid_1'] },
      // Kaif: First Reporter
      { user_id: kaifId,  achievement_id: achievementMap['fines_reported_1'] },
      // Alex: First Fine, Reporter
      { user_id: alexId,  achievement_id: achievementMap['fines_received_1'] },
      { user_id: alexId,  achievement_id: achievementMap['fines_reported_1'] },
      // Sara: First Fine, Debt Clearer
      { user_id: saraId,  achievement_id: achievementMap['fines_received_1'] },
      { user_id: saraId,  achievement_id: achievementMap['fines_paid_1'] },
    ]
      .filter((a) => a.achievement_id) // skip if achievement_id is undefined
      .map((a) => ({ ...a, group_id: GROUP_ID }))

    if (awards.length) {
      await supabase.from('user_achievements').upsert(awards, { onConflict: 'user_id,group_id,achievement_id', ignoreDuplicates: true })
      ok(`${awards.length} achievements awarded`)
    }
  } else {
    log('(No achievements in DB — run the schema migration first to seed achievements)')
  }

  // ── 10. Audit log entries ────────────────────────────────────────────────────
  log('Adding audit log sample…')
  await supabase.from('audit_logs').insert([
    {
      group_id: GROUP_ID, actor_id: kaifId, action: 'group_settings_updated',
      target_type: 'group', target_id: GROUP_ID, metadata: {},
      created_at: daysAgo(30),
    },
  ])
  ok('1 audit log entry created')

  // ── Done ─────────────────────────────────────────────────────────────────────
  console.log('\n🎉  Seeding complete!\n')
  console.log('  Group invite code: THEGANG42')
  console.log('  Test accounts (password: password123):')
  console.log('    kaif@keeptabs.dev   — Owner')
  console.log('    alex@keeptabs.dev   — Admin')
  console.log('    rahul@keeptabs.dev  — Member (most fined)')
  console.log('    sara@keeptabs.dev   — Member')
  console.log('\n  Run: npm run dev  →  open http://localhost:3000\n')
}

seed().catch((e) => {
  console.error('\n❌  Seed failed:', e.message)
  process.exit(1)
})
