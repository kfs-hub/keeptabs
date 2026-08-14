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

import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  const errorParam = searchParams.get('error')

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
    <Card className="p-0 overflow-hidden border-zinc-200 shadow-xs bg-white">
      <CardHeader className="p-6 pb-0">
        <CardTitle className="text-lg font-bold text-zinc-900">Sign In</CardTitle>
        <CardDescription className="text-xs text-zinc-500">Welcome back. Access your groups and fines.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Google OAuth */}
        <GoogleSignInButton redirectTo={redirectTo} text="Continue with Google" />

        {/* Divider */}
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-white px-2 text-zinc-400 font-medium">or continue with email</span>
          </div>
        </div>

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
                className="text-xs text-zinc-600 hover:text-zinc-900 transition-colors"
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

          <Button type="submit" className="w-full" size="default" loading={loading}>
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-zinc-500">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="text-zinc-900 font-semibold hover:underline transition-colors"
          >
            Create one
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
