import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Target, Users, Sparkles, Heart } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />
        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              About{" "}
              <span className="bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                ezmy.life
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
                    ezmy.life was born from a simple observation: powerful digital tools should be accessible to everyone, not just tech experts.
                  </p>
                  <p>
                    We noticed that people were spending hours searching for the right tools, dealing with complicated setups, and juggling multiple subscriptions. There had to be a better way.
                  </p>
                  <p>
                    That's why we created ezmy.life—a single platform where you can access premium digital tools instantly, with no installation, no complexity, just results.
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
                  Everyone deserves access to premium tools. We make sure they're available to all.
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div className="space-y-2">
                <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                  2000+
                </div>
                <p className="text-lg font-semibold">AI Tools</p>
                <p className="text-sm text-muted-foreground">
                  Carefully curated for maximum productivity
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                  100%
                </div>
                <p className="text-lg font-semibold">Browser-Based</p>
                <p className="text-sm text-muted-foreground">
                  No downloads or installations required
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                  24/7
                </div>
                <p className="text-lg font-semibold">Always Available</p>
                <p className="text-sm text-muted-foreground">
                  Access your tools anytime, anywhere
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 <span className="font-semibold text-foreground">ezmy.life</span> — Simplifying complexity
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
