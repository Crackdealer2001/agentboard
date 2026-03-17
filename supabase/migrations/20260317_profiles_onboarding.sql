-- Create profiles table for onboarding tracking
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  onboarding_completed boolean not null default false,
  onboarding_step integer not null default 0,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table profiles enable row level security;

-- Users can read their own profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);
