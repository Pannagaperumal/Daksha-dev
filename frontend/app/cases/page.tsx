"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import Protected from "@/components/protected";
import { api, ApiError, Case, CaseStatistics, Paginated } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  pending: "bg-purple-50 text-purple-700",
  closed: "bg-neutral-100 text-neutral-600",
  archived: "bg-neutral-100 text-neutral-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-neutral-300",
  medium: "bg-blue-400",
  high: "bg-amber-400",
  urgent: "bg-red-500",
};

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3">
      <div
        className={`text-2xl font-semibold tabular-nums ${accent ?? "text-neutral-900"}`}
      >
        {value}
      </div>
      <div className="text-xs text-neutral-500">{label}</div>
    </div>
  );
}

function NewCaseForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    case_number: "",
    title: "",
    description: "",
    client_name: "",
    client_email: "",
    priority: "medium",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/cases/cases/", form);
      setForm({
        case_number: "",
        title: "",
        description: "",
        client_name: "",
        client_email: "",
        priority: "medium",
      });
      setOpen(false);
      onCreated();
    } catch (err) {
      if (err instanceof ApiError && err.body && typeof err.body === "object") {
        const firstError = Object.values(err.body as Record<string, unknown>)[0];
        setError(Array.isArray(firstError) ? String(firstError[0]) : String(firstError));
      } else {
        setError("Failed to create case");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
      >
        + New case
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/20 px-4 pt-20">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-lg rounded-lg border border-neutral-200 bg-white p-5 shadow-xl"
      >
        <h2 className="mb-4 text-base font-semibold text-neutral-900">
          New case
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Case number"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            value={form.case_number}
            onChange={(e) => setForm((f) => ({ ...f, case_number: e.target.value }))}
          />
          <input
            placeholder="Title"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <input
            placeholder="Client name"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            value={form.client_name}
            onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
          />
          <input
            placeholder="Client email"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            value={form.client_email}
            onChange={(e) => setForm((f) => ({ ...f, client_email: e.target.value }))}
          />
          <select
            className="col-span-2 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
          >
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
            <option value="urgent">Urgent priority</option>
          </select>
        </div>
        <textarea
          placeholder="Description"
          required
          className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md px-3.5 py-2 text-sm text-neutral-500 hover:text-neutral-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create case"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CasesContent() {
  const [cases, setCases] = useState<Case[] | null>(null);
  const [stats, setStats] = useState<CaseStatistics | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [casesRes, statsRes] = await Promise.all([
        api.get<Paginated<Case> | Case[]>("/cases/cases/"),
        api.get<CaseStatistics>("/cases/cases/statistics/"),
      ]);
      setCases(Array.isArray(casesRes) ? casesRes : casesRes.results);
      setStats(statsRes);
    } catch {
      setError("Could not load cases. Is the backend running on :8000?");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Cases</h1>
          <p className="text-sm text-neutral-500">
            Everything your firm is currently working on.
          </p>
        </div>
        <NewCaseForm onCreated={load} />
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard label="Total" value={stats.total_cases} />
          <StatCard label="Open" value={stats.open_cases} accent="text-blue-600" />
          <StatCard label="In progress" value={stats.in_progress_cases} accent="text-amber-600" />
          <StatCard label="Urgent" value={stats.urgent_cases} accent="text-red-600" />
          <StatCard label="Closed" value={stats.closed_cases} accent="text-neutral-500" />
        </div>
      )}

      {cases === null ? (
        <div className="rounded-lg border border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-400">
          Loading…
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-10 text-center text-sm text-neutral-400">
          No cases yet — create your first one to get started.
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
          {cases.map((c) => (
            <Link
              key={c.id}
              href={`/cases/${c.id}`}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50"
            >
              <span
                title={`${c.priority} priority`}
                className={`h-2 w-2 flex-shrink-0 rounded-full ${
                  PRIORITY_COLORS[c.priority] ?? "bg-neutral-300"
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-neutral-900">
                  {c.title}
                </div>
                <div className="truncate text-xs text-neutral-500">
                  {c.case_number} · {c.client_name}
                </div>
              </div>
              <span
                className={`flex-shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                  STATUS_COLORS[c.status] ?? "bg-neutral-100 text-neutral-600"
                }`}
              >
                {c.status.replace("_", " ")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CasesPage() {
  return (
    <Protected>
      <CasesContent />
    </Protected>
  );
}
