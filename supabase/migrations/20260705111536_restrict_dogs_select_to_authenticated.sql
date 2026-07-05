-- The dogs gallery/details pages now require login, not public (SPEC.md
-- §4 "All Dogs Gallery") — revoke the `anon` read access that
-- 20260623125227_create_initial_schema.sql granted, so a logged-out visitor
-- can't read the `dogs` table by calling the Supabase REST API directly,
-- bypassing the app's own login gate entirely.

drop policy "dogs_select_all" on public.dogs;

create policy "dogs_select_authenticated" on public.dogs
  for select to authenticated using (true);

revoke select on public.dogs from anon;
