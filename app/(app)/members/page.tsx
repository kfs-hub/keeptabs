import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, getInitials } from '@/lib/utils'

import { getActiveGroup } from '@/lib/groups/get-active-group'

export const metadata = { title: 'Members' }

export default async function MembersPage() {
  const supabase = await createClient()

  const { group, groupId, userId } = await getActiveGroup()
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
          <h1 className="text-xl font-bold text-zinc-950">Members</h1>
          <p className="text-zinc-500 text-xs mt-0.5">{members?.length ?? 0} members in {group?.name}</p>
        </div>
      </div>

      {!members?.length ? (
        <div className="glass-card rounded-xl p-10 text-center bg-white border border-zinc-200">
          <Users className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No members found</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden divide-y divide-zinc-100 bg-white border border-zinc-200">
          {members.map((m) => {
            const p = m.profiles as any
            const balance = balanceMap[m.user_id] ?? 0
            const isMe = m.user_id === userId
            return (
              <Link
                key={m.user_id}
                href={`/members/${m.user_id}`}
                className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-zinc-50 transition-colors"
              >
                <Avatar className="h-9 w-9 shrink-0 ring-1 ring-zinc-100">
                  <AvatarImage src={p?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs bg-zinc-100 text-zinc-700 font-medium">
                    {getInitials(p?.display_name ?? '?')}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-zinc-950 text-xs">{p?.display_name}</span>
                    {isMe && <Badge variant="default" className="text-[9px] py-0 px-1.5">You</Badge>}
                    <Badge
                      variant={m.role === 'owner' ? 'owner' : m.role === 'admin' ? 'admin' : 'member'}
                      className="text-[9px] py-0 px-1.5 capitalize"
                    >
                      {m.role}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">@{p?.username}</p>
                </div>

                <div className="text-right shrink-0">
                  {balance > 0 ? (
                    <p className="text-xs font-semibold text-red-600 tabular-nums">{formatCurrency(balance, currency)}</p>
                  ) : (
                    <p className="text-xs font-medium text-emerald-600">Settled</p>
                  )}
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {balance > 0 ? 'outstanding' : 'zero balance'}
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
