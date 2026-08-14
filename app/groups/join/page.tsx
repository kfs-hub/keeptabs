'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { joinGroupAction } from './actions'

export default function JoinGroupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      const result = await joinGroupAction(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('You joined the group! Welcome aboard! 🎉')
        router.push('/dashboard')
      }
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Join a Group</h1>
        <p className="text-zinc-500 mt-1">Enter your invite code to join your friends.</p>
      </div>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="invite_code">Invite Code</Label>
              <Input
                id="invite_code"
                name="invite_code"
                placeholder="e.g. THEGANG42"
                className="text-center text-xl font-mono tracking-widest uppercase"
                maxLength={20}
                required
                onChange={(e) => { e.target.value = e.target.value.toUpperCase() }}
              />
              <p className="text-xs text-zinc-400">Ask a group member for the code.</p>
            </div>
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              <Link2 className="h-4 w-4" />
              Join Group
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
