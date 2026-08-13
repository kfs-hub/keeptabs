'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true)
      return
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

interface CheckoutButtonProps {
  fineIds: string[]
  groupId: string
  totalAmount: number
  currency?: string
  userName: string
  userEmail: string
  onSuccess: (paymentDbId: string) => void
  onFailure: (error: string) => void
  onStateChange: (state: 'idle' | 'loading' | 'open' | 'verifying') => void
  disabled?: boolean
}

export function CheckoutButton({
  fineIds,
  groupId,
  totalAmount,
  currency = 'INR',
  userName,
  userEmail,
  onSuccess,
  onFailure,
  onStateChange,
  disabled,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handlePay = useCallback(async () => {
    setLoading(true)
    onStateChange('loading')

    try {
      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay. Check your internet connection.')
      }

      // 2. Create order server-side (amount validated server-side)
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fineIds, groupId }),
      })

      if (!orderRes.ok) {
        const err = await orderRes.json()
        throw new Error(err.error ?? 'Failed to create payment order.')
      }

      const { orderId, amount, keyId, paymentDbId } = await orderRes.json()

      // 3. Open Razorpay Checkout
      onStateChange('open')

      await new Promise<void>((resolve, reject) => {
        const options = {
          key: keyId,
          amount,
          currency: 'INR',
          name: 'Keep Tabs',
          description: `Paying ${fineIds.length} fine${fineIds.length > 1 ? 's' : ''}`,
          order_id: orderId,
          prefill: {
            name: userName,
            email: userEmail,
          },
          theme: {
            color: '#7c3aed',
            backdrop_color: 'rgba(0,0,0,0.8)',
          },
          modal: {
            ondismiss: () => {
              reject(new Error('DISMISSED'))
            },
          },
          handler: async (response: any) => {
            onStateChange('verifying')

            // 4. Verify signature server-side
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentDbId,
              }),
            })

            const verifyData = await verifyRes.json()

            if (!verifyRes.ok || !verifyData.success) {
              reject(new Error(verifyData.error ?? 'Payment verification failed.'))
              return
            }

            resolve()
            onSuccess(paymentDbId)
          },
        }

        const rzp = new window.Razorpay(options)
        rzp.on('payment.failed', (resp: any) => {
          reject(new Error(resp?.error?.description ?? 'Payment failed.'))
        })
        rzp.open()
      })
    } catch (err: any) {
      if (err.message !== 'DISMISSED') {
        onFailure(err.message ?? 'Payment failed.')
      }
      onStateChange('idle')
    } finally {
      setLoading(false)
    }
  }, [fineIds, groupId, userName, userEmail, onSuccess, onFailure, onStateChange])

  return (
    <Button
      onClick={handlePay}
      loading={loading}
      disabled={disabled || loading}
      size="xl"
      className="w-full text-lg"
    >
      💳 Pay {formatCurrency(totalAmount, currency)}
    </Button>
  )
}
