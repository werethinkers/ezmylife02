import { Link, NavLink, Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { gb } from "../lib/business";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { CopyButton } from "../components/CopyButton";
import { Panel, useBusinessData } from "../components/dash";
import { generateReply, type ReplyTone } from "../lib/generate";


const TONES: { id: ReplyTone; label: string; when: string }[] = [
  { id: "positive", label: "4–5 stars", when: "Thank them" },
  { id: "neutral", label: "3 stars", when: "Ask what to improve" },
  { id: "negative", label: "1–2 stars", when: "Apologise and take it offline" },
];

export default function Replies() {
  const { id } = useParams() as { id: string; sid: string };
  const { biz } = useBusinessData(id);
  const [name, setName] = useState("");
  if (!biz) return null;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Reply templates</h2>
        <p className="text-sm text-muted-foreground">Reply to every Google review — including the bad ones. People read the replies.</p>
      </div>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Reviewer's name (optional)" className="max-w-xs bg-card" />
      {TONES.map((t) => {
        const text = generateReply(biz, t.id, name);
        return (
          <Panel key={t.id} title={t.label} hint={t.when} action={<CopyButton text={text} />}>
            <p className="text-sm">{text}</p>
          </Panel>
        );
      })}
      <Panel title="Avoid" hint="These get reviews removed or listings penalised by Google">
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Offering discounts or gifts in exchange for reviews.</li>
          <li>Asking only happy customers, or writing reviews for customers.</li>
          <li>Reviews from staff, family or your own accounts.</li>
        </ul>
      </Panel>
    </div>
  );
}
