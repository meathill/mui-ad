'use client';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function authHeaders(apiKey: string | null): Record<string, string> {
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
}

export type RequestFn = <T>(path: string, init?: RequestInit) => Promise<T>;

async function request<T>(workerUrl: string, apiKey: string | null, path: string, init: RequestInit = {}): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const res = await fetch(`${workerUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...authHeaders(apiKey),
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 204) return undefined as T;
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new ApiError(res.status, (body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return body;
}

/** 把 workerUrl + apiKey 绑成传给各资源模块的 scoped 请求函数。 */
export function createRequest(workerUrl: string, apiKey: string | null): RequestFn {
  return <T>(path: string, init?: RequestInit) => request<T>(workerUrl, apiKey, path, init);
}
