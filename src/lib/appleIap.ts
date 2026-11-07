import { supabase } from "@/integrations/supabase/client";
import { isIosApp } from "./nativeApp";

/*
 * Buying credits with Apple in-app purchase, inside the iOS app only (docs/ios-app.md).
 * The website keeps Razorpay. Credits land in the same wallet.
 *
 * Flow: StoreKit shows Apple's payment sheet → we send the signed transaction to the apple-iap-verify
 * function → it adds the credits → only then do we tell StoreKit the purchase is finished. If anything fails
 * in between, the transaction stays unfinished and is retried the next time the app opens or the person signs in,
 * so nobody pays Apple without getting their credits.
 */

export const APPLE_BUNDLE_ID = "com.ezyourlife.app";

/** Same credits as the website packs of the same size. Prices come from Apple (set in App Store Connect). */
export const APPLE_PACKS: { id: string; credits: number; badge?: string }[] = [
  { id: "p100", credits: 180 },
  { id: "p250", credits: 500, badge: "Popular" },
  { id: "p500", credits: 1100, badge: "Better value" },
  { id: "p1000", credits: 2200, badge: "Best value" },
];

export const appleProductId = (packId: string) => `${APPLE_BUNDLE_ID}.credits.${packId}`;

export type ApplePack = { id: string; credits: number; badge?: string; priceString: string };

async function plugin() {
  const m = await import("@capgo/native-purchases");
  return m;
}

/** The packs Apple has set up, with the price in the person's own currency. Empty when the store can't be reached. */
export async function loadApplePacks(): Promise<ApplePack[]> {
  if (!isIosApp()) return [];
  const { NativePurchases, PURCHASE_TYPE } = await plugin();
  const { products } = await NativePurchases.getProducts({
    productIdentifiers: APPLE_PACKS.map((p) => appleProductId(p.id)),
    productType: PURCHASE_TYPE.INAPP,
  });
  const out: ApplePack[] = [];
  for (const p of APPLE_PACKS) {
    const prod = products.find((x) => x.identifier === appleProductId(p.id));
    if (prod) out.push({ ...p, priceString: prod.priceString });
  }
  return out;
}

async function creditOnServer(jws: string): Promise<{ credits: number }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Sign in first.");
  const { data, error } = await supabase.functions.invoke("apple-iap-verify", {
    body: { jws },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let msg = (error as any)?.message || "Could not add your credits.";
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = await (error as any).context?.json?.();
      if (body?.error) msg = body.error;
    } catch { /* keep the generic message */ }
    throw new Error(msg);
  }
  if (!data?.success) throw new Error(data?.error || "Could not add your credits.");
  return { credits: Number(data.credits) };
}

/** Opens Apple's payment sheet for a pack and adds the credits. Throws "cancelled" if the person closes the sheet. */
export async function buyApplePack(packId: string, userId: string): Promise<{ credits: number }> {
  const { NativePurchases, PURCHASE_TYPE } = await plugin();
  let tx;
  try {
    tx = await NativePurchases.purchaseProduct({
      productIdentifier: appleProductId(packId),
      productType: PURCHASE_TYPE.INAPP,
      quantity: 1,
      appAccountToken: userId, // our account ids are UUIDs, which is what Apple requires; the server checks it matches
      autoAcknowledgePurchases: false, // finish only after the credits are added
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/cancel/i.test(msg)) throw new Error("cancelled");
    throw e;
  }
  if (!tx.jwsRepresentation) throw new Error("Apple did not return the purchase. If you were charged, reopen the app and your credits will be added.");
  const res = await creditOnServer(tx.jwsRepresentation);
  await NativePurchases.finishTransaction({ transactionId: tx.transactionId }).catch(() => undefined);
  return res;
}

let recovering = false;
/** Adds credits for any purchase Apple has but we haven't finished (app closed mid-purchase, no signal, an ask-to-buy approval). */
export async function recoverApplePurchases(): Promise<number> {
  if (!isIosApp() || recovering) return 0;
  recovering = true;
  let added = 0;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return 0;
    const { NativePurchases } = await plugin();
    const { transactions } = await NativePurchases.getUnfinishedTransactions();
    for (const tx of transactions) {
      // Only this account's purchases: the server refuses the rest, and leaves them for their own account.
      if (!tx.jwsRepresentation || (tx.appAccountToken && tx.appAccountToken.toLowerCase() !== session.user.id.toLowerCase())) continue;
      try {
        const r = await creditOnServer(tx.jwsRepresentation);
        added += r.credits;
        await NativePurchases.finishTransaction({ transactionId: tx.transactionId }).catch(() => undefined);
      } catch (e) {
        console.warn("[app] could not add credits for a purchase yet", e);
      }
    }
  } catch (e) {
    console.warn("[app] purchase recovery failed", e);
  } finally {
    recovering = false;
  }
  return added;
}
