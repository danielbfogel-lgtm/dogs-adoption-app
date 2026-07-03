import { useCallback, useEffect, useRef, useState } from "react";

export type ToastVariant = "success" | "error";
export type ToastMessage = { id: number; message: string; variant: ToastVariant };

// ui-ux-pro-max `toast-dismiss` guideline: auto-dismiss toasts in 3-5s.
const AUTO_DISMISS_MS = 4000;

/** Small in-memory toast queue — no toast library is installed in this project. */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextId = useRef(0);
  // Tracks in-flight auto-dismiss timers so they can be cleared on unmount —
  // otherwise a toast pushed just before the owning component unmounts fires
  // a `setState` nobody will ever see.
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = ++nextId.current;
      setToasts((prev) => [...prev, { id, message, variant }]);
      const timeout = setTimeout(() => {
        timeoutsRef.current.delete(timeout);
        dismiss(id);
      }, AUTO_DISMISS_MS);
      timeoutsRef.current.add(timeout);
    },
    [dismiss],
  );

  return { toasts, push, dismiss };
}
