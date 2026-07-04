import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log in — Dog Adoption",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="mb-8 text-center text-sm text-fg-muted">Log in to see your dog matches.</p>
        <LoginForm redirectTo={redirect} />
      </div>
    </div>
  );
}
