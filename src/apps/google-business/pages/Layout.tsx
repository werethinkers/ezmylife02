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
import { AppHeader } from "../components/AppHeader";
import { Button } from "@/components/ui/button";
import { useBusinessData } from "../components/dash";
import { deleteBusiness, industryLabel, isPending } from "../lib/business";
import { resolveIndustry } from "../lib/industries";


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
      <div className="min-h-screen">
        <AppHeader />
        <div className="mx-auto max-w-md p-10 text-center">
          <p className="font-medium">This business isn't saved in this browser.</p>
          <p className="mt-1 text-sm text-muted-foreground">Data is stored on the device where it was created.</p>
          <Button asChild className="mt-4">
            <Link to={gb("/setup")}>Set up a business</Link>
          </Button>
        </div>
      </div>
    );

  const pending = subs.filter(isPending).length;
  const ind = resolveIndustry(biz);

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader
        right={
          <>
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
          </>
        }
      />
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0">
          <div className="mb-4">
            <h1 className="truncate text-lg font-bold tracking-tight">{biz.name}</h1>
            <p className="truncate text-xs text-muted-foreground">
              {industryLabel(biz, ind.label)} · {biz.locations.length} location{biz.locations.length === 1 ? "" : "s"}
            </p>
          </div>
          <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={gb(n.to.replace("$id", id))}
                end={"exact" in n}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-background hover:text-foreground ${
                    isActive ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground"
                  }`
                }
              >
                <n.icon className="h-4 w-4" />
                {n.label}
                {n.label === "Submissions" && pending > 0 && (
                  <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">{pending}</span>
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
  );
}
