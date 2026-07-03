import type { Metadata } from "next";
import { requireAdmin } from "@/lib/current-user";
import { CreateUserForm } from "@/components/admin/CreateUserForm";

export const metadata: Metadata = {
  title: "Add User — Dog Adoption",
};

/** Admin-only "Create User" (SPEC.md §4 "/admin/users ... can manually create ... users"). */
export default async function NewUserPage() {
  await requireAdmin("/admin/users/new");

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-zinc-900">Add a user</h1>
      <p className="mt-1 text-sm text-zinc-600">Create a new adopter or admin account.</p>
      <div className="mt-8">
        <CreateUserForm />
      </div>
    </div>
  );
}
