"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteDog } from "@/lib/dog-actions";

/**
 * Two-step inline confirm (not a native `confirm()` dialog — easier to
 * style, test, and keep accessible) before submitting the `deleteDog`
 * Server Action. `deleteDog` isn't wired through `useActionState` (it always
 * redirects rather than returning form state), so this is a plain
 * `<form action={deleteDog}>`.
 */
export function DeleteDogButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-fg-muted">Delete this dog?</span>
        <form action={deleteDog}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            className="flex h-9 items-center rounded-lg bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700"
          >
            Confirm
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="flex h-9 items-center rounded-lg border border-divider-strong px-3 text-sm font-medium text-fg-secondary hover:bg-surface-muted"
        >
          Cancel
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
      Delete
    </button>
  );
}
