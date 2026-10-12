import { useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import SEOFooter from "@/components/SEOFooter";
import { Button } from "@/components/ui/button";

/*
 * Offer landing page at /kit. Influencer links point here (ezyourlife.com/kit?ref=CODE).
 * The ref is captured site-wide by useRefCapture, so this page needs no ref logic.
 * It has the normal navbar and footer so visitors can browse the rest of the site.
 */

type Trade = {
  key: string;
  label: string;
  kit: string;
  who: string;
  siteWord: string;
  color: string;
  deadline: string | null;
  items: { name: string; price: number }[];
  getList: string[];
};

const TRADES: Trade[] = [
  {
    key: "shop", label: "Shop", kit: "Dukaan Diwali Kit", who: "shop owner", siteWord: "shop website",
    color: "#FFC800", deadline: "Sun 8 Nov 2026",
    items: [
      { name: "Shop website (jewellery and retail design)", price: 299 },
      { name: "Product catalogue", price: 249 },
      { name: "Digital visiting card", price: 99 },
      { name: "Diwali greeting card for customers", price: 11 },
    ],
    getList: ["Shop website, ready to share on WhatsApp", "Product catalogue with your prices", "Digital visiting card", "Diwali greeting card for customers", "2,200 credits for bills, GST quotations and product photos"],
  },
  {
    key: "salon", label: "Salon or parlour", kit: "Dukaan Diwali Kit", who: "salon owner", siteWord: "salon website",
    color: "#FF8FE9", deadline: "Sun 8 Nov 2026",
    items: [
      { name: "Salon website", price: 249 },
      { name: "Salon rate card", price: 99 },
      { name: "Digital visiting card", price: 99 },
      { name: "Diwali greeting card for customers", price: 11 },
    ],
    getList: ["Salon website with WhatsApp booking", "Rate card", "Digital visiting card", "Diwali greeting card for customers", "2,200 credits for review replies, offers and salary slips"],
  },
  {
    key: "wedding", label: "Wedding service", kit: "Wedding Vendor Kit", who: "wedding vendor", siteWord: "studio website",
    color: "#22C3A6", deadline: null,
    items: [
      { name: "Studio website (photographer design)", price: 249 },
      { name: "Photographer portfolio", price: 149 },
      { name: "Service rate card", price: 99 },
      { name: "Digital visiting card", price: 99 },
    ],
    getList: ["Studio website with WhatsApp enquiry", "Portfolio of your work", "Service rate card", "Digital visiting card", "2,200 credits for client contracts, bills and photo edits"],
  },
  {
    key: "pro", label: "Professional practice", kit: "Professional Practice Kit", who: "professional", siteWord: "practice website",
    color: "#8FB4FF", deadline: null,
    items: [
      { name: "Practice website", price: 249 },
      { name: "Consultant profile", price: 149 },
      { name: "Digital visiting card", price: 99 },
    ],
    getList: ["Practice website", "Consultant profile", "Digital visiting card", "2,200 credits for rent agreements, NDAs and notice replies"],
  },
];

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export default function Kit() {
  const [tradeKey, setTradeKey] = useState("shop");
  const t = TRADES.find((x) => x.key === tradeKey) ?? TRADES[0];
  const worth = t.items.reduce((sum, i) => sum + i.price, 0);

  return (
    <div className="min-h-screen bg-[#FFF8EB] text-[#121212]">
      <SEOHead
        title="Your business online for one payment | EZYOURLIFE"
        description="A website, a visiting card and 2,200 credits for business apps. Built for shop owners, salons, wedding vendors and professionals."
        path="/kit"
      />
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-10 space-y-12">
        <section className="space-y-5">
          {t.deadline && (
            <div className="inline-block border-2 border-[#121212] bg-[#FFC800] px-3 py-1 text-sm font-bold shadow-[3px_3px_0_#121212]">
              Offer ends {t.deadline}
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Your {t.siteWord} and business tools, ready in 24 hours.
          </h1>
          <p className="text-lg max-w-2xl">
            Made for {t.who}s. You get a live website, a digital visiting card and 2,200 credits for business apps,
            all in one purchase.
          </p>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Choose your business">
            {TRADES.map((x) => (
              <button
                key={x.key}
                role="tab"
                aria-selected={x.key === tradeKey}
                onClick={() => setTradeKey(x.key)}
                className={`border-2 border-[#121212] px-3 py-1.5 text-sm font-bold ${
                  x.key === tradeKey ? "shadow-[3px_3px_0_#121212]" : "bg-white"
                }`}
                style={x.key === tradeKey ? { background: x.color } : undefined}
              >
                {x.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild className="border-2 border-[#121212] shadow-[4px_4px_0_#121212] h-12 px-6">
              <Link to="/credits">Get 2,200 credits · ₹1,000</Link>
            </Button>
            <Button asChild variant="outline" className="border-2 border-[#121212] h-12 px-6">
              <Link to="/auth">Make my free preview first</Link>
            </Button>
          </div>
        </section>

        <section className="border-2 border-[#121212] bg-white p-6 shadow-[6px_6px_0_#121212] space-y-4">
          <h2 className="text-2xl font-bold">What you get</h2>
          <ul className="space-y-2">
            {t.getList.map((g) => (
              <li key={g} className="flex gap-2">
                <Check className="h-5 w-5 shrink-0 mt-0.5" /> <span>{g}</span>
              </li>
            ))}
          </ul>
          <div className="border-t-2 border-[#121212] pt-4 text-sm space-y-1">
            {t.items.map((i) => (
              <div key={i.name} className="flex justify-between gap-4">
                <span>{i.name}</span>
                <span className="font-mono">{inr(i.price)}</span>
              </div>
            ))}
            <div className="flex justify-between gap-4 font-bold pt-2">
              <span>Bought separately</span>
              <span className="font-mono">{inr(worth)}</span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">How it works</h2>
          <ol className="grid gap-3 md:grid-cols-4">
            {[
              ["Pick your business", `Choose the design made for ${t.who}s.`],
              ["Add your details", "Name, photos and prices. See it on your phone for free."],
              ["Pay once", "UPI or card. The credits land in your account."],
              ["We set it up", "On WhatsApp, within 24 hours. Share the link with your customers."],
            ].map(([title, body], idx) => (
              <li key={title} className="border-2 border-[#121212] bg-white p-4 shadow-[4px_4px_0_#121212]">
                <div className="text-sm font-bold">Step {idx + 1}</div>
                <div className="font-bold mt-1">{title}</div>
                <p className="text-sm mt-1">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Questions</h2>
          <div className="space-y-2">
            <details className="border-2 border-[#121212] bg-white p-4">
              <summary className="font-bold">What are credits?</summary>
              <p className="mt-2 text-sm">Credits pay for app results, like an invoice or a product photo. You are charged only when an app gives you a result. Most apps use 1 to 3 credits.</p>
            </details>
            <details className="border-2 border-[#121212] bg-white p-4">
              <summary className="font-bold">Do I need a laptop?</summary>
              <p className="mt-2 text-sm">No. Everything works on your phone, and your website opens on any phone your customers use.</p>
            </details>
          </div>
        </section>

        <section className="border-2 border-[#121212] bg-[#121212] text-white p-6 text-center space-y-3">
          <h2 className="text-2xl font-bold">Start with a free preview</h2>
          <p className="text-sm">See your {t.siteWord} with your own name before you pay anything.</p>
          <Button asChild className="border-2 border-white bg-[#FFC800] text-[#121212] hover:bg-[#FFC800]/90 h-12 px-6">
            <Link to="/auth">Make my free preview</Link>
          </Button>
        </section>
      </main>

      <SEOFooter />
    </div>
  );
}
