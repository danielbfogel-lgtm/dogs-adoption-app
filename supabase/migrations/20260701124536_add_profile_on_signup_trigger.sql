-- =========================================================
-- Auto-create a public.profiles row for every new auth user
-- =========================================================
-- When Supabase Auth inserts into auth.users (i.e. someone registers), create the
-- matching public.profiles row with role 'adopter'.
--
-- SECURITY DEFINER: the function runs with the privileges of its OWNER (postgres,
-- which has BYPASSRLS), not the caller. Required because:
--   * the insert runs inside the auth.users INSERT, executed by the
--     supabase_auth_admin role, which has no rights on public.profiles; and
--   * public.profiles has RLS enabled with only "insert your own row while
--     authenticated" (profiles_insert_own with check auth.uid() = id). At signup
--     there is no end-user session (auth.uid() is null) — especially with email
--     confirmation on — so a caller-privileged insert is blocked by RLS.
-- SECURITY DEFINER + a BYPASSRLS owner lets the trigger write the row regardless.
--
-- `set search_path = ''` hardens the SECURITY DEFINER function against search-path
-- hijacking (and satisfies the Supabase function_search_path_mutable advisor);
-- every referenced object is fully schema-qualified.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'adopter')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Idempotent (re)creation of the trigger.
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
