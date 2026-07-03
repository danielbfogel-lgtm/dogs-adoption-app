/**
 * Shared between the client-side uploader (`DogPhotoUploadField`) and the
 * server-side cleanup in `lib/dog-actions.ts` (`saveDog`/`deleteDog`), so the
 * bucket name and the public-URL-to-object-path parsing can't drift apart.
 */
export const DOG_PHOTOS_BUCKET = "dog-photos";

/**
 * Extracts the Storage object path from a `dog-photos` public URL, so it can
 * be passed to `.storage.from(DOG_PHOTOS_BUCKET).remove([path])`. Returns
 * `null` for anything that isn't a same-bucket public URL (e.g. a legacy or
 * hand-entered externally-hosted URL) — such values are left alone rather
 * than guessed at, since `dogs.photo_url` is a plain, unconstrained text
 * column and not guaranteed to always be one of our own uploads.
 */
export function extractDogPhotoStoragePath(url: string | null): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${DOG_PHOTOS_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const path = url.slice(index + marker.length);
  return path.length > 0 ? decodeURIComponent(path) : null;
}
