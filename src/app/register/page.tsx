import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Register — Dog Adoption",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold text-foreground">Create your account</h1>
        <p className="mb-8 text-center text-sm text-fg-muted">
          Register to start finding your new best friend.
        </p>
        <RegisterForm />
      </div>
    </div>
  );
}
