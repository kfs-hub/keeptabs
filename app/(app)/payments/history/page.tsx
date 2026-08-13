import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PaymentHistoryClient } from './payment-history-client'

export const metadata = { title: 'Payment History' }

export default async function PaymentHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('group_members')
    .select('group_id, role, groups(*)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1)
    .single()

  if (!membership) redirect('/onboarding')

  const groupId = membership.group_id
  const group = membership.groups as any
  const currency: string = group?.currency ?? 'INR'
  const isAdmin = ['admin', 'owner'].includes(membership.role)

  const page = parseInt(params.page ?? '1')
  const pageSize = 15
  const statusFilter = params.status

  // Build query — admins see all group payments, members see only their own
  let query = supabase
    .from('payments')
    .select('*, profiles!payments_user_id_fkey(display_name, avatar_url, username)', { count: 'exact' })
    .eq('group_id', groupId)

  if (!isAdmin) {
    query = query.eq('user_id', user.id)
  }

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  query = query.order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1)

  const { data: payments, count } = await query

  // Fetch fine details for each payment
  const paymentIds = (payments ?? []).map((p) => p.id)
  const { data: paymentFines } = paymentIds.length
    ? await supabase
        .from('payment_fines')
        .select('payment_id, fine_id, amount, fines(rule_id, description, rules(name))')
        .in('payment_id', paymentIds)
    : { data: [] }

  // Group fines by payment_id
  const finesByPayment: Record<string, any[]> = {}
  for (const pf of paymentFines ?? []) {
    if (!finesByPayment[pf.payment_id]) finesByPayment[pf.payment_id] = []
    finesByPayment[pf.payment_id].push(pf)
  }

  return (
    <PaymentHistoryClient
      payments={payments ?? []}
      finesByPayment={finesByPayment}
      currency={currency}
      isAdmin={isAdmin}
      currentUserId={user.id}
      total={count ?? 0}
      page={page}
      pageSize={pageSize}
    />
  )
}
