import Link from "next/link";
import { SearchX } from "lucide-react";

export default function DogNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <SearchX className="h-10 w-10 text-zinc-300" aria-hidden="true" />
      <h1 className="mt-4 text-xl font-bold text-zinc-900">Dog not found</h1>
      <p className="mt-2 text-sm text-zinc-600">
        This dog may have been adopted, removed, or the link is incorrect.
      </p>
      <Link
        href="/dogs"
        className="mt-6 flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark"
      >
        Browse all dogs
      </Link>
    </div>
  );
}
