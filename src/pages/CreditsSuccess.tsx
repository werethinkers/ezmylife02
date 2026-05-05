import { Link, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { Zap, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const CreditsSuccess = () => {
  const [params] = useSearchParams();
  const credits = Number(params.get("credits") || 0);
  const { free, paid, total } = useWallet();

  return (
    <>
      <SEOHead title="Credits added — EZYOURLIFE" description="Your wallet has been topped up." path="/credits/success" />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-xl">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <h1 className="text-2xl font-semibold">+{credits} credits added</h1>
              <p className="text-muted-foreground mt-1">Your wallet is ready to go.</p>
              <div className="mt-6 rounded-lg border bg-muted/30 p-4 inline-flex items-center gap-3">
                <Zap className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">New balance</p>
                  <p className="text-2xl font-semibold tabular-nums">{total}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{free} free · {paid} paid</p>
                </div>
              </div>
              <div className="mt-8 flex gap-2 justify-center">
                <Button asChild><Link to="/tools">Browse tools</Link></Button>
                <Button asChild variant="outline"><Link to="/credits">Buy more</Link></Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </>
  );
};

export default CreditsSuccess;
