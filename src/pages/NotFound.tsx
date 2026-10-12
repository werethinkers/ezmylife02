import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import SEOFooter from "@/components/SEOFooter";
import { Button } from "@/components/ui/button";
import { PageSeo } from "@/components/seo/PageSeo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <PageSeo title="Page not found | EZYOURLIFE" description="This page does not exist. Browse business apps, websites and cards on EZYOURLIFE." path={location.pathname} noindex />
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-3xl border-2 border-ink bg-sun p-8 text-center shadow-block-lg md:p-12">
          <p className="font-display text-6xl font-extrabold">404</p>
          <h1 className="mt-3 text-2xl font-extrabold md:text-3xl">This page doesn't exist</h1>
          <p className="mx-auto mt-2 max-w-md text-ink/85">The link may be old or mistyped. Here's where you can go instead.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <Button asChild><Link to="/">Go to home</Link></Button>
            <Button asChild variant="outline"><Link to="/ai-apps">Business apps</Link></Button>
            <Button asChild variant="outline"><Link to="/websites">Websites</Link></Button>
            <Button asChild variant="outline"><Link to="/cards">Cards</Link></Button>
          </div>
        </div>
      </main>
      <SEOFooter />
    </div>
  );
};

export default NotFound;
