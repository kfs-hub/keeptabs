'use client'

import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { updatePasswordAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function UpdatePasswordPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await updatePasswordAction(formData)

      if (result?.error) {
        toast.error(result.error)
      }
      // On success, server redirects to /dashboard
    } catch {
      // Redirect throws — expected
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="p-6 pb-0">
        <CardTitle className="text-xl">Set new password 🔐</CardTitle>
        <CardDescription>Choose a strong new password.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 characters"
                required
                minLength={8}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-500 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">Confirm Password</Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repeat your password"
              required
              minLength={8}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            <Lock className="h-4 w-4" />
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
