'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { loginAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('redirectTo', redirectTo)

      const result = await loginAction(formData)

      if (result?.error) {
        toast.error(result.error)
      }
      // If no error, loginAction redirects automatically
    } catch {
      // Redirect throws — this is expected from Next.js server actions
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader className="p-6 pb-0">
        <CardTitle className="text-xl">Welcome back 👋</CardTitle>
        <CardDescription>Sign in to Keep Tabs</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/reset-password"
                className="text-xs text-violet-600 hover:text-violet-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                required
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
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="text-violet-600 hover:text-violet-700 font-medium transition-colors"
          >
            Create one
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
