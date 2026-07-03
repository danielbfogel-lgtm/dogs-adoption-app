-- =========================================================
-- 1. profiles: rename user_type -> role
-- =========================================================
alter table public.profiles rename column user_type to role;

alter table public.profiles
  drop constraint if exists profiles_user_type_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('adopter', 'admin'));

-- =========================================================
-- 2. dogs: add name column
-- =========================================================
alter table public.dogs add column name text;

-- =========================================================
-- 3. adopters: drop status and email columns
-- =========================================================
alter table public.adopters drop column status;
alter table public.adopters drop column email;

-- =========================================================
-- 4. potential_matches: rename status -> match_status,
--    drop interest_confirmed
-- =========================================================
alter table public.potential_matches rename column status to match_status;
alter table public.potential_matches drop column interest_confirmed;

-- =========================================================
-- 5. Drop dogs_adopters (policies/grants cascade with the table)
-- =========================================================
drop table public.dogs_adopters;

-- =========================================================
-- 6. Rebuild dogs admin policies to reference role (not user_type)
-- =========================================================
drop policy if exists "dogs_admin_insert" on public.dogs;
drop policy if exists "dogs_admin_update" on public.dogs;
drop policy if exists "dogs_admin_delete" on public.dogs;

create policy "dogs_admin_insert" on public.dogs
  for insert to authenticated
  with check (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ));

create policy "dogs_admin_update" on public.dogs
  for update to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ));

create policy "dogs_admin_delete" on public.dogs
  for delete to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ));
