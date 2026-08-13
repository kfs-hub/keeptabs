'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { generateInviteCode } from '@/lib/utils'
import { z } from 'zod'

// Admin client bypasses RLS — safe to use server-side only
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const createGroupSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  currency: z.string().min(1).max(10).default('INR'),
  default_fine_amount: z.coerce.number().min(1).max(10000).default(10),
})

interface CreateGroupResult {
  error?: string
  data?: { groupId: string; inviteCode: string }
}

export async function createGroupAction(formData: FormData): Promise<CreateGroupResult> {
  // 1. Get current authenticated user (uses anon client + session cookie)
  const serverClient = await createServerClient()
  const { data: { user }, error: authError } = await serverClient.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be logged in to create a group.' }
  }

  // 2. Validate input
  const raw = {
    name: formData.get('name') as string,
    description: formData.get('description') as string | undefined,
    currency: (formData.get('currency') as string) || 'INR',
    default_fine_amount: formData.get('default_fine_amount') as string,
  }

  const parsed = createGroupSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // 3. Use admin client for all DB operations (bypasses RLS safely on server)
  const supabase = getAdminClient()

  // Generate unique invite code
  let inviteCode = generateInviteCode(8)
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabase
      .from('groups')
      .select('id')
      .eq('invite_code', inviteCode)
      .single()
    if (!existing) break
    inviteCode = generateInviteCode(8)
  }

  // Create group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: parsed.data.name,
      description: parsed.data.description || null,
      invite_code: inviteCode,
      created_by: user.id,
      currency: parsed.data.currency,
      default_fine_amount: parsed.data.default_fine_amount,
      settings: {},
    })
    .select('id')
    .single()

  if (groupError || !group) {
    console.error('Group creation error:', groupError)
    return { error: `Failed to create group: ${groupError?.message ?? 'unknown error'}` }
  }

  // Add creator as owner
  const { error: memberError } = await supabase.from('group_members').insert({
    group_id: (group as any).id,
    user_id: user.id,
    role: 'owner',
  })

  if (memberError) {
    console.error('Member insert error:', memberError)
    await supabase.from('groups').delete().eq('id', (group as any).id)
    return { error: `Failed to set up group membership: ${memberError.message}` }
  }

  return { data: { groupId: (group as any).id, inviteCode } }
}
