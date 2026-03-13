import { API_URL } from "@/lib/config";
import { getAccessToken } from "@/lib/auth";

export type ApiErrorResponse = {
  statusCode?: number;
  code?: string;
  message?: string;
  details?: unknown;
};

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  raw?: unknown;

  constructor(args: {
    status: number;
    code: string;
    message?: string;
    details?: unknown;
    raw?: unknown;
  }) {
    super(args.message || args.code);
    this.name = "ApiError";
    this.status = args.status;
    this.code = args.code;
    this.details = args.details;
    this.raw = args.raw;
  }
}

function buildUrl(input: string) {
  if (/^https?:\/\//i.test(input)) return input;
  if (input.startsWith("/")) return `${API_URL}${input}`;
  return `${API_URL}/${input}`;
}

function extractCodeAndDetails(body: unknown, status: number) {
  const b =
    body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const msg = b?.message;
  const msgObj =
    msg && typeof msg === "object" ? (msg as Record<string, unknown>) : null;

  const code =
    (b?.code as unknown) ||
    (msgObj?.code as unknown) ||
    (b?.message as unknown) ||
    (b?.error as unknown) ||
    `HTTP_${status}`;

  const details = (b?.details as unknown) || (msgObj?.details as unknown);
  return { code: String(code), details };
}

export async function apiFetch<T>(
  input: string,
  init?: RequestInit & { auth?: boolean; token?: string | null },
) {
  const url = buildUrl(input);
  const headers = new Headers(init?.headers || {});

  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (init?.auth !== false) {
    const token = init?.token ?? getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...init,
    headers,
  });

  const contentType = res.headers.get("content-type") || "";
  let body: unknown = null;
  try {
    if (contentType.includes("application/json")) {
      body = (await res.json()) as unknown;
    } else {
      body = await res.text();
    }
  } catch {
    body = null;
  }

  if (!res.ok) {
    const { code, details } = extractCodeAndDetails(body, res.status);
    throw new ApiError({
      status: res.status,
      code,
      message: code,
      details,
      raw: body,
    });
  }

  return body as T;
}
