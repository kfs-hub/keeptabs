# 💸 Keep Tabs — Friend Group Fine Tracker

A polished, mobile-first web app for tracking fines, settling debts, and keeping your friend group accountable — with style.

**Stack:** Next.js 16, TypeScript, Tailwind CSS v4, Supabase, Razorpay, Framer Motion, Recharts

---

## Features

- **Authentication** — Sign up, login, password reset via Supabase Auth
- **Groups** — Create groups with invite codes, join via code
- **Fine System** — Issue fines with rules, evidence uploads, descriptions
- **Disputes** — Dispute fines with admin review workflow
- **Payments** — Razorpay integration with UPI, server-side order creation, webhook verification
- **Leaderboard** — Animated, sortable, with playful labels
- **Statistics** — Bar, Pie, Area charts with Recharts
- **Notifications** — Real-time via Supabase Realtime
- **Achievements** — 15 achievements auto-awarded on events
- **Admin Panel** — Member management, dispute resolution, settings, audit log
- **Fun Features** — Hall of Shame, Fine of the Week, clean streaks
- **Dark mode** — Default, glassmorphism UI

---

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd keeptabs
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key from **Settings → API**
3. Copy your service role key (needed for seed script only)

### 3. Run database migrations

In the Supabase **SQL Editor**, run the migration file:

```
supabase/migrations/001_initial_schema.sql
```

This creates all tables, indexes, RLS policies, helper functions, and the default achievements.

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Configure Supabase Storage

Create three storage buckets in **Supabase → Storage**:
- `avatars` — Public
- `group-icons` — Public
- `evidence` — Public

### 6. Configure Supabase Auth

In **Authentication → URL Configuration**:
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

### 7. Set up Razorpay (Test Mode)

1. Create an account at [razorpay.com](https://razorpay.com)
2. Get test API keys from **Settings → API Keys**
3. Add a webhook at **Settings → Webhooks**:
   - URL: `https://your-domain.com/api/razorpay-webhook`
   - Events: `payment.captured`, `payment.failed`
   - Copy the webhook secret into `RAZORPAY_WEBHOOK_SECRET`

For local webhook testing, use [ngrok](https://ngrok.com):
```bash
ngrok http 3000
# Use the ngrok URL as your webhook URL
```

### 8. Seed development data

```bash
npm run seed
```

This creates:
- 4 test users (password: `password123`)
  - `kaif@keeptabs.dev` — Group Owner
  - `alex@keeptabs.dev` — Admin
  - `rahul@keeptabs.dev` — Member (most fined, great for testing)
  - `sara@keeptabs.dev` — Member
- Group "The Gang" with invite code `THEGANG42`
- 6 rules, 15 fines, 3 payments, 1 dispute, 8 notifications, achievements

### 9. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript type check |
| `npm run seed` | Seed development data |
| `npm run db:reset` | Clear all app data (auth users preserved) |

---

## Deployment (Vercel)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set all environment variables (same as `.env.local` but with production values)
4. Update Supabase Auth redirect URLs to your Vercel domain
5. Update Razorpay webhook URL to your Vercel domain
6. Deploy

The `vercel.json` configures appropriate function timeouts for the Razorpay webhook and payment routes.

---

## Architecture

```
app/
├── (auth)/          # Login, signup, password reset
├── (app)/           # Authenticated app shell
│   ├── dashboard/   # Main dashboard with leaderboard
│   ├── fines/       # Fine history + dispute
│   ├── rules/       # Rules CRUD
│   ├── payments/    # Pay fines, payment history
│   ├── leaderboard/ # Full leaderboard
│   ├── members/     # Member list + profiles
│   ├── notifications/
│   ├── stats/       # Charts and analytics
│   ├── settings/    # User profile settings
│   └── admin/       # Admin panel (disputes, members, audit)
├── api/
│   ├── payments/    # create-order, verify, status
│   └── razorpay-webhook/  # Payment webhook handler
└── auth/callback/   # Supabase auth callback

lib/
├── supabase/        # Server + client Supabase factories
├── auth/            # Auth guards (requireGroupMembership, etc.)
├── notifications/   # Notification creation utilities
├── achievements/    # Achievement check and award logic
└── rate-limit.ts    # Simple sliding-window rate limiter

components/
├── ui/              # Base UI components (buttons, inputs, etc.)
├── layout/          # Sidebar, header, bottom nav
├── dashboard/       # Dashboard-specific components
├── fines/           # Fine modal, animation, FAB
├── payments/        # Checkout button, success/failure screens
├── notifications/   # Bell, notification items
├── stats/           # Recharts wrappers
├── rules/           # Rule cards and forms
├── admin/           # Admin panel components
└── fun/             # Achievements, streaks, Hall of Shame
```

---

## Payment Flow

```
User selects fines
     ↓
POST /api/payments/create-order
  → Server fetches fines from DB (never trusts client amount)
  → Creates Razorpay order
  → Stores pending payment in DB
     ↓
Frontend opens Razorpay Checkout
     ↓
User completes payment
     ↓
POST /api/payments/verify
  → Verifies HMAC signature
  → Sets payment to "processing"
     ↓
Razorpay fires webhook → POST /api/razorpay-webhook
  → Verifies webhook signature (raw body HMAC)
  → Idempotency check (processed_webhook_events)
  → Sets payment to "successful"
  → Marks all linked fines as "paid"
  → Sends notifications
```

---

## Security

- Row Level Security on all Supabase tables
- Server-side Razorpay secret (never in client code)
- Payment signature verification on every transaction
- Webhook HMAC verification with raw body
- Idempotent webhook processing (no double-payments)
- Rate limiting on fine issuance and disputes
- File upload validation (type + size)
- Admin operations verified server-side, not client-claimed

---

## License

MIT
