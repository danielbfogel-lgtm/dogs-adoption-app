import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { he } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: he.auth.register.metaTitle,
};

export default function RegisterPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold text-foreground">{he.auth.register.heading}</h1>
        <p className="mb-8 text-center text-sm text-fg-muted">{he.auth.register.subheading}</p>
        <RegisterForm />
      </div>
    </div>
  );
}
