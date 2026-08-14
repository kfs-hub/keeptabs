'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit2, Trash2, ToggleLeft, ToggleRight, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toggleRuleAction, deleteRuleAction } from '@/app/(app)/rules/actions'
import type { Rule } from '@/types/database'

interface RuleCardProps {
  rule: Rule
  fineCount: number
  totalGenerated: number
  currency?: string
  isAdmin: boolean
  onEdit?: (rule: Rule) => void
}

export function RuleCard({
  rule,
  fineCount,
  totalGenerated,
  currency = 'INR',
  isAdmin,
  onEdit,
}: RuleCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    const result = await toggleRuleAction(rule.id, rule.group_id, !rule.is_active)
    if (result.error) toast.error(result.error)
    else toast.success(`Rule ${rule.is_active ? 'disabled' : 'enabled'}`)
    setLoading(false)
  }

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteRuleAction(rule.id, rule.group_id)
    if (result.error) {
      toast.error(result.error)
      setIsDeleting(false)
    } else {
      toast.success('Rule deleted')
    }
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: rule.is_active ? 1 : 0.5, scale: 1 }}
        className="glass-card rounded-2xl p-5 space-y-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-zinc-900">{rule.name}</h3>
              {!rule.is_active && (
                <Badge variant="ghost" className="text-[10px]">Disabled</Badge>
              )}
            </div>
            {rule.description && (
              <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{rule.description}</p>
            )}
          </div>

          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-all shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(rule)}>
                  <Edit2 className="h-4 w-4" />
                  Edit Rule
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggle} disabled={loading}>
                  {rule.is_active ? (
                    <><ToggleLeft className="h-4 w-4" /> Disable</>
                  ) : (
                    <><ToggleRight className="h-4 w-4" /> Enable</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Rule
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-zinc-400 text-xs">Fine: </span>
            <span className="font-semibold text-violet-600">
              {formatCurrency(rule.default_amount, currency)}
            </span>
          </div>
          <div className="text-zinc-300">·</div>
          <div>
            <span className="text-zinc-400 text-xs">Broken: </span>
            <span className="font-semibold text-zinc-900">{fineCount}×</span>
          </div>
          <div className="text-zinc-300">·</div>
          <div>
            <span className="text-zinc-400 text-xs">Generated: </span>
            <span className="font-semibold text-green-600">
              {formatCurrency(totalGenerated, currency)}
            </span>
          </div>
        </div>
      </motion.div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{rule.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the rule. Existing fines won&apos;t be affected, but
              you won&apos;t be able to issue new fines for this rule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-100 text-red-600 border border-red-200 hover:bg-red-500/30"
            >
              Delete Rule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
