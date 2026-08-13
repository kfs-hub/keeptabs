import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Check if they have a group
    const { data: membership } = await supabase
      .from('group_members')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (membership) redirect('/dashboard')
    else redirect('/onboarding')
  }

  redirect('/login')
}
