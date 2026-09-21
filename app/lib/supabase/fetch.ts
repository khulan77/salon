import { setTimeout as delay } from "node:timers/promises";

/** Retry only reads rejected by PostgREST's transient JWT clock-skew error. */
async function retryFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const request = input instanceof Request ? input : undefined;
  const method = (init?.method ?? request?.method ?? "GET").toUpperCase();
  const url = new URL(request?.url ?? String(input));
  const canRetry =
    (method === "GET" || method === "HEAD") &&
    url.pathname.startsWith("/rest/v1/");
  const signal = init?.signal ?? request?.signal ?? undefined;

  for (let attempt = 0; ; attempt++) {
    const response = await fetch(input, init);
    if (!canRetry || response.status !== 401 || attempt >= 2) return response;

    const error = await response.clone().json().catch(() => null);
    if (error?.code !== "PGRST303" || error?.message !== "JWT issued at future") {
      return response;
    }

    await response.body?.cancel();
    await delay(1000 * (attempt + 1), undefined, { signal });
  }
}

// Preserve Bun’s optional fetch helper when running under Bun.
export const fetchWithJwtRetry = Object.assign(retryFetch, {
  preconnect: fetch.preconnect,
});
