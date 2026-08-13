'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ChevronLeft, Upload, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatCurrency, getInitials } from '@/lib/utils'
import { issueFineAction } from '@/app/(app)/fines/actions'
import type { Profile, Rule } from '@/types/database'

interface IssueFineModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (data: { amount: number; userName: string }) => void
  members: Profile[]
  rules: Rule[]
  groupId: string
  currency?: string
}

type Step = 'who' | 'what' | 'review'

export function IssueFineModal({
  open,
  onClose,
  onSuccess,
  members,
  rules,
  groupId,
  currency = 'INR',
}: IssueFineModalProps) {
  const [step, setStep] = useState<Step>('who')
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null)
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [description, setDescription] = useState('')
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const amount = customAmount
    ? parseFloat(customAmount)
    : selectedRule?.default_amount ?? 0

  function handleClose() {
    setStep('who')
    setSelectedMember(null)
    setSelectedRule(null)
    setCustomAmount('')
    setDescription('')
    setEvidenceFile(null)
    onClose()
  }

  async function handleSubmit() {
    if (!selectedMember || amount <= 0) return
    setLoading(true)

    try {
      const formData = new FormData()
      formData.set('group_id', groupId)
      formData.set('fined_user_id', selectedMember.id)
      if (selectedRule) formData.set('rule_id', selectedRule.id)
      formData.set('amount', amount.toString())
      if (description) formData.set('description', description)
      if (evidenceFile) formData.set('evidence', evidenceFile)

      const result = await issueFineAction(formData)

      if (result.error) {
        toast.error(result.error)
      } else if (result.data) {
        handleClose()
        onSuccess({ amount: result.data.amount, userName: result.data.userName })
      }
    } catch {
      toast.error('Failed to issue fine.')
    } finally {
      setLoading(false)
    }
  }

  const activeRules = rules.filter((r) => r.is_active)

  const stepTitles: Record<Step, string> = {
    who: '👤 Who broke the rule?',
    what: '📜 What did they do?',
    review: '⚖️ Review Fine',
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step !== 'who' && (
              <button
                onClick={() => setStep(step === 'review' ? 'what' : 'who')}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <DialogTitle>{stepTitles[step]}</DialogTitle>
          </div>
          {/* Progress indicator */}
          <div className="flex gap-1 mt-2">
            {(['who', 'what', 'review'] as Step[]).map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all ${
                  ['who', 'what', 'review'].indexOf(step) >= i
                    ? 'bg-violet-500'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Who */}
          {step === 'who' && (
            <motion.div
              key="who"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-2 mt-2"
            >
              {members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    setSelectedMember(member)
                    setStep('what')
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 border border-white/5 hover:border-violet-500/30 transition-all text-left group"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar_url ?? undefined} />
                    <AvatarFallback>{getInitials(member.display_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-white">{member.display_name}</p>
                    <p className="text-xs text-white/40">@{member.username}</p>
                  </div>
                  <ChevronLeft className="ml-auto h-4 w-4 text-white/20 group-hover:text-violet-400 rotate-180 transition-colors" />
                </button>
              ))}
            </motion.div>
          )}

          {/* Step 2: What rule */}
          {step === 'what' && (
            <motion.div
              key="what"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-2 mt-2"
            >
              {activeRules.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p>No active rules. Create some rules first.</p>
                </div>
              ) : (
                activeRules.map((rule) => (
                  <button
                    key={rule.id}
                    onClick={() => {
                      setSelectedRule(rule)
                      setCustomAmount(rule.default_amount.toString())
                      setStep('review')
                    }}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-white/5 border border-white/5 hover:border-violet-500/30 transition-all text-left"
                  >
                    <div>
                      <p className="font-medium text-white">{rule.name}</p>
                      {rule.description && (
                        <p className="text-xs text-white/40 line-clamp-1">{rule.description}</p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-violet-400 shrink-0">
                      {formatCurrency(rule.default_amount, currency)}
                    </span>
                  </button>
                ))
              )}

              <button
                onClick={() => {
                  setSelectedRule(null)
                  setCustomAmount('')
                  setStep('review')
                }}
                className="w-full p-3 rounded-xl border border-dashed border-white/10 hover:border-violet-500/30 text-white/40 hover:text-white text-sm transition-all"
              >
                + Custom Fine (no specific rule)
              </button>
            </motion.div>
          )}

          {/* Step 3: Review */}
          {step === 'review' && selectedMember && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 mt-2"
            >
              {/* Summary */}
              <div className="bg-white/3 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedMember.avatar_url ?? undefined} />
                    <AvatarFallback>{getInitials(selectedMember.display_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-white">{selectedMember.display_name}</p>
                    <p className="text-xs text-white/40">
                      {selectedRule?.name ?? 'Custom fine'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label>Fine Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                    {currency === 'INR' ? '₹' : currency}
                  </span>
                  <Input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="pl-7"
                    min="1"
                    max="100000"
                    placeholder="Amount"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label>Description (optional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='"Used the forbidden word 7 times during dinner."'
                  rows={2}
                  maxLength={500}
                />
              </div>

              {/* Evidence */}
              <div className="space-y-1.5">
                <Label>Evidence (optional)</Label>
                {evidenceFile ? (
                  <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
                    <Upload className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-white/70 flex-1 truncate">{evidenceFile.name}</span>
                    <button
                      onClick={() => setEvidenceFile(null)}
                      className="text-white/30 hover:text-white/60"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-white/10 hover:border-violet-500/30 cursor-pointer transition-all">
                    <Upload className="h-4 w-4 text-white/30" />
                    <span className="text-sm text-white/40">Upload image evidence (optional)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error('File must be under 5MB')
                            return
                          }
                          setEvidenceFile(file)
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                loading={loading}
                className="w-full"
                size="lg"
                disabled={!amount || amount <= 0}
              >
                🚨 Issue Fine — {formatCurrency(amount, currency)}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
