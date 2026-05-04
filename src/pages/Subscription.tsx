import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { FunnelStepper } from "@/components/FunnelStepper";
import { SEOHead } from "@/components/SEOHead";
import SEOFooter from "@/components/SEOFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Check, Crown, Loader2, Sparkles, Tag, Zap, Star, Shield, Clock, Building2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { EnterpriseContactDialog } from "@/components/EnterpriseContactDialog";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Subscription = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [accessType, setAccessType] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<string | null>(null);
  const [isRedeemingCoupon, setIsRedeemingCoupon] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [isStartingMonthly, setIsStartingMonthly] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkSubscriptionStatus();
  }, [user, navigate]);

  // Forward redirect (no homepage bounce after success)
  const goNext = () => {
    const stored = (() => { try { return localStorage.getItem("auth_redirect_to"); } catch { return null; } })();
    const queryNext = searchParams.get("next");
    const dest = stored || queryNext || "/tools";
    try { localStorage.removeItem("auth_redirect_to"); } catch { /* ignore */ }
    setTimeout(() => navigate(dest, { replace: true }), 700);
  };

  useEffect(() => {
    const couponParam = searchParams.get("coupon");
    if (couponParam) {
      setCouponCode(couponParam);
    }

    if (searchParams.get("success") === "true") {
      toast({
        title: "Payment Successful!",
        description: "Welcome to Premium! Taking you to your next step…",
      });
      checkSubscriptionStatus();
      goNext();
    } else if (searchParams.get("trial_success") === "true") {
      toast({
        title: "Trial Activated!",
        description: "You have 24-hour access. Let's open your tool.",
      });
      checkSubscriptionStatus();
      goNext();
    } else if (searchParams.get("canceled") === "true") {
      toast({
        title: "Payment Canceled",
        description: "Your payment was canceled. You can try again anytime.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const checkSubscriptionStatus = async () => {
    try {
      setIsCheckingStatus(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setIsPremium(data.subscribed);
      setAccessType(data.access_type);
      setSubscriptionEnd(data.subscription_end || null);
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const initiateRazorpayPayment = async (planType: "yearly" | "monthly" | "trial") => {
    const setLoadingState = planType === "trial" ? setIsStartingTrial : planType === "monthly" ? setIsStartingMonthly : setIsLoading;
    
    try {
      setLoadingState(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: orderData, error: orderError } = await supabase.functions.invoke("create-razorpay-order", {
        body: { plan_type: planType, coupon_code: appliedDiscount },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (orderError) throw orderError;
      if (orderData.error) {
        toast({
          title: "Error",
          description: orderData.error,
          variant: "destructive",
        });
        return;
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "EZYOURLIFE",
        description: orderData.description,
        order_id: orderData.order_id,
        handler: async (response: any) => {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-razorpay-payment", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_type: planType,
              },
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });

            if (verifyError) throw verifyError;

            if (verifyData.success) {
              toast({
                title: planType === "trial" ? "Trial Activated!" : "Payment Successful!",
                description: planType === "trial"
                  ? "Taking you to your tool — enjoy 24h access."
                  : "Welcome to Premium! Heading to your next step…",
              });
              checkSubscriptionStatus();
              goNext();
            } else {
              throw new Error(verifyData.error || "Payment verification failed");
            }
          } catch (error: any) {
            console.error("Payment verification error:", error);
            toast({
              title: "Verification Failed",
              description: "Payment was received but verification failed. Please contact support.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          email: orderData.user_email,
        },
        theme: {
          color: "#000000",
        },
        modal: {
          ondismiss: () => {
            setLoadingState(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        toast({
          title: "Payment Failed",
          description: response.error.description || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      });
      rzp.open();
    } catch (error: any) {
      console.error("Error initiating payment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingState(false);
    }
  };

  const handleSubscribe = () => initiateRazorpayPayment("yearly");
  const handleMonthlySubscribe = () => initiateRazorpayPayment("monthly");
  const handleStartTrial = () => initiateRazorpayPayment("trial");

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a coupon code",
        variant: "destructive",
      });
      return;
    }

    const code = couponCode.toLowerCase().trim();

    // Check if it's a discount coupon (not free)
    if (code === "abhi99") {
      setAppliedDiscount(code);
      toast({
        title: "Coupon Applied! 🎉",
        description: "99% discount will be applied to your next payment.",
      });
      return;
    }

    // Otherwise try redeeming as a free coupon
    try {
      setIsRedeemingCoupon(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("redeem-coupon", {
        body: { coupon_code: couponCode },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success!",
          description: data.message,
        });
        setCouponCode("");
        checkSubscriptionStatus();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to redeem coupon",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error redeeming coupon:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to redeem coupon",
        variant: "destructive",
      });
    } finally {
      setIsRedeemingCoupon(false);
    }
  };

  const trialFeatures = [
    "Full access for 24 hours",
    "All 200+ live AI tools unlocked (2,000+ coming within a year)",
    "Perfect for trying before buying",
    "No automatic renewal",
  ];

  const monthlyFeatures = [
    "Access to all 200+ live AI tools (2,000+ coming within a year)",
    "30 days of full access",
    "Flexible month-to-month",
    "Cancel anytime",
    "Priority support",
  ];

  const yearlyFeatures = [
    "Access to all 200+ live AI tools + every new tool we ship (2,000+ planned)",
    "Business automation & content creation",
    "AI-powered assistants & chatbots",
    "Document analysis & PDF tools",
    "Marketing, sales & finance tools",
    "Design & creative tools",
    "Priority support",
    "New tools added weekly",
  ];

  if (isCheckingStatus) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Loading your subscription...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="EZYOURLIFE Pricing - Free & Premium AI Tools Plans"
        description="Choose your EZYOURLIFE plan. Start free, or upgrade to Premium for unlimited access to 200+ live AI tools today (2,000+ launching within a year). Affordable AI tools subscription for students, creators and businesses."
        path="/subscription"
        keywords="ezyourlife pricing, ai tools subscription, premium ai tools plan, free ai tools, ezyourlife premium, ai tools for students, affordable ai tools"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "EZYOURLIFE Pricing",
            description: "Choose your EZYOURLIFE plan — free or premium access to 200+ live AI tools (2,000+ coming within a year).",
            url: "https://ezyourlife.com/subscription",
            mainEntity: {
              "@type": "Product",
              name: "EZYOURLIFE Premium",
              description: "Unlimited access to 200+ live AI tools today (2,000+ launching within a year) for productivity, business, and education.",
              brand: { "@type": "Brand", name: "EZYOURLIFE" },
              offers: {
                "@type": "AggregateOffer",
                priceCurrency: "INR",
                lowPrice: "0",
                offerCount: "2",
              },
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://ezyourlife.com" },
              { "@type": "ListItem", position: 2, name: "Pricing", item: "https://ezyourlife.com/subscription" },
            ],
          },
        ]}
      />
      <Navbar />
      <FunnelStepper current="plan" />

      {/* What is this page strip */}
      <div className="border-b border-border/40 bg-muted/20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-medium">Step 2 — Choose your plan</p>
            <p className="text-xs text-muted-foreground">Pick a plan and we'll take you straight to the tool you wanted next.</p>
          </div>
          <Badge variant="outline" className="bg-primary/5 border-primary/30 text-primary">No homepage detours</Badge>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <main className="container relative mx-auto px-4 py-12 md:py-20">
          <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
            {isPremium ? (
              <>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                  <Crown className="h-4 w-4" />
                  <span className="text-sm font-medium">Premium Member</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
                  Welcome Back, Premium User!
                </h1>
                <p className="text-xl text-muted-foreground">
                  You have full access to all tools. Explore and create amazing things.
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">Unlock Premium</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                  Choose Your{" "}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Premium Plan
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Get unlimited access to 200+ live AI tools (and every new tool we ship — 2,000+ planned within a year). Automate your work, boost productivity, and simplify your life.
                </p>
              </>
            )}
          </div>

          {isPremium ? (
            <div className="max-w-lg mx-auto animate-scale-in">
              <Card className="border-primary border-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-xl px-4 py-1 bg-primary text-primary-foreground">
                    <Crown className="h-3 w-3 mr-1" />
                    {accessType === "trial" 
                      ? "Trial" 
                      : subscriptionEnd 
                        ? `Expires ${new Date(subscriptionEnd).toLocaleDateString()}` 
                        : accessType === "coupon" 
                          ? "Lifetime" 
                          : "Active"}
                  </Badge>
                </div>
                <CardContent className="relative pt-12 pb-8 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                    <Crown className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Premium Access Active</h2>
                  <p className="text-muted-foreground mb-6">
                    {accessType === "trial"
                      ? "Your 24-hour trial is active. Make the most of it!"
                      : subscriptionEnd
                        ? `Your premium access is valid until ${new Date(subscriptionEnd).toLocaleDateString()}.`
                        : accessType === "coupon"
                          ? "You have lifetime premium access via coupon code!"
                          : "Your subscription is active. Enjoy all premium features!"
                    }
                  </p>
                  <Button onClick={() => navigate("/tools")} size="lg" className="w-full">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Explore All Tools
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {/* Big Launch Offer Banner */}
              <div className="max-w-4xl mx-auto mb-12 animate-fade-in">
                <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/60 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-8 md:p-10 text-center">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
                  <div className="relative">
                    <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 text-sm px-4 py-1">
                      <Sparkles className="h-3 w-3 mr-1" /> One-Time Launch Offer
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-bold mb-3">
                      Get Your First Month <span className="text-primary">100% FREE</span>
                    </h2>
                    <p className="text-lg text-muted-foreground mb-5 max-w-xl mx-auto">
                      No credit card required. Use the coupon code below to unlock 30 days of premium access — absolutely free.
                    </p>
                    <div className="inline-flex items-center gap-3 bg-background border-2 border-dashed border-primary/50 rounded-xl px-6 py-3 mb-4">
                      <span className="font-mono font-bold text-2xl tracking-widest text-primary">ezyLAUNCH</span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Zap className="h-3 w-3" /> Valid for early users only • Scroll down to apply
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
                {/* Trial Plan */}
                <Card className="relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 animate-fade-in" style={{ animationDelay: "100ms" }}>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-muted to-muted-foreground/50" />
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <Clock className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-xl">Day Pass</CardTitle>
                    <CardDescription>Perfect for trying out</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">₹50</span>
                        <span className="text-muted-foreground">/day</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">24-hour full access</p>
                    </div>

                    <ul className="space-y-3">
                      {trialFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      onClick={handleStartTrial} 
                      disabled={isStartingTrial}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      {isStartingTrial ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Start Day Pass
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Monthly Plan */}
                <Card className="relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 animate-fade-in" style={{ animationDelay: "150ms" }}>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-accent/50" />
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <Sparkles className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Monthly Premium</CardTitle>
                    <CardDescription>Flexible month-to-month</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">₹199</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">30 days full access</p>
                    </div>

                    <ul className="space-y-3">
                      {monthlyFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      onClick={handleMonthlySubscribe} 
                      disabled={isStartingMonthly}
                      variant="outline"
                      className="w-full border-primary/50 hover:bg-primary/10"
                      size="lg"
                    >
                      {isStartingMonthly ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Get Monthly Access
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Yearly Plan - Recommended */}
                <Card className="relative overflow-hidden border-primary/50 shadow-xl shadow-primary/10 scale-[1.02] animate-fade-in" style={{ animationDelay: "200ms" }}>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
                  <div className="absolute -top-px -right-px">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent blur-sm" />
                      <Badge className="relative rounded-none rounded-bl-xl px-4 py-1.5 bg-gradient-to-r from-primary to-accent text-primary-foreground border-0">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Best Value
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="text-center pb-4 pt-8">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                      <Crown className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl">Annual Premium</CardTitle>
                    <CardDescription>Unlimited access for a year</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">₹1,999</span>
                        <span className="text-muted-foreground">/year</span>
                      </div>
                      <p className="text-sm text-primary mt-1 font-medium">Save ₹16,251 vs daily</p>
                    </div>

                    <ul className="space-y-3">
                      {yearlyFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      onClick={handleSubscribe} 
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Crown className="mr-2 h-4 w-4" />
                          Get Premium Access
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Enterprise Plan */}
                <Card className="relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 animate-fade-in" style={{ animationDelay: "250ms" }}>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/60 to-orange-500/60" />
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
                      <Building2 className="h-7 w-7 text-amber-600" />
                    </div>
                    <CardTitle className="text-xl">Enterprise</CardTitle>
                    <CardDescription>For teams &amp; organisations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">Custom</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Volume pricing</p>
                    </div>
                    <ul className="space-y-3">
                      {["SSO &amp; team accounts","Custom-built tools","Dedicated success manager","SLA &amp; priority support","Volume pricing"].map((f,i)=>(
                        <li key={i} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm" dangerouslySetInnerHTML={{__html: f}} />
                        </li>
                      ))}
                    </ul>
                    <EnterpriseContactDialog
                      trigger={
                        <Button variant="outline" size="lg" className="w-full border-amber-500/40 hover:bg-amber-500/10">
                          <Building2 className="mr-2 h-4 w-4" /> Talk to Sales
                        </Button>
                      }
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Coupon — collapsed in dialog */}
              <div className="text-center mb-8 animate-fade-in" style={{ animationDelay: "300ms" }}>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Tag className="h-4 w-4 mr-2" /> Have a coupon code?
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Apply a coupon</DialogTitle>
                      <DialogDescription>Enter a code to unlock free or discounted access.</DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRedeemCoupon()}
                      />
                      <Button onClick={handleRedeemCoupon} disabled={isRedeemingCoupon}>
                        {isRedeemingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                    {appliedDiscount && (
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <Check className="h-4 w-4" />
                        <span>Coupon <strong>{appliedDiscount}</strong> applied!</span>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap justify-center gap-6 mt-12 animate-fade-in" style={{ animationDelay: "400ms" }}>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-5 w-5" />
                  <span className="text-sm">Secure Payments</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="h-5 w-5" />
                  <span className="text-sm">Instant Access</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Star className="h-5 w-5" />
                  <span className="text-sm">200+ Live · 2,000+ Coming</span>
                </div>
              </div>

              {/* Refund Policy Link */}
              <div className="text-center mt-8 animate-fade-in" style={{ animationDelay: "500ms" }}>
                <Link to="/refund-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline">
                  View Cancellation & Refund Policy
                </Link>
              </div>
            </>
          )}
        </main>
      </div>
      <SEOFooter />
    </div>
  );
};

export default Subscription;
