import { API_URL } from "@/lib/config";
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "@/lib/auth";
import { useApiLoading } from "@/store/api-loading-store";

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

let _refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
    };
    saveTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T>(
  input: string,
  init?: RequestInit & { auth?: boolean; token?: string | null; _retried?: boolean },
) {
  const url = buildUrl(input);
  const headers = new Headers(init?.headers || {});

  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;

  if (init?.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (init?.auth !== false) {
    const token = init?.token ?? getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const { inc, dec } = useApiLoading.getState();
  inc();

  try {
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
      // Silent refresh: if 401 and not already retried, try refreshing tokens
      if (res.status === 401 && init?.auth !== false && !init?._retried) {
        if (!_refreshPromise) {
          _refreshPromise = attemptTokenRefresh().finally(() => {
            _refreshPromise = null;
          });
        }
        const refreshed = await _refreshPromise;
        if (refreshed) {
          return apiFetch<T>(input, { ...init, _retried: true });
        }
        // Refresh failed — redirect to login
        clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }

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
  } finally {
    dec();
  }
}
