create extension if not exists "pgcrypto";

create type public.industry as enum ('marketing_agency','it_msp','consulting','saas','accounting','professional_services','other');
create type public.currency as enum ('USD','GBP','KES','NGN','EUR','SGD','PHP');
create type public.revenue_model as enum ('retainer','subscription','project','mixed');
create type public.plan_tier as enum ('starter','growth','scale');
create type public.record_type as enum ('income','expense','asset','liability');
create type public.record_source as enum ('csv_upload','manual','quickbooks','xero','wave');
create type public.insight_type as enum ('health_summary','cash_flow_alert','benchmark_comparison','growth_opportunity','cost_reduction','forecast_narrative');
create type public.insight_priority as enum ('critical','warning','info','positive');
create type public.subscription_status as enum ('active','trialing','past_due','canceled','incomplete');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  industry public.industry not null,
  country text not null,
  currency public.currency not null default 'USD',
  revenue_band text not null default 'under_1m',
  revenue_model public.revenue_model not null,
  headcount integer not null default 1 check (headcount >= 0),
  fiscal_year_start_month integer not null default 1 check (fiscal_year_start_month between 1 and 12),
  onboarding_completed boolean not null default false,
  logo_url text,
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  company_id uuid references public.companies(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.financial_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  date date not null,
  period_month smallint generated always as (extract(month from date)::smallint) stored,
  period_year smallint generated always as (extract(year from date)::smallint) stored,
  type public.record_type not null,
  category text not null,
  description text not null,
  amount numeric(14,2) not null check (amount >= 0),
  currency public.currency not null,
  source public.record_source not null default 'manual',
  created_at timestamptz not null default now()
);
create index financial_records_company_date_idx on public.financial_records(company_id, date desc);

create table public.kpi_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  period_month smallint not null check (period_month between 1 and 12),
  period_year smallint not null,
  total_revenue numeric(14,2) not null default 0,
  recurring_revenue numeric(14,2) not null default 0,
  one_time_revenue numeric(14,2) not null default 0,
  total_cogs numeric(14,2) not null default 0,
  total_opex numeric(14,2) not null default 0,
  total_payroll numeric(14,2) not null default 0,
  gross_profit numeric(14,2) not null default 0,
  gross_margin_pct numeric(8,2) not null default 0,
  ebitda numeric(14,2) not null default 0,
  ebitda_margin_pct numeric(8,2) not null default 0,
  net_profit numeric(14,2) not null default 0,
  net_margin_pct numeric(8,2) not null default 0,
  cash_balance numeric(14,2) not null default 0,
  burn_rate numeric(14,2) not null default 0,
  runway_months numeric(8,2),
  revenue_per_employee numeric(14,2) not null default 0,
  payroll_ratio_pct numeric(8,2) not null default 0,
  mom_revenue_growth_pct numeric(8,2),
  arr numeric(14,2),
  mrr numeric(14,2),
  created_at timestamptz not null default now(),
  unique(company_id, period_month, period_year)
);

create table public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  type public.insight_type not null,
  title text not null,
  body text not null,
  priority public.insight_priority not null,
  period_month smallint,
  period_year smallint,
  created_at timestamptz not null default now(),
  is_read boolean not null default false
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_price_id text not null,
  plan public.plan_tier not null default 'starter',
  status public.subscription_status not null,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider text not null check (provider in ('xero','quickbooks','wave')),
  access_token text,
  refresh_token text,
  external_company_id text,
  expires_at timestamptz,
  status text not null default 'disconnected' check (status in ('connected','disconnected','error')),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, provider)
);

create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  events jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  type text not null check (type in ('boardpack','summary')),
  period_month smallint,
  period_year smallint,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  report_id uuid references public.reports(id) on delete cascade,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger companies_touch_updated_at before update on public.companies for each row execute function public.touch_updated_at();
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
create trigger subscriptions_touch_updated_at before update on public.subscriptions for each row execute function public.touch_updated_at();
create trigger integrations_touch_updated_at before update on public.integrations for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, coalesce(new.email, '')) on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.financial_records enable row level security;
alter table public.kpi_snapshots enable row level security;
alter table public.ai_insights enable row level security;
alter table public.subscriptions enable row level security;
alter table public.integrations enable row level security;
alter table public.scenarios enable row level security;
alter table public.reports enable row level security;
alter table public.share_links enable row level security;

create or replace function public.user_company_ids() returns setof uuid language sql stable security definer set search_path = public as $$
  select id from public.companies where owner_id = auth.uid()
  union
  select company_id from public.profiles where id = auth.uid() and company_id is not null;
$$;

create policy companies_owner_access on public.companies for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy profiles_self_access on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy financial_records_company_access on public.financial_records for all using (company_id in (select public.user_company_ids())) with check (company_id in (select public.user_company_ids()));
create policy kpi_snapshots_company_access on public.kpi_snapshots for all using (company_id in (select public.user_company_ids())) with check (company_id in (select public.user_company_ids()));
create policy ai_insights_company_access on public.ai_insights for all using (company_id in (select public.user_company_ids())) with check (company_id in (select public.user_company_ids()));
create policy subscriptions_company_access on public.subscriptions for select using (company_id in (select public.user_company_ids()));
create policy integrations_company_access on public.integrations for all using (company_id in (select public.user_company_ids())) with check (company_id in (select public.user_company_ids()));
create policy scenarios_company_access on public.scenarios for all using (company_id in (select public.user_company_ids())) with check (company_id in (select public.user_company_ids()));
create policy reports_company_access on public.reports for all using (company_id in (select public.user_company_ids())) with check (company_id in (select public.user_company_ids()));
create policy share_links_company_access on public.share_links for all using (company_id in (select public.user_company_ids())) with check (company_id in (select public.user_company_ids()));
create policy share_links_public_read on public.share_links for select using (revoked_at is null and (expires_at is null or expires_at > now()));
