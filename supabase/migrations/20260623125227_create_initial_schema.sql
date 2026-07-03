-- =========================================================
-- profiles  (replaces ERD "Users"; 1:1 with auth.users)
-- =========================================================
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  user_type   text not null default 'adopter'
                check (user_type in ('adopter', 'admin')),
  created_at  timestamptz not null default now()
);

-- =========================================================
-- dogs
-- =========================================================
create table public.dogs (
  id                 uuid primary key default gen_random_uuid(),
  birth_date         date,
  age                integer check (age >= 0),
  breed              text,
  size               text check (size in ('small', 'medium', 'large')),
  energy_level       integer check (energy_level between 1 and 5),
  good_with_children boolean,
  good_with_dogs     boolean,
  good_with_cats     boolean,
  sheds              boolean,
  free_description   text,
  status             text not null default 'available'
                       check (status in ('available', 'pending', 'adopted')),
  photo_url          text,
  created_at         timestamptz not null default now()
);

-- =========================================================
-- adopters  (1:0..1 with profiles -> user_id UNIQUE)
-- =========================================================
create table public.adopters (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null unique references public.profiles (id) on delete cascade,
  first_name         text,
  last_name          text,
  birth_date         date,
  age                integer check (age >= 0),
  family_structure   text check (family_structure in ('single', 'couple', 'family')),
  energy_level       integer check (energy_level between 1 and 5),
  number_of_children integer check (number_of_children >= 0),
  youngest_child_age integer check (youngest_child_age >= 0),
  number_of_dogs     integer check (number_of_dogs >= 0),
  number_of_cats     integer check (number_of_cats >= 0),
  household_size     integer check (household_size >= 0),
  status             text not null default 'active'
                       check (status in ('active', 'inactive', 'approved', 'pending')),
  email              text,
  phone              text,
  created_at         timestamptz not null default now()
);

-- =========================================================
-- potential_matches  (adopter x dog candidate pairing)
-- =========================================================
create table public.potential_matches (
  id                 uuid primary key default gen_random_uuid(),
  adopter_id         uuid not null references public.adopters (id) on delete cascade,
  dog_id             uuid not null references public.dogs (id) on delete cascade,
  interest_confirmed boolean not null default false,
  status             text not null default 'pending'
                       check (status in ('pending', 'confirmed', 'rejected')),
  matching_score     numeric,
  created_at         timestamptz not null default now(),
  unique (adopter_id, dog_id)
);

-- =========================================================
-- dogs_adopters  (confirmed match; 0..1 per potential_match)
-- =========================================================
create table public.dogs_adopters (
  id                 uuid primary key default gen_random_uuid(),
  potential_match_id uuid unique references public.potential_matches (id) on delete set null,
  adopter_id         uuid not null references public.adopters (id) on delete cascade,
  dog_id             uuid not null references public.dogs (id) on delete cascade,
  matching_score     numeric,
  dog_status         text check (dog_status in ('pending', 'adopted', 'returned')),
  created_at         timestamptz not null default now()
);

-- FK indexes
create index idx_adopters_user_id            on public.adopters (user_id);
create index idx_potential_matches_adopter   on public.potential_matches (adopter_id);
create index idx_potential_matches_dog       on public.potential_matches (dog_id);
create index idx_dogs_adopters_adopter       on public.dogs_adopters (adopter_id);
create index idx_dogs_adopters_dog           on public.dogs_adopters (dog_id);

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.profiles          enable row level security;
alter table public.dogs              enable row level security;
alter table public.adopters          enable row level security;
alter table public.potential_matches enable row level security;
alter table public.dogs_adopters     enable row level security;

-- profiles: a user reads/edits only their own row
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- dogs: public browse; only admins mutate
create policy "dogs_select_all" on public.dogs
  for select to anon, authenticated using (true);
create policy "dogs_admin_insert" on public.dogs
  for insert to authenticated
  with check (exists (select 1 from public.profiles p
                      where p.id = (select auth.uid()) and p.user_type = 'admin'));
create policy "dogs_admin_update" on public.dogs
  for update to authenticated
  using (exists (select 1 from public.profiles p
                 where p.id = (select auth.uid()) and p.user_type = 'admin'))
  with check (exists (select 1 from public.profiles p
                      where p.id = (select auth.uid()) and p.user_type = 'admin'));
create policy "dogs_admin_delete" on public.dogs
  for delete to authenticated
  using (exists (select 1 from public.profiles p
                 where p.id = (select auth.uid()) and p.user_type = 'admin'));

-- adopters: a user owns the adopter row tied to their profile
create policy "adopters_rw_own" on public.adopters
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- potential_matches: visible/editable by the owning adopter
create policy "matches_rw_own" on public.potential_matches
  for all to authenticated
  using (exists (select 1 from public.adopters a
                 where a.id = adopter_id and a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.adopters a
                      where a.id = adopter_id and a.user_id = (select auth.uid())));

-- dogs_adopters: visible/editable by the owning adopter
create policy "dogs_adopters_rw_own" on public.dogs_adopters
  for all to authenticated
  using (exists (select 1 from public.adopters a
                 where a.id = adopter_id and a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.adopters a
                      where a.id = adopter_id and a.user_id = (select auth.uid())));

-- =========================================================
-- Data API grants (required: tables not auto-exposed since 2026-04-28)
-- =========================================================
grant select on public.dogs to anon, authenticated;
grant select, insert, update, delete
  on public.profiles, public.adopters, public.potential_matches, public.dogs_adopters
  to authenticated;
grant insert, update, delete on public.dogs to authenticated;
