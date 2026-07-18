import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, PlayCircle, Star, Shield, Clock, CreditCard, XCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useToolPricing } from "@/hooks/useToolPricing";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";
import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";

interface GalleryImage { url: string; caption?: string; kind?: string }

interface PromoPage {
  id: string;
  tool_id: string;
  slug: string;
  is_published: boolean;
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_title_accent: string | null;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  hero_chips: Array<{ label: string; icon?: string }>;
  cta_label: string | null;
  cta_sublabel: string | null;
  rating: number | null;
  reviews_count: number | null;
  social_proof: string | null;
  trust_logos: Array<{ name: string; url?: string }>;
  features: Array<{ icon?: string; title: string; body: string }>;
  how_it_works: Array<{ step?: number; title: string; body: string; icon?: string }>;
  testimonials: Array<{ name: string; role?: string; quote: string; rating?: number; avatar?: string }>;
  stats: { value?: string; label?: string };
  final_cta_title: string | null;
  final_cta_subtitle: string | null;
  footer_badges: Array<{ icon?: string; title: string; body: string }>;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  gallery_images: GalleryImage[];
}


const defaultBadges = [
  { icon: "shield", title: "Secure & Private", body: "Your data is safe and encrypted" },
  { icon: "clock", title: "24/7 Support", body: "We're here to help you anytime" },
  { icon: "credit", title: "Credit System", body: "Pay only for what you use" },
  { icon: "x", title: "Cancel Anytime", body: "No subscriptions. No hidden fees." },
];

const BadgeIcon = ({ name }: { name?: string }) => {
  const cls = "h-5 w-5 text-primary";
  switch (name) {
    case "clock": return <Clock className={cls} />;
    case "credit": return <CreditCard className={cls} />;
    case "x": return <XCircle className={cls} />;
    default: return <Shield className={cls} />;
  }
};

export default function PromoPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState<PromoPage | null>(null);
  const [catalogPreview, setCatalogPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const { creditCost } = useToolPricing(page?.tool_id);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("tool_promo_pages")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      const p = (data as unknown) as PromoPage | null;
      setPage(p);
      if (p?.tool_id) {
        const { data: c } = await supabase
          .from("tools_catalog")
          .select("preview_image_url")
          .eq("id", p.tool_id)
          .maybeSingle();
        setCatalogPreview((c as any)?.preview_image_url ?? null);
      }
      setLoading(false);
    })();
  }, [slug]);


  // Auto-launch after login if ?launch=1 is present
  useEffect(() => {
    if (!authLoading && user && page && searchParams.get("launch") === "1") {
      navigate(`/tool/${page.tool_id}`, { replace: true });
    }
  }, [authLoading, user, page, searchParams, navigate]);

  const [entering, setEntering] = useState(false);
  const handleUseIt = async () => {
    if (!page) return;
    if (!user) {
      try {
        localStorage.setItem("auth_redirect_to", `/promo/${page.slug}?launch=1`);
      } catch { /* ignore */ }
      setLoginOpen(true);
      return;
    }
    if (entering) return;
    setEntering(true);
    try {
      // Immediately deduct credits from the user's wallet before entering the tool.
      const { data: startData, error: startErr } = await supabase.functions.invoke("tool-charge", {
        body: { action: "start", tool_id: page.tool_id },
      });
      if (startErr) throw startErr;
      if (!startData?.ok) {
        if (startData?.reason === "insufficient") {
          const need = startData?.credits_required ?? creditCost;
          const bal = startData?.balance ?? 0;
          const { toast } = await import("sonner");
          toast.error(`Not enough credits. Need ${need}, you have ${bal}.`);
          navigate("/pricing");
          return;
        }
        throw new Error(startData?.reason ?? "start_failed");
      }
      const runId = startData?.run_id;
      if (runId && !startData?.free_tool) {
        // Immediately complete → cuts credits from wallet now.
        await supabase.functions.invoke("tool-charge", {
          body: { action: "complete", run_id: runId, success: true },
        });
      }
      navigate(`/tool/${page.tool_id}`);
    } catch (e: any) {
      const { toast } = await import("sonner");
      toast.error(e?.message ?? "Could not enter tool");
    } finally {
      setEntering(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Page not found</h1>
          <Button onClick={() => navigate("/")}>Go home</Button>
        </div>
      </div>
    );
  }

  const ctaSublabel = page.cta_sublabel ?? `${creditCost} CREDIT${creditCost === 1 ? "" : "S"} to start`;
  const badges = page.footer_badges?.length ? page.footer_badges : defaultBadges;

  // Build the "See it in action" gallery: preview → gallery_images (screenshot, output, extra).
  const galleryFromDb = Array.isArray(page.gallery_images) ? page.gallery_images.filter(g => g?.url) : [];
  const galleryUrls = new Set(galleryFromDb.map(g => g.url));
  const gallery: GalleryImage[] = [
    ...(catalogPreview && !galleryUrls.has(catalogPreview)
      ? [{ url: catalogPreview, caption: "Preview", kind: "preview" }]
      : []),
    ...galleryFromDb,
  ].slice(0, 4);


  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={page.seo_title ?? `${page.hero_title ?? "AI App"} — EZYOURLIFE`}
        description={page.seo_description ?? page.hero_subtitle ?? ""}
        image={page.og_image_url ?? page.hero_image_url ?? undefined}
        path={`/promo/${page.slug}`}
        noindex
      />
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="container mx-auto px-4 py-12 lg:py-20 grid lg:grid-cols-2 gap-12 items-center relative">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {page.hero_eyebrow && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-5">
                {page.hero_eyebrow}
              </span>
            )}
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-4">
              {page.hero_title}{" "}
              {page.hero_title_accent && (
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {page.hero_title_accent}
                </span>
              )}
            </h1>
            {page.hero_subtitle && (
              <p className="text-lg text-muted-foreground mb-6 max-w-xl whitespace-pre-line">
                {page.hero_subtitle}
              </p>
            )}
            {page.hero_chips?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-7">
                {page.hero_chips.map((c, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full text-xs border border-border/60 bg-card/60 backdrop-blur">
                    {c.label}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={handleUseIt}
                className="h-14 px-7 text-base bg-gradient-to-r from-primary to-accent hover:opacity-95 shadow-lg shadow-primary/30"
              >
                <Zap className="h-5 w-5 mr-2" />
                <div className="text-left leading-tight">
                  <div className="font-semibold">{page.cta_label ?? "Try Now"}</div>
                  <div className="text-[11px] opacity-90">{ctaSublabel}</div>
                </div>
              </Button>
              <Button variant="outline" size="lg" className="h-14 px-5" onClick={() => navigate(`/tool/${page.tool_id}`)}>
                <PlayCircle className="h-5 w-5 mr-2" /> Watch Demo
              </Button>
            </div>
            {(page.rating || page.social_proof) && (
              <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
                {page.rating != null && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <strong className="text-foreground">{page.rating}</strong>
                    {page.reviews_count ? <span>({page.reviews_count.toLocaleString()}+ reviews)</span> : null}
                  </span>
                )}
                {page.social_proof && <span>· {page.social_proof}</span>}
              </div>
            )}
          </motion.div>

          {page.hero_image_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 shadow-2xl shadow-primary/10"
            >
              <img src={page.hero_image_url} alt={page.hero_title ?? ""} className="w-full h-auto rounded-xl" />
            </motion.div>
          )}
        </div>
      </section>

      {/* TRUST LOGOS */}
      {page.trust_logos?.length > 0 && (
        <section className="container mx-auto px-4 py-6">
          <div className="rounded-2xl border border-border/60 bg-card/40 p-6">
            <p className="text-center text-sm text-muted-foreground mb-4">Trusted by online sellers and brands worldwide</p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-80">
              {page.trust_logos.map((l, i) =>
                l.url ? (
                  <img key={i} src={l.url} alt={l.name} className="h-7 object-contain" />
                ) : (
                  <span key={i} className="font-semibold text-muted-foreground">{l.name}</span>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* GALLERY — See it in action */}
      {gallery.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold mb-2">See It in Action</h2>
            <p className="text-muted-foreground">Preview, in-app screenshots and real output — no surprises.</p>
          </div>
          <div className={`grid gap-4 ${gallery.length >= 3 ? "md:grid-cols-2 lg:grid-cols-4" : gallery.length === 2 ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
            {gallery.map((g, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden shadow-lg shadow-primary/5 hover:shadow-primary/15 transition"
              >
                <div className="aspect-video w-full bg-muted/30 overflow-hidden">
                  <img
                    src={g.url}
                    alt={g.caption ?? `${page.hero_title ?? "App"} — image ${i + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                {g.caption && (
                  <div className="px-4 py-3 text-xs text-muted-foreground border-t border-border/40">
                    {g.caption}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>
      )}


      {/* FEATURES */}
      {page.features?.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">Why You'll Love It</h2>
            <p className="text-muted-foreground">Save time, reduce costs, and unlock new capabilities effortlessly.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {page.features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-xl border border-border/60 bg-card/60 p-6 hover:shadow-lg hover:shadow-primary/10 transition"
              >
                <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* HOW IT WORKS + side CTA */}
      {page.how_it_works?.length > 0 && (
        <section className="container mx-auto px-4 py-10">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border/60 bg-card/60 p-8">
              <h2 className="text-2xl font-bold mb-6">
                How It <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Works</span>
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {page.how_it_works.slice(0, 3).map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="mx-auto h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-3">
                      {s.step ?? i + 1}
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{s.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/60 p-8">
              <h3 className="text-2xl font-bold mb-3">Start Creating Now</h3>
              <p className="text-sm text-muted-foreground mb-4">Minimum Credit to Start</p>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{creditCost} CREDIT{creditCost === 1 ? "" : "S"}</div>
                  <div className="text-sm text-muted-foreground">for 1 Generation</div>
                </div>
              </div>
              <Button
                size="lg"
                onClick={handleUseIt}
                className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-95"
              >
                START USING · {creditCost} CREDIT{creditCost === 1 ? "" : "S"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {page.testimonials?.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-10">Loved by Thousands of Users</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {page.testimonials.map((t, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-card/60 p-5">
                <div className="flex items-center gap-1 mb-3 text-yellow-400">
                  {[...Array(t.rating ?? 5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-sm text-foreground/90 mb-4 leading-relaxed">"{t.quote}"</p>
                <div className="text-xs text-muted-foreground">
                  – {t.name}{t.role ? `, ${t.role}` : ""}
                </div>
              </div>
            ))}
            {page.stats?.value && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex flex-col items-center justify-center text-center">
                <div className="text-3xl font-bold text-primary">{page.stats.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{page.stats.label ?? "Happy Users"}</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="container mx-auto px-4 py-12">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/60 to-accent/10 p-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <div>
            <h3 className="text-2xl font-bold mb-1">{page.final_cta_title ?? "Ready to get started?"}</h3>
            <p className="text-sm text-muted-foreground">{page.final_cta_subtitle ?? "Join thousands using this AI app every day."}</p>
          </div>
          <Button
            size="lg"
            onClick={handleUseIt}
            className="h-14 px-7 bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/30"
          >
            <Zap className="h-5 w-5 mr-2" />
            <div className="text-left leading-tight">
              <div className="font-semibold">{page.cta_label ?? "Try Now"}</div>
              <div className="text-[11px] opacity-90">{ctaSublabel}</div>
            </div>
          </Button>
        </div>
      </section>

      {/* FOOTER BADGES */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((b, i) => (
            <div key={i} className="flex items-start gap-3 p-4">
              <BadgeIcon name={b.icon} />
              <div>
                <div className="font-semibold text-sm">{b.title}</div>
                <div className="text-xs text-muted-foreground">{b.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <LoginPromptDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        returnTo={`/promo/${page.slug}?launch=1`}
      />
    </div>
  );
}
