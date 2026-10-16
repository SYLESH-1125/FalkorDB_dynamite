const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const SESSION_KEY = "bhumi.session";
const REQUEST_TIMEOUT_MS = 15_000;

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return {};
  try {
    const token = (JSON.parse(raw) as { token: string }).token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function withTimeout(init: RequestInit): RequestInit {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return { ...init, signal: controller.signal };
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, withTimeout(init));
    return await handle<T>(res);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out — the server is not responding.");
    }
    if (err instanceof TypeError) {
      throw new Error("Could not reach the server. Check your connection and try again.");
    }
    throw err;
  }
}

export const apiClient = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, { headers: { ...authHeader() } });
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  put<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(body),
    });
  },
  delete<T>(path: string): Promise<T> {
    return request<T>(path, {
      method: "DELETE",
      headers: { ...authHeader() },
    });
  },
  upload<T>(path: string, files: File[]): Promise<T> {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    return request<T>(path, {
      method: "POST",
      headers: { ...authHeader() },
      body: form,
    });
  },
};
