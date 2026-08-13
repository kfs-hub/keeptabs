'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Check, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { updateGroupSettingsAction, regenerateInviteCodeAction } from '../actions'

interface AdminSettingsClientProps {
  group: any
  groupId: string
}

export function AdminSettingsClient({ group, groupId }: AdminSettingsClientProps) {
  const [saving, setSaving] = useState(false)
  const [regen, setRegen] = useState(false)
  const [inviteCode, setInviteCode] = useState<string>(group.invite_code)
  const [copied, setCopied] = useState(false)

  const labels = (group.settings?.leaderboard_labels ?? {}) as Record<string, string>

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    const r = await updateGroupSettingsAction(groupId, formData)
    if (r.error) toast.error(r.error)
    else toast.success('Settings saved!')
    setSaving(false)
  }

  async function handleRegen() {
    setRegen(true)
    const r = await regenerateInviteCodeAction(groupId)
    if (r.error) toast.error(r.error)
    else {
      setInviteCode(r.code!)
      toast.success('New invite code generated.')
    }
    setRegen(false)
  }

  async function copyCode() {
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">⚙️ Group Settings</h2>

      {/* Invite code */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-medium text-white/70">Invite Code</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
            <span className="text-xl font-mono font-bold tracking-widest text-violet-300">
              {inviteCode}
            </span>
          </div>
          <Button variant="outline" size="icon" onClick={copyCode} title="Copy">
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button variant="warning" size="icon" onClick={handleRegen} loading={regen} title="Regenerate">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-white/30">Regenerating will invalidate the old code.</p>
      </div>

      {/* Group settings form */}
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 space-y-5">
        <h3 className="text-sm font-medium text-white/70">Group Info</h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Group Name *</Label>
            <Input id="name" name="name" defaultValue={group.name} required maxLength={50} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" name="currency" defaultValue={group.currency} maxLength={10} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={group.description ?? ''}
            rows={2}
            maxLength={200}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="default_fine_amount">Default Fine Amount (₹)</Label>
          <Input
            id="default_fine_amount"
            name="default_fine_amount"
            type="number"
            min="1"
            defaultValue={group.default_fine_amount}
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/70">🏆 Leaderboard Labels</h3>
          <p className="text-xs text-white/30">Customise the fun labels shown on the leaderboard.</p>

          {[
            { key: 'first',  placeholder: '💀 Biggest Criminal' },
            { key: 'second', placeholder: '😭 Bro Owes Everyone' },
            { key: 'third',  placeholder: '💸 Walking ATM' },
          ].map(({ key, placeholder }) => (
            <div key={key} className="space-y-1">
              <Label className="capitalize text-xs">{key} place label</Label>
              <Input
                name={`label_${key}`}
                defaultValue={labels[key] ?? ''}
                placeholder={placeholder}
                maxLength={40}
              />
            </div>
          ))}
        </div>

        <Button type="submit" loading={saving} className="w-full">
          Save Settings
        </Button>
      </form>
    </div>
  )
}
