# MizoramStay

Production-oriented MVP foundation for the Mizoram tourism marketplace and homestay management platform.

## Current status

| Area | Status |
|------|--------|
| Auth, roles, RLS, landing page, admin dashboard, analytics | ✅ Complete (Phase 1) |
| Host property CRUD (create / edit / submit for review) | ✅ Complete |
| Search filtering (destination, district, type, price, amenities, verification) | ✅ Complete |
| Availability check (`room_inventory`) | ✅ Complete |
| Booking engine (service + server actions + checkout UI) | ⏳ In progress |
| Payment integration (provider order creation, webhook signature verification) | 🔲 Stub only |
| Reviews, wishlists, notifications UI | 🔲 Not started (schema only) |

## Architecture

- Next.js App Router + TypeScript (strict)
- Tailwind CSS v4 + shadcn-style source components
- Supabase/PostgreSQL for Auth, RLS, Storage, Realtime and Edge Functions
- Modular monolith domain boundaries under `src/features/`; REST `/api/v1` route handlers for external/application APIs
- Server-side transactional booking and payment workflows; client never confirms payment
- PWA manifest, sitemap and robots
- Public, host and admin experiences use separate navigation structures

## Routes

Public: `/`, `/stays`, `/search`, `/stays/[slug]`, `/destinations`, `/destinations/[slug]`, `/account`

Booking: `/booking/new`, `/booking/[id]`

Host: `/host/dashboard`, `/host/properties`, `/host/properties/[slug]`, `/host/calendar`, `/host/bookings`, `/host/revenue`, `/host/reviews`

Admin: `/admin/dashboard`, `/admin/properties`, `/admin/users`, `/admin/bookings`, `/admin/payments`, `/admin/reviews`, `/admin/verification`, `/admin/settings`

API: `/api/v1/properties`, `/api/v1/properties/[id]/availability`, `/api/v1/bookings`, `/api/v1/admin/properties/[id]/approve|reject|request-changes`, `/api/v1/analytics`, `/api/webhooks/payment`

## Local setup

1. Copy `.env.example` to `.env.local` and supply Supabase credentials.
2. Apply the migrations in `supabase/migrations/` to a Supabase project — the consolidated `20260830190000_mizoramstay_core.sql` covers the full schema, with incremental `NNNN_*.sql` files applied on top.
3. `npm install`
4. `npm run dev`

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## Production hardening before real transactions

The UI and domain boundaries are implemented, but real money movement is deliberately disabled until payment gateway credentials, webhook signature verification, transactional inventory locking RPCs, private document storage, and notification providers are configured.

The production booking sequence must be: server-side availability check → inventory hold → booking → payment initiation → signed provider webhook → booking confirmation → payout record → notification. This matches the project architecture baseline.
