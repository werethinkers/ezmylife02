// deno test --allow-env supabase/functions/_shared/billing_test.ts
Deno.env.set("SUPABASE_URL", "https://db.test");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-key");

const { billed } = await import("./billing.ts");

type Call = { url: string; body?: unknown };
let calls: Call[] = [];
let balance = 10;
const price = 3;

globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  const url = String(input instanceof Request ? input.url : input);
  const body = init?.body ? JSON.parse(String(init.body)) : undefined;
  calls.push({ url, body });
  if (url.endsWith("/auth/v1/user")) {
    const auth = (init?.headers as Record<string, string>)?.Authorization ?? "";
    return auth === "Bearer user-token"
      ? new Response(JSON.stringify({ id: "u1" }), { status: 200 })
      : new Response(JSON.stringify({ msg: "invalid claim" }), { status: 403 });
  }
  if (url.endsWith("/rpc/start_tool_run")) {
    return new Response(
      JSON.stringify(balance >= price ? { ok: true, run_id: "r1", credits_required: price } : { ok: false, reason: "insufficient", credits_required: price, balance }),
    );
  }
  if (url.endsWith("/rpc/complete_tool_run")) {
    const b = body as { _success: boolean };
    if (b._success) balance -= price;
    return new Response(JSON.stringify({ ok: true, charged: b._success ? price : 0 }));
  }
  return new Response("not found", { status: 404 });
}) as typeof fetch;

const req = (token?: string) =>
  new Request("https://fn.test", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" },
    body: JSON.stringify({ tool_id: "x" }),
  });

const ok = () => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
const fail = () => Promise.resolve(new Response(JSON.stringify({ error: "boom" }), { status: 500 }));
const assert = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(msg);
};

Deno.test("signed-in success is charged once", async () => {
  calls = [];
  balance = 10;
  const res = await billed({ tool: "x" }, ok)(req("user-token"));
  assert(res.status === 200, `status ${res.status}`);
  assert(res.headers.get("x-credits-charged") === "3", "charged header");
  assert(balance === 7, `balance ${balance}`);
  assert(calls.filter((c) => c.url.includes("complete_tool_run")).length === 1, "one completion");
});

Deno.test("failed work is not charged", async () => {
  balance = 10;
  const res = await billed({ tool: "x" }, fail)(req("user-token"));
  assert(res.status === 500, `status ${res.status}`);
  assert(balance === 10, `balance ${balance}`);
});

Deno.test("thrown errors are not charged", async () => {
  balance = 10;
  const res = await billed({ tool: "x" }, () => Promise.reject(new Error("crash")))(req("user-token"));
  assert(res.status === 500 && balance === 10, "no charge on throw");
});

Deno.test("insufficient balance returns 402 and skips the work", async () => {
  balance = 2;
  let ran = false;
  const res = await billed({ tool: "x" }, () => {
    ran = true;
    return ok();
  })(req("user-token"));
  assert(res.status === 402, `status ${res.status}`);
  assert(!ran, "work must not run");
});

Deno.test("public anon key and missing token are rejected", async () => {
  assert((await billed({ tool: "x" }, ok)(req("anon-key"))).status === 401, "anon rejected");
  assert((await billed({ tool: "x" }, ok)(req())).status === 401, "missing rejected");
});

Deno.test("internal service calls run without charging", async () => {
  calls = [];
  balance = 10;
  const res = await billed({ tool: "x" }, ok)(req("service-key"));
  assert(res.status === 200 && balance === 10, "no charge for internal");
  assert(!calls.some((c) => c.url.includes("start_tool_run")), "no start");
});

const sse = (chunks: string[], failAfter = -1) =>
  () => {
    let i = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(ctrl) {
        if (i === failAfter) {
          ctrl.error(new Error("provider dropped"));
          return;
        }
        if (i >= chunks.length) {
          ctrl.close();
          return;
        }
        ctrl.enqueue(new TextEncoder().encode(chunks[i++]));
      },
    });
    return Promise.resolve(new Response(body, { status: 200, headers: { "Content-Type": "text/event-stream" } }));
  };

Deno.test("streams are charged only after they finish", async () => {
  balance = 10;
  const res = await billed({ tool: "x" }, sse(["data: a\n\n", "data: [DONE]\n\n"]))(req("user-token"));
  assert(balance === 10, "not charged before reading");
  const text = await res.text();
  assert(text.includes("[DONE]"), "stream passes through");
  assert(balance === 7, `charged after end, balance ${balance}`);
});

Deno.test("a stream the provider breaks off is not charged", async () => {
  balance = 10;
  const res = await billed({ tool: "x" }, sse(["data: a\n\n", "data: b\n\n"], 1))(req("user-token"));
  await res.text().catch(() => "");
  assert(balance === 10, `balance ${balance}`);
});

Deno.test("free actions (tool null) are not charged", async () => {
  balance = 10;
  const res = await billed({ tool: () => null }, ok)(req("user-token"));
  assert(res.status === 200 && balance === 10, "free action");
});
