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
import { Target, Users, Sparkles, Heart, Mail, MessageSquare, Send, Loader2 } from "lucide-react";
import { z } from "zod";

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

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">Our Story</h2>
                <div className="space-y-4 text-lg text-muted-foreground">
                  <p>
                    EZYOURLIFE was born from a simple observation: powerful digital tools should be accessible to everyone, not just tech experts.
                  </p>
                  <p>
                    We noticed that people were spending hours searching for the right tools, dealing with complicated setups, and juggling multiple subscriptions. There had to be a better way.
                  </p>
                  <p>
                    That's why we created EZYOURLIFE—a single platform where you can access professional digital tools instantly, with no installation, no complexity, just results.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-accent/20 to-background border border-border/50 flex items-center justify-center p-8">
                  <div className="text-center space-y-4">
                    <Sparkles className="h-16 w-16 text-primary mx-auto" />
                    <p className="text-2xl font-bold">Making Digital Simple</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Our Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Simplicity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We believe powerful tools should be simple to use. No steep learning curves, just intuitive design.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Accessibility</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Everyone deserves access to professional tools. We make sure they're available to all.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Innovation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We constantly evolve our platform with cutting-edge features and AI capabilities.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">User-First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Every decision we make is centered around making your experience better.
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
