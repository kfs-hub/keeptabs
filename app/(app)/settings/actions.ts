'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const profileSchema = z.object({
  display_name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, and underscores only'),
})

export interface SettingsActionResult {
  error?: string
  success?: boolean
}

export async function updateProfileAction(formData: FormData): Promise<SettingsActionResult> {
  const currentUser = await getCurrentUser()
  const supabase = await createClient()

  const raw = {
    display_name: formData.get('display_name') as string,
    username: (formData.get('username') as string)?.toLowerCase(),
  }

  const parsed = profileSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Check username uniqueness (excluding self)
  if (parsed.data.username !== currentUser.profile.username) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', parsed.data.username)
      .neq('id', currentUser.id)
      .single()

    if (existing) return { error: 'Username is already taken.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: parsed.data.display_name,
      username: parsed.data.username,
      updated_at: new Date().toISOString(),
    })
    .eq('id', currentUser.id)

  if (error) return { error: 'Failed to update profile.' }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function uploadAvatarAction(formData: FormData): Promise<SettingsActionResult & { url?: string }> {
  const currentUser = await getCurrentUser()
  const supabase = await createClient()

  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) return { error: 'No file provided.' }

  // Validate
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) return { error: 'Must be a JPEG, PNG, WebP, or GIF.' }
  if (file.size > 2 * 1024 * 1024) return { error: 'Avatar must be under 2MB.' }

  const ext = file.type.split('/')[1]
  const path = `${currentUser.id}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { error: 'Upload failed. Check storage bucket setup.' }

  const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path)
  const avatarUrl = `${publicData.publicUrl}?t=${Date.now()}`

  await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', currentUser.id)

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { success: true, url: avatarUrl }
}

export async function updatePasswordFromSettingsAction(formData: FormData): Promise<SettingsActionResult> {
  const password = formData.get('password') as string
  const confirm = formData.get('confirm_password') as string

  if (!password || password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (password !== confirm) return { error: 'Passwords do not match.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  return { success: true }
}
