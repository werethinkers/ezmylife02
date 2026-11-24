import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, KeyRound, MessageSquareText, Plus, QrCode, ShieldCheck, Store } from "lucide-react";
import { gb, industryLabel, listBusinesses, type Business } from "../lib/business";
import { resolveIndustry } from "../lib/industries";
import { ModernPage } from "@/components/modern/ModernPage";
import { SectionHead } from "@/components/modern/ui";
import { BTN_OUTLINE, BTN_PRIMARY, CARD, CONTAINER, EYEBROW, FOCUS_RING } from "@/components/modern/styles";
import { cn } from "@/lib/utils";

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
    <ModernPage section="apps">
      {/* ───────── Hero ───────── */}
      <section className={cn(CONTAINER, "pb-12 pt-8 md:pt-14")}>
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 lg:col-span-7">
            <span className={EYEBROW}>For any shop, clinic, salon or service business</span>
            <h1 className="mt-4 font-display text-[2.1rem] font-extrabold leading-[1.08] sm:text-5xl xl:text-[3.4rem]">
              Your Google Business Profile,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-rose-500">set up in five minutes.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              No billing software or catalogue needed. Type your business and what you sell — get keywords, profile content and a
              review system built for you.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to={gb("/setup")} className={cn(BTN_PRIMARY, "h-12 px-6 text-base")}>
                Set up my business <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="min-w-0 lg:col-span-5">
            <div className={cn("flex flex-col gap-4 p-5 shadow-soft md:p-6", CARD)}>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950">
                  <Store className="h-4 w-4 text-orange-600 dark:text-orange-400" aria-hidden />
                </span>
                <h2 className="text-lg font-bold">What's in the kit</h2>
              </div>
              <ul className="space-y-2.5">
                {FEATURES.map((f) => (
                  <li key={f.title} className="flex items-start gap-2.5">
                    <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden />
                    <span className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-200">{f.title}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[14px] text-zinc-600 dark:text-zinc-400">Everything above is ready the moment you finish setup.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Your businesses ───────── */}
      {list.length > 0 && (
        <section className={cn(CONTAINER, "pb-12 md:pb-16")}>
          <SectionHead
            eyebrow="Your workspace"
            title="Your businesses"
            action={
              <Link to={gb("/setup")} className={cn(BTN_OUTLINE, "h-10 px-4 text-sm")}>
                <Plus className="h-4 w-4" aria-hidden /> Add business
              </Link>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {list.map((b) => (
              <Link
                key={b.id}
                to={gb(`/b/${b.id}`)}
                className={cn("group flex items-center justify-between gap-3 p-5 shadow-soft-sm transition hover:-translate-y-0.5 hover:shadow-soft", CARD, FOCUS_RING)}
              >
                <div className="min-w-0">
                  <div className="truncate font-display text-lg font-bold">{b.name}</div>
                  <div className="mt-0.5 truncate text-sm text-zinc-600 dark:text-zinc-400">
                    {industryLabel(b, resolveIndustry(b).label)} · {Array.from(new Set(b.locations.map((l) => l.city).filter(Boolean))).join(", ") || "—"} ·{" "}
                    {b.locations.length} location{b.locations.length === 1 ? "" : "s"}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-orange-600" aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ───────── What you get ───────── */}
      <section className={cn(CONTAINER, "pb-12 md:pb-16")}>
        <SectionHead eyebrow="What you get" title="Everything you need on Google" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className={cn("flex flex-col gap-2 p-5 shadow-soft-sm", CARD)}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950">
                <f.icon className="h-5 w-5 text-orange-600 dark:text-orange-400" aria-hidden />
              </span>
              <h3 className="font-display text-lg font-bold">{f.title}</h3>
              <p className="text-[15px] text-zinc-600 dark:text-zinc-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── Review-policy notice ───────── */}
      <section className={cn(CONTAINER, "pb-16")}>
        <div className="flex gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-5 text-[15px] dark:border-orange-900 dark:bg-orange-950/40">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden />
          <p className="text-zinc-800 dark:text-zinc-200">
            <span className="font-bold">Reviews stay genuine.</span> Customers write and post their own reviews from their own Google
            account, at any star rating. That keeps your listing within Google's review policy, so reviews don't get removed.
          </p>
        </div>
      </section>
    </ModernPage>
  );
}
