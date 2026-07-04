"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteUser } from "@/lib/admin-users-api";
import { he } from "@/lib/i18n/he";

type DeleteUserButtonProps = {
  id: string;
  onDeleted: () => void;
  onError: (message: string) => void;
};

/**
 * Two-step inline confirm (not a native `confirm()` dialog), mirroring
 * `components/dogs/DeleteDogButton.tsx`. Unlike that button, there's no
 * Server Action to hand off to — this calls `lib/admin-users-api.ts`'s
 * `deleteUser()` (the Python Admin Auth API) directly and reports the
 * outcome via callbacks instead of a `redirect()`.
 */
export function DeleteUserButton({ id, onDeleted, onError }: DeleteUserButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await deleteUser(id);
      onDeleted();
    } catch (err) {
      onError(err instanceof Error ? err.message : he.admin.users.deleteButton.deleteFailed);
    } finally {
      setPending(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-fg-muted">{he.admin.users.deleteButton.confirmPrompt}</span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {he.common.confirm}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="flex h-9 items-center rounded-lg border border-divider-strong px-3 text-sm font-medium text-fg-secondary hover:bg-surface-muted"
        >
          {he.common.cancel}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-danger-border px-3 text-sm font-medium text-danger hover:bg-danger-soft"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
      {he.common.delete}
    </button>
  );
}
