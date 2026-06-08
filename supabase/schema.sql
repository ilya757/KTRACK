-- ============================================================
-- Sobriety Tracker Schema
-- Run this in: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Profiles table (one row per user, linked to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  daily_goal_mg numeric(10,2) not null default 2000,
  partner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Allow reading partner profile (for shared summary view)
create policy "Users can view partner profile"
  on public.profiles for select
  using (
    id in (
      select partner_id from public.profiles where id = auth.uid()
    )
  );

-- Log entries
create table public.log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  amount_mg numeric(10,2) not null check (amount_mg > 0),
  logged_at timestamptz not null default now(),
  reason text,
  tag text,
  note text,
  created_at timestamptz not null default now()
);

alter table public.log_entries enable row level security;

create policy "Users can view own entries"
  on public.log_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on public.log_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own entries"
  on public.log_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own entries"
  on public.log_entries for delete
  using (auth.uid() = user_id);

-- Allow partner to view entries for shared summary
create policy "Partner can view entries"
  on public.log_entries for select
  using (
    user_id in (
      select partner_id from public.profiles where id = auth.uid()
    )
  );

-- Indexes
create index log_entries_user_id_logged_at_idx
  on public.log_entries (user_id, logged_at desc);

create index log_entries_tag_idx
  on public.log_entries (user_id, tag);

-- ============================================================
-- Function: get 30-day daily totals for a user
-- ============================================================
create or replace function public.daily_totals(target_user_id uuid, days int default 30)
returns table (day date, total_mg numeric)
language sql
security definer
set search_path = public
as $$
  select
    date_trunc('day', logged_at at time zone 'UTC')::date as day,
    sum(amount_mg) as total_mg
  from log_entries
  where user_id = target_user_id
    and logged_at >= now() - (days || ' days')::interval
  group by 1
  order by 1;
$$;

-- Grant usage
grant execute on function public.daily_totals to authenticated;
