import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@/lib/supabase/server'

// Server-only: Razorpay secret never reaches the client
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

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
    const { fineIds, groupId } = body as { fineIds: string[]; groupId: string }

    if (!fineIds?.length || !groupId) {
      return NextResponse.json({ error: 'Missing fineIds or groupId' }, { status: 400 })
    }

    // 3. Verify user is in the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    // 4. Server-side fetch fines — NEVER trust client-sent amounts
    const { data: fines, error: finesError } = await supabase
      .from('fines')
      .select('id, amount, status, fined_user_id, group_id')
      .in('id', fineIds)
      .eq('group_id', groupId)
      .eq('fined_user_id', user.id) // Only the person who owes can pay
      .in('status', ['unpaid', 'disputed'])

    if (finesError || !fines?.length) {
      return NextResponse.json(
        { error: 'No valid fines found. Fines must be unpaid and belong to you.' },
        { status: 400 }
      )
    }

    // 5. Validate all requested fineIds were returned (prevent partial spoofing)
    const validIds = new Set(fines.map((f) => f.id))
    const allValid = fineIds.every((id) => validIds.has(id))
    if (!allValid) {
      return NextResponse.json({ error: 'One or more fines are invalid or already paid.' }, { status: 400 })
    }

    // 6. Calculate total server-side
    const totalAmount = fines.reduce((sum, f) => sum + Number(f.amount), 0)
    const amountInPaise = Math.round(totalAmount * 100) // Razorpay uses paise

    // 7. Get group currency
    const { data: group } = await supabase
      .from('groups')
      .select('currency')
      .eq('id', groupId)
      .single()

    const currency = group?.currency === 'INR' ? 'INR' : 'INR' // Razorpay primarily supports INR

    // 8. Create Razorpay order
    const receipt = `pay_${user.id.slice(0, 8)}_${Date.now()}`
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt,
      notes: {
        user_id: user.id,
        group_id: groupId,
        fine_ids: fineIds.join(','),
      },
    })

    // 9. Create a pending payment record in our DB
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        group_id: groupId,
        user_id: user.id,
        amount: totalAmount,
        razorpay_order_id: order.id,
        status: 'pending',
      })
      .select('id')
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 })
    }

    // 10. Link fines to this payment
    await supabase.from('payment_fines').insert(
      fines.map((f) => ({
        payment_id: payment.id,
        fine_id: f.id,
        amount: Number(f.amount),
      }))
    )

    // 11. Return order info + public key only (never the secret)
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      paymentDbId: payment.id,
      fineCount: fines.length,
    })
  } catch (error: any) {
    console.error('create-order error:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: 500 }
    )
  }
}
