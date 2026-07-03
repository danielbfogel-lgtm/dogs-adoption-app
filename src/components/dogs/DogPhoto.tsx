"use client";

import Image from "next/image";
import { useState } from "react";
import { Dog as DogIcon } from "lucide-react";

type DogPhotoProps = {
  src: string | null;
  alt: string;
  sizes?: string;
};

/**
 * Fills its (relatively-positioned, sized) parent. Falls back to a paw/dog
 * icon placeholder when `photo_url` is null or the image fails to load —
 * admin-entered URLs (SPEC.md §2) aren't guaranteed to stay reachable.
 */
export function DogPhoto({ src, alt, sizes }: DogPhotoProps) {
  // Keyed by `src` so each distinct URL gets its own component instance —
  // `failed` state then naturally resets when `src` changes (e.g. a
  // client-side nav between two /dogs/[id] routes reconciling the same
  // fiber), per React's "reset state via key, not an effect" guidance.
  return <DogPhotoImage key={src ?? "none"} src={src} alt={alt} sizes={sizes} />;
}

function DogPhotoImage({ src, alt, sizes }: DogPhotoProps) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  if (showFallback) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-100">
        <DogIcon className="h-1/3 w-1/3 text-zinc-300" aria-hidden="true" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      // `dogs.photo_url` points at an admin-entered, unknown host — see
      // next.config.ts for why `/_next/image` must never be pointed at
      // arbitrary hosts. `unoptimized` makes the browser fetch it directly.
      unoptimized
      sizes={sizes ?? "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"}
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}
