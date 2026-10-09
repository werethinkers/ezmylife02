import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, MotionConfig } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import SEOFooter from "@/components/SEOFooter";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  Sparkles,
  Search,
  MousePointerClick,
  Wand2,
  Rocket,
  Target,
  Users,
  Mail,
  Clock,
  Send,
} from "lucide-react";
import { z } from "zod";
import founderAbhijay from "@/assets/founder-abhijay.jpg";
import founderArinjay from "@/assets/founder-arinjay.jpg";
import { useAppCountLabel } from "@/lib/appCount";

const SUPPORT_EMAIL = "support@ezyourlife.com";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(1000),
});

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
} as const;

const STATS = [
  { value: "LIVE_COUNT", label: "AI apps live today" },
  { value: "2,000+", label: "Launching within a year" },
  { value: "100%", label: "Browser-based, no installs" },
  { value: "24/7", label: "Available anytime, anywhere" },
];

const STEPS = [
  {
    icon: Search,
    title: "Discover",
    text: "Find the right AI app by task, industry or use case, all in one catalogue.",
  },
  {
    icon: MousePointerClick,
    title: "Use",
    text: "Open it in your browser and get the task done. Nothing to install.",
  },
  {
    icon: Wand2,
    title: "Request",
    text: "Can't find what you need? Ask for a custom AI app and we'll build it.",
  },
];

const FOUNDERS = [
  {
    name: "Abhijay Jain",
    role: "Founder & CEO",
    photo: founderAbhijay,
    alt: "Abhijay Jain, Founder and CEO of EZYOURLIFE",
    tags: ["Computer Science, VIT Vellore", "The Daly College, Indore", "SeaFund", "VP – Investments"],
    bio: "A Computer Science graduate from VIT Vellore and alumnus of The Daly College, Indore, Abhijay combines technology, startup exposure, and real-world business understanding. Before EZYOURLIFE, he worked with SeaFund, a deeptech venture capital firm, and later served as Vice President – Investments at a Delhi-based investment banking firm.",
  },
  {
    name: "Arinjay Jain",
    role: "Co-Founder, Marketing & Growth",
    photo: founderArinjay,
    alt: "Arinjay Jain, Co-Founder of EZYOURLIFE",
    tags: ["Founded ThingMonkey", "Tetr College of Business", "Marketing & Growth"],
    bio: "Abhijay's younger brother and co-founder, Arinjay brings a strong young-builder mindset to the company. He started his first venture, ThingMonkey, during his Class 11 summer break, gaining early hands-on experience in e-commerce, customer behaviour, and digital marketing. Recently completed his 12th and now enrolled at Tetr College of Business, he leads marketing and growth at EZYOURLIFE.",
  },
];

const Eyebrow = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <span
    className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary ${className}`}
  >
    <span className="h-px w-6 bg-current opacity-60" />
    {children}
  </span>
);

const About = () => {
  const countLabel = useAppCountLabel();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  useEffect(() => {
    if (window.location.hash === "#contact") {
      setTimeout(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, []);

  // No backend inbox exists for this form, so hand the message to the visitor's
  // email app instead of pretending it was sent.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(formData);
    if (!parsed.success) {
      toast({ title: "Please check the form", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    const { name, email, message } = parsed.data;
    const subject = `Website enquiry from ${name}`;
    const body = `${message}\n\n—\n${name}\n${email}`;
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast({ title: "Opening your email app", description: `Your message is ready to send to ${SUPPORT_EMAIL}.` });
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background">
        <SEOHead
          title="About EZYOURLIFE - The Future's First AI App Store | Our Mission"
          description={`What is EZYOURLIFE? Learn about the Future's First AI App Store — ${countLabel} live AI Apps today and 2,000+ launching within a year, for productivity, business, content creation and education. Meet the founders and discover the ezyourlife mission.`}
          path="/about"
          keywords="what is ezyourlife, about ezyourlife, ezyourlife ai platform, ai app store mission, ezyourlife story, ezyourlife founders"
          jsonLd={[
            {
              "@context": "https://schema.org",
              "@type": "AboutPage",
              name: "About EZYOURLIFE",
              description:
                `Learn about EZYOURLIFE, the Future's First AI App Store — ${countLabel} live AI Apps today and 2,000+ launching within a year.`,
              url: "https://ezyourlife.com/about",
              mainEntity: {
                "@type": "Organization",
                name: "EZYOURLIFE",
                url: "https://ezyourlife.com",
                logo: { "@type": "ImageObject", url: "https://ezyourlife.com/favicon.png" },
                founder: [
                  { "@type": "Person", name: "Abhijay Jain", jobTitle: "Founder & CEO" },
                  { "@type": "Person", name: "Arinjay Jain", jobTitle: "Co-Founder, Marketing & Growth" },
                ],
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://ezyourlife.com" },
                { "@type": "ListItem", position: 2, name: "About", item: "https://ezyourlife.com/about" },
              ],
            },
          ]}
        />
        <Navbar />

        {/* ───────── Hero ───────── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh" aria-hidden />
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.7)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.7)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
          />
          <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

          <div className="relative container mx-auto px-4 pt-16 pb-16 md:pt-28 md:pb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-4xl text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-sun px-3 py-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">About EZYOURLIFE</span>
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-7xl">
                AI shouldn't feel complicated.
                <br />
                <span className="text-gradient">It should feel useful.</span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                EZYOURLIFE is the Future's First AI App Store: practical, task-specific AI apps in one place,
                ready to use in your browser.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="group h-12 rounded-xl px-6 shadow-lg">
                  <Link to="/ai-apps">
                    Explore AI Apps
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-xl bg-background/60 px-6 backdrop-blur">
                  <a href="#contact">Talk to us</a>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-3xl border border-border/60 shadow-lg md:mt-20"
            >
              <dl className="grid grid-cols-2 gap-px bg-border/60 md:grid-cols-4">
                {STATS.map((s) => ({ ...s, value: s.value === "LIVE_COUNT" ? countLabel : s.value })).map((s) => (
                  <div key={s.label} className="flex flex-col-reverse justify-end gap-1 bg-background/85 p-5 text-center backdrop-blur md:p-7">
                    <dt className="text-xs leading-snug text-muted-foreground sm:text-sm">{s.label}</dt>
                    <dd className="font-display text-3xl font-bold tracking-tight md:text-5xl">
                      <span className="text-gradient">{s.value}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </div>
        </section>

        {/* ───────── Story ───────── */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-12 lg:gap-16">
              <motion.div {...fadeUp} className="self-start lg:sticky lg:top-28 lg:col-span-5">
                <Eyebrow>Our story</Eyebrow>
                <h2 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">
                  From scattered tools to <span className="text-gradient">one marketplace.</span>
                </h2>
              </motion.div>

              <div className="space-y-10 lg:col-span-7">
                <motion.div {...fadeUp} className="space-y-5 text-lg leading-relaxed text-muted-foreground">
                  <p>
                    At <span className="font-semibold text-foreground">EZYOURLIFE</span>, we are building an AI-powered
                    AI app marketplace designed to make digital work faster, simpler, and more accessible for everyone.
                  </p>
                  <p>
                    The idea comes from a simple belief: AI should not feel complicated. It should feel useful. Today,
                    people use multiple apps for writing, research, productivity, business tasks, automation, and
                    everyday workflows. But most of these apps are scattered, expensive, or difficult to discover.
                  </p>
                  <p>
                    EZYOURLIFE brings practical AI apps into one unified platform where you can discover, use, and even
                    request custom AI apps based on your needs.
                  </p>
                </motion.div>

                <ol className="grid gap-4 sm:grid-cols-3">
                  {STEPS.map((step, i) => (
                    <motion.li
                      key={step.title}
                      {...fadeUp}
                      transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                      className="relative rounded-2xl border-2 border-ink bg-card p-5 shadow-sm"
                    >
                      <span className="absolute right-4 top-4 font-display text-sm font-semibold text-muted-foreground/60">
                        0{i + 1}
                      </span>
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-sun">
                        <step.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                    </motion.li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── Founders ───────── */}
        <section className="border-y border-border/40 bg-muted/30 py-20 md:py-28">
          <div className="container mx-auto px-4">
            <motion.div {...fadeUp} className="mx-auto mb-14 max-w-2xl text-center">
              <Eyebrow>The team</Eyebrow>
              <h2 className="mt-4 text-3xl font-bold md:text-5xl">Meet the Founders</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Two brothers building the future of AI, one app at a time.
              </p>
            </motion.div>

            <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
              {FOUNDERS.map((f, i) => (
                <motion.article
                  key={f.name}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                  className="group overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-sm transition-shadow duration-300 hover:shadow-xl"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={f.photo}
                      alt={f.alt}
                      loading="lazy"
                      className="h-full w-full object-cover object-top transition-transform duration-700 motion-safe:group-hover:scale-[1.03]"
                    />
                    <div aria-hidden className="absolute inset-0 bg-sand/50 mix-blend-multiply" />
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <span className="inline-block rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                        {f.role}
                      </span>
                      <h3 className="mt-2 text-2xl font-bold text-white md:text-3xl">{f.name}</h3>
                    </div>
                  </div>

                  <div className="space-y-4 p-6">
                    <ul className="flex flex-wrap gap-2" aria-label={`${f.name} highlights`}>
                      {f.tags.map((t) => (
                        <li
                          key={t}
                          className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-foreground/80"
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                    <p className="leading-relaxed text-muted-foreground">{f.bio}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── What makes us different ───────── */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <motion.div {...fadeUp} className="mx-auto mb-14 max-w-2xl text-center">
              <Eyebrow>Why EZYOURLIFE</Eyebrow>
              <h2 className="mt-4 text-3xl font-bold md:text-5xl">Built different, on purpose.</h2>
            </motion.div>

            <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
              {/* Vision */}
              <motion.div
                {...fadeUp}
                className="relative overflow-hidden rounded-3xl bg-gradient-hero p-8 text-white shadow-xl md:col-span-2 md:p-10"
              >
                <div aria-hidden className="absolute inset-0 bg-black/10" />
                <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
                <div className="relative">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-white/15 backdrop-blur">
                    <Rocket className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/85">Our vision</p>
                  <p className="mt-3 font-display text-2xl font-semibold leading-snug md:text-3xl">
                    To democratize AI for students, professionals, businesses, creators, and anyone who wants to save
                    time and work smarter.
                  </p>
                  <p className="mt-5 max-w-2xl leading-relaxed text-white/90">
                    We believe the future of AI is not one super app doing everything. It's an ecosystem of focused,
                    task-specific AI apps that unlock productivity in everyday life.
                  </p>
                </div>
              </motion.div>

              {/* Speed */}
              <motion.div
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.08 }}
                className="flex flex-col rounded-2xl border-2 border-ink bg-card p-8 shadow-sm"
              >
                <Clock className="h-6 w-6 text-primary" />
                <p className="mt-6 font-display text-5xl font-bold tracking-tight md:mt-auto md:pt-6">
                  <span className="text-gradient">24–48</span>
                  <span className="ml-1 text-2xl text-muted-foreground">hrs</span>
                </p>
                <h3 className="mt-3 text-lg font-semibold">From request to live app</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  If an AI app isn't on the platform yet, our team can build and deploy it within 24 to 48 hours.
                </p>
              </motion.div>

              {/* Purpose-built */}
              <motion.div
                {...fadeUp}
                className="rounded-2xl border-2 border-ink bg-card p-8 shadow-sm"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-sun">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">One app, one job</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Each app is built to finish a specific task. No prompt-writing, just structured output you can use.
                </p>
              </motion.div>

              {/* Creators */}
              <motion.div
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.08 }}
                className="rounded-2xl border-2 border-ink bg-card p-8 shadow-sm"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-sun">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Open to creators</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  We're opening the ecosystem so developers and creators can launch their own AI apps on EZYOURLIFE
                  through a revenue-sharing model.
                </p>
              </motion.div>

              {/* CTA */}
              <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.16 }}>
                <Link
                  to="/ai-apps"
                  className="group flex h-full flex-col justify-between rounded-3xl border border-primary/25 bg-card p-8 shadow-sm transition-all hover:border-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Sparkles className="h-6 w-6 text-primary" />
                  <div className="mt-10">
                    <h3 className="text-2xl font-bold leading-tight">Explore {countLabel} live AI apps</h3>
                    <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">
                      Browse the store
                      <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ───────── Contact ───────── */}
        <section id="contact" className="scroll-mt-20 pb-20 md:pb-28">
          <div className="container mx-auto px-4">
            <motion.div
              {...fadeUp}
              className="mx-auto grid max-w-6xl overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-xl lg:grid-cols-5"
            >
              <div className="relative overflow-hidden bg-gradient-hero p-8 text-white md:p-10 lg:col-span-2">
                <div aria-hidden className="absolute inset-0 bg-black/15" />
                <div aria-hidden className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                <div className="relative flex h-full flex-col">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/85">Get in touch</p>
                  <h2 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">Let's build something useful.</h2>
                  <p className="mt-4 leading-relaxed text-white/90">
                    Questions, feedback, or an AI app you wish existed? Tell us.
                  </p>

                  <div className="mt-8 space-y-4 lg:mt-auto lg:pt-10">
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <Mail className="h-5 w-5 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-xs text-white/80">Email us</span>
                        <span className="block truncate font-medium">{SUPPORT_EMAIL}</span>
                      </span>
                    </a>
                    <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                      <Clock className="h-5 w-5 shrink-0" />
                      <span>
                        <span className="block text-xs text-white/80">Quick response</span>
                        <span className="block font-medium">We typically reply within 24 hours</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-10 lg:col-span-3">
                <h3 className="text-2xl font-bold">Send us a message</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  This opens your email app with your message ready to send.
                </p>
                <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        maxLength={100}
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        maxLength={255}
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us how we can help..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      className="min-h-[160px] rounded-xl"
                      maxLength={1000}
                    />
                    <p className="text-right text-xs text-muted-foreground">{formData.message.length}/1000</p>
                  </div>
                  <Button type="submit" size="lg" className="group h-12 w-full rounded-xl">
                    <Send className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    Send Message
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        </section>

        <SEOFooter />
      </div>
    </MotionConfig>
  );
};

export default About;
