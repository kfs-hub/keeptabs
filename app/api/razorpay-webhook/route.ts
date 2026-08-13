import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'

// Use service role for webhook — bypasses RLS for trusted server-side operations
function getAdminClient() {
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Disable Next.js body parsing — we need raw bytes for HMAC
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    // 1. Read raw body BEFORE any JSON parsing
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // 2. Verify webhook signature
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(rawBody)
      .digest('hex')

    if (expectedSig !== signature) {
      console.error('Webhook signature mismatch')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // 3. Parse event
    const event = JSON.parse(rawBody)
    const eventType: string = event.event
    const eventId: string = event.payload?.payment?.entity?.id ?? `${event.event}_${Date.now()}`

    const supabase = getAdminClient()

    // 4. Idempotency check — don't process the same event twice
    const { data: existing } = await supabase
      .from('processed_webhook_events')
      .select('id')
      .eq('event_id', eventId)
      .single()

    if (existing) {
      // Already processed — return 200 to stop Razorpay retrying
      return NextResponse.json({ received: true, status: 'already_processed' })
    }

    // 5. Handle event types
    if (eventType === 'payment.captured') {
      await handlePaymentCaptured(supabase, event)
    } else if (eventType === 'payment.failed') {
      await handlePaymentFailed(supabase, event)
    }
    // Other events: order.paid, refund.created, etc. — log and acknowledge

    // 6. Record that we processed this event (idempotency)
    await supabase.from('processed_webhook_events').insert({
      event_id: eventId,
      event_type: eventType,
    })

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    // Return 200 to prevent Razorpay from retrying on parse errors
    // (re-tries on 5xx, which would cause duplicate processing)
    return NextResponse.json({ received: true, error: 'Handler error logged' })
  }
}

async function handlePaymentCaptured(supabase: ReturnType<typeof getAdminClient>, event: any) {
  const payment = event.payload.payment.entity
  const razorpayOrderId = payment.order_id
  const razorpayPaymentId = payment.id

  // Find our payment record
  const { data: paymentRecord } = await supabase
    .from('payments')
    .select('id, user_id, group_id, status')
    .eq('razorpay_order_id', razorpayOrderId)
    .single()

  if (!paymentRecord) {
    console.error('Payment record not found for order:', razorpayOrderId)
    return
  }

  // If already successful (e.g., verify endpoint processed it first), skip
  if (paymentRecord.status === 'successful') {
    return
  }

  // 1. Update payment to successful
  await supabase
    .from('payments')
    .update({
      razorpay_payment_id: razorpayPaymentId,
      status: 'successful',
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentRecord.id)

  // 2. Get the fines linked to this payment
  const { data: paymentFines } = await supabase
    .from('payment_fines')
    .select('fine_id')
    .eq('payment_id', paymentRecord.id)

  if (paymentFines?.length) {
    const fineIds = paymentFines.map((pf) => pf.fine_id)

    // 3. Mark all linked fines as paid — server-side only, RLS bypassed
    await supabase
      .from('fines')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .in('id', fineIds)
  }

  // 4. Get user profile for notification message
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', paymentRecord.user_id)
    .single()

  const userName = profile?.display_name ?? 'A member'

  // 5. Notify the payer
  await supabase.from('notifications').insert({
    user_id: paymentRecord.user_id,
    group_id: paymentRecord.group_id,
    type: 'payment_successful',
    title: '🎉 Payment Successful!',
    message: `Your payment was confirmed. Debt cleared! 🏆`,
    metadata: { payment_id: paymentRecord.id },
  })

  // 6. Notify group admins
  const { data: admins } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', paymentRecord.group_id)
    .in('role', ['admin', 'owner'])
    .neq('user_id', paymentRecord.user_id)

  for (const admin of admins ?? []) {
    await supabase.from('notifications').insert({
      user_id: admin.user_id,
      group_id: paymentRecord.group_id,
      type: 'payment_received',
      title: '💸 Payment Received!',
      message: `${userName} has paid their fines.`,
      metadata: { payment_id: paymentRecord.id },
    })
  }
}

async function handlePaymentFailed(supabase: ReturnType<typeof getAdminClient>, event: any) {
  const payment = event.payload.payment.entity
  const razorpayOrderId = payment.order_id

  const { data: paymentRecord } = await supabase
    .from('payments')
    .select('id, user_id, group_id')
    .eq('razorpay_order_id', razorpayOrderId)
    .single()

  if (!paymentRecord) return

  // Update payment to failed
  await supabase
    .from('payments')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentRecord.id)

  // Notify user
  await supabase.from('notifications').insert({
    user_id: paymentRecord.user_id,
    group_id: paymentRecord.group_id,
    type: 'payment_failed',
    title: '💀 Payment Failed',
    message: `Your payment failed. Your debt remains undefeated. Try again?`,
    metadata: { payment_id: paymentRecord.id },
  })
}
