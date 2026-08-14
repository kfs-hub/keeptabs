'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { signupAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await signupAction(formData)

      if (result?.error) {
        toast.error(result.error)
      } else if (result?.success) {
        setDone(true)
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <div className="text-5xl">📧</div>
          <h2 className="text-xl font-semibold text-zinc-900">Check your email!</h2>
          <p className="text-zinc-500 text-sm">
            We sent a confirmation link to your email. Click it to activate your account.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Back to Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader className="p-6 pb-0">
        <CardTitle className="text-xl">Join the gang 🎉</CardTitle>
        <CardDescription>Create your Keep Tabs account</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                name="display_name"
                type="text"
                placeholder="Kaif"
                required
                minLength={2}
                maxLength={50}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="kaif42"
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_]+"
                title="Letters, numbers, and underscores only"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 characters"
                autoComplete="new-password"
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

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            <UserPlus className="h-4 w-4" />
            Create Account
          </Button>

          <p className="text-xs text-zinc-400 text-center">
            By signing up, you agree to our group rules. No excuses.
          </p>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-violet-600 hover:text-violet-700 font-medium transition-colors"
          >
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
