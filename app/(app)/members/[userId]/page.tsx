import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'

import { getActiveGroup } from '@/lib/groups/get-active-group'

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }) {
  return { title: 'Member Profile' }
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId: profileUserId } = await params
  const supabase = await createClient()

  // Get viewer's active group
  const { group, groupId, userId } = await getActiveGroup()
  const currency: string = group?.currency ?? 'INR'

  // Verify target user is in the same group (RLS also enforces this)
  const { data: targetMembership } = await supabase
    .from('group_members')
    .select('role, joined_at, profiles(*)')
    .eq('group_id', groupId)
    .eq('user_id', profileUserId)
    .single()

  if (!targetMembership) notFound()

  const profile = targetMembership.profiles as any
  const isMe = profileUserId === userId

  // Get this user's fines
  const { data: receivedFines } = await supabase
    .from('fines')
    .select('id, amount, status, created_at, rules(name), reporter:profiles!fines_reported_by_fkey(display_name)')
    .eq('group_id', groupId)
    .eq('fined_user_id', profileUserId)
    .order('created_at', { ascending: false })
    .limit(10)

  // Stats
  const { data: allFines } = await supabase
    .from('fines')
    .select('amount, status, fined_user_id, reported_by')
    .eq('group_id', groupId)

  const myFines = (allFines ?? []).filter((f) => f.fined_user_id === profileUserId)
  const reportedFines = (allFines ?? []).filter((f) => f.reported_by === profileUserId)
  const totalOwed = myFines
    .filter((f) => f.status === 'unpaid' || f.status === 'disputed')
    .reduce((s, f) => s + Number(f.amount), 0)
  const totalPaid = myFines
    .filter((f) => f.status === 'paid')
    .reduce((s, f) => s + Number(f.amount), 0)

  // Achievements
  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id, earned_at, achievements(name, description, icon)')
    .eq('user_id', profileUserId)
    .eq('group_id', groupId)
    .order('earned_at', { ascending: false })

  const statusEmoji: Record<string, string> = {
    unpaid: '🔴', paid: '🟢', disputed: '🟡', cancelled: '⚪',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/members" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-900 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Members
      </Link>

      {/* Profile header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 shrink-0 ring-2 ring-violet-500/30">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xl">{getInitials(profile?.display_name ?? '?')}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-zinc-900">{profile?.display_name}</h1>
              {isMe && <Badge variant="default" className="text-[10px]">You</Badge>}
              <Badge
                variant={targetMembership.role === 'owner' ? 'owner' : targetMembership.role === 'admin' ? 'admin' : 'member'}
                className="text-[10px]"
              >
                {targetMembership.role}
              </Badge>
            </div>
            <p className="text-zinc-400 text-sm">@{profile?.username}</p>
            <p className="text-zinc-300 text-xs mt-1">
              Joined {formatDate(targetMembership.joined_at)}
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-zinc-200">
          {[
            { label: 'Fines', value: myFines.length, color: 'text-zinc-900' },
            { label: 'Owes', value: formatCurrency(totalOwed, currency), color: totalOwed > 0 ? 'text-red-600' : 'text-green-600' },
            { label: 'Paid', value: formatCurrency(totalPaid, currency), color: 'text-green-600' },
            { label: 'Reported', value: reportedFines.length, color: 'text-zinc-500' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-zinc-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      {(userAchievements?.length ?? 0) > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">🏆 Achievements</h3>
          <div className="flex flex-wrap gap-2">
            {userAchievements?.map((ua) => {
              const a = ua.achievements as any
              return (
                <div
                  key={ua.achievement_id}
                  title={`${a?.name}: ${a?.description}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-200 text-xs text-zinc-600 cursor-default hover:bg-violet-100 transition-colors"
                >
                  <span className="text-base">{a?.icon}</span>
                  <span>{a?.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent fines received */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200">
          <h3 className="font-semibold text-zinc-900">Recent Fines</h3>
        </div>
        {!receivedFines?.length ? (
          <div className="p-8 text-center text-zinc-400 text-sm">No fines yet 🎉</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {receivedFines.map((f) => (
              <div key={f.id} className="flex items-center justify-between px-5 py-3.5 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900">
                    {(f.rules as any)?.name ?? 'Custom fine'}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    By {(f.reporter as any)?.display_name} · {formatDate(f.created_at)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-zinc-900">{formatCurrency(f.amount, currency)}</p>
                  <p className="text-xs text-zinc-400">{statusEmoji[f.status]} {f.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
