"use client";

import { useId, type ReactNode } from "react";

type FieldShellProps = {
  label: string;
  error?: string;
  hint?: string;
  children: (id: string, describedBy: string | undefined) => ReactNode;
};

/** Label + error/hint plumbing shared by every profile form field. */
function FieldShell({ label, error, hint, children }: FieldShellProps) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-zinc-900">
        {label}
      </label>
      <div className="mt-1.5">{children(id, describedBy)}</div>
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-zinc-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass =
  "block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40";

const errorInputClass = "border-red-400 focus:border-red-500 focus:ring-red-400/40";

// Every field below is controlled (value + onChange), not defaultValue.
// React resets *all* uncontrolled fields in a <form action={fn}> back to
// their defaultValue once the action settles — including on a failed
// (validation-error) submission — which would silently wipe out everything
// the user just typed on this 14-field form. Controlled inputs keep the
// entered values under our own state, immune to that reset.

type TextFieldProps = {
  name: string;
  label: string;
  type?: "text" | "tel" | "date";
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  hint?: string;
  autoComplete?: string;
  max?: string;
};

export function TextField({
  name,
  label,
  type = "text",
  value,
  onChange,
  required,
  error,
  hint,
  autoComplete,
  max,
}: TextFieldProps) {
  return (
    <FieldShell label={label} error={error} hint={hint}>
      {(id, describedBy) => (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          required={required}
          autoComplete={autoComplete}
          max={max}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${inputClass} ${error ? errorInputClass : ""}`}
        />
      )}
    </FieldShell>
  );
}

type NumberFieldProps = {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  required?: boolean;
  error?: string;
  hint?: string;
};

export function NumberField({
  name,
  label,
  value,
  onChange,
  min = 0,
  required,
  error,
  hint,
}: NumberFieldProps) {
  return (
    <FieldShell label={label} error={error} hint={hint}>
      {(id, describedBy) => (
        <input
          id={id}
          name={name}
          type="number"
          inputMode="numeric"
          min={min}
          step={1}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${inputClass} ${error ? errorInputClass : ""}`}
        />
      )}
    </FieldShell>
  );
}

type TextareaFieldProps = {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
  error?: string;
  hint?: string;
};

export function TextareaField({
  name,
  label,
  value,
  onChange,
  rows = 4,
  required,
  error,
  hint,
}: TextareaFieldProps) {
  return (
    <FieldShell label={label} error={error} hint={hint}>
      {(id, describedBy) => (
        <textarea
          id={id}
          name={name}
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${inputClass} resize-y ${error ? errorInputClass : ""}`}
        />
      )}
    </FieldShell>
  );
}

type SelectFieldProps<T extends string | number> = {
  name: string;
  label: string;
  options: { value: T; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
};

export function SelectField<T extends string | number>({
  name,
  label,
  options,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  error,
}: SelectFieldProps<T>) {
  return (
    <FieldShell label={label} error={error}>
      {(id, describedBy) => (
        <select
          id={id}
          name={name}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${inputClass} ${error ? errorInputClass : ""} ${disabled ? "cursor-not-allowed bg-zinc-50 text-zinc-500" : ""}`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}
