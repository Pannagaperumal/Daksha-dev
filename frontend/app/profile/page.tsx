"use client";

import { useState, FormEvent } from "react";
import Protected from "@/components/protected";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

function ProfileContent() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    firm_name: user?.firm_name ?? "",
    phone_number: user?.phone_number ?? "",
    bar_number: user?.bar_number ?? "",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.patch<typeof user>("/accounts/users/update_profile/", form);
      if (updated) localStorage.setItem("daksha_user", JSON.stringify(updated));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  const inputClass =
    "rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
  const displayName = `${user.first_name} ${user.last_name}`.trim() || user.username;

  return (
    <div className="max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-semibold text-indigo-700">
          {displayName.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Profile</h1>
          <p className="text-sm text-neutral-500">Manage your account details</p>
        </div>
      </div>
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Username</label>
          <input
            disabled
            className="w-full rounded-md border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm text-neutral-500"
            value={user.username}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="First name"
            className={inputClass}
            value={form.first_name}
            onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
          />
          <input
            placeholder="Last name"
            className={inputClass}
            value={form.last_name}
            onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
          />
        </div>
        <input
          placeholder="Firm name"
          className={inputClass}
          value={form.firm_name ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, firm_name: e.target.value }))}
        />
        <input
          placeholder="Phone number"
          className={inputClass}
          value={form.phone_number ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
        />
        <input
          placeholder="Bar number"
          className={inputClass}
          value={form.bar_number ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, bar_number: e.target.value }))}
        />
        <div className="mt-1 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && <p className="text-sm font-medium text-green-600">✓ Saved</p>}
        </div>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Protected>
      <ProfileContent />
    </Protected>
  );
}
