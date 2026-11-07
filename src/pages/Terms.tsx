import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import SEOFooter from "@/components/SEOFooter";
import { seoFor } from "@/lib/seo/pages";

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "Your account",
    body: "You need an account to use apps, buy credits or publish a website or card. Keep your sign-in details to yourself. You are responsible for what is done from your account.",
  },
  {
    title: "Credits",
    body: "Apps are paid in credits. Credits are used only when an app gives you a result; if it fails, nothing is used. Websites and cards are paid once, in credits. Sending a card or website to many people at once with Send all on WhatsApp also uses credits, shown before you confirm; automatic messages that fail are refunded. Bought credits do not expire. Free monthly credits reset on the 1st of each month.",
  },
  {
    title: "Promotional and gift credits",
    body: "Credits given free of charge (card gift credits, sign-up credits, free monthly credits, coupons) have no cash value and cannot be refunded, sold, transferred or exchanged for money. A gift card can be claimed once, on one account, and may have a claim-by date. Gift credits work on each AI app up to 3 times (in Bulk Mode each file is one use); after that the app uses your free or bought credits. Apps that run in your browser without AI are not limited this way. Gift credits are spent first, then free credits, then bought credits. We may stop or cancel gift credits if we find misuse, such as making many accounts to claim more than one card.",
  },
  {
    title: "Refunds",
    body: (
      <>
        Credit purchases have a 30-day money-back guarantee on a pro rata basis: we refund the unused part of what you bought, not the credits already used, and never promotional credits. Full details are in the{" "}
        <Link to="/refund-policy#money-back" className="underline">Cancellation and refund policy</Link>.
      </>
    ),
  },
  {
    title: "Payments",
    body: "Payments are handled by Razorpay. Prices are shown in rupees and include taxes where the law requires. A website or card goes live once payment is confirmed.",
  },
  {
    title: "What you make",
    body: "You own what you create. You must have the right to use any text, photos or logos you add, and you must not use the service for anything unlawful, misleading or harmful. AI results can contain mistakes; check them before you rely on them, especially for legal, tax or medical matters.",
  },
  {
    title: "Changes and contact",
    body: (
      <>
        We may update these terms and will change the date below when we do. Questions: support@ezyourlife.com or{" "}
        <Link to="/about#contact" className="underline">talk to us</Link>.
      </>
    ),
  },
];

const Terms = () => (
  <div className="min-h-screen bg-background">
    <SEOHead {...seoFor("/terms", "")} />
    <Navbar />
    <main className="container mx-auto px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 font-display text-3xl font-semibold md:text-4xl lg:text-5xl">Terms and conditions</h1>
          <p className="text-muted-foreground">Last updated on Oct 26, 2026</p>
        </div>
        <div className="space-y-6">
          {SECTIONS.map((s) => (
            <section key={s.title} className="space-y-3 rounded-2xl border-2 border-ink bg-card p-6">
              <h2 className="font-display text-xl font-semibold">{s.title}</h2>
              <p className="text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
    <SEOFooter />
  </div>
);

export default Terms;
