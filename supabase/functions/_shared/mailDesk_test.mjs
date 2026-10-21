// node --experimental-strip-types --test supabase/functions/_shared/mailDesk_test.mjs
import test from "node:test";
import assert from "node:assert/strict";
const m = await import("./mailDesk.ts");

test("runs add up to ceil(mails x 0.08) for every size up to 5000", () => {
  for (let n = 1; n <= 5000; n++) assert.equal(m.creditsForMails(n), Math.floor((2 * n + 24) / 25), `n=${n}`);
});
test("examples", () => {
  assert.equal(m.creditsForMails(0), 0);
  assert.equal(m.creditsForMails(1), 1);
  assert.equal(m.creditsForMails(12), 1);
  assert.equal(m.creditsForMails(13), 2);
  assert.equal(m.creditsForMails(30), 3);
  assert.equal(m.creditsForMails(100), 8);
  assert.equal(m.creditsForMails(1000), 80);
  assert.deepEqual(m.planChunks(30), [25, 5]);
});
test("chunk tool and price", () => {
  assert.deepEqual(m.chunkPrice(5), { toolId: "mail-desk-12", credits: 1 });
  assert.deepEqual(m.chunkPrice(25), { toolId: "mail-desk-25", credits: 2 });
  assert.equal(m.chunkPrice(0), null);
});
test("sorting", () => {
  const base = { labels: ["INBOX"], list_unsub: false, precedence: "", from_email: "rohan@example.com" };
  assert.deepEqual(m.sortMail(base), { kind: "person", useAI: true });
  assert.equal(m.sortMail({ ...base, labels: ["INBOX", "CATEGORY_PROMOTIONS"] }).useAI, false);
  assert.equal(m.sortMail({ ...base, list_unsub: true }).kind, "promo");
  assert.equal(m.sortMail({ ...base, from_email: "noreply@bank.com" }).kind, "notice");
  assert.equal(m.sortMail({ ...base, labels: ["CATEGORY_UPDATES"] }).useAI, false);
  assert.equal(m.sortMail({ ...base, labels: ["CATEGORY_UPDATES"] }, true).useAI, true);
  assert.equal(m.sortMail({ ...base, labels: ["SENT"] }).kind, "sent");
});
test("cleanBody cuts quotes, signatures and links", () => {
  const t = m.cleanBody("Hi,\nPlease send the quote https://x.com/y\n\nOn Mon, A wrote:\n> old\n");
  assert.equal(t, "Hi,\nPlease send the quote <link>");
  assert.ok(m.cleanBody("<p>Hello&nbsp;there</p><style>a{}</style>").includes("Hello there"));
  assert.ok(m.cleanBody("x".repeat(5000)).length <= 1502);
});
test("parseAi keeps good items, drops bad ones, ignores ids it did not ask for", () => {
  const got = m.parseAi({ mails: [
    { id: "1", summary: "s", label: "needs_reply", tasks: [{ title: "Send quote", kind: "ask", due: "2026-10-23" }, { title: "", kind: "x" }], reminder: { date: "2026-10-25", text: "call" }, reply: "Hi" },
    { id: "2", summary: "t", label: "weird", tasks: "no", reminder: { date: "tomorrow" }, reply: "should be dropped" },
    { id: "9", summary: "not asked" }, { id: "1", summary: "duplicate" },
  ] }, ["1", "2", "3"]);
  assert.equal(got.size, 2);
  assert.equal(got.get("1").tasks.length, 1);
  assert.equal(got.get("1").reply, "Hi");
  assert.equal(got.get("2").label, "fyi");
  assert.equal(got.get("2").reply, null);
  assert.equal(got.get("2").reminder, null);
  assert.equal(m.parseAi("junk", ["1"]).size, 0);
});
test("ai cost estimate is a few hundredths of a rupee for 25 mails", () => {
  const c = m.estimateCostInr(25 * 1800, 25 * 600);
  assert.ok(c > 0.02 && c < 0.3, String(c));
});
