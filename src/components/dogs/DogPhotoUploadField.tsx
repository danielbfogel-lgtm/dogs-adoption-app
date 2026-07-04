"use client";

import { useId, useState, type ChangeEvent } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DogPhoto } from "@/components/dogs/DogPhoto";
import { DOG_PHOTOS_BUCKET } from "@/lib/dog-photo-storage";
import { he } from "@/lib/i18n/he";

// Mirrors the bucket's file_size_limit/allowed_mime_types
// (supabase/migrations/20260703114640_add_dog_photos_bucket.sql) — checked
// here for a fast, friendly error, but Storage enforces both server-side
// regardless of what this component lets through.
const MAX_FILE_BYTES = 5 * 1024 * 1024;
// Object-key extension derived from this map (the already-validated MIME
// type), not from the untrusted `file.name` — a file can be named anything.
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const ALLOWED_TYPES = Object.keys(EXTENSION_BY_TYPE);

type DogPhotoUploadFieldProps = {
  value: string | null;
  onChange: (url: string | null) => void;
  /**
   * Reports whether an upload is in flight so the parent form can disable
   * its submit button — otherwise submitting mid-upload saves the dog with
   * the *previous* `photo_url` (the upload's `onChange` hasn't fired yet)
   * and the newly-uploaded file is silently orphaned in Storage.
   */
  onUploadingChange: (uploading: boolean) => void;
};

/**
 * Uploads directly from the browser to the `dog-photos` Storage bucket —
 * client-side, not through the `saveDog` Server Action, to avoid the
 * action's body-size limits. `saveDog` only ever persists the resulting
 * public URL string via this field's hidden `photo_url` input. Admin-only
 * writes are enforced by the `dog_photos_admin_*` RLS policies
 * (supabase/migrations/20260703114640..., 20260703115007...) — a non-admin's
 * upload attempt is rejected by Postgres regardless of what this component
 * does; the role check that gates whether this field even renders
 * (`DogForm`, gated by `requireAdmin()` on the page) is just UX.
 *
 * Deliberately never deletes the *previous* Storage object on replace here
 * (only uploads the new one) — the admin might replace a photo and then
 * abandon the edit without saving, and deleting the old object immediately
 * would break the still-live dog row's photo. `saveDog` does that cleanup
 * instead, only after the new `photo_url` is actually persisted.
 */
export function DogPhotoUploadField({ value, onChange, onUploadingChange }: DogPhotoUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file afterward
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(he.dogs.photoUpload.fileTypeError);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(he.dogs.photoUpload.fileSizeError);
      return;
    }

    setError(null);
    setUploading(true);
    onUploadingChange(true);

    const extension = EXTENSION_BY_TYPE[file.type];
    const path = `${crypto.randomUUID()}.${extension}`;

    const supabase = createClient();
    const { error: uploadError } = await supabase.storage.from(DOG_PHOTOS_BUCKET).upload(path, file);

    if (uploadError) {
      console.error("dog photo upload failed:", uploadError.message);
      setError(he.dogs.photoUpload.uploadFailedError);
      setUploading(false);
      onUploadingChange(false);
      return;
    }

    const { data } = supabase.storage.from(DOG_PHOTOS_BUCKET).getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
    onUploadingChange(false);
  }

  return (
    <div>
      <span className="block text-sm font-medium text-foreground">{he.dogs.photoUpload.fieldLabel}</span>
      <div className="mt-1.5 flex items-center gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-divider">
          <DogPhoto src={value} alt={he.dogs.photoUpload.photoPreviewAlt} sizes="96px" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/70">
              <Loader2 className="h-5 w-5 animate-spin text-fg-muted" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="flex flex-col items-start gap-2">
          <label
            htmlFor={id}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-divider-strong px-3 text-sm font-medium text-fg-secondary hover:bg-surface-muted"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {value ? he.dogs.photoUpload.replacePhoto : he.dogs.photoUpload.uploadPhoto}
          </label>
          <input
            id={id}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            onChange={handleFileChange}
            disabled={uploading}
            className="sr-only"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-danger hover:bg-danger-soft"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              {he.dogs.photoUpload.removePhoto}
            </button>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
      {/* saveDog reads this field name, not the file input above. */}
      <input type="hidden" name="photo_url" value={value ?? ""} />
    </div>
  );
}
