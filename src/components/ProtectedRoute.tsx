import { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import SEOFooter from "@/components/SEOFooter";
import { Button } from "@/components/ui/button";
import { PageSeo } from "@/components/seo/PageSeo";
import { seoFor, sitePage, withCount } from "@/lib/seo/pages";
import { APP_COUNT_FALLBACK } from "@/lib/appCount";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // A page with search text (src/lib/seo/pages.ts) says what it does and offers sign-in, so visitors
    // and search engines see a real page instead of being bounced to /auth.
    const page = sitePage(location.pathname);
    if (page) return <SignedOutIntro path={page.path} />;
    return <Navigate to="/auth" replace state={{ from: location.pathname + location.search }} />;
  }

  return <>{children}</>;
};

function SignedOutIntro({ path }: { path: string }) {
  const page = sitePage(path)!;
  const t = (s: string) => withCount(s, APP_COUNT_FALLBACK);
  return (
    <div className="min-h-screen bg-background">
      <PageSeo {...seoFor(page.path, APP_COUNT_FALLBACK)} />
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <div className="rounded-3xl border-2 border-ink bg-card p-6 shadow-block-lg md:p-10">
          <h1 className="text-3xl font-extrabold md:text-5xl">{page.h1}</h1>
          {page.text.map((p) => (
            <p key={p} className="mt-4 text-lg text-ink/85">{t(p)}</p>
          ))}
          <p className="mt-4 text-[15px] font-semibold">New accounts start with 100 free credits.</p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Button asChild><Link to="/auth?mode=signup" state={{ from: path }}>Sign up free</Link></Button>
            <Button asChild variant="outline"><Link to="/auth" state={{ from: path }}>Sign in</Link></Button>
            <Button asChild variant="outline"><Link to="/ai-apps">See all apps</Link></Button>
          </div>
        </div>
      </main>
      <SEOFooter />
    </div>
  );
}
