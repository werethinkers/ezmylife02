import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Check, Crown, Loader2, Sparkles, Tag } from "lucide-react";

const Subscription = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [accessType, setAccessType] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [isRedeemingCoupon, setIsRedeemingCoupon] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkSubscriptionStatus();
  }, [user, navigate]);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({
        title: "Payment Successful!",
        description: "Welcome to Premium! You now have full access to all tools.",
      });
      checkSubscriptionStatus();
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
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a coupon code",
        variant: "destructive",
      });
      return;
    }

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

  const features = [
    "Access to all 36+ Jain Digital Tools",
    "Jain Audio & Video Streaming",
    "AI-powered assistants (JainGyan AI, Advance AI Bot)",
    "Shastra PDF Reader & Multi-PDF AI Bot",
    "Jain Encyclopedia & Panchang",
    "Quiz, Image Creator, StoryBook Creator",
    "Research tools (Rich Editor, OCR, Dictionaries)",
    "Modern Science tools & Lab experiments",
    "Priority support",
    "New tools & updates"
  ];

  if (isCheckingStatus) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            {isPremium ? "You're a Premium Member!" : "Unlock Premium Access"}
          </h1>
          <p className="text-lg text-muted-foreground">
            {isPremium 
              ? "Thank you for being a premium member. Enjoy full access to all tools."
              : "Get unlimited access to all Jain Digital Tools with our premium subscription."
            }
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <Card className={`relative overflow-hidden ${isPremium ? 'border-primary border-2' : ''}`}>
            {isPremium && (
              <div className="absolute top-0 right-0">
                <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground">
                  <Crown className="h-3 w-3 mr-1" />
                  {accessType === "coupon" ? "Lifetime Access" : "Active"}
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Premium Subscription</CardTitle>
              <CardDescription>Full access to all tools</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center">
                <span className="text-4xl font-bold">₹2,000</span>
                <span className="text-muted-foreground">/year</span>
              </div>

              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {!isPremium && (
                <>
                  <Button 
                    onClick={handleSubscribe} 
                    disabled={isLoading}
                    className="w-full"
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
                        Subscribe Now
                      </>
                    )}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or use coupon</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="pl-10"
                        onKeyDown={(e) => e.key === "Enter" && handleRedeemCoupon()}
                      />
                    </div>
                    <Button 
                      onClick={handleRedeemCoupon}
                      disabled={isRedeemingCoupon}
                      variant="outline"
                    >
                      {isRedeemingCoupon ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Redeem"
                      )}
                    </Button>
                  </div>
                </>
              )}

              {isPremium && (
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-primary font-medium">
                    {accessType === "coupon" 
                      ? "You have lifetime premium access via coupon code!"
                      : "Your subscription is active. Enjoy all premium features!"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Subscription;