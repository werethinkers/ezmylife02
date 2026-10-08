// Shared Razorpay helpers for verify-razorpay-payment and razorpay-webhook.

const enc = new TextEncoder();

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Constant-time string comparison (length is not secret: HMAC hex is always 64 chars).
export function timingSafeEqual(a: string, b: string): boolean {
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

export async function verifyHmac(secret: string, message: string, signature: string): Promise<boolean> {
  if (typeof signature !== "string" || !signature) return false;
  return timingSafeEqual(await hmacSha256Hex(secret, message), signature.toLowerCase());
}

type Purchase = { razorpay_order_id: string | null; inr_amount: number };
type SettleResult = { ok: true; payment: any } | { ok: false; reason: string };

function authHeader(keyId: string, keySecret: string) {
  return "Basic " + btoa(`${keyId}:${keySecret}`);
}

// Confirms with Razorpay that `paymentId` is a captured INR payment for this
// purchase's order and amount. Captures it first if it is only authorized.
export async function settlePayment(
  paymentId: string,
  purchase: Purchase,
  keyId: string,
  keySecret: string,
): Promise<SettleResult> {
  const auth = authHeader(keyId, keySecret);
  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: auth },
  });
  if (!res.ok) throw new Error(`Razorpay payment lookup failed (${res.status})`);
  let payment = await res.json();

  const expectedAmount = purchase.inr_amount * 100;
  if (!purchase.razorpay_order_id || payment.order_id !== purchase.razorpay_order_id) {
    return { ok: false, reason: "order_mismatch" };
  }
  if (payment.amount !== expectedAmount || payment.currency !== "INR") {
    return { ok: false, reason: "amount_mismatch" };
  }

  if (payment.status === "authorized") {
    const cap = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/capture`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: expectedAmount, currency: "INR" }),
    });
    if (!cap.ok) {
      // A concurrent capture (webhook vs client verify) can race; re-read the payment.
      const again = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
        headers: { Authorization: auth },
      });
      if (!again.ok) throw new Error(`Razorpay capture failed (${cap.status})`);
      payment = await again.json();
    } else {
      payment = await cap.json();
    }
  }

  if (payment.status !== "captured") return { ok: false, reason: `payment_${payment.status}` };
  return { ok: true, payment };
}
