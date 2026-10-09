import { Link, NavLink, Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { gb } from "../lib/business";
import { useEffect, useState } from "react";
import { ArrowRight, KeyRound, MessageSquareText, QrCode, Store, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "../components/AppHeader";
import { listBusinesses, type Business } from "../lib/business";
import { resolveIndustry } from "../lib/industries";
import { industryLabel } from "../lib/business";


const FEATURES = [
  { icon: KeyRound, title: "Local keywords", body: "Generated from your products, business type and area — ready to use on Google." },
  { icon: Store, title: "Profile kit", body: "Description, categories, product listings, posts and Q&A written for you." },
  { icon: QrCode, title: "Review link & QR", body: "One link for customers. They pick what they bought and post in their own words." },
  { icon: MessageSquareText, title: "Reply templates", body: "Polite replies for good, average and bad reviews, plus WhatsApp requests." },
];

export default function Home() {
  const [list, setList] = useState<Business[]>([]);
  useEffect(() => setList(listBusinesses()), []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        right={
          <Button asChild size="sm">
            <Link to={gb("/setup")}>
              <Plus className="mr-1 h-4 w-4" /> Add business
            </Link>
          </Button>
        }
      />

      <main className="mx-auto max-w-5xl px-4 pb-16">
        {list.length > 0 && (
          <section className="pt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Your businesses</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((b) => (
                <Link
                  key={b.id}
                  to={gb(`/b/${b.id}`)}
                  className="group flex items-center justify-between rounded-xl border bg-card p-4 transition hover:border-primary/50 hover:shadow-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{b.name}</div>
                    <div className="truncate text-sm text-muted-foreground">
                      {industryLabel(b, resolveIndustry(b).label)} · {Array.from(new Set(b.locations.map((l) => l.city).filter(Boolean))).join(", ") || "—"} · {b.locations.length} location{b.locations.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className={list.length ? "pt-14" : "pt-16"}>
          <p className="text-sm font-medium text-primary">For any shop, clinic, salon or service business</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Your Google Business Profile, set up in five minutes.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            No billing software or catalogue needed. Type your business and what you sell — get keywords, profile content and a
            review system built for you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={gb("/setup")}>
                Set up my business <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="mt-14 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-5">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-5 text-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            <span className="font-semibold">Reviews stay genuine.</span> Customers write and post their own reviews from their own
            Google account, at any star rating. That keeps your listing within Google's review policy, so reviews don't get removed.
          </p>
        </section>
      </main>
    </div>
  );
}
