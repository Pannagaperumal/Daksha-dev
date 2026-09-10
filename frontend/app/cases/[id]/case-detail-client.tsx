"use client";

import { useEffect, useState, useRef, FormEvent, MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import Protected from "@/components/protected";
import { api, ApiError, Case, CaseComment, DocumentItem } from "@/lib/api";
import { askCase, ChatSource } from "@/lib/rag";
import { useToast } from "@/lib/toast-context";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  pending: "bg-purple-50 text-purple-700",
  closed: "bg-neutral-100 text-neutral-600",
  archived: "bg-neutral-100 text-neutral-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-neutral-500",
  medium: "text-blue-600",
  high: "text-amber-600",
  urgent: "text-red-600",
};

function CommentsSection({ caseId }: { caseId: string }) {
  const [comments, setComments] = useState<CaseComment[] | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const data = await api.get<CaseComment[]>(`/cases/cases/${caseId}/comments/`);
    setComments(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/cases/cases/${caseId}/add_comment/`, { content });
      setContent("");
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="border-t-4 border-purple-400" />
      <h2 className="flex items-center gap-2 border-b border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700">
        <span aria-hidden>💬</span>
        Comments {comments && comments.length > 0 && `(${comments.length})`}
      </h2>

      {comments === null ? (
        <p className="px-4 py-4 text-sm text-neutral-500">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="px-4 py-4 text-sm text-neutral-400">
          No comments yet — start the discussion below.
        </p>
      ) : (
        <div className="max-h-80 divide-y divide-neutral-100 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="px-4 py-3">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-neutral-600">
                  {c.author_detail
                    ? `${c.author_detail.first_name} ${c.author_detail.last_name}`.trim() ||
                      c.author_detail.username
                    : "Unknown"}
                </span>
                <span className="flex-shrink-0 text-xs text-neutral-400">
                  {new Date(c.created_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-neutral-800">{c.content}</p>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="flex gap-2 border-t border-neutral-200 p-3"
      >
        <input
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          placeholder="Add a comment…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          Post
        </button>
      </form>
    </div>
  );
}

function DocumentsSection({ caseId }: { caseId: string }) {
  const [docs, setDocs] = useState<DocumentItem[] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reindexingId, setReindexingId] = useState<number | null>(null);
  const { push, update } = useToast();

  async function load() {
    const data = await api.get<{ results: DocumentItem[] } | DocumentItem[]>(
      `/documents/documents/?case=${caseId}`
    );
    setDocs(Array.isArray(data) ? data : data.results);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Choose a file first.");
      return;
    }
    const docTitle = title.trim() || file.name;
    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    setUploading(true);
    const toastId = isPdf
      ? push({
          title: `Indexing "${docTitle}"…`,
          detail: "Uploading and embedding into the vector store",
          status: "loading",
        })
      : null;
    try {
      const formData = new FormData();
      formData.append("case", caseId);
      formData.append("title", docTitle);
      formData.append("document_type", "other");
      formData.append("file", file);
      const created = await api.post<DocumentItem>(
        "/documents/documents/",
        formData
      );
      setFile(null);
      setTitle("");
      await load();
      if (toastId) {
        update(toastId, {
          status: created.is_indexed ? "success" : "error",
          title: created.is_indexed
            ? `"${docTitle}" is chat-ready`
            : `Failed to index "${docTitle}"`,
          detail: created.is_indexed
            ? undefined
            : "You can retry from the document list.",
        });
      }
    } catch (err) {
      const message =
        err instanceof ApiError && err.body && typeof err.body === "object"
          ? (() => {
              const firstError = Object.values(
                err.body as Record<string, unknown>
              )[0];
              return Array.isArray(firstError)
                ? String(firstError[0])
                : String(firstError);
            })()
          : "Upload failed";
      setError(message);
      if (toastId) {
        update(toastId, { status: "error", title: `Upload failed`, detail: message });
      }
    } finally {
      setUploading(false);
    }
  }

  async function onReindex(doc: DocumentItem) {
    setReindexingId(doc.id);
    const toastId = push({
      title: `Re-indexing "${doc.title}"…`,
      status: "loading",
    });
    try {
      const updated = await api.post<DocumentItem>(
        `/documents/documents/${doc.id}/reindex/`
      );
      await load();
      update(toastId, {
        status: updated.is_indexed ? "success" : "error",
        title: updated.is_indexed
          ? `"${doc.title}" is chat-ready`
          : `Still failed to index "${doc.title}"`,
      });
    } catch {
      update(toastId, { status: "error", title: "Re-index failed" });
    } finally {
      setReindexingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="border-t-4 border-blue-400" />
      <h2 className="flex items-center gap-2 border-b border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700">
        <span aria-hidden>📄</span>
        Documents {docs && docs.length > 0 && `(${docs.length})`}
      </h2>

      {docs === null ? (
        <p className="px-4 py-4 text-sm text-neutral-500">Loading…</p>
      ) : docs.length === 0 ? (
        <p className="px-4 py-4 text-sm text-neutral-400">
          No documents yet — upload one below.
        </p>
      ) : (
        <div className="max-h-80 divide-y divide-neutral-100 overflow-y-auto">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-neutral-900">
                  {d.title}
                </div>
                <div className="text-xs text-neutral-500">
                  {(d.file_size / 1024).toFixed(0)} KB
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
              <div className="flex flex-shrink-0 items-center gap-3">
                {d.file_extension.toLowerCase() === ".pdf" && !d.is_indexed && (
                  <button
                    onClick={() => onReindex(d)}
                    disabled={reindexingId === d.id}
                    className="text-sm text-neutral-500 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900 disabled:opacity-50"
                  >
                    {reindexingId === d.id ? "Retrying…" : "Retry"}
                  </button>
                )}
                <a
                  href={d.file}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-neutral-500 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900"
                >
                  View
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={onUpload}
        className="flex flex-col gap-2 border-t border-neutral-200 p-3 sm:flex-row sm:items-center"
      >
        <input
          className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          placeholder="Document title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <input
            type="file"
            className="min-w-0 flex-1 text-xs text-neutral-500 file:mr-2 file:rounded-md file:border-0 file:bg-neutral-100 file:px-2 file:py-1.5 file:text-xs file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="submit"
            disabled={uploading}
            className="flex-shrink-0 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </form>
      {error && <p className="border-t border-neutral-100 px-3 py-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  error?: boolean;
  mentionTitle?: string;
}

interface MentionDoc {
  id: number;
  title: string;
}

// Turns a title into a mention token with no spaces, e.g. "Rent Agreement" -> "Rent_Agreement".
function mentionToken(title: string): string {
  return title.trim().replace(/\s+/g, "_");
}

function ChatPanel({
  caseId,
  onCollapse,
  onToggleExpand,
  expanded,
}: {
  caseId: string;
  onCollapse?: () => void;
  onToggleExpand?: () => void;
  expanded?: boolean;
}) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [query, setQuery] = useState("");
  const [asking, setAsking] = useState(false);
  const [docs, setDocs] = useState<MentionDoc[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get<{ results: DocumentItem[] } | DocumentItem[]>(
        `/documents/documents/?case=${caseId}`
      )
      .then((res) => {
        const list = Array.isArray(res) ? res : res.results;
        setDocs(
          list
            .filter((d) => d.is_indexed)
            .map((d) => ({ id: d.id, title: d.title }))
        );
      })
      .catch(() => {});
  }, [caseId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, asking]);

  // Active "@partial" being typed at the end of the input, for the suggestion list.
  const mentionMatch = /(?:^|\s)@(\S*)$/.exec(query);
  const mentionPartial = mentionMatch?.[1] ?? null;
  const suggestions =
    mentionPartial !== null
      ? docs
          .filter((d) =>
            d.title.toLowerCase().includes(mentionPartial.toLowerCase())
          )
          .slice(0, 5)
      : [];

  function pickSuggestion(doc: MentionDoc) {
    const insertion = `@${mentionToken(doc.title)} `;
    setQuery((q) => q.slice(0, mentionMatch!.index) + (mentionMatch![0][0] === " " ? " " : "") + insertion);
  }

  // Resolve an "@Some_Title" mention in the query to a specific document id,
  // so retrieval is scoped to just that doc instead of the whole case —
  // faster and more precise than searching every uploaded document.
  function resolveMention(q: string): { text: string; documentId?: string; title?: string } {
    const match = /(?:^|\s)@(\S+)/.exec(q);
    if (!match) return { text: q };
    const token = match[1].replace(/_/g, " ").toLowerCase();
    const doc = docs.find((d) => d.title.toLowerCase() === token) ||
      docs.find((d) => d.title.toLowerCase().includes(token));
    if (!doc) return { text: q };
    return {
      text: (q.slice(0, match.index) + q.slice(match.index + match[0].length)).trim() || q,
      documentId: String(doc.id),
      title: doc.title,
    };
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const raw = query.trim();
    if (!raw || asking) return;
    setQuery("");
    const { text, documentId, title } = resolveMention(raw);
    setTurns((t) => [...t, { role: "user", content: raw, mentionTitle: title }]);
    setAsking(true);
    try {
      const res = await askCase(caseId, text, documentId);
      setTurns((t) => [
        ...t,
        { role: "assistant", content: res.answer, sources: res.sources },
      ]);
    } catch (err) {
      setTurns((t) => [
        ...t,
        {
          role: "assistant",
          content:
            err instanceof Error
              ? err.message
              : "Something went wrong answering that.",
          error: true,
        },
      ]);
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="border-t-4 border-indigo-400" />
      <div className="flex items-start justify-between border-b border-neutral-200 px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
            <span aria-hidden>✨</span>
            Chat with case documents
          </h2>
          <p className="text-xs text-neutral-500">
            Type <span className="font-mono">@filename</span> to ask about one
            specific document. Runs on a local model — replies can take a
            while.
          </p>
        </div>
        <div className="ml-2 flex flex-shrink-0 items-center gap-1">
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              title={expanded ? "Shrink" : "Expand"}
              className="rounded-md px-1.5 py-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            >
              {expanded ? "⤡" : "⤢"}
            </button>
          )}
          {onCollapse && (
            <button
              onClick={onCollapse}
              title="Collapse"
              className="rounded-md px-1.5 py-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            >
              »
            </button>
          )}
        </div>
      </div>

      <div className="flex max-h-[60vh] min-h-48 flex-col gap-3 overflow-y-auto px-4 py-3">
        {turns.length === 0 && (
          <p className="text-sm text-neutral-400">
            Ask something like &quot;What&apos;s the deadline mentioned in the
            contract?&quot; or &quot;@{docs[0] ? mentionToken(docs[0].title) : "filename"}{" "}
            what&apos;s this about?&quot;
          </p>
        )}
        {turns.map((t, i) => (
          <div
            key={i}
            className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
              t.role === "user"
                ? "self-end bg-indigo-600 text-white"
                : t.error
                ? "self-start bg-red-50 text-red-700"
                : "self-start bg-neutral-100 text-neutral-800"
            }`}
          >
            {t.mentionTitle && (
              <p className="mb-1 text-xs opacity-70">
                Scoped to: {t.mentionTitle}
              </p>
            )}
            <p className="whitespace-pre-wrap">{t.content}</p>
            {t.sources && t.sources.length > 0 && (
              <details className="mt-2 text-xs opacity-80">
                <summary className="cursor-pointer">
                  {t.sources.length} source
                  {t.sources.length > 1 ? "s" : ""}
                </summary>
                <div className="mt-1 flex flex-col gap-1">
                  {t.sources.map((s, si) => (
                    <p key={si} className="rounded bg-white/60 p-1.5">
                      {s.metadata.title && (
                        <span className="font-medium">
                          {s.metadata.title}:{" "}
                        </span>
                      )}
                      {s.content}…
                    </p>
                  ))}
                </div>
              </details>
            )}
          </div>
        ))}
        {asking && (
          <div className="self-start rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-500">
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={onSubmit}
        className="relative flex gap-2 border-t border-neutral-200 p-3"
      >
        {suggestions.length > 0 && (
          <div className="absolute bottom-full left-3 right-3 mb-1 rounded-md border border-neutral-200 bg-white shadow-md">
            {suggestions.map((d) => (
              <button
                type="button"
                key={d.id}
                onClick={() => pickSuggestion(d)}
                className="block w-full truncate px-3 py-1.5 text-left text-sm hover:bg-neutral-100"
              >
                @{d.title}
              </button>
            ))}
          </div>
        )}
        <input
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          placeholder="Ask about this case's documents… (@ to mention one)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={asking}
        />
        <button
          type="submit"
          disabled={asking || !query.trim()}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {asking ? "Asking…" : "Ask"}
        </button>
      </form>
    </div>
  );
}

const CHAT_MIN_WIDTH = 340;
const CHAT_MAX_WIDTH = 900;
const CHAT_DEFAULT_WIDTH = 400;
const CHAT_EXPANDED_WIDTH = 640;

function CaseDetailContent({ caseId }: { caseId: string }) {
  const [c, setCase] = useState<Case | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatWidth, setChatWidth] = useState(CHAT_DEFAULT_WIDTH);
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null);

  function onDragStart(e: ReactMouseEvent) {
    e.preventDefault();
    dragState.current = { startX: e.clientX, startWidth: chatWidth };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
  }

  function onDragMove(e: MouseEvent) {
    if (!dragState.current) return;
    // Panel is on the right, so dragging left (negative dx) grows it.
    const dx = dragState.current.startX - e.clientX;
    const next = Math.min(
      CHAT_MAX_WIDTH,
      Math.max(CHAT_MIN_WIDTH, dragState.current.startWidth + dx)
    );
    setChatWidth(next);
  }

  function onDragEnd() {
    dragState.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", onDragEnd);
  }

  function toggleExpand() {
    setChatWidth((w) =>
      w >= CHAT_EXPANDED_WIDTH ? CHAT_DEFAULT_WIDTH : CHAT_EXPANDED_WIDTH
    );
  }

  useEffect(() => {
    api
      .get<Case>(`/cases/cases/${caseId}/`)
      .then(setCase)
      .catch(() => setError("Could not load this case."));
  }, [caseId]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!c) return <p className="text-sm text-neutral-500">Loading…</p>;

  return (
    <div className="flex flex-col items-start gap-6 lg:flex-row">
      <div className="min-w-0 w-full flex-1">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/cases" className="text-sm text-neutral-500 hover:text-neutral-900">
            ← Back to cases
          </Link>
          {!chatOpen && (
            <button
              onClick={() => setChatOpen(true)}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              💬 Open chat
            </button>
          )}
        </div>
        <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-neutral-900">{c.title}</h1>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_COLORS[c.status] ?? "bg-neutral-100 text-neutral-600"
              }`}
            >
              {c.status.replace("_", " ")}
            </span>
          </div>
          <p className="mb-3 text-sm text-neutral-500">
            {c.case_number} · {c.client_name}
          </p>
          <p className="text-sm leading-relaxed text-neutral-700">{c.description}</p>
          <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-neutral-500">Priority</dt>
              <dd className={`font-medium capitalize ${PRIORITY_COLORS[c.priority] ?? ""}`}>
                {c.priority}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Assigned to</dt>
              <dd>
                {c.assigned_to_detail
                  ? `${c.assigned_to_detail.first_name} ${c.assigned_to_detail.last_name}`.trim() ||
                    c.assigned_to_detail.username
                  : "Unassigned"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Hearing date</dt>
              <dd>{c.hearing_date ? new Date(c.hearing_date).toLocaleString() : "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <DocumentsSection caseId={caseId} />
          <CommentsSection caseId={caseId} />
        </div>
      </div>

      {chatOpen && (
        <div
          className="relative w-full flex-shrink-0 lg:sticky lg:top-6"
          style={{ width: chatWidth, maxWidth: "100%" }}
        >
          <div
            onMouseDown={onDragStart}
            title="Drag to resize"
            className="absolute -left-2 top-0 z-10 hidden h-full w-4 cursor-col-resize items-center justify-center lg:flex"
          >
            <div className="h-10 w-1 rounded-full bg-neutral-300" />
          </div>
          <ChatPanel
            caseId={caseId}
            onCollapse={() => setChatOpen(false)}
            onToggleExpand={toggleExpand}
            expanded={chatWidth >= CHAT_EXPANDED_WIDTH}
          />
        </div>
      )}
    </div>
  );
}

export default function CaseDetailClient({ caseId }: { caseId: string }) {
  return (
    <Protected>
      <CaseDetailContent caseId={caseId} />
    </Protected>
  );
}
