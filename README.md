# Pembantu-App

A swipe-to-match marketplace for personal helpers in Malaysia. Cleaning, cooking, errands, eldercare, and more.

Plan: `/root/.claude/plans/i-want-to-create-delightful-curry.md` (or check the commit history).

## Stack

- **Next.js 15** (App Router, RSC, Server Actions) + TypeScript strict
- **Prisma 6** on Prisma Postgres (via Vercel Marketplace)
- **Better Auth** (phone-OTP plugin) + Twilio Verify
- **Billplz** for FPX / DuitNow QR / e-wallets — Stripe doesn't support FPX in MY
- **Framer Motion** for the swipe stack
- **Serwist** for PWA
- **Pusher Channels** for in-app chat
- **Inngest** for booking-lifecycle jobs (payout release, match expiry, reminders)
- **Vercel Blob** for ID/selfie + listing photos
- **Upstash Redis** for rate-limits
- **Tailwind 4 + shadcn/ui** for UI
- **Biome** for lint/format

## Quick start

```bash
# 1. install
npm install

# 2. configure env
cp .env.example .env
#   - Set DATABASE_URL to a local Postgres or `npx prisma dev` URL.
#   - Leave DEV_OTP_BYPASS=1 for local dev (accepts code 000000).

# 3. database
npx prisma migrate dev --name init
npm run db:seed       # 1 admin, 1 test client, 10 helpers across categories

# 4. run
npm run dev           # http://localhost:3000
```

**Test customer**: `test@maidapp.ai` / `test123` (id `test-client-fixed-id`).
The current dev build runs every server action as this user — full Better Auth
session lookup lands in implementation step 3.

Open `/` then tap **Find a helper** to see the swipe stack.

### Test accounts (seeded)

**Customer** — `test@maidapp.ai` / `test123` (postcode 50000, KL)

**Helpers** (password `helper123`):
`aishah@maidapp.ai` · `hafiz@maidapp.ai` · `meiling@maidapp.ai` · `priya@maidapp.ai` ·
`daniel@maidapp.ai` · `siti@maidapp.ai` · `ravi@maidapp.ai` · `nurul@maidapp.ai` ·
`kumar@maidapp.ai` · `farah@maidapp.ai`

**Admin** — `admin@maidapp.ai` / `admin123`

### Demo the full flow (5 minutes)

1. Visit `/login` → log in as `test@maidapp.ai`
2. Land on `/discover` → swipe right on Aishah
3. Sign out → log in as `aishah@maidapp.ai` → land on `/helper/dashboard`
4. Tap **Inbox** → swipe right on Test Customer → "It's a match!"
5. Tap **Matches** → open thread → send "call me at 012-3456789" → see PII redaction
6. Sign back in as test customer → `/matches` → tap **Book** → pick date/duration → confirm
7. Sign in as Aishah → `/helper/jobs` → tap booking → **Accept job** → **Check in** → **In progress** → **Complete**
8. Sign in as client → `/bookings` → tap booking → **Simulate payment success** → **Confirm & release payout** (sets 48h payout hold)

### Automated tests

```bash
npm run db:simulate    # 35 unit checks against the DB directly
npm run db:walkthrough # 40 live-HTTP checks against a running dev server
```

The HTTP walkthrough verifies login redirects, discover renders, swipe → match,
helper inbox, chat PII redaction in the rendered HTML, booking creation,
helper dashboard, and auth-aware home — all by signing a session cookie with
the same HMAC the app uses.

## What's wired up (this commit)

- Prisma schema with HelperProfile, HelperListing, Swipe, Match, Booking, PaymentIntent, Dispute, audit/trust models
- Swipe-stack discovery: server action + Framer Motion card stack + match celebration overlay
- `swipeListing` server action with idempotent upsert + rate-limits + mutual-right → MATCHED
- Filters drawer (category, postcode, max rate, skill keyword)
- Billplz webhook stub with X-Signature HMAC verification
- PII redaction utility for chat (strips MY phone formats, emails, social handles)
- Phone OTP starter with `DEV_OTP_BYPASS=1` shortcut for local dev
- PWA manifest + Serwist service worker
- Feature flags for high-trust categories (childcare/eldercare/driver/beauty) defaulted OFF

## What's still stubbed

See the plan's "Implementation Order" — remaining: full Better Auth wiring, helper onboarding wizard, listing CRUD UI, match detail + Pusher chat, booking flow + Billplz bill creation, check-in (geo + photo), Inngest functions, admin dashboard, reviews, mutual rating, Playwright e2e.

## Deploy to Vercel

### 1. Pick a serverless-friendly Postgres

**Do not** use a self-hosted Postgres with a public IP — Vercel's build and
function IPs are dynamic so you can't allowlist them, and serverless functions
spin up unbounded concurrent connections that crush a single instance.
Use one of:

- **Prisma Postgres** (Vercel Marketplace, one-click integration — recommended)
- **Neon** (serverless-native, generous free tier, has connection pooling)
- **Supabase** Postgres (also fine; ignore their auth since we use Better Auth)

The marketplace integration auto-injects `DATABASE_URL` (pooled) and
`DIRECT_URL` (direct, for migrations).

### 2. Import the repo

Vercel → New Project → import this repo on branch
`claude/maid-app-mvp-research-Fque4`. Vercel detects Next.js automatically.

### 3. Add env vars

From the **Vercel UI** (Project → Settings → Environment Variables) — never
commit secrets. Required:

- `DATABASE_URL`, `DIRECT_URL` (from your DB provider — auto-set if you used
  the Prisma Postgres marketplace integration)
- `BETTER_AUTH_SECRET` (run `openssl rand -hex 32`)
- `NEXT_PUBLIC_APP_URL`, `BETTER_AUTH_URL` — your production domain

Optional, only when you ship the feature:
- `TWILIO_*` for real OTP (leave unset to use `DEV_OTP_BYPASS=1` in preview)
- `BILLPLZ_*` for payments
- `PUSHER_*` for chat
- `UPSTASH_REDIS_*` for distributed rate limits

### 4. Run migrations (separate from build)

Migrations are intentionally **not** in the build command — they're a
production-state change and shouldn't silently run on every deploy.

```bash
# from your local machine, one-time setup
vercel link
vercel env pull .env.production.local

# then any time the schema changes:
DOTENV_CONFIG_PATH=.env.production.local npx -y dotenv-cli -- npx prisma migrate deploy
```

Or run migrations from your laptop against the production DB URL directly,
once, then deploy. Build region is pinned to `sin1` (Singapore) via
`vercel.json` for low MY latency.

## Differentiation vs Maideasy

See the plan file. Headline: any-category helpers (not just cleaning), helper-set pricing, mutual swipe match required before booking, in-app chat with PII protection, persistent match relationship for 2-tap re-booking.

## Risks called out in the plan

- Childcare/eldercare/driver/beauty disabled by default until TIER_1 ID+selfie verification ships
- "Pay-after-service" implemented as collect-now-release-later via Billplz balance — not true post-pay
- Free-text skills go through a banned-terms moderation filter
