'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { generateInviteCode } from '@/lib/utils'
import { z } from 'zod'

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
  const currentUser = await getCurrentUser()
  const supabase = await createClient()

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

  // Generate unique invite code
  let inviteCode = generateInviteCode(8)
  let attempts = 0
  while (attempts < 5) {
    const { data: existing } = await supabase
      .from('groups')
      .select('id')
      .eq('invite_code', inviteCode)
      .single()

    if (!existing) break
    inviteCode = generateInviteCode(8)
    attempts++
  }

  // Create group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: parsed.data.name,
      description: parsed.data.description || null,
      invite_code: inviteCode,
      created_by: currentUser.id,
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
    user_id: currentUser.id,
    role: 'owner',
  })

  if (memberError) {
    console.error('Member insert error:', memberError)
    await supabase.from('groups').delete().eq('id', (group as any).id)
    return { error: `Failed to set up group membership: ${memberError.message}` }
  }

  return { data: { groupId: (group as any).id, inviteCode } }
}
