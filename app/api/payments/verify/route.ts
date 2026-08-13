import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

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

    // 3. Verify HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // 4. Verify the payment record belongs to this user
    const { data: payment } = await supabase
      .from('payments')
      .select('id, user_id, status, razorpay_order_id')
      .eq('id', paymentDbId)
      .single()

    if (!payment || payment.user_id !== user.id) {
      return NextResponse.json({ error: 'Payment not found or not yours' }, { status: 403 })
    }

    if (payment.razorpay_order_id !== razorpay_order_id) {
      return NextResponse.json({ error: 'Order ID mismatch' }, { status: 400 })
    }

    if (payment.status === 'successful') {
      // Already processed (e.g., webhook was faster) — idempotent success
      return NextResponse.json({ success: true, alreadyProcessed: true })
    }

    // 5. Update payment status to processing (webhook will finalize to successful)
    await supabase
      .from('payments')
      .update({
        razorpay_payment_id,
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentDbId)

    return NextResponse.json({ success: true, status: 'processing' })
  } catch (error: any) {
    console.error('verify-payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
