# ClaritySME

ClaritySME is a financial intelligence workspace for small and growing businesses. It turns transaction data into KPI snapshots, cash-flow visibility, forecasts, alerts, AI-assisted analysis, and board-ready reports.

## What is included

- Supabase email authentication and company onboarding
- CSV transaction import with validation and automatic KPI snapshot generation
- KPI history, revenue and expense trends, 12-month revenue forecasts, and 13-week cash-flow forecasts
- Runway, margin, payroll, cash-balance, and revenue alerts
- Scenario planning for common revenue, hiring, and expense changes
- AI insights and financial Q&A through Anthropic
- Xero and QuickBooks OAuth connections and transaction sync
- Boardpack generation, CSV exports, and secure share links for active reports
- Stripe checkout, customer portal, and webhook endpoints

## Requirements

- Node.js 18.18 or newer
- npm
- A Supabase project for authentication and application data

Optional services are required only for their features: Anthropic for AI, Stripe for billing, Xero or QuickBooks for accounting sync, and SendGrid for email delivery.

## Local setup

Install dependencies:

```powershell
npm install
```

Create the project-root environment file from the provided template:

```powershell
Copy-Item .env.example .env.local
```

At minimum, set these Supabase variables in `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The service-role key is server-only. Never expose it through a `NEXT_PUBLIC_` variable or client-side code.

Start the development server:

```powershell
npm run dev
```

Open [http://localhost:3000](https://claritysme-git-main-steve-2a21.vercel.app/).

## Environment variables

The complete variable list is maintained in `.env.example`.

| Area | Variables | Required for |
| --- | --- | --- |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Auth, onboarding, dashboard data, and API routes |
| AI | `ANTHROPIC_API_KEY` | AI chat and generated insights |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and six price IDs | Billing checkout, portal, and webhook processing |
| Xero | `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET` | Xero OAuth and sync |
| QuickBooks | `QB_CLIENT_ID`, `QB_CLIENT_SECRET`, `QB_SANDBOX` | QuickBooks OAuth and sync |
| Application | `NEXT_PUBLIC_APP_URL`, `INTEGRATION_STATE_SECRET` | OAuth callback URLs and signed OAuth state |
| Email and cron | `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `CRON_SECRET` | Scheduled or manually triggered email delivery |

Use a strong, private value for `INTEGRATION_STATE_SECRET`. `CRON_SECRET` authenticates scheduled report requests when email delivery is configured.

## Supabase migrations

The schema and row-level security policies live in [`supabase/migrations`](supabase/migrations):

- `0001_initial.sql` creates the application schema, triggers, and baseline policies.
- `0002_public_shared_reports.sql` allows anonymous readers to access only reports referenced by an active, unexpired share link.

For an existing remote Supabase project, authenticate, link the project, and push migrations:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

The project reference is the subdomain in `NEXT_PUBLIC_SUPABASE_URL`. The CLI may request the database password during linking. Enter credentials directly in the terminal and do not commit them.

## Xero setup

The Xero connection uses the OAuth 2.0 app configuration from the Xero developer portal. Add the exact callback URL below to the Xero app's redirect URI allowlist:

```text
http://localhost:3000/api/integrations/xero/callback
```

Then copy the app's real client ID and client secret into `XERO_CLIENT_ID` and `XERO_CLIENT_SECRET`. The Xero app must be enabled; placeholder values or a disabled app produce Xero's `unauthorized_client` / `Unknown client or client not enabled` error before the user can sign in.

## Useful commands

```powershell
npm run dev          # Start the development server
npm run build        # Create a production build
npm run start        # Serve the production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript without emitting files
npm test             # Run calculation, parser, and report smoke tests
```

## Main routes

Public routes include `/`, `/auth/login`, `/auth/signup`, `/auth/callback`, and `/share/[token]`.

Authenticated dashboard routes include `/dashboard/overview`, `/dashboard/kpis`, `/dashboard/cashflow`, `/dashboard/forecasting`, `/dashboard/trends`, `/dashboard/alerts`, `/dashboard/insights`, `/dashboard/chat`, `/dashboard/scenarios`, `/dashboard/reports`, `/dashboard/upload`, `/dashboard/integrations`, and `/dashboard/settings`.

## Data flow

1. A user signs up and completes company onboarding.
2. A CSV upload is parsed and validated by `src/lib/csv/parser.ts`.
3. Valid records are saved to `financial_records` and the current KPI snapshot is upserted.
4. Dashboard pages read company-scoped data through Supabase row-level security.
5. Forecasts, alerts, reports, and AI features derive results from those records and snapshots.
6. Generated boardpacks are saved in `reports`; share links expose only the selected report while the link remains valid.

## Current limitations

- Wave is listed as a future integration but has no adapter or sync route yet.
- The scheduled reports endpoint validates `CRON_SECRET`, but email delivery still requires a configured provider implementation.
- The Stripe webhook currently validates signatures and acknowledges events; subscription persistence and plan synchronization still need to be added.
- The smoke tests cover calculation, CSV parsing, alert, and boardpack logic. Provider integrations and end-to-end browser flows require configured service credentials.

## Security notes

All company-scoped tables use Supabase row-level security. Server routes resolve the authenticated company before reading or writing company data. Public report access is restricted by both the share-link token and its expiration or revocation state.

Keep `.env.local`, access tokens, database passwords, OAuth secrets, Stripe keys, and the Supabase service-role key out of source control.
