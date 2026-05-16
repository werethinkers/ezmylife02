import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import SEOFooter from "@/components/SEOFooter";
import { useToast } from "@/hooks/use-toast";
import { Target, Users, Sparkles, Heart, Mail, MessageSquare, Send, Loader2, Rocket, Zap } from "lucide-react";
import { z } from "zod";
import founderAbhijay from "@/assets/founder-abhijay.jpg";
import founderArinjay from "@/assets/founder-arinjay.jpg";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(1000),
});

const About = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  useEffect(() => {
    if (window.location.hash === "#contact") {
      setTimeout(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      contactSchema.parse(formData);
      await new Promise((r) => setTimeout(r, 800));
      toast({ title: "Message sent!", description: "We'll get back to you soon." });
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation error", description: error.errors[0].message, variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="About EZYOURLIFE - The World's First AI App Store | Our Mission"
        description="What is EZYOURLIFE? Learn about the world's first AI App Store — 200+ live AI Apps today and 2,000+ launching within a year, for productivity, business, content creation and education. Discover the ezyourlife mission and values."
        path="/about"
        keywords="what is ezyourlife, about ezyourlife, ezyourlife ai platform, ai app store mission, ezyourlife story"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: "About EZYOURLIFE",
            description: "Learn about EZYOURLIFE, the world's first AI App Store — 200+ live AI Apps today and 2,000+ launching within a year.",
            url: "https://ezyourlife.com/about",
            mainEntity: {
              "@type": "Organization",
              name: "EZYOURLIFE",
              url: "https://ezyourlife.com",
              logo: { "@type": "ImageObject", url: "https://ezyourlife.com/favicon.png" },
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

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />
        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              About{" "}
              <span className="bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                EZYOURLIFE
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We're on a mission to make digital tools accessible, simple, and powerful for everyone.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-6 text-lg text-muted-foreground leading-relaxed">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Our Story</h2>
            <p>
              At <span className="font-semibold text-foreground">EZYOURLIFE</span>, we are building an AI-powered AI app marketplace designed to make digital work faster, simpler, and more accessible for everyone.
            </p>
            <p>
              The idea behind EZYOURLIFE comes from a simple belief: AI should not feel complicated. It should feel useful. Today, people use multiple apps for writing, research, productivity, business tasks, automation, and everyday workflows. But most of these apps are scattered, expensive, or difficult to discover.
            </p>
            <p>
              EZYOURLIFE brings practical AI apps into one unified platform where users can discover, use, and even request custom AI apps based on their needs.
            </p>
          </div>
        </div>
      </section>

      {/* Founders Section */}
      <section className="py-20 bg-muted/30 border-y border-border/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Meet the Founders</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Two brothers building the future of AI, one app at a time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Abhijay */}
            <Card className="border-border/50 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-accent/10">
                <img
                  src={founderAbhijay}
                  alt="Abhijay Jain, Founder and CEO of EZYOURLIFE"
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Abhijay Jain</CardTitle>
                <CardDescription className="text-base font-medium text-primary">Founder &amp; CEO</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  A Computer Science graduate from VIT Vellore and alumnus of The Daly College, Indore, Abhijay combines technology, startup exposure, and real-world business understanding. Before EZYOURLIFE, he worked with SeaFund, a deeptech venture capital firm, and later served as Vice President – Investments at a Delhi-based investment banking firm.
                </p>
              </CardContent>
            </Card>

            {/* Arinjay */}
            <Card className="border-border/50 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-accent/10 to-primary/10">
                <img
                  src={founderArinjay}
                  alt="Arinjay Jain, Co-Founder of EZYOURLIFE"
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Arinjay Jain</CardTitle>
                <CardDescription className="text-base font-medium text-primary">Co-Founder, Marketing &amp; Growth</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Abhijay's younger brother and co-founder, Arinjay brings a strong young-builder mindset to the company. He started his first venture, ThingMonkey, during his Class 11 summer break, gaining early hands-on experience in e-commerce, customer behaviour, and digital marketing. Recently completed his 12th and now enrolled at Tetr College of Business, he leads marketing and growth at EZYOURLIFE.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What makes us different */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
            <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Speed &amp; Flexibility</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  If an AI app is not available on the platform, our team can build and deploy it within <span className="font-semibold text-foreground">24 to 48 hours</span>. We're also opening the ecosystem for developers and creators to launch their own AI apps on EZYOURLIFE through a revenue-sharing model.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 mb-4">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  To democratize AI for students, professionals, businesses, creators, and anyone who wants to save time and work smarter. We believe the future of AI is not one super app doing everything — it's an ecosystem of focused, task-specific AI apps that unlock productivity in everyday life.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
              <div className="space-y-2">
                <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                  200+
                </div>
                <p className="text-lg font-semibold">Live Now</p>
                <p className="text-sm text-muted-foreground">
                  AI Apps you can use today
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                  2,000+
                </div>
                <p className="text-lg font-semibold">Coming Year 1</p>
                <p className="text-sm text-muted-foreground">
                  Launching within a year
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                  100%
                </div>
                <p className="text-lg font-semibold">Browser-Based</p>
                <p className="text-sm text-muted-foreground">
                  No downloads or installations
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                  24/7
                </div>
                <p className="text-lg font-semibold">Always Available</p>
                <p className="text-sm text-muted-foreground">
                  Access anytime, anywhere
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section (merged from /contact) */}
      <section id="contact" className="py-20 bg-muted/30 border-t border-border/40 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Get in Touch</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Email Us</CardTitle>
                      <CardDescription>support@ezyourlife.com</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Quick Response</CardTitle>
                      <CardDescription>We typically reply within 24 hours</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Send us a message</CardTitle>
                <CardDescription>We'll get back to you as soon as possible.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" type="text" placeholder="Your name" value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required disabled={isSubmitting} maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required disabled={isSubmitting} maxLength={255} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" placeholder="Tell us how we can help..." value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required disabled={isSubmitting} className="min-h-[150px]" maxLength={1000} />
                    <p className="text-xs text-muted-foreground">{formData.message.length}/1000 characters</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                    ) : (
                      <><Send className="mr-2 h-4 w-4" /> Send Message</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <SEOFooter />
    </div>
  );
};

export default About;
