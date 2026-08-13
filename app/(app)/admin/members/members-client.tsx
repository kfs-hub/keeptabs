'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { UserMinus, ShieldCheck, ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { removeMemberAction, changeRoleAction } from '../actions'

interface AdminMembersClientProps {
  members: any[]
  groupId: string
  currency: string
  currentUserId: string
  isOwner: boolean
}

export function AdminMembersClient({
  members, groupId, currency, currentUserId, isOwner,
}: AdminMembersClientProps) {
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [removeConfirm, setRemoveConfirm] = useState<any>(null)
  const setLoad = (k: string, v: boolean) => setLoading((p) => ({ ...p, [k]: v }))

  async function handleRemove(m: any) {
    setLoad(m.user_id, true)
    const r = await removeMemberAction(m.user_id, groupId)
    if (r.error) toast.error(r.error)
    else toast.success(`${m.profiles?.display_name} removed.`)
    setLoad(m.user_id, false)
    setRemoveConfirm(null)
  }

  async function handleRoleChange(m: any, newRole: 'member' | 'admin') {
    setLoad(m.user_id + '_role', true)
    const r = await changeRoleAction(m.user_id, groupId, newRole)
    if (r.error) toast.error(r.error)
    else toast.success(`Role updated to ${newRole}.`)
    setLoad(m.user_id + '_role', false)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">👥 Manage Members</h2>

      <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/5">
        {members.map((m) => {
          const p = m.profiles as any
          const isMe = m.user_id === currentUserId
          const isOwnerRow = m.role === 'owner'
          const balance = m.balance ?? 0

          return (
            <motion.div
              key={m.user_id}
              layout
              className="flex items-center gap-4 px-5 py-4"
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={p?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">{getInitials(p?.display_name ?? '?')}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white text-sm">{p?.display_name}</span>
                  {isMe && <Badge variant="default" className="text-[10px]">You</Badge>}
                  <Badge
                    variant={isOwnerRow ? 'owner' : m.role === 'admin' ? 'admin' : 'member'}
                    className="text-[10px]"
                  >
                    {m.role}
                  </Badge>
                </div>
                <p className="text-xs text-white/35 mt-0.5">
                  @{p?.username} · Joined {formatDate(m.joined_at)}
                </p>
                {balance > 0 && (
                  <p className="text-xs text-red-400/70 mt-0.5">{formatCurrency(balance, currency)} outstanding</p>
                )}
              </div>

              {/* Actions — only for non-owner rows and not yourself */}
              {!isOwnerRow && !isMe && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      loading={loading[m.user_id + '_role']}
                      onClick={() => handleRoleChange(m, m.role === 'admin' ? 'member' : 'admin')}
                      title={m.role === 'admin' ? 'Demote to member' : 'Promote to admin'}
                    >
                      {m.role === 'admin'
                        ? <ShieldOff className="h-4 w-4 text-yellow-400" />
                        : <ShieldCheck className="h-4 w-4 text-violet-400" />
                      }
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    loading={loading[m.user_id]}
                    onClick={() => setRemoveConfirm(m)}
                    title="Remove member"
                  >
                    <UserMinus className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <AlertDialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeConfirm?.profiles?.display_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will lose access to the group immediately. Their fines and history will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleRemove(removeConfirm)}
              className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
