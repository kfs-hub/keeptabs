import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Admin client to bypass RLS when marking fines paid
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse body
    const body = await req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentDbId } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !paymentDbId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 3. Verify HMAC signature — server-side only
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // 4. Verify payment record belongs to this user
    const { data: payment } = await supabase
      .from('payments')
      .select('id, user_id, status, razorpay_order_id, group_id')
      .eq('id', paymentDbId)
      .single()

    const p = payment as any

    if (!p || p.user_id !== user.id) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 403 })
    }

    if (p.razorpay_order_id !== razorpay_order_id) {
      return NextResponse.json({ error: 'Order ID mismatch' }, { status: 400 })
    }

    // 5. If already successful, return early (idempotent)
    if (p.status === 'successful') {
      return NextResponse.json({ success: true, status: 'successful' })
    }

    // 6. Signature verified — immediately mark payment as successful
    // Use admin client to bypass RLS (users can't update their own payment status)
    const admin = getAdminClient()

    await admin
      .from('payments')
      .update({
        razorpay_payment_id,
        status: 'successful',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentDbId)

    // 7. Get linked fines and mark them all as paid
    const { data: paymentFines } = await admin
      .from('payment_fines')
      .select('fine_id')
      .eq('payment_id', paymentDbId)

    if (paymentFines && paymentFines.length > 0) {
      const fineIds = paymentFines.map((pf: any) => pf.fine_id)
      await admin
        .from('fines')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .in('id', fineIds)
    }

    // 8. Send notification to user
    await admin.from('notifications').insert({
      user_id: user.id,
      group_id: p.group_id,
      type: 'payment_successful',
      title: 'Payment Confirmed',
      message: `Your payment of ₹${p.amount} was successful. Debt cleared.`,
      metadata: { payment_id: paymentDbId },
    })

    // 9. Revalidate all relevant pages so they show fresh data immediately
    revalidatePath('/dashboard')
    revalidatePath('/fines')
    revalidatePath('/payments')
    revalidatePath('/payments/pay')
    revalidatePath('/payments/history')
    revalidatePath('/leaderboard')
    revalidatePath('/stats')

    return NextResponse.json({ success: true, status: 'successful' })
  } catch (error: any) {
    console.error('verify-payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
