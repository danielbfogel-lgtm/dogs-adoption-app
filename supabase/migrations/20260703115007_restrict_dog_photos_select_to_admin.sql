-- =========================================================
-- dog-photos: narrow the SELECT policy to admins only
-- =========================================================
-- `supabase db advisors` flagged "public_bucket_allows_listing": the prior
-- broad `anon, authenticated` SELECT policy let any client enumerate every
-- object in the bucket via the Storage API's .list()/.download(). That
-- policy was unnecessary for viewing photos — a `public = true` bucket
-- already serves every object unconditionally via the
-- /storage/v1/object/public/... URL, bypassing storage.objects RLS entirely
-- (per Supabase's storage docs: "all files uploaded in a public bucket are
-- publicly accessible"). The only remaining reason to keep a SELECT policy
-- at all is that `upload(..., { upsert: true })` needs SELECT (in addition
-- to INSERT/UPDATE) to check for an existing object — and only admins ever
-- upload, so scope it to them.
drop policy "dog_photos_public_read" on storage.objects;

create policy "dog_photos_admin_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'dog-photos'
    and exists (select 1 from public.profiles p
                where p.id = (select auth.uid()) and p.role = 'admin')
  );
