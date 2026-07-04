import Link from "next/link";
import { SearchX } from "lucide-react";
import { he } from "@/lib/i18n/he";

export default function DogNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <SearchX className="h-10 w-10 text-fg-subtle" aria-hidden="true" />
      <h1 className="mt-4 text-xl font-bold text-foreground">{he.dogs.notFound.heading}</h1>
      <p className="mt-2 text-sm text-fg-muted">{he.dogs.notFound.body}</p>
      <Link
        href="/dogs"
        className="mt-6 flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark"
      >
        {he.dogs.notFound.browseAllDogs}
      </Link>
    </div>
  );
}
