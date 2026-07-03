import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // No remotePatterns wildcard: `dogs.photo_url` is an admin-entered URL
    // on an unknown host (SPEC.md §2), and `/_next/image` is a *public*
    // endpoint — allowing it to fetch arbitrary hosts would make it an
    // SSRF-capable open proxy for any visitor, regardless of what's
    // actually stored in the DB. `DogPhoto` renders these images
    // `unoptimized` instead, so the browser fetches them directly.
  },
};

export default nextConfig;
