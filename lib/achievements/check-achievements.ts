'use server'

import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications/create-notification'

/**
 * Check and award any newly-earned achievements for a user in a group.
 * Called after fine issuance and payment events.
 * Returns list of newly earned achievement IDs.
 */
export async function checkAndAwardAchievements(
  userId: string,
  groupId: string
): Promise<{ id: string; name: string; icon: string }[]> {
  const supabase = await createClient()

  // 1. Load all achievements
  const { data: allAchievements } = await supabase.from('achievements').select('*')
  if (!allAchievements?.length) return []

  // 2. Load already-earned achievements for this user in this group
  const { data: earned } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId)
    .eq('group_id', groupId)

  const earnedIds = new Set((earned ?? []).map((e) => e.achievement_id))
  const unearned = allAchievements.filter((a) => !earnedIds.has(a.id))
  if (!unearned.length) return []

  // 3. Gather user stats in this group
  const { data: receivedFines } = await supabase
    .from('fines')
    .select('id, amount, status, created_at')
    .eq('group_id', groupId)
    .eq('fined_user_id', userId)
    .neq('status', 'cancelled')

  const { data: reportedFines } = await supabase
    .from('fines')
    .select('id')
    .eq('group_id', groupId)
    .eq('reported_by', userId)

  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('status', 'successful')

  const { data: wonDisputes } = await supabase
    .from('disputes')
    .select('id')
    .eq('submitted_by', userId)
    .eq('status', 'cancelled') // dispute accepted = fine cancelled

  const fines = receivedFines ?? []
  const paidFinesCount = fines.filter((f) => f.status === 'paid').length
  const totalFinesReceived = fines.length
  const totalAmountReceived = fines.reduce((s, f) => s + Number(f.amount), 0)
  const totalAmountPaid = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0)
  const finesReported = (reportedFines ?? []).length
  const disputesWon = (wonDisputes ?? []).length

  // Clean streak (days since last fine)
  const now = new Date()
  const sortedFines = [...fines].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const cleanStreakDays =
    sortedFines.length === 0
      ? 999
      : Math.floor(
          (now.getTime() - new Date(sortedFines[0].created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        )

  // 4. Evaluate each unearned achievement
  const newlyEarned: { id: string; name: string; icon: string }[] = []

  for (const a of unearned) {
    let earned = false

    switch (a.condition_type) {
      case 'fines_received':
        earned = totalFinesReceived >= a.condition_value
        break
      case 'fines_amount_received':
        earned = totalAmountReceived >= a.condition_value
        break
      case 'fines_paid':
        earned = paidFinesCount >= a.condition_value
        break
      case 'amount_paid':
        earned = totalAmountPaid >= a.condition_value
        break
      case 'clean_streak_days':
        earned = cleanStreakDays >= a.condition_value
        break
      case 'fines_reported':
        earned = finesReported >= a.condition_value
        break
      case 'disputes_won':
        earned = disputesWon >= a.condition_value
        break
      // Special: most_owed / least_owed require group comparison — skip here
    }

    if (earned) {
      // Insert into user_achievements (ignore duplicate — constraint handles it)
      const { error } = await supabase.from('user_achievements').insert({
        user_id: userId,
        group_id: groupId,
        achievement_id: a.id,
      })

      if (!error) {
        newlyEarned.push({ id: a.id, name: a.name, icon: a.icon })

        // Notify the user
        await createNotification({
          userId: userId,
          groupId: groupId,
          type: 'achievement_earned',
          title: `Achievement Unlocked`,
          message: `${a.name} — ${a.description}`,
          metadata: { achievement_id: a.id },
        })
      }
    }
  }

  return newlyEarned
}
