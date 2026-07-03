"use client";

import { CheckCircle2, X, XCircle } from "lucide-react";
import type { ToastMessage } from "@/lib/use-toasts";

type ToastStackProps = {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
};

/**
 * Fixed-position toast stack. `aria-live="polite"` + `role="status"` per
 * ui-ux-pro-max's `toast-accessibility` guideline — announced to screen
 * readers without stealing focus; dismiss is still a real button for anyone
 * not relying on the auto-dismiss timer (`useToasts`).
 */
export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
            toast.variant === "success" ? "bg-zinc-900" : "bg-red-600"
          }`}
        >
          {toast.variant === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
            className="rounded p-1 hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
