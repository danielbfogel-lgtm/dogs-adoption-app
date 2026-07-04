import type { Metadata } from "next";
import Link from "next/link";
import { Dog, Heart, Search, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Dog Adoption Matching",
  description: "Find your new best friend — matched to your family's lifestyle.",
};

const FEATURES = [
  {
    icon: Search,
    title: "Browse available dogs",
    description: "Search and filter every dog currently in our program.",
  },
  {
    icon: Heart,
    title: "Get matched",
    description: "Our scoring algorithm ranks dogs against your household and lifestyle.",
  },
  {
    icon: ShieldCheck,
    title: "Confirm with confidence",
    description: "Review your top matches and confirm the ones you want to meet.",
  },
];

/** Public landing page (SPEC.md doesn't specify its content — the app previously shipped with the un-customized create-next-app scaffold here, only ever noticed via a live screenshot). */
export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-zinc-200 bg-zinc-50">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-20 text-center sm:px-6">
          <Dog className="h-12 w-12 text-primary" aria-hidden="true" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Find your new best friend
          </h1>
          <p className="mt-3 max-w-xl text-lg text-zinc-600">
            We match adoptable dogs with families based on energy level, size, household, and
            more — so you find a dog that actually fits your life.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dogs"
              className="flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white hover:bg-primary-dark"
            >
              Browse Dogs
            </Link>
            {user ? (
              <Link
                href="/matches"
                className="flex h-12 items-center justify-center rounded-lg border border-zinc-300 px-6 text-base font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                View My Matches
              </Link>
            ) : (
              <Link
                href="/register"
                className="flex h-12 items-center justify-center rounded-lg border border-zinc-300 px-6 text-base font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Create an Account
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col items-center text-center sm:items-start sm:text-left"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-zinc-900">{title}</h2>
              <p className="mt-1.5 text-sm text-zinc-600">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
