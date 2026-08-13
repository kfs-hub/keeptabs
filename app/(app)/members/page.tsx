import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, getInitials } from '@/lib/utils'

export const metadata = { title: 'Members' }

export default async function MembersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('group_members')
    .select('group_id, groups(*)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1)
    .single()

  if (!membership) redirect('/onboarding')

  const groupId = membership.group_id
  const group = membership.groups as any
  const currency: string = group?.currency ?? 'INR'

  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, role, joined_at, profiles(display_name, username, avatar_url)')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })

  // Unpaid balances
  const { data: fines } = await supabase
    .from('fines')
    .select('fined_user_id, amount, status')
    .eq('group_id', groupId)

  const balanceMap: Record<string, number> = {}
  for (const f of fines ?? []) {
    if (f.status === 'unpaid' || f.status === 'disputed') {
      balanceMap[f.fined_user_id] = (balanceMap[f.fined_user_id] ?? 0) + Number(f.amount)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">👥 Members</h1>
          <p className="text-white/40 text-sm mt-1">{members?.length ?? 0} members in {group?.name}</p>
        </div>
      </div>

      {!members?.length ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Users className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No members found.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/5">
          {members.map((m) => {
            const p = m.profiles as any
            const balance = balanceMap[m.user_id] ?? 0
            const isMe = m.user_id === user.id
            return (
              <Link
                key={m.user_id}
                href={`/members/${m.user_id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors"
              >
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarImage src={p?.avatar_url ?? undefined} />
                  <AvatarFallback>{getInitials(p?.display_name ?? '?')}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">{p?.display_name}</span>
                    {isMe && <Badge variant="default" className="text-[10px]">You</Badge>}
                    <Badge
                      variant={m.role === 'owner' ? 'owner' : m.role === 'admin' ? 'admin' : 'member'}
                      className="text-[10px]"
                    >
                      {m.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">@{p?.username}</p>
                </div>

                <div className="text-right shrink-0">
                  {balance > 0 ? (
                    <p className="text-sm font-semibold text-red-400">{formatCurrency(balance, currency)}</p>
                  ) : (
                    <p className="text-sm text-green-400/70">✅ Clear</p>
                  )}
                  <p className="text-xs text-white/25 mt-0.5">
                    {balance > 0 ? 'outstanding' : 'no debt'}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
