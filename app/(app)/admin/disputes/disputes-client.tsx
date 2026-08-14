'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Scale, CheckCircle2, XCircle, Edit3, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatCurrency, formatRelativeTime, getInitials } from '@/lib/utils'
import {
  approveDisputeAction,
  cancelDisputeAction,
  modifyDisputedFineAction,
} from '../actions'

interface DisputesClientProps {
  disputes: any[]
  groupId: string
  currency: string
}

export function DisputesClient({ disputes, groupId, currency }: DisputesClientProps) {
  const [modifyOpen, setModifyOpen] = useState(false)
  const [modifyDispute, setModifyDispute] = useState<any>(null)
  const [newAmount, setNewAmount] = useState('')
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [approveConfirm, setApproveConfirm] = useState<any>(null)
  const [cancelConfirm, setCancelConfirm] = useState<any>(null)

  const setLoad = (id: string, v: boolean) => setLoading((p) => ({ ...p, [id]: v }))

  async function handleApprove(d: any) {
    setLoad(d.id, true)
    const r = await approveDisputeAction(d.id, d.fine.id, groupId)
    if (r.error) toast.error(r.error)
    else toast.success('Fine approved — dispute denied.')
    setLoad(d.id, false)
    setApproveConfirm(null)
  }

  async function handleCancel(d: any) {
    setLoad(d.id + '_cancel', true)
    const r = await cancelDisputeAction(d.id, d.fine.id, groupId)
    if (r.error) toast.error(r.error)
    else toast.success('Fine cancelled — dispute accepted! ✅')
    setLoad(d.id + '_cancel', false)
    setCancelConfirm(null)
  }

  async function handleModify() {
    if (!modifyDispute || !newAmount) return
    setLoad(modifyDispute.id + '_mod', true)
    const r = await modifyDisputedFineAction(modifyDispute.id, modifyDispute.fine.id, groupId, parseFloat(newAmount))
    if (r.error) toast.error(r.error)
    else { toast.success('Fine amount modified.'); setModifyOpen(false) }
    setLoad(modifyDispute.id + '_mod', false)
  }

  const pending = disputes.filter((d) => d.status === 'pending')
  const resolved = disputes.filter((d) => d.status !== 'pending')

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-zinc-900">⚖️ Disputes</h2>
        {pending.length > 0 && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-600 border border-yellow-200 font-medium">
            {pending.length} pending
          </span>
        )}
      </div>

      {disputes.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Scale className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500">No disputes. Everyone&apos;s accepted their fate.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pending */}
          {pending.map((d) => (
            <motion.div
              key={d.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-5 border border-yellow-500/15 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-xs">
                      {getInitials(d.submitter?.display_name ?? '?')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-zinc-900 text-sm">{d.submitter?.display_name}</p>
                    <p className="text-xs text-zinc-400">{formatRelativeTime(d.created_at)}</p>
                  </div>
                </div>
                <Badge variant="disputed" className="text-[10px] shrink-0">🟡 Pending</Badge>
              </div>

              {/* Fine details */}
              <div className="bg-zinc-50 rounded-xl p-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">{d.fine?.rule?.name ?? 'Custom fine'}</span>
                  <span className="font-bold text-zinc-900">{formatCurrency(d.fine?.amount ?? 0, currency)}</span>
                </div>
                {d.fine?.description && (
                  <p className="text-xs text-zinc-400 italic">&quot;{d.fine.description}&quot;</p>
                )}
                <p className="text-xs text-zinc-400">Reported by {d.fine?.reporter?.display_name}</p>
              </div>

              {/* Dispute reason */}
              <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-3">
                <p className="text-xs text-yellow-600/80 font-medium mb-1">Their argument:</p>
                <p className="text-sm text-zinc-600 italic">&quot;{d.reason}&quot;</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setApproveConfirm(d)}
                  loading={loading[d.id]}
                >
                  <XCircle className="h-4 w-4" />
                  Deny — Keep Fine
                </Button>
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => setCancelConfirm(d)}
                  loading={loading[d.id + '_cancel']}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Accept — Cancel Fine
                </Button>
                <Button
                  size="sm"
                  variant="warning"
                  onClick={() => {
                    setModifyDispute(d)
                    setNewAmount(String(d.fine?.amount ?? ''))
                    setModifyOpen(true)
                  }}
                >
                  <Edit3 className="h-4 w-4" />
                  Modify Amount
                </Button>
              </div>
            </motion.div>
          ))}

          {/* Resolved */}
          {resolved.length > 0 && (
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium px-1 mb-2">
                Resolved ({resolved.length})
              </p>
              <div className="space-y-2">
                {resolved.map((d) => (
                  <div key={d.id} className="glass-card rounded-xl p-4 opacity-60 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">
                        {d.submitter?.display_name} · {d.fine?.rule?.name ?? 'Fine'}
                      </p>
                      <p className="text-xs text-zinc-400">{d.resolution}</p>
                    </div>
                    <Badge
                      variant={d.status === 'cancelled' ? 'paid' : d.status === 'approved' ? 'unpaid' : 'disputed'}
                      className="text-[10px] shrink-0"
                    >
                      {d.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approve confirm */}
      <AlertDialog open={!!approveConfirm} onOpenChange={() => setApproveConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deny dispute &amp; keep fine?</AlertDialogTitle>
            <AlertDialogDescription>
              The fine of {formatCurrency(approveConfirm?.fine?.amount ?? 0, currency)} will remain unpaid. {approveConfirm?.submitter?.display_name} will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleApprove(approveConfirm)} className="bg-red-100 text-red-600 border-red-200 hover:bg-red-500/30">
              Deny Dispute
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel confirm */}
      <AlertDialog open={!!cancelConfirm} onOpenChange={() => setCancelConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept dispute &amp; cancel fine?</AlertDialogTitle>
            <AlertDialogDescription>
              The fine of {formatCurrency(cancelConfirm?.fine?.amount ?? 0, currency)} will be cancelled. This action is logged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleCancel(cancelConfirm)}>
              Accept &amp; Cancel Fine
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modify amount dialog */}
      <Dialog open={modifyOpen} onOpenChange={setModifyOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Modify Fine Amount</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-zinc-500">
              Current: {formatCurrency(modifyDispute?.fine?.amount ?? 0, currency)} for{' '}
              {modifyDispute?.submitter?.display_name}
            </p>
            <div className="space-y-1.5">
              <Label>New Amount (₹)</Label>
              <Input
                type="number"
                min="1"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModifyOpen(false)}>Cancel</Button>
            <Button
              onClick={handleModify}
              loading={loading[modifyDispute?.id + '_mod']}
              disabled={!newAmount || parseFloat(newAmount) <= 0}
            >
              Save Amount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
