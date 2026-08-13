'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Filter, SlidersHorizontal, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { createDisputeAction } from './actions'
import type { FineWithDetails, Profile } from '@/types/database'

interface Rule { id: string; name: string }

interface FinesClientProps {
  fines: FineWithDetails[]
  members: Profile[]
  rules: Rule[]
  currentUserId: string
  currency: string
  isAdmin: boolean
  total: number
  page: number
  pageSize: number
}

const statusVariants: Record<string, 'unpaid' | 'paid' | 'disputed' | 'cancelled'> = {
  unpaid: 'unpaid', paid: 'paid', disputed: 'disputed', cancelled: 'cancelled',
}

const statusEmoji: Record<string, string> = {
  unpaid: '🔴', paid: '🟢', disputed: '🟡', cancelled: '⚪',
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

export function FinesClient({
  fines, members, rules, currentUserId, currency, isAdmin, total, page, pageSize,
}: FinesClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Dispute state
  const [disputeFine, setDisputeFine] = useState<FineWithDetails | null>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeLoading, setDisputeLoading] = useState(false)

  // Evidence lightbox
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null)

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === 'all') params.delete(key)
    else params.set(key, value)
    params.delete('page')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', p.toString())
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  async function handleDispute() {
    if (!disputeFine) return
    setDisputeLoading(true)
    const fd = new FormData()
    fd.set('fine_id', disputeFine.id)
    fd.set('reason', disputeReason)
    const result = await createDisputeAction(fd)
    if (result.error) toast.error(result.error)
    else {
      toast.success('Dispute submitted! Admins will review it. 💪')
      setDisputeFine(null)
      setDisputeReason('')
    }
    setDisputeLoading(false)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🚨 Fines</h1>
          <p className="text-white/40 text-sm mt-1">{total} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            placeholder="Search by description..."
            defaultValue={searchParams.get('search') ?? ''}
            className="pl-9"
            onChange={(e) => {
              const val = e.target.value
              const timeout = setTimeout(() => updateParam('search', val), 400)
              return () => clearTimeout(timeout)
            }}
          />
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Select defaultValue={searchParams.get('member') ?? 'all'} onValueChange={(v) => updateParam('member', v)}>
            <SelectTrigger><SelectValue placeholder="Person" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All members</SelectItem>
              {members.filter(Boolean).map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.display_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select defaultValue={searchParams.get('rule') ?? 'all'} onValueChange={(v) => updateParam('rule', v)}>
            <SelectTrigger><SelectValue placeholder="Rule" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rules</SelectItem>
              {rules.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select defaultValue={searchParams.get('status') ?? 'all'} onValueChange={(v) => updateParam('status', v)}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="unpaid">🔴 Unpaid</SelectItem>
              <SelectItem value="paid">🟢 Paid</SelectItem>
              <SelectItem value="disputed">🟡 Disputed</SelectItem>
              <SelectItem value="cancelled">⚪ Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue={searchParams.get('sort') ?? 'newest'} onValueChange={(v) => updateParam('sort', v)}>
            <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="highest">Highest amount</SelectItem>
              <SelectItem value="lowest">Lowest amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fine list */}
      {fines.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <AlertTriangle className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/50">No fines found.</p>
          <p className="text-white/30 text-sm mt-1">🎉 Either everyone&apos;s being good, or the filters are too strict.</p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {fines.map((fine) => (
            <motion.div key={fine.id} variants={item}>
              <div className="glass-card rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={fine.fined_user?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">{getInitials(fine.fined_user?.display_name ?? '?')}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-semibold text-white">{fine.fined_user?.display_name}</span>
                        <Badge variant={statusVariants[fine.status]} className="ml-2 text-[10px]">
                          {statusEmoji[fine.status]} {fine.status}
                        </Badge>
                      </div>
                      <span className="text-lg font-bold text-white shrink-0">
                        {formatCurrency(fine.amount, currency)}
                      </span>
                    </div>

                    <p className="text-sm text-white/60 mt-0.5">
                      {fine.rule?.name ?? 'Custom fine'}
                    </p>

                    {fine.description && (
                      <p className="text-xs text-white/40 mt-1 italic">&quot;{fine.description}&quot;</p>
                    )}

                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-white/30">
                      <span>Reported by {fine.reporter?.display_name}</span>
                      <span>·</span>
                      <span>{formatDate(fine.created_at)}</span>
                      {fine.evidence_url && (
                        <>
                          <span>·</span>
                          <button
                            onClick={() => setEvidenceUrl(fine.evidence_url!)}
                            className="text-violet-400 hover:text-violet-300 transition-colors"
                          >
                            📎 Evidence
                          </button>
                        </>
                      )}
                    </div>

                    {/* Dispute button */}
                    {fine.fined_user_id === currentUserId && fine.status === 'unpaid' && (
                      <Button
                        variant="warning"
                        size="sm"
                        className="mt-3"
                        onClick={() => setDisputeFine(fine)}
                      >
                        ⚖️ Dispute This
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-white/50">Page {page} of {totalPages}</span>
          <Button variant="outline" size="icon-sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Dispute Modal */}
      <Dialog open={!!disputeFine} onOpenChange={() => { setDisputeFine(null); setDisputeReason('') }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>⚖️ Dispute Fine</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {disputeFine && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-sm text-yellow-300">
                Disputing <strong>{formatCurrency(disputeFine.amount, currency)}</strong> fine for{' '}
                <em>{disputeFine.rule?.name ?? 'Custom fine'}</em>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Your Reason *</Label>
              <Textarea
                placeholder='"I DID NOT SAY IT 😭"'
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-white/30">{disputeReason.length}/500</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDisputeFine(null); setDisputeReason('') }}>Cancel</Button>
            <Button
              onClick={handleDispute}
              loading={disputeLoading}
              disabled={disputeReason.trim().length < 5}
              variant="warning"
            >
              Submit Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evidence lightbox */}
      <Dialog open={!!evidenceUrl} onOpenChange={() => setEvidenceUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>📎 Evidence</DialogTitle></DialogHeader>
          {evidenceUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={evidenceUrl} alt="Evidence" className="w-full rounded-xl max-h-[70vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
