// The only way client components talk to the API (docs/03 SECTION 5.1).
export class ApiError extends Error {
  status: number;
  code: string;
  details?: { path: string; issue: string }[];

  constructor(
    status: number,
    code: string,
    message: string,
    details?: { path: string; issue: string }[],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Calls /api/v1<path>, returns data, throws ApiError on failure.
export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const hasBody = init?.body !== undefined;
  const res = await fetch(`/api/v1${path}`, {
    method: init?.method ?? "GET",
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(init!.body) : undefined,
    credentials: "same-origin",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new ApiError(
      res.status,
      json?.error?.code ?? "UNKNOWN",
      json?.error?.message ?? "Something went wrong",
      json?.error?.details,
    );
  }
  return json.data as T;
}
