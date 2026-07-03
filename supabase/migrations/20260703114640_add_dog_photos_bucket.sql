-- =========================================================
-- dog-photos storage bucket (admin dog management — photo upload)
-- =========================================================
-- Public bucket: photo_url values are rendered on the public /dogs and
-- /dogs/[id] pages (no auth required to view), so reads must be open to
-- anon+authenticated. Writes are restricted to admins only, mirroring the
-- existing dogs_admin_insert/update/delete policies' inline role-check
-- subquery (no is_admin() helper exists yet, so this stays consistent with
-- that pattern rather than introducing a new one).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dog-photos',
  'dog-photos',
  true,
  5242880, -- 5 MiB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "dog_photos_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'dog-photos');

create policy "dog_photos_admin_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'dog-photos'
    and exists (select 1 from public.profiles p
                where p.id = (select auth.uid()) and p.role = 'admin')
  );

-- Upsert-style replace (INSERT ... upsert:true) needs UPDATE too, in addition
-- to INSERT+SELECT above, or file replacement silently fails.
create policy "dog_photos_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'dog-photos'
    and exists (select 1 from public.profiles p
                where p.id = (select auth.uid()) and p.role = 'admin')
  )
  with check (
    bucket_id = 'dog-photos'
    and exists (select 1 from public.profiles p
                where p.id = (select auth.uid()) and p.role = 'admin')
  );

create policy "dog_photos_admin_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'dog-photos'
    and exists (select 1 from public.profiles p
                where p.id = (select auth.uid()) and p.role = 'admin')
  );
