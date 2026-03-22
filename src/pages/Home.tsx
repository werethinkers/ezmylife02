import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import LaunchOfferBanner from "@/components/LaunchOfferBanner";
import { ArrowRight, Sparkles, Zap, Shield, Globe, Check, FileText, Palette, FileSearch, Settings, GraduationCap } from "lucide-react";
import RequestToolSection from "@/components/RequestToolSection";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import logo from "@/assets/logo.png";
import { useRef } from "react";

const TOTAL_TOOLS_COUNT = 50000;

const problemCards = [
  {
    id: "gst-compliance",
    title: "I need help with GST & compliance",
    icon: FileText,
    toolKeywords: ["invoice", "tax", "gst", "compliance", "legal", "contract"],
  },
  {
    id: "content-creation",
    title: "I want to create better content",
    icon: Palette,
    toolKeywords: ["content", "image", "video", "storybook", "creative", "design"],
  },
  {
    id: "pdf-documents",
    title: "I need to analyze PDFs and documents",
    icon: FileSearch,
    toolKeywords: ["pdf", "document", "text", "extractor", "ocr", "reader"],
  },
  {
    id: "automation",
    title: "I want to automate business tasks",
    icon: Settings,
    toolKeywords: ["automation", "bot", "ai", "workflow", "expense", "tracker"],
  },
  {
    id: "studying",
    title: "I need help studying or learning",
    icon: GraduationCap,
    toolKeywords: ["quiz", "learning", "encyclopedia", "notebook", "mindmap"],
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Parallax Background Component
const ParallaxBackground = () => {
  const { scrollY } = useScroll();
  
  // Smooth spring physics for parallax
  const springConfig = { stiffness: 100, damping: 30, mass: 1 };
  
  // Different speeds for different layers (creates depth)
  const y1 = useSpring(useTransform(scrollY, [0, 1000], [0, -150]), springConfig);
  const y2 = useSpring(useTransform(scrollY, [0, 1000], [0, -250]), springConfig);
  const y3 = useSpring(useTransform(scrollY, [0, 1000], [0, -100]), springConfig);
  const y4 = useSpring(useTransform(scrollY, [0, 1000], [0, -200]), springConfig);
  
  // Opacity fade on scroll
  const opacity = useSpring(useTransform(scrollY, [0, 600], [1, 0]), springConfig);
  
  // Scale effect
  const scale = useSpring(useTransform(scrollY, [0, 800], [1, 1.1]), springConfig);
  
  // Rotation for floating elements
  const rotate1 = useSpring(useTransform(scrollY, [0, 1000], [0, 15]), { stiffness: 50, damping: 20 });
  const rotate2 = useSpring(useTransform(scrollY, [0, 1000], [0, -10]), { stiffness: 50, damping: 20 });

  return (
    <motion.div 
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ opacity }}
    >
      {/* Main gradient background with scale */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-b from-accent/50 to-background"
        style={{ scale }}
      />
      
      {/* Layer 1 - Slowest (furthest back) */}
      <motion.div
        className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full"
        style={{
          y: y1,
          rotate: rotate1,
          background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      
      {/* Layer 2 - Medium speed */}
      <motion.div
        className="absolute top-40 right-0 w-[600px] h-[600px] rounded-full"
        style={{
          y: y2,
          rotate: rotate2,
          background: "radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      
      {/* Layer 3 - Floating orb left */}
      <motion.div
        className="absolute top-60 left-[10%] w-72 h-72 rounded-full"
        style={{
          y: y3,
          background: "radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
        animate={{
          x: [0, 20, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Layer 4 - Floating orb right */}
      <motion.div
        className="absolute bottom-20 right-[15%] w-96 h-96 rounded-full"
        style={{
          y: y4,
          background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 60%)",
          filter: "blur(50px)",
        }}
        animate={{
          x: [0, -15, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} 
      />
    </motion.div>
  );
};

const Home = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  
  // Parallax for hero content
  const springConfig = { stiffness: 100, damping: 30, mass: 1 };
  const heroY = useSpring(useTransform(scrollY, [0, 500], [0, 50]), springConfig);
  const heroOpacity = useSpring(useTransform(scrollY, [0, 400], [1, 0]), springConfig);
  const heroScale = useSpring(useTransform(scrollY, [0, 500], [1, 0.98]), springConfig);

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
      title: "Secure & Private",
      description: "Your data is protected with bank-grade encryption and privacy standards.",
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
    <div className="min-h-screen bg-background overflow-hidden">
      <SEOHead
        title="EZYOURLIFE - 50,000+ Premium AI Tools for Productivity & Business"
        description="Discover 50,000+ AI-powered digital tools for productivity, content creation, business automation, education and more. Start free today."
        path="/"
      />
      <Navbar />
      <LaunchOfferBanner />

      {/* Hero Section with Parallax */}
      <section ref={heroRef} className="relative overflow-hidden min-h-[90vh] flex items-center">
        <ParallaxBackground />
        
        <div className="relative container mx-auto px-4 py-24 md:py-32 lg:py-40">
          <motion.div
            className="mx-auto max-w-5xl text-center space-y-8"
            style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex justify-center mb-2"
            >
              <motion.img
                src={logo}
                alt="EZYOURLIFE"
                className="h-20 md:h-28 lg:h-36 object-contain will-change-transform"
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="font-display text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-tight"
            >
              The Future's First{" "}
              <span className="text-gradient bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                AI App Store
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light"
            >
              Access 2000+ AI-powered tools that simplify life and business. 
              One subscription replaces dozens of apps. Think it → Done.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
            >
              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }} 
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button asChild size="lg" className="text-base px-8 h-14 shadow-lg hover:shadow-xl transition-all group">
                  <Link to="/auth">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }} 
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button asChild variant="outline" size="lg" className="text-base px-8 h-14">
                  <Link to="/tools">Explore Tools</Link>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          style={{ opacity: heroOpacity }}
        >
          <motion.div
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="w-1.5 h-3 rounded-full bg-muted-foreground/50"
              animate={{ y: [0, 8, 0], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 space-y-4"
          >
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Why EZYOURLIFE</p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold">
              Everything You Need in One Place
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              2000+ AI tools to simplify your life and work
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group p-8 rounded-2xl border border-border/50 bg-card hover:border-border hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-5">
                  <motion.div
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 border border-border group-hover:bg-primary/10 transition-colors"
                    whileHover={{ rotate: 5 }}
                  >
                    <feature.icon className="h-6 w-6 text-foreground" />
                  </motion.div>
                  <div className="space-y-2">
                    <h3 className="font-display text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-accent/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 space-y-4"
          >
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Categories</p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold">
              Every Tool You Need
            </h2>
          </motion.div>

          <motion.div
            className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {categories.map((category, index) => (
              <motion.div
                key={category}
                variants={fadeInUp}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ scale: 1.1, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-3 rounded-full border border-border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <span className="text-sm font-medium">{category}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tool Discovery Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-6"
            >
              <div className="space-y-4">
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold">
                  Start with your problem
                </h2>
                <p className="text-lg text-muted-foreground max-w-xl">
                  Choose what you're trying to solve. We'll show you only the tools you need.
                </p>
              </div>
              <motion.div
                className="flex-shrink-0"
                whileHover={{ scale: 1.05 }}
              >
                <div className="px-5 py-3 rounded-full bg-accent border border-border">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total Tools: <span className="text-foreground font-semibold">{TOTAL_TOOLS_COUNT.toLocaleString()}+</span> <span className="text-xs">(including upcoming)</span>
                  </span>
                </div>
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {problemCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link
                    to={`/tools?problem=${card.id}`}
                    className="group block p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                  >
                    <motion.div
                      className="flex items-start gap-4"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 border border-border group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors"
                        whileHover={{ rotate: 10, scale: 1.1 }}
                      >
                        <card.icon className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
                      </motion.div>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors leading-snug">
                          {card.title}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>Explore solutions</span>
                          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 md:py-32 bg-accent/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16 space-y-4"
            >
              <p className="text-sm uppercase tracking-widest text-muted-foreground">Simple Pricing</p>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold">
                One Plan, Everything Included
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent to-primary/5 rounded-3xl blur-3xl opacity-50" />
              <motion.div
                className="relative p-8 md:p-12 rounded-3xl border border-border bg-card"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p className="text-sm uppercase tracking-widest text-muted-foreground">Premium Access</p>
                      <motion.div
                        className="flex items-baseline gap-2"
                        initial={{ scale: 0.9, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <span className="font-display text-5xl md:text-6xl font-semibold">₹2000</span>
                        <span className="text-muted-foreground">/year</span>
                      </motion.div>
                      <p className="text-muted-foreground">or $19.99/month globally</p>
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button asChild size="lg" className="w-full md:w-auto px-8 h-14">
                        <Link to="/subscription">
                          Subscribe Now
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                    </motion.div>
                  </div>
                  <div className="space-y-4">
                    {[
                      "Access to 2000+ AI tools",
                      "Unlimited usage",
                      "Priority support",
                      "New tools added weekly",
                      "BYO API support",
                      "Personal dashboard",
                    ].map((benefit, index) => (
                      <motion.div
                        key={benefit}
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                          <Check className="h-4 w-4 text-foreground" />
                        </div>
                        <span className="text-muted-foreground">{benefit}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Request a Tool Section */}
      <RequestToolSection />

      {/* Final CTA Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center space-y-8"
          >
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
              Stop searching for tools.<br />
              <span className="text-primary">Start solving problems.</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              One subscription. Thousands of focused tools.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild size="lg" className="text-base px-8 h-14 shadow-lg hover:shadow-xl transition-all group">
                <Link to="/auth">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center space-y-8"
          >
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-lg opacity-80 max-w-2xl mx-auto">
              Join thousands of businesses and individuals who have simplified their digital life with EZYOURLIFE.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild size="lg" variant="secondary" className="text-base px-8 h-14 shadow-lg">
                <Link to="/auth">
                  Get Started Free
                  <Sparkles className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div className="flex items-center gap-3">
              <img src={logo} alt="EZYOURLIFE" className="h-16 object-contain" />
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              {["About", "Tools", "Pricing", "Contact", "Refund Policy"].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase().replace(" ", "-")}`}
                  className="hover:text-foreground transition-colors relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 EZYOURLIFE. All rights reserved.
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
