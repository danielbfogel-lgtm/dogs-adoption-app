import type { Metadata } from "next";
import Link from "next/link";
import { Dog, Heart, Search, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { he } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: he.home.metaTitle,
  description: he.home.metaDescription,
};

const FEATURES = [
  {
    icon: Search,
    title: he.home.feature1Title,
    description: he.home.feature1Desc,
  },
  {
    icon: Heart,
    title: he.home.feature2Title,
    description: he.home.feature2Desc,
  },
  {
    icon: ShieldCheck,
    title: he.home.feature3Title,
    description: he.home.feature3Desc,
  },
];

/** Public landing page (SPEC.md doesn't specify its content — the app previously shipped with the un-customized create-next-app scaffold here, only ever noticed via a live screenshot). */
export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-divider bg-surface-muted">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-20 text-center sm:px-6">
          <Dog className="h-12 w-12 text-primary" aria-hidden="true" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {he.home.heroTitle}
          </h1>
          <p className="mt-3 max-w-xl text-lg text-fg-muted">{he.home.heroSubtitle}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dogs"
              className="flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white hover:bg-primary-dark"
            >
              {he.home.browseDogs}
            </Link>
            {user ? (
              <Link
                href="/matches"
                className="flex h-12 items-center justify-center rounded-lg border border-divider-strong px-6 text-base font-semibold text-fg-secondary hover:bg-surface-muted"
              >
                {he.home.viewMyMatches}
              </Link>
            ) : (
              <Link
                href="/register"
                className="flex h-12 items-center justify-center rounded-lg border border-divider-strong px-6 text-base font-semibold text-fg-secondary hover:bg-surface-muted"
              >
                {he.home.createAccount}
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
              className="flex flex-col items-center text-center sm:items-start sm:text-start"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-foreground">{title}</h2>
              <p className="mt-1.5 text-sm text-fg-muted">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
