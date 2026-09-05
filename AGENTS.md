<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MizoramStay — Agent Coding Guidelines

These instructions apply to **all** coding agents working in this repository. Read this file before writing or modifying any code.

---

## 0. Project overview

MizoramStay is a **homestay and tourism marketplace** for the Indian state of Mizoram. Guests can discover, search, and book homestays; hosts can list properties; operators can offer experiences and transport; admins moderate the platform.

### Current status (2026-09-01)

| Area | Status |
|------|--------|
| Auth, roles, RLS, landing page, admin dashboard, analytics | ✅ Complete (Phase 1) |
| Host property CRUD (create / edit / submit for review) | ✅ Complete |
| Search filtering, availability check, booking engine | ⏳ In progress |
| Payment integration, notifications, reviews, wishlists | 🔲 Not started |

---

## 1. Research before you write code

### 1.1 Always consult official documentation via Context7 MCP

Before implementing any feature, API, library, or architecture decision, **search the official documentation using the Context7 MCP server** (`mcp_context7_resolve-library-id` → `mcp_context7_get-library-docs`). This applies to every dependency in this project, including but not limited to:

- **Next.js 16** (App Router, Server Components, Route Handlers, caching, metadata, `"use cache"`)
- **React 19** (Server Actions, `use()`, `useFormStatus`, `useOptimistic`)
- **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`, Auth, Storage, Postgres/RLS)
- **Tailwind CSS v4** (CSS-first config, `@theme`, `@import "tailwindcss"`)
- **Zod** and **react-hook-form**
- Any other library you intend to use

Do not rely on training-data assumptions — APIs change. Verify signatures, conventions, and deprecations against current official docs before writing code.

### 1.2 Always use relevant skills before implementing

Before writing or changing any code, check the **global skills directory** at `C:\Users\USER\.agents\skills` (and any other skills VS Code can access) and load the skill(s) relevant to the task. Read the skill's `SKILL.md` and follow its guidance. Relevant skills for this project include (but are not limited to):

- `next-best-practices`, `next-cache-components`, `next-upgrade` — Next.js conventions
- `vercel-react-best-practices`, `vercel-composition-patterns` — React/Next.js performance & composition
- `tailwind-4-docs` — Tailwind CSS v4
- `shadcn` / `shadcn-ui` — UI components
- `ant-design-react` — Ant Design components
- `supabase-postgres-best-practices` — Postgres/RLS performance
- `fastapi-python`, `fastapi-async-patterns`, `pydantic`, `pytest` — Python (if applicable)
- `web-design-guidelines` — UI/UX & accessibility review
- `context7-mcp` — how to use the Context7 MCP server

If a task falls within a skill's domain, **read and follow that skill** before writing code.

---

## 2. Stack & key dependencies

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 (CSS-first config via `@theme inline` in `globals.css`) |
| Icons | Lucide React |
| Data / Auth / Storage | Supabase — Postgres 17, Auth, SSR via `@supabase/ssr` |
| Validation | Zod schemas + react-hook-form |
| UI primitives | `@base-ui/react`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge` |
| Toasts | Sonner |
| Theming | `next-themes` |
| Linting | ESLint (flat config) + `eslint-config-next/core-web-vitals` |
| Testing | Vitest (unit), Playwright (e2e) |
| Deployment | Vercel |

### TypeScript configuration
- **Strict mode** is enabled — no `any`, no implicit `any`.
- Path alias: `@/*` → `./src/*`. Always use `@/` imports.
- `noEmit: true` — type-checking only; Next.js handles compilation.

### npm / dependency gotcha
> **⚠️ `npm install <pkg>` prunes undeclared dependencies.** If you install a new package and it removes packages that are used in code but not declared in `package.json`, typecheck will break. Before running `npm install`, verify that all packages imported in `src/` are declared in `package.json`. If something breaks, reinstall the missing packages immediately.

---

## 3. Project structure

```
mizoramstay/
├── src/
│   ├── app/                    # Next.js App Router pages & layouts
│   │   ├── (auth)/             # Auth route group (login, signup, forgot-password, etc.)
│   │   ├── (public)/           # Public route group
│   │   ├── account/            # User account pages
│   │   ├── admin/              # Admin dashboard (properties, users, bookings, etc.)
│   │   ├── api/                # Route handlers
│   │   ├── auth/               # Auth callback / signout
│   │   ├── booking/            # Booking pages
│   │   ├── host/               # Host workspace (properties list, create, edit)
│   │   └── ...                 # Other routes (stays, destinations, etc.)
│   ├── components/             # Shared UI components
│   │   ├── ui/                 # Primitive UI (button, card, input, etc.) — shadcn-style
│   │   ├── forms/              # Form components
│   │   ├── home/               # Landing page section components
│   │   ├── admin/              # Admin-specific components
│   │   ├── host/               # Host-specific components
│   │   └── public/             # Public-facing components
│   ├── features/               # Domain-specific business logic
│   │   ├── auth/               # Auth logic
│   │   ├── bookings/           # Booking domain (service, repository, validation, events)
│   │   ├── properties/         # Property domain (service, repository, admin, host)
│   │   ├── reviews/            # Reviews domain
│   │   ├── search/             # Search domain
│   │   ├── verification/       # Verification domain
│   │   └── payments/           # Payment domain
│   ├── lib/                    # Shared utilities & clients
│   │   ├── supabase/           # Supabase client factories (server, browser, admin)
│   │   ├── auth/               # Auth helpers
│   │   ├── booking/            # Booking helpers
│   │   ├── pricing/            # Pricing helpers
│   │   └── validation/         # Shared Zod schemas
│   └── types/                  # Shared TypeScript types
│       ├── domain.ts           # Core domain types (Property, Room, etc.)
│       └── marketplace.ts      # Marketplace projection types
├── supabase/
│   ├── config.toml             # Supabase local config
│   ├── migrations/             # SQL migrations (NNNN_name.sql)
│   ├── functions/              # Edge functions
│   └── seed.sql                # Seed data
├── tests/
│   ├── unit/                   # Vitest unit tests
│   ├── api/                    # API route tests
│   └── e2e/                    # Playwright end-to-end tests
└── public/                     # Static assets
```

---

## 4. Architecture conventions

### 4.1 Feature-based organization

Business logic lives under `src/features/<domain>/`. Each feature folder typically contains:

| File | Purpose |
|------|---------|
| `README.md` | Feature scope description |
| `*.service.ts` | Business logic orchestration |
| `*.repository.ts` | Data access interface |
| `*.repository.supabase.ts` | Supabase-backed repository implementation |
| `*.actions.ts` | Next.js Server Actions (forms, mutations) |
| `*.schema.ts` | Zod validation schemas |

Keep domain logic inside its feature folder — do not leak it into `src/app/` or `src/components/`.

### 4.2 App routes are thin

Routes under `src/app/` should be **thin wrappers** that:
1. Call Server Components or Server Actions.
2. Delegate all business logic to feature modules.
3. Handle layout, metadata, and streaming.

Do **not** put database queries, complex business logic, or service orchestration directly in route files.

### 4.3 Server vs Client components

| Rule | Details |
|------|---------|
| **Default to Server Components** | No `"use client"` directive unless needed |
| **Use `"use client"` only for** | Interactivity (onClick, onChange, useState, useEffect, form handling) |
| **Keep client boundaries low** | Push `"use client"` as deep as possible in the component tree |
| **Server Actions for mutations** | Use `"use server"` functions for form submissions and data mutations |

### 4.4 Component conventions

- **Small and composable** — one component per file, follow React composition patterns.
- **Naming**: PascalCase for components, camelCase for functions/variables. Files: `kebab-case.tsx` for components, `kebab-case.ts` for utilities/services.
- **UI primitives** live in `src/components/ui/` and follow shadcn conventions (variant-based via `class-variance-authority`).
- Use `cn()` from `@/lib/utils` (clsx + tailwind-merge) for conditional class merging.

### 4.5 Path aliases

Always use the `@/` alias for imports within `src/`:
```ts
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { Property } from '@/types/domain'
```

---

## 5. Supabase guidelines

### 5.1 Client factories — never create ad-hoc clients

| Client | File | Use for |
|--------|------|---------|
| Server (RLS-respecting) | `src/lib/supabase/server.ts` | Server Components, Route Handlers, Server Actions |
| Browser | `src/lib/supabase/browser.ts` | Client Components (rare — prefer Server Components) |
| Admin (service-role) | `src/lib/supabase/admin.ts` | Background jobs only — bypasses RLS |

**⚠️ The server client is ASYNC.** Always `await createClient()`:
```ts
const supabase = await createClient()
```

### 5.2 Row Level Security (RLS)

- **Every table must have RLS enabled** and explicit policies. No table is accessible without a policy.
- **Never expose `SECURITY DEFINER` functions to `anon`/`authenticated`** unless intentional — always `REVOKE EXECUTE` where not needed.
- **Always `SET search_path = public`** in `SECURITY DEFINER` functions to prevent search-path hijacking.

### 5.3 The infinite-recursion gotcha

A policy on table X that queries table X causes `infinite recursion detected in policy for relation 'X'`. **Fix**: create a `SECURITY DEFINER` helper function:

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
  );
$$;
```

Then use `is_admin()` in all admin policies instead of self-referencing subqueries. See migration `0018_fix_admin_policies.sql` for the canonical example.

### 5.4 Admin pages use RLS-respecting client

Admin pages use `src/lib/supabase/server.ts` (which respects RLS), **not** the service-role client. This means every table an admin must read needs an **explicit admin SELECT policy** (see migration `0017_admin_read_policies.sql`).

---

## 6. Database migrations

### 6.1 Naming & location

- All schema changes go in `supabase/migrations/` using `NNNN_name.sql` (e.g., `0021_add_property_media.sql`).
- Each migration must be **idempotent** where possible.

### 6.2 Applying migrations

1. Write the SQL migration locally.
2. Apply via Supabase MCP: `mcp_supabase_apply_migration(project_id, name, query)`.
3. **Verify** the result by querying `pg_policies`, `information_schema.columns`, or relevant tables.
4. Keep the local `supabase/migrations/*.sql` file **in sync** with what was applied remotely.

### 6.3 Schema conventions

- **UUID primary keys** on all tables.
- **`timestamptz`** for all timestamp columns (not `timestamp`).
- **`numeric(12,2)`** for monetary values (not `float`).
- **Check constraints** for enums and valid ranges.
- **Cascading deletes** where ownership is clear.
- **Foreign key indexes** on all FK columns.

---

## 7. Code quality

### 7.1 TypeScript strict mode

- **No `any`** unless absolutely unavoidable (and add a `// eslint-disable-next-line` comment explaining why).
- Prefer **narrow types** and **discriminated unions** over broad type assertions.
- Use **Zod schemas** for runtime validation of all external input (API params, form data, env vars).

### 7.2 Validation with Zod

- Define schemas in `src/lib/validation/` or alongside the feature they serve.
- Use `z.infer<typeof schema>` to derive TypeScript types from Zod schemas — keep DB types and validation in sync.
- Validate server-side in Server Actions and Route Handlers, **not just** on the client.

### 7.3 Linting & formatting

```bash
npm run lint        # ESLint — must pass with zero errors
npm run typecheck   # tsc --noEmit — must pass with zero errors
```

Run both before committing. Fix all errors and warnings. Do not suppress warnings without justification.

### 7.4 Environment variables

- Secrets go in `.env.local` — **never** commit them.
- Public env vars are prefixed with `NEXT_PUBLIC_`.
- Use `process.env.NEXT_PUBLIC_*` for client-side access, `process.env.*` for server-side only.

---

## 8. Testing

### 8.1 Unit tests (Vitest)

```bash
npm run test        # Run all unit tests once
```

- Test pure functions, utilities, validation schemas, and pricing logic.
- Place tests in `tests/unit/` mirroring the source structure.

### 8.2 API / integration tests

- Place in `tests/api/`.
- Test Route Handlers and Server Actions with mocked Supabase clients where needed.

### 8.3 End-to-end tests (Playwright)

```bash
npm run test:e2e    # Run Playwright tests
```

- Place in `tests/e2e/`.
- Test critical user flows (auth, search, booking, host property creation).

### 8.4 Before completing any task

Run the full verification suite and confirm all checks pass:

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

---

## 9. Security

- **Never** commit secrets, API keys, or credentials.
- **Never** use the service-role Supabase client in client-side code.
- **Always** validate and sanitize input on the server side.
- **Always** use RLS — never bypass it without explicit authorization.
- **Revoke** `EXECUTE` on `SECURITY DEFINER` functions from `anon`/`authenticated` unless they must be callable.
- **CSRF / XSS**: use Next.js built-in protections; never inject untrusted HTML.
- **Rate limiting**: add rate limiting to public API endpoints before going to production.

---

## 10. Verification before completion

After making changes, **always** run the relevant checks and confirm they pass:

| Check | Command |
|-------|---------|
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` |
| Unit tests | `npm run test` |
| Build | `npm run build` |

- For **database changes**, verify the result by querying the schema/policies (e.g., `SELECT * FROM pg_policies WHERE tablename = '...'`) rather than assuming success.
- Do **not** claim a change is complete without fresh verification output.

---

## 11. Quick reference — common patterns

### Creating a Supabase server client in a Server Component / Server Action
```ts
import { createClient } from '@/lib/supabase/server'

export async function myAction() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('properties').select('*')
  if (error) throw error
  return data
}
```

### Defining a Zod schema and inferring a type
```ts
import { z } from 'zod'

export const CreatePropertySchema = z.object({
  name: z.string().min(1).max(200),
  district: z.string().min(1),
  propertyType: z.enum(['HOMESTAY', 'HOTEL', 'RESORT', 'GUESTHOUSE']),
})

export type CreatePropertyInput = z.infer<typeof CreatePropertySchema>
```

### Using the `cn()` utility
```ts
import { cn } from '@/lib/utils'

<div className={cn('base-styles', isActive && 'active-styles', className)} />
```
