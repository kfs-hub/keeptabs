'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { createRuleAction, updateRuleAction } from '@/app/(app)/rules/actions'
import type { Rule } from '@/types/database'

interface RuleFormProps {
  open: boolean
  onClose: () => void
  groupId: string
  editingRule?: Rule | null
}

export function RuleForm({ open, onClose, groupId, editingRule }: RuleFormProps) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('group_id', groupId)
      if (editingRule) formData.set('rule_id', editingRule.id)

      const action = editingRule ? updateRuleAction : createRuleAction
      const result = await action(formData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(editingRule ? 'Rule updated!' : 'Rule created!')
        onClose()
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingRule ? 'Edit Rule' : 'Create New Rule'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Rule Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder='e.g. "Saying Bro"'
              required
              minLength={2}
              maxLength={100}
              defaultValue={editingRule?.name}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe what this rule is about..."
              rows={2}
              maxLength={500}
              defaultValue={editingRule?.description ?? ''}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="default_amount">Default Fine Amount (₹) *</Label>
            <Input
              id="default_amount"
              name="default_amount"
              type="number"
              min="1"
              max="100000"
              required
              defaultValue={editingRule?.default_amount ?? 10}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {editingRule ? 'Save Changes' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
