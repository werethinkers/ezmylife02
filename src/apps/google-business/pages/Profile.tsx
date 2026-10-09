import { Link, NavLink, Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { gb } from "../lib/business";
import { useEffect, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "../components/CopyButton";
import { Panel, useBusinessData } from "../components/dash";
import { resolveIndustry } from "../lib/industries";
import { generateDescription, generatePosts, generateQA } from "../lib/generate";
import { cn } from "@/lib/utils";


export default function Profile() {
  const { id } = useParams() as { id: string; sid: string };
  const { biz } = useBusinessData(id);
  const [locId, setLocId] = useState("");
  const loc = biz?.locations.find((l) => l.id === locId) ?? biz?.locations[0];
  const [desc, setDesc] = useState("");
  useEffect(() => {
    if (biz && loc) setDesc(generateDescription(biz, loc));
  }, [biz, loc]);
  const posts = useMemo(() => (biz && loc ? generatePosts(biz, loc) : []), [biz, loc]);
  const qa = useMemo(() => (biz && loc ? generateQA(biz, loc) : []), [biz, loc]);
  if (!biz || !loc) return null;
  const ind = resolveIndustry(biz);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Profile kit</h2>
          <p className="text-sm text-muted-foreground">Copy each block into your Google Business Profile.</p>
        </div>
        {biz.locations.length > 1 && (
          <select className="h-9 rounded-md border bg-background px-2 text-sm" value={loc.id} onChange={(e) => setLocId(e.target.value)}>
            {biz.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        )}
      </div>
      <Panel title="Business description" hint="Edit profile → Description (max 750 characters)." action={<CopyButton text={desc} />}>
        <Textarea value={desc} onChange={(e) => setDesc(e.target.value.slice(0, 750))} rows={5} />
        <p className="mt-1 text-right text-xs text-muted-foreground">{desc.length}/750</p>
      </Panel>
      <Panel title="Category ideas" hint="Pick the closest match as Primary category; confirm each exists in Google's list.">
        <div className="flex flex-wrap gap-1.5">
          {ind.gbpCategories.map((c, i) => (
            <span key={c} className={cn("rounded-md px-2 py-1 text-sm", i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary")}>
              {c}{i === 0 && " · primary"}
            </span>
          ))}
        </div>
      </Panel>
      <Panel title={`Products & services · ${biz.products.length}`} hint="Add each under Products or Services in your profile.">
        <div className="divide-y">
          {biz.products.map((p, i) => {
            const text = `${p.name} — available at ${biz.name}${loc.area || loc.city ? `, ${loc.area || loc.city}` : ""}. Visit or call us to know more.`;
            return (
              <div key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="font-medium">{p.name}{p.type && p.type !== p.name && <span className="ml-2 text-xs font-normal text-muted-foreground">{p.type}</span>}</div>
                  <div className="truncate text-muted-foreground">{text}</div>
                </div>
                <CopyButton text={text} size="icon" variant="ghost" />
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel title="Weekly post ideas" hint="Post one a week with a real photo.">
        <div className="grid gap-3 sm:grid-cols-2">
          {posts.map((p) => (
            <div key={p.title} className="rounded-lg border p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium">{p.title}</div>
                <CopyButton text={p.body} size="icon" variant="ghost" />
              </div>
              <p className="mt-1 text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Questions & answers">
        <div className="space-y-3">
          {qa.map((x) => (
            <div key={x.q} className="flex items-start justify-between gap-3 text-sm">
              <div>
                <div className="font-medium">{x.q}</div>
                <div className="text-muted-foreground">{x.a}</div>
              </div>
              <CopyButton text={`${x.q}\n${x.a}`} size="icon" variant="ghost" />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
