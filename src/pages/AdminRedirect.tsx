import { Navigate, useLocation } from "react-router-dom";

/** Every admin screen now lives inside /admin. Old links (emails, bookmarks) land on the right section. */
const TAB: Record<string, string> = {
  "/admin/influencers": "influencers",
  "/admin/developer-apps": "app-review",
  "/admin/refunds": "refunds",
  "/admin/bulk-qa": "bulk-qa",
  "/admin/instant": "instant",
};

export default function AdminRedirect() {
  const { pathname } = useLocation();
  return <Navigate to={`/admin?tab=${TAB[pathname.replace(/\/$/, "")] ?? "analytics"}`} replace />;
}
