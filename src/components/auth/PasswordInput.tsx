"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = {
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  /** Defaults to `true` (Login/Register always require a password). Set `false` for an optional field, e.g. admin's "leave blank to keep the current password". */
  required?: boolean;
};

/** Password field with a visible label and a show/hide toggle (lucide icons, no emoji). */
export function PasswordInput({
  name,
  label,
  autoComplete,
  minLength,
  required = true,
}: PasswordInputProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-zinc-900">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 pr-11 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-zinc-500 hover:text-zinc-700"
        >
          {visible ? (
            <EyeOff className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Eye className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
