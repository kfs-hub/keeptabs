import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const paymentId = searchParams.get('id')

  if (!paymentId) {
    return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 })
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: payment } = await supabase
    .from('payments')
    .select('id, status, amount, user_id')
    .eq('id', paymentId)
    .single()

  // Only return status to the payment owner
  if (!payment || payment.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ status: payment.status, amount: payment.amount })
}
