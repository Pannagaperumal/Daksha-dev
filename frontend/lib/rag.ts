const RAG_URL = process.env.NEXT_PUBLIC_RAG_URL ?? "http://localhost:2100";

export interface ChatSource {
  content: string;
  metadata: {
    case?: string;
    document?: string;
    title?: string;
    uuid?: string;
  };
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

export async function askCase(
  caseId: string,
  query: string,
  documentId?: string
): Promise<ChatResponse> {
  const res = await fetch(`${RAG_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      case: caseId,
      ...(documentId ? { document: documentId } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Chat request failed (${res.status})`);
  }
  return res.json();
}
