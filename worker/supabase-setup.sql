-- VantagePM Supabase schema
-- Run this once in the Supabase SQL editor:
-- supabase.com/dashboard/project/YOUR_PROJECT/editor

-- One row per user; stores all app state as JSONB blobs.
create table if not exists public.user_data (
  id          uuid references auth.users primary key,
  settings    jsonb not null default '{}'::jsonb,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- Row-level security: each user can only read/write their own row.
alter table public.user_data enable row level security;

create policy "Users own their data"
  on public.user_data
  for all
  using  (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create the row when a new user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_data (id)
  values (new.id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
