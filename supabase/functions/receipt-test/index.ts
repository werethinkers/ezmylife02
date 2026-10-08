import { sendSampleReceipt } from "../_shared/receipt.ts";
Deno.serve(async (req) => {
  const b = await req.json().catch(() => ({}));
  if (b.nonce !== "ezy-test-7f3k2q") return new Response("no", { status: 403 });
  const jobs = [
    { to: "abhijayjain3@gmail.com", amt: 10, desc: "15 EZYOURLIFE credits", no: "TEST/0001" },
    { to: "work.abhijayjain@gmail.com", amt: 5000, desc: "Credit pack · ₹5,000", no: "TEST/0002" },
  ];
  const out = [];
  for (const j of jobs) {
    try {
      await sendSampleReceipt(j.to, { kind: "credits", userId: "test", name: "Abhijay Jain", description: j.desc, amountInr: j.amt, paymentId: "pay_TEST" + j.amt, orderId: "order_TEST" + j.amt, link: "https://ezyourlife.com/ai-apps" }, j.no);
      out.push({ to: j.to, ok: true });
    } catch (e) { out.push({ to: j.to, ok: false, error: String(e) }); }
  }
  return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" } });
});
