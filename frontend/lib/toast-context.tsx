"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  ReactNode,
} from "react";

export type ToastStatus = "loading" | "success" | "error";

export interface Toast {
  id: string;
  title: string;
  detail?: string;
  status: ToastStatus;
}

interface ToastContextValue {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => string;
  update: (id: string, patch: Partial<Omit<Toast, "id">>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${++counter.current}`;
    setToasts((t) => [...t, { ...toast, id }]);
    return id;
  }, []);

  const update = useCallback(
    (id: string, patch: Partial<Omit<Toast, "id">>) => {
      setToasts((t) => t.map((x) => (x.id === id ? { ...x, ...patch } : x)));
      if (patch.status && patch.status !== "loading") {
        setTimeout(() => dismiss(id), 5000);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toasts, push, update, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg border px-3 py-2 shadow-md ${
              t.status === "error"
                ? "border-red-200 bg-red-50"
                : t.status === "success"
                ? "border-green-200 bg-green-50"
                : "border-neutral-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-2">
              {t.status === "loading" && (
                <span className="h-3 w-3 flex-shrink-0 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" />
              )}
              {t.status === "success" && (
                <span className="flex-shrink-0 text-green-600">✓</span>
              )}
              {t.status === "error" && (
                <span className="flex-shrink-0 text-red-600">✕</span>
              )}
              <p
                className={`text-sm font-medium ${
                  t.status === "error"
                    ? "text-red-700"
                    : t.status === "success"
                    ? "text-green-700"
                    : "text-neutral-800"
                }`}
              >
                {t.title}
              </p>
              <button
                onClick={() => dismiss(t.id)}
                className="ml-auto text-xs text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>
            {t.detail && (
              <p className="mt-0.5 text-xs text-neutral-500">{t.detail}</p>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
