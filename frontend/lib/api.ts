const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(typeof body === "string" ? body : JSON.stringify(body));
    this.status = status;
    this.body = body;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("daksha_token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("daksha_token", token);
  else localStorage.removeItem("daksha_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (!(options.body instanceof FormData) && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Token ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// --- Types matching the Django serializers ---

export interface LawyerUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  bar_number: string | null;
  firm_name: string | null;
  phone_number: string | null;
  address: string | null;
  specializations: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: LawyerUser;
}

export interface CaseLabel {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

export interface Case {
  id: number;
  case_number: string;
  title: string;
  description: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  status: string;
  priority: string;
  labels: number[];
  labels_detail: CaseLabel[];
  assigned_to: number | null;
  assigned_to_detail: LawyerUser | null;
  created_by_detail: LawyerUser | null;
  court_name: string | null;
  judge_name: string | null;
  hearing_date: string | null;
  deadline: string | null;
  documents_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface CaseComment {
  id: number;
  case: number;
  author_detail: LawyerUser | null;
  content: string;
  created_at: string;
}

export interface CaseStatistics {
  total_cases: number;
  open_cases: number;
  closed_cases: number;
  urgent_cases: number;
  in_progress_cases: number;
}

export interface DocumentItem {
  id: number;
  case: number;
  case_number: string;
  case_title: string;
  title: string;
  description: string | null;
  document_type: string;
  file: string;
  file_size: number;
  file_extension: string;
  is_confidential: boolean;
  is_indexed: boolean;
  tags: string | null;
  uploaded_by_detail: LawyerUser | null;
  created_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
