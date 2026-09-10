"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

const initial = {
  username: "",
  email: "",
  password: "",
  password2: "",
  first_name: "",
  last_name: "",
  firm_name: "",
};

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof typeof initial) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(form);
      router.push("/cases");
    } catch (err) {
      if (err instanceof ApiError && err.body && typeof err.body === "object") {
        const firstError = Object.values(err.body as Record<string, unknown>)[0];
        setError(
          Array.isArray(firstError) ? String(firstError[0]) : String(firstError)
        );
      } else {
        setError("Registration failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            D
          </div>
          <h1 className="text-xl font-semibold text-neutral-900">Create an account</h1>
          <p className="mt-1 text-sm text-neutral-500">Join Daksha to manage your cases</p>
        </div>
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="First name"
              className={inputClass}
              value={form.first_name}
              onChange={update("first_name")}
            />
            <input
              placeholder="Last name"
              className={inputClass}
              value={form.last_name}
              onChange={update("last_name")}
            />
          </div>
          <input
            placeholder="Username"
            className={inputClass}
            value={form.username}
            onChange={update("username")}
            required
          />
          <input
            placeholder="Email"
            type="email"
            className={inputClass}
            value={form.email}
            onChange={update("email")}
            required
          />
          <input
            placeholder="Firm name"
            className={inputClass}
            value={form.firm_name}
            onChange={update("firm_name")}
          />
          <input
            placeholder="Password"
            type="password"
            className={inputClass}
            value={form.password}
            onChange={update("password")}
            required
          />
          <input
            placeholder="Confirm password"
            type="password"
            className={inputClass}
            value={form.password2}
            onChange={update("password2")}
            required
          />
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="mt-1 rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
