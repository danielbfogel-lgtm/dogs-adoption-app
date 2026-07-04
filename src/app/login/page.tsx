import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { he } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: he.auth.login.metaTitle,
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; resetSuccess?: string }>;
}) {
  const { redirect, resetSuccess } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {resetSuccess === "1" && (
          <p role="status" className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {he.auth.login.resetSuccessBanner}
          </p>
        )}
        <h1 className="mb-1 text-center text-2xl font-bold text-foreground">{he.auth.login.heading}</h1>
        <p className="mb-8 text-center text-sm text-fg-muted">{he.auth.login.subheading}</p>
        <LoginForm redirectTo={redirect} />
      </div>
    </div>
  );
}
