// Razorpay Checkout — loaded via CDN script tag
interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name?: string
  description?: string
  order_id: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  theme?: {
    color?: string
    backdrop_color?: string
  }
  modal?: {
    ondismiss?: () => void
  }
  handler?: (response: RazorpayResponse) => void
}

interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

interface RazorpayInstance {
  open(): void
  on(event: string, handler: (resp: any) => void): void
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance
}

interface Window {
  Razorpay: RazorpayConstructor
}
