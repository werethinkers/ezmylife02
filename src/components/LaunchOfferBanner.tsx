import { useState } from "react";
import { Link } from "react-router-dom";
import { Rocket, Copy, Check, ArrowRight, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { motion } from "framer-motion";

const COUPON_CODE = "ezyLAUNCH";

const LaunchOfferBanner = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(COUPON_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-border/50">
      <Carousel
        opts={{ loop: true, align: "center" }}
        plugins={[Autoplay({ delay: 5000, stopOnInteraction: false })]}
        className="w-full"
      >
        <CarouselContent>
          {/* Slide 1 — Launch Offer */}
          <CarouselItem>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 px-4 py-4 md:py-5">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Rocket className="h-6 w-6 text-primary" />
                </motion.div>
                <div className="text-center md:text-left">
                  <p className="font-semibold text-sm md:text-base">
                    🚀 Launch Offer – Limited Time!
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    100% OFF your first month — completely FREE
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background border-2 border-dashed border-primary/50 hover:border-primary transition-colors cursor-pointer"
                >
                  <span className="font-mono font-bold text-sm tracking-wider text-primary">
                    {COUPON_CODE}
                  </span>
                  {copied ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                <Button asChild size="sm" className="group">
                  <Link to={`/subscription?coupon=${COUPON_CODE}`}>
                    Redeem Now
                    <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </CarouselItem>

          {/* Slide 2 — Features */}
          <CarouselItem>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 px-4 py-4 md:py-5">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <p className="font-semibold text-sm md:text-base">
                  200+ Live AI Tools · 2,000+ Coming Soon
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs md:text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Instant Access
                </span>
                <span>•</span>
                <span>⚡ Valid for early users only</span>
                <span>•</span>
                <Badge variant="secondary" className="text-xs">Limited Time</Badge>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/tools">Explore Tools</Link>
              </Button>
            </div>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default LaunchOfferBanner;
