'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { createGroupAction } from './actions'

export default function NewGroupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState<{ groupId: string; inviteCode: string } | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      const result = await createGroupAction(formData)
      if (result.error) {
        toast.error(result.error)
      } else if (result.data) {
        setCreated(result.data)
      }
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function copyInviteCode() {
    if (!created) return
    await navigator.clipboard.writeText(created.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Invite code copied!')
  }

  if (created) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-6">
          <div className="text-6xl">🎉</div>
          <div>
            <h2 className="text-2xl font-bold text-white">Group Created!</h2>
            <p className="text-white/50 mt-2">Share this code with your friends to invite them.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
            <p className="text-white/40 text-xs uppercase tracking-widest">Invite Code</p>
            <div className="text-4xl font-mono font-bold gradient-text tracking-widest">
              {created.inviteCode}
            </div>
            <Button onClick={copyInviteCode} variant="outline" size="sm" className="gap-2">
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </Button>
          </div>
          <Button onClick={() => router.push('/dashboard')} className="w-full" size="lg">
            Go to Dashboard →
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Create a Group</h1>
        <p className="text-white/50 mt-1">Set up your friend group&apos;s fine tracker.</p>
      </div>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Group Name *</Label>
              <Input id="name" name="name" placeholder="The Gang, Bro Squad, etc." required maxLength={50} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="What's this group about? Optional." rows={2} maxLength={200} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" name="currency" defaultValue="INR" maxLength={10} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="default_fine_amount">Default Fine (₹)</Label>
                <Input id="default_fine_amount" name="default_fine_amount" type="number" defaultValue="10" min="1" max="10000" />
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              <Users className="h-4 w-4" />
              Create Group
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
