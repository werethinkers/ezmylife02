// Checkout for Instant Digital Products pages.
//   action "create": prices the page from ip_products (never from the client), creates a Razorpay order.
//                    Free products, and admins testing with { free: true }, publish immediately.
//   action "verify": checks the Razorpay signature, confirms the captured amount with Razorpay,
//                    then publishes through ip_mark_order_paid. The webhook does the same if the tab dies.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { settlePayment, verifyHmac } from "../_shared/razorpay.ts";
import { receiptInBackground } from "../_shared/receipt.ts";
import { writeSharePage } from "../_shared/sharepage.ts";
import { inBackground } from "../_shared/whatsapp.ts";
import { notifyTaskDone } from "../_shared/notify.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!token) return json({ error: "Sign in to publish." }, 401);
    const { data: ud, error: ue } = await supabase.auth.getUser(token);
    if (ue || !ud.user) return json({ error: "Sign in to publish." }, 401);
    const user = ud.user;

    const body = await req.json();
    const action = String(body.action ?? "");

    if (action === "create") {
      const pageId = String(body.page_id ?? "");
      const { data: page } = await supabase.from("ip_pages").select("*").eq("id", pageId).maybeSingle();
      if (!page || page.owner_id !== user.id) return json({ error: "Page not found." }, 404);
      if (page.status === "published") return json({ published: true, slug: page.slug });

      const { data: product } = await supabase.from("ip_products").select("*").eq("id", page.product_id).maybeSingle();
      if (!product || !product.is_active) return json({ error: "This product isn't available right now." }, 400);

      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (product.price_inr === 0 || (body.free === true && isAdmin)) {
        await supabase.from("ip_orders").insert({ user_id: user.id, page_id: page.id, product_id: product.id, inr_amount: 0, status: "free", paid_at: new Date().toISOString() });
        const { data: pub, error: perr } = await supabase.rpc("ip_publish_page", { _page_id: page.id });
        if (perr || !pub?.ok) throw new Error(perr?.message ?? pub?.reason ?? "Publish failed");
        const link = `https://ezyourlife.com/p/${pub.slug}`;
        inBackground(notifyTaskDone({
          userId: user.id, toolId: `page-${product.id}`, runId: `page-${page.id}`, name: product.name, link, throttle: false,
          output: `🎉 Your ${product.name.toLowerCase()} is live. Share this link on WhatsApp:\n${link}`,
        }));
        return json({ published: true, slug: pub.slug });
      }

      const keyId = Deno.env.get("RAZORPAY_KEY_ID");
      const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
      if (!keyId || !keySecret) throw new Error("Payments are not configured.");

      const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Basic " + btoa(`${keyId}:${keySecret}`) },
        body: JSON.stringify({
          amount: product.price_inr * 100,
          currency: "INR",
          receipt: `pg_${page.id.slice(0, 8)}_${Date.now()}`,
          notes: { kind: "instant_page", page_id: page.id, product_id: product.id, user_id: user.id },
        }),
      });
      if (!orderRes.ok) throw new Error(`Razorpay error: ${await orderRes.text()}`);
      const order = await orderRes.json();

      const { error: oe } = await supabase.from("ip_orders").insert({
        user_id: user.id, page_id: page.id, product_id: product.id, inr_amount: product.price_inr, razorpay_order_id: order.id,
      });
      if (oe) throw new Error(oe.message);

      return json({
        order_id: order.id, amount: order.amount, currency: order.currency, key_id: keyId,
        description: `${product.name} · ₹${product.price_inr}`, user_email: user.email ?? "",
      });
    }

    if (action === "pay_credits") {
      // Pays for the page with credits (gift, then free, then bought): charge, order and publish happen together in
      // ip_pay_with_credits(), so a failed publish never keeps the credits. Price is read from ip_products there.
      const pageId = String(body.page_id ?? "");
      const { data: res, error: ce } = await supabase.rpc("ip_pay_with_credits", { _uid: user.id, _page_id: pageId });
      if (ce) throw new Error(ce.message);
      if (!res?.ok) {
        if (res?.reason === "insufficient") {
          return json({ error: `This needs ${res.credits_required} credits. You have ${res.balance}.`, insufficient: true, credits_required: res.credits_required, balance: res.balance }, 402);
        }
        return json({ error: `Could not pay with credits (${res?.reason}).` }, 400);
      }
      if (!res.noop) {
        const { data: page } = await supabase.from("ip_pages").select("product_id").eq("id", pageId).maybeSingle();
        const { data: prod } = await supabase.from("ip_products").select("name").eq("id", page?.product_id ?? "").maybeSingle();
        const link = `https://ezyourlife.com/p/${res.slug}`;
        await supabase.from("activity_logs").insert({
          user_id: user.id, action_type: "payment",
          action_details: { kind: "instant_page_credits", product_id: page?.product_id, credits: res.charged },
        });
        inBackground(notifyTaskDone({
          userId: user.id, toolId: `page-${page?.product_id}`, runId: `page-${pageId}`, name: prod?.name ?? "page", link, throttle: false,
          output: `🎉 Your ${(prod?.name ?? "page").toLowerCase()} is live. Share this link on WhatsApp:\n${link}`,
        }));
      }
      return json({ published: true, slug: res.slug, charged: res.charged ?? 0 });
    }

    if (action === "verify") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return json({ error: "Missing payment details." }, 400);
      const keyId = Deno.env.get("RAZORPAY_KEY_ID");
      const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
      if (!keyId || !keySecret) throw new Error("Payments are not configured.");

      if (!(await verifyHmac(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`, razorpay_signature))) {
        return json({ error: "Payment signature didn't match." }, 400);
      }
      const { data: order } = await supabase.from("ip_orders").select("*").eq("razorpay_order_id", razorpay_order_id).maybeSingle();
      if (!order || order.user_id !== user.id) return json({ error: "Order not found." }, 404);

      const settled = await settlePayment(razorpay_payment_id, { razorpay_order_id: order.razorpay_order_id, inr_amount: order.inr_amount }, keyId, keySecret);
      if (!settled.ok) return json({ error: `Payment not confirmed (${settled.reason}).` }, 400);

      const { data: res, error: re } = await supabase.rpc("ip_mark_order_paid", { _razorpay_order_id: razorpay_order_id, _payment_id: razorpay_payment_id });
      if (re) throw new Error(re.message);
      if (!res?.ok) return json({ error: `Could not publish (${res?.reason}).` }, 400);

      if (!res.noop) {
        await supabase.from("activity_logs").insert({
          user_id: user.id, action_type: "payment",
          action_details: { kind: "instant_page", product_id: order.product_id, inr: order.inr_amount, payment_id: razorpay_payment_id },
        });
      }
      const { data: prod } = await supabase.from("ip_products").select("name").eq("id", order.product_id).maybeSingle();
      receiptInBackground(supabase, {
        kind: "page", userId: user.id, email: user.email, name: user.user_metadata?.full_name ?? user.user_metadata?.name,
        description: `${prod?.name ?? "Digital page"} · ezyourlife.com/p/${res.slug}`, amountInr: order.inr_amount,
        paymentId: razorpay_payment_id, orderId: razorpay_order_id, link: `https://ezyourlife.com/p/${res.slug}`,
        phone: settled.payment?.contact,
      });
      return json({ published: true, slug: res.slug, page_id: order.page_id });
    }

    if (action === "updated") {
      // The owner republished an edit: confirm the live page on WhatsApp and email.
      const { data: page } = await supabase.from("ip_pages").select("id, owner_id, slug, status, product_id, updated_at").eq("id", String(body.page_id ?? "")).maybeSingle();
      if (!page || page.owner_id !== user.id || page.status !== "published" || !page.slug) return json({ error: "Page not found." }, 404);
      const { data: prod } = await supabase.from("ip_products").select("name").eq("id", page.product_id).maybeSingle();
      const name = prod?.name ?? "page";
      const link = `https://ezyourlife.com/p/${page.slug}`;
      inBackground(notifyTaskDone({
        userId: user.id, toolId: `page-${page.product_id}`, runId: `page-${page.id}-${new Date(page.updated_at).getTime()}`, name, link,
        output: `Your changes to your ${name.toLowerCase()} are live. The link stays the same:\n${link}`,
      }));
      return json({ ok: true });
    }

    if (action === "share_todo" || action === "share_admin") {
      // Admin backfill for cards and websites published before link previews existed. The admin's
      // browser draws each page's preview card (share_todo lists them), then share_admin writes it.
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return json({ error: "Admins only." }, 403);
      if (action === "share_todo") {
        const { data: pages, count } = await supabase.from("ip_pages")
          .select("id, slug, product_id, published_variant_id, published_content", { count: "exact" })
          .eq("status", "published").is("share_url", null).not("slug", "is", null).limit(50);
        return json({ pages: pages ?? [], remaining: count ?? 0 });
      }
      const { data: page } = await supabase.from("ip_pages").select("id, slug, status, product_id").eq("id", String(body.page_id ?? "")).maybeSingle();
      if (!page || page.status !== "published" || !page.slug) return json({ error: "Page not found." }, 404);
      const image = typeof body.image === "string" && /^https:\/\//.test(body.image) ? body.image : null;
      const { data: product } = await supabase.from("ip_products").select("family").eq("id", page.product_id).maybeSingle();
      if (image) await supabase.from("ip_pages").update({ og_image: image }).eq("id", page.id);
      const url = await writeSharePage({
        slug: page.slug, title: String(body.title ?? "").slice(0, 120) || "EZYOURLIFE",
        description: String(body.description ?? "").slice(0, 300), image,
        indexable: ["business", "menu", "profile"].includes(product?.family ?? ""),
      });
      if (!url) return json({ error: "Add the GITHUB_SHARE_TOKEN secret first." }, 400);
      await supabase.rpc("ip_set_share_url", { _page_id: page.id, _url: url });
      return json({ share_url: url });
    }

    if (action === "share") {
      // Writes the page's link-preview file (its own title, text and image) and stores its address.
      const { data: page } = await supabase.from("ip_pages").select("id, owner_id, slug, status, og_image").eq("id", String(body.page_id ?? "")).maybeSingle();
      // The owner, or an admin editing the link preview on the owner's behalf.
      const { data: isAdminShare } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!page || (page.owner_id !== user.id && !isAdminShare) || page.status !== "published" || !page.slug) return json({ error: "Page not found." }, 404);
      const { data: product } = await supabase.from("ip_products").select("family").eq("id", body.product_id ?? "").maybeSingle();
      const url = await writeSharePage({
        slug: page.slug, title: String(body.title ?? "").slice(0, 120) || "EZYOURLIFE",
        description: String(body.description ?? "").slice(0, 300), image: page.og_image,
        indexable: ["business", "menu", "profile"].includes(product?.family ?? ""),
      });
      if (url) await supabase.rpc("ip_set_share_url", { _page_id: page.id, _url: url });
      return json({ share_url: url });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("ip-checkout error", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

