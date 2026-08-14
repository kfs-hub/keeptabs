'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { resetPasswordAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await resetPasswordAction(formData)

      if (result?.error) {
        toast.error(result.error)
      } else {
        setDone(true)
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <Card className="border-zinc-200 bg-white shadow-xs">
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800 mx-auto">
            <Mail className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900">Email sent</h2>
          <p className="text-zinc-500 text-xs">
            Check your inbox for a password reset link. It expires in 24 hours.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-zinc-200 bg-white shadow-xs">
      <CardHeader className="p-6 pb-0">
        <CardTitle className="text-lg font-bold text-zinc-900">Reset Password</CardTitle>
        <CardDescription className="text-xs text-zinc-500">
          Enter your email and we&apos;ll send you a password reset link
        </CardDescription>
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
              required
            />
          </div>
          <Button type="submit" className="w-full" size="default" loading={loading}>
            <Mail className="h-4 w-4" />
            Send Reset Link
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-xs text-zinc-600 hover:text-zinc-900 inline-flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
