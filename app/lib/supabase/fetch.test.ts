import { afterEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import { fetchWithJwtRetry } from "./fetch";

const url = "https://example.supabase.co/rest/v1/services";
const skew = () => Response.json(
  { code: "PGRST303", message: "JWT issued at future" },
  { status: 401 },
);

afterEach(() => mock.restoreAll());

test("recovers from a transient JWT error and preserves request options", async () => {
  let calls = 0;
  const options = { headers: { apikey: "test-only" } };
  mock.method(globalThis, "fetch", async (input: unknown, init: unknown) => {
    assert.equal(input, url);
    assert.equal(init, options);
    return ++calls === 1 ? skew() : Response.json([{ id: "svc-1" }]);
  });
  const response = await fetchWithJwtRetry(url, options);
  assert.deepEqual(await response.json(), [{ id: "svc-1" }]);
  assert.equal(calls, 2);
});

test("returns the original error after two retries", async () => {
  const stub = mock.method(globalThis, "fetch", async () => skew());
  const response = await fetchWithJwtRetry(url);
  assert.equal(stub.mock.callCount(), 3);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).message, "JWT issued at future");
});

test("does not retry mutations, other auth errors, or non-REST requests", async () => {
  const stub = mock.method(globalThis, "fetch", async () => skew());
  for (const method of ["POST", "PATCH", "DELETE"]) {
    await fetchWithJwtRetry(url, { method, body: "{}" });
  }
  await fetchWithJwtRetry("https://example.supabase.co/auth/v1/user");
  stub.mock.mockImplementation(async () => Response.json(
    { code: "PGRST303", message: "JWT expired" }, { status: 401 },
  ));
  await fetchWithJwtRetry(url);
  assert.equal(stub.mock.callCount(), 5);
});

test("aborting during backoff prevents another request", async () => {
  const controller = new AbortController();
  const stub = mock.method(globalThis, "fetch", async () => {
    controller.abort();
    return skew();
  });
  await assert.rejects(fetchWithJwtRetry(url, { signal: controller.signal }));
  assert.equal(stub.mock.callCount(), 1);
});
