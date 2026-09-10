"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const links = [
  { href: "/cases", label: "Cases", icon: "📁" },
  { href: "/documents", label: "Documents", icon: "📄" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const displayName =
    `${user.first_name} ${user.last_name}`.trim() || user.username;

  return (
    <aside className="flex h-full w-56 flex-shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="px-5 py-5">
        <Link href="/cases" className="text-base font-semibold tracking-tight text-neutral-900">
          Daksha
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {links.map((l) => {
          const active = pathname?.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-indigo-50 font-medium text-indigo-700"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <span aria-hidden>{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200 px-3 py-3">
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-800">
              {displayName}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-sm text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
