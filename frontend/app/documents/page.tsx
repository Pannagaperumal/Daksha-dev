"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Protected from "@/components/protected";
import { api, DocumentItem, Paginated } from "@/lib/api";

function DocumentsContent() {
  const [docs, setDocs] = useState<DocumentItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Paginated<DocumentItem> | DocumentItem[]>("/documents/documents/")
      .then((res) => setDocs(Array.isArray(res) ? res : res.results))
      .catch(() => setError("Could not load documents."));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-900">Documents</h1>
        <p className="text-sm text-neutral-500">
          All files uploaded across every case.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {docs === null ? (
        <div className="rounded-lg border border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-400">
          Loading…
        </div>
      ) : docs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-10 text-center text-sm text-neutral-400">
          No documents yet — upload one from a case&apos;s detail page.
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-blue-50 text-sm">
                  📄
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-neutral-900">{d.title}</div>
                  <div className="truncate text-xs text-neutral-500">
                    <Link href={`/cases/${d.case}`} className="text-indigo-600 hover:underline">
                      {d.case_number}
                    </Link>{" "}
                    · {d.document_type} · {(d.file_size / 1024).toFixed(0)} KB
                    {d.file_extension.toLowerCase() === ".pdf" && (
                      <>
                        {" · "}
                        {d.is_indexed ? (
                          <span className="text-green-600">Chat-ready</span>
                        ) : (
                          <span className="text-red-600">Not indexed</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <a
                href={d.file}
                target="_blank"
                rel="noreferrer"
                className="flex-shrink-0 text-sm text-neutral-500 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900"
              >
                View
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Protected>
      <DocumentsContent />
    </Protected>
  );
}
