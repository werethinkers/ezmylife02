import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { ArrowRight, Sparkles, Zap, Shield, Globe, Users, TrendingUp, Check } from "lucide-react";
import logo from "@/assets/logo.png";

const Home = () => {
  const stats = [
    { value: "2000+", label: "AI Tools" },
    { value: "70M+", label: "MSMEs in India" },
    { value: "90%+", label: "Gross Margin" },
    { value: "$110B", label: "Market by 2030" },
  ];

  const features = [
    {
      icon: Zap,
      title: "Think it → Done",
      description: "Instant answers to any business or personal challenge with 2000+ specialized AI tools.",
    },
    {
      icon: Globe,
      title: "One Platform, Everything",
      description: "Replace 50+ expensive subscriptions with a single, unified AI ecosystem.",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Your data is protected with bank-grade encryption and privacy standards.",
    },
    {
      icon: TrendingUp,
      title: "BYO API Support",
      description: "Bring your own API keys for ultra-low costs and maximum flexibility.",
    },
  ];

  const categories = [
    "Business Automation",
    "Content Creation",
    "Finance & Accounting",
    "Marketing & Sales",
    "Education & Learning",
    "Personal Productivity",
    "Legal & Compliance",
    "Design & Creative",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/50 to-background" />
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        <div className="relative container mx-auto px-4 py-24 md:py-32 lg:py-40">
          <div className="mx-auto max-w-5xl text-center space-y-8 animate-fade-in">
            <div className="flex justify-center mb-8">
              <img src={logo} alt="ezmy.life" className="h-20 md:h-24 object-contain" />
            </div>
            
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-tight">
              The World's First{" "}
              <span className="text-gradient">AI App Store</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
              Access 2000+ AI-powered tools that simplify life and business. 
              One subscription replaces dozens of apps. Think it → Done.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button asChild size="lg" className="text-base px-8 h-14 shadow-lg hover:shadow-xl transition-all group">
                <Link to="/auth">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8 h-14">
                <Link to="/tools">Explore Tools</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/50 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center space-y-2">
                <div className="font-display text-3xl md:text-4xl font-semibold">{stat.value}</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Why Ezmylife</p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold">
              AI Flipkart + Zapier + Google AI Studio
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              For everyone. From students to enterprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-8 rounded-2xl border border-border/50 bg-card hover:border-border hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 border border-border group-hover:bg-primary/10 transition-colors">
                    <feature.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-accent/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Categories</p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold">
              Every Tool You Need
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {categories.map((category) => (
              <div
                key={category}
                className="px-5 py-3 rounded-full border border-border bg-background hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
              >
                <span className="text-sm font-medium">{category}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <p className="text-sm uppercase tracking-widest text-muted-foreground">Simple Pricing</p>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold">
                One Plan, Everything Included
              </h2>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent to-primary/5 rounded-3xl blur-3xl opacity-50" />
              <div className="relative p-8 md:p-12 rounded-3xl border border-border bg-card">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p className="text-sm uppercase tracking-widest text-muted-foreground">Premium Access</p>
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-5xl md:text-6xl font-semibold">₹2000</span>
                        <span className="text-muted-foreground">/year</span>
                      </div>
                      <p className="text-muted-foreground">or $19.99/month globally</p>
                    </div>
                    <Button asChild size="lg" className="w-full md:w-auto px-8 h-14">
                      <Link to="/subscription">
                        Subscribe Now
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {[
                      "Access to 2000+ AI tools",
                      "Unlimited usage",
                      "Priority support",
                      "New tools added weekly",
                      "BYO API support",
                      "Personal dashboard",
                    ].map((benefit) => (
                      <div key={benefit} className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                          <Check className="h-4 w-4 text-foreground" />
                        </div>
                        <span className="text-muted-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-lg opacity-80 max-w-2xl mx-auto">
              Join thousands of businesses and individuals who have simplified their digital life with Ezmylife.
            </p>
            <Button asChild size="lg" variant="secondary" className="text-base px-8 h-14 shadow-lg">
              <Link to="/auth">
                Get Started Free
                <Sparkles className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <img src={logo} alt="ezmy.life" className="h-10 object-contain" />
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link to="/tools" className="hover:text-foreground transition-colors">Tools</Link>
              <Link to="/subscription" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Ezmylife. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;