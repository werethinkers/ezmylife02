import { Link, NavLink, Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { gb } from "../lib/business";
import {
  BarChart3,
  Inbox,
  KeyRound,
  MapPinned,
  MessageCircle,
  MessageSquareReply,
  Pencil,
  QrCode,
  Store,
  Trash2,
} from "lucide-react";
import { ModernPage } from "@/components/modern/ModernPage";
import { CONTAINER } from "@/components/modern/styles";
import { Button } from "@/components/ui/button";
import { useBusinessData } from "../components/dash";
import { deleteBusiness, industryLabel, isPending } from "../lib/business";
import { resolveIndustry } from "../lib/industries";
import { cn } from "@/lib/utils";


const NAV = [
  { to: "/b/$id", label: "Overview", icon: BarChart3, exact: true },
  { to: "/b/$id/submissions", label: "Submissions", icon: Inbox },
  { to: "/b/$id/share", label: "Review links & QR", icon: QrCode },
  { to: "/b/$id/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { to: "/b/$id/locations", label: "Locations", icon: MapPinned },
  { to: "/b/$id/keywords", label: "Keywords", icon: KeyRound },
  { to: "/b/$id/profile", label: "Profile kit", icon: Store },
  { to: "/b/$id/replies", label: "Reply templates", icon: MessageSquareReply },
] as const;

export default function Layout() {
  const { id } = useParams() as { id: string; sid: string };
  const navigate = useNavigate();
  const { biz, subs } = useBusinessData(id);

  if (biz === undefined) return null;
  if (biz === null)
    return (
      <ModernPage section="apps">
        <div className={cn(CONTAINER, "flex flex-col items-center py-24 text-center")}>
          <p className="font-display font-bold">This business isn't saved in this browser.</p>
          <p className="mt-1 text-sm text-muted-foreground">Data is stored on the device where it was created.</p>
          <Button asChild className="mt-4">
            <Link to={gb("/setup")}>Set up a business</Link>
          </Button>
        </div>
      </ModernPage>
    );

  const pending = subs.filter(isPending).length;
  const ind = resolveIndustry(biz);

  return (
    <ModernPage section="apps">
      <div className={cn(CONTAINER, "pb-10 pt-6")}>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-foreground bg-card p-4 shadow-block-sm">
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold">{biz.name}</h1>
            <p className="truncate text-sm text-muted-foreground">
              {industryLabel(biz, ind.label)} · {biz.locations.length} location{biz.locations.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={gb(`/setup?id=${biz.id}`)}>
                <Pencil className="mr-1 h-4 w-4" /> Edit business
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete business"
              onClick={() => {
                if (!confirm(`Delete ${biz.name} and all its submissions from this browser?`)) return;
                deleteBusiness(biz.id);
                navigate(gb("/"));
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          <aside className="lg:w-56 lg:shrink-0">
            <nav className="-mx-1 flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={gb(n.to.replace("$id", id))}
                  end={"exact" in n}
                  className={({ isActive }) =>
                    cn(
                      "flex shrink-0 items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition",
                      isActive ? "border-foreground bg-foreground text-background" : "border-foreground bg-card text-foreground hover:bg-background",
                    )
                  }
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                  {n.label === "Submissions" && pending > 0 && (
                    <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{pending}</span>
                  )}
                </NavLink>
              ))}
            </nav>
          </aside>
          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </ModernPage>
  );
}
