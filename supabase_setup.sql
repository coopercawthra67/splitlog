-- ============================================================
-- SplitLog Database Setup
-- Run this entire file in Supabase → SQL Editor → New Query
-- ============================================================

-- PROFILES (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  role text not null check (role in ('coach', 'athlete')),
  avatar_initials text,
  color text default '#c8ff3e',
  share_enabled boolean default false,
  created_at timestamptz default now()
);

-- GROUPS
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  coach_id uuid references public.profiles(id) on delete cascade,
  color text default '#3ecfff',
  created_at timestamptz default now()
);

-- GROUP MEMBERS
create table if not exists public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  athlete_id uuid references public.profiles(id) on delete cascade,
  primary key (group_id, athlete_id)
);

-- WORKOUTS
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text default 'Track',
  date date,
  time_of_day text,
  location text,
  surface text,
  weather text,
  coach_notes text,
  coach_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- WORKOUT ATHLETES (junction)
create table if not exists public.workout_athletes (
  workout_id uuid references public.workouts(id) on delete cascade,
  athlete_id uuid references public.profiles(id) on delete cascade,
  primary key (workout_id, athlete_id)
);

-- SPLITS
create table if not exists public.splits (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references public.workouts(id) on delete cascade,
  athlete_id uuid references public.profiles(id) on delete cascade,
  rep_number integer,
  distance text,
  time text,
  created_at timestamptz default now()
);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, role, avatar_initials, color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'athlete'),
    upper(left(coalesce(new.raw_user_meta_data->>'name', new.email), 1) || 
          coalesce(left(split_part(coalesce(new.raw_user_meta_data->>'name', ''), ' ', 2), 1), '')),
    coalesce(new.raw_user_meta_data->>'color', '#c8ff3e')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_athletes enable row level security;
alter table public.splits enable row level security;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- PROFILES: everyone can read profiles, users update their own
create policy "profiles_read" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- GROUPS: coaches manage their own, athletes can read groups they belong to
create policy "groups_read" on public.groups for select using (
  coach_id = auth.uid() or
  exists (select 1 from public.group_members where group_id = groups.id and athlete_id = auth.uid())
);
create policy "groups_insert" on public.groups for insert with check (coach_id = auth.uid());
create policy "groups_update" on public.groups for update using (coach_id = auth.uid());
create policy "groups_delete" on public.groups for delete using (coach_id = auth.uid());

-- GROUP MEMBERS: coaches manage, members can read
create policy "group_members_read" on public.group_members for select using (
  exists (select 1 from public.groups where id = group_members.group_id and coach_id = auth.uid())
  or athlete_id = auth.uid()
  or exists (select 1 from public.group_members gm2 where gm2.group_id = group_members.group_id and gm2.athlete_id = auth.uid())
);
create policy "group_members_insert" on public.group_members for insert with check (
  exists (select 1 from public.groups where id = group_members.group_id and coach_id = auth.uid())
);
create policy "group_members_delete" on public.group_members for delete using (
  exists (select 1 from public.groups where id = group_members.group_id and coach_id = auth.uid())
);

-- WORKOUTS: coaches see all they created, athletes see workouts they're in
create policy "workouts_coach_all" on public.workouts for all using (coach_id = auth.uid());
create policy "workouts_athlete_read" on public.workouts for select using (
  exists (select 1 from public.workout_athletes where workout_id = workouts.id and athlete_id = auth.uid())
);

-- WORKOUT ATHLETES: coaches manage, athletes read their own
create policy "wa_coach" on public.workout_athletes for all using (
  exists (select 1 from public.workouts where id = workout_athletes.workout_id and coach_id = auth.uid())
);
create policy "wa_athlete_read" on public.workout_athletes for select using (athlete_id = auth.uid());

-- SPLITS: coaches manage all, athletes read own + shared teammates
create policy "splits_coach" on public.splits for all using (
  exists (select 1 from public.workouts where id = splits.workout_id and coach_id = auth.uid())
);
create policy "splits_athlete_own" on public.splits for select using (athlete_id = auth.uid());
create policy "splits_athlete_shared" on public.splits for select using (
  exists (
    select 1 from public.profiles p
    join public.group_members gm1 on gm1.athlete_id = p.id
    join public.group_members gm2 on gm2.group_id = gm1.group_id and gm2.athlete_id = auth.uid()
    where p.id = splits.athlete_id and p.share_enabled = true
  )
);
