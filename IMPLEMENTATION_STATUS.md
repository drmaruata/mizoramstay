# MizoramStay implementation status

## Implemented in this repository

- Next.js App Router project structure with public, host and admin areas.
- Design-token based UI using Tailwind CSS v4 and local shadcn-style source components under `src/components/ui/`.
- Public homepage, destination discovery, stay discovery/search, property detail, booking checkout UX and booking confirmation.
- Tourist account surfaces for trips, wishlist, reviews and sign-in entry.
- Host dashboard, property onboarding surface, availability calendar, bookings, revenue and review management.
- Admin dashboard, property inventory and verification workflow surfaces.
- `/api/v1` route handlers for properties, availability, booking validation and administrative property actions.
- Supabase browser/server/admin clients and a Next.js session-refresh `proxy.ts` boundary.
- PostgreSQL/Supabase migration with normalized marketplace schema, RLS, indexes, audit structures, payments/refunds/payouts, verification tables and idempotent payment-event storage.
- Edge Function stubs for create-booking, payment-webhook, cancellation and notifications.
- PWA manifest, robots and sitemap.
- Unit/API/E2E test scaffolding and GitHub CI workflow.

## Intentionally not enabled yet

- Live Supabase connection (no project credentials were provided).
- Real OTP delivery/authentication.
- Real payment order creation, webhook signature validation, refunds and host settlement.
- Production notification providers (WhatsApp/SMS/email).
- Live map provider.
- Signed private-document access.
- Real-time booking inventory and transactional availability RPC.

These are integration steps, not client-side placeholders for money movement. The client is not treated as a source of truth for payment or booking confirmation.

## Validation performed in this environment

The source tree and repository configuration were inspected with the available local toolchain. A full `npm install`/Next.js build could not be executed because the sandbox has no DNS access to the npm registry, and therefore dependencies were unavailable. A global TypeScript invocation consequently reports missing external modules; those messages are environmental rather than a completed application build.

Before merging to production, run dependency resolution and commit the generated lockfile, then execute lint → typecheck → unit tests → build → Playwright E2E against a staging Supabase project.
