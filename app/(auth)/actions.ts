'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  display_name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
})

export interface ActionResult {
  error?: string
  success?: boolean
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Wrong email or password. Try again.' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Please verify your email address first.' }
    }
    return { error: error.message }
  }

  const redirectTo = formData.get('redirectTo') as string
  redirect(redirectTo || '/dashboard')
}

export async function signupAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    display_name: formData.get('display_name') as string,
    username: formData.get('username') as string,
  }

  const parsed = signupSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  // Check username uniqueness
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', parsed.data.username.toLowerCase())
    .single()

  if (existingProfile) {
    return { error: 'Username is already taken. Try another one.' }
  }

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.display_name,
        username: parsed.data.username.toLowerCase(),
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'This email is already registered. Try logging in.' }
    }
    return { error: error.message }
  }

  return { success: true }
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email') as string

  if (!email || !z.string().email().safeParse(email).success) {
    return { error: 'Please enter a valid email address.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updatePasswordAction(formData: FormData): Promise<ActionResult> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}
