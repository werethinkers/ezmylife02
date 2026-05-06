import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Image as ImageIcon, FileText, Contact } from "lucide-react";

const examples = [
  {
    icon: ImageIcon,
    title: "Drop 50 photos",
    desc: "Background removed in one click. Download as ZIP.",
    cta: "Try Background Remover",
    to: "/tool/background-remover",
  },
  {
    icon: FileText,
    title: "Drop 10 pitch decks",
    desc: "Investor-grade analyses generated in parallel.",
    cta: "Try Startup Analyser",
    to: "/startup-analyser",
  },
  {
    icon: Contact,
    title: "Drop 50 business cards",
    desc: "All scanned and saved to your contacts instantly.",
    cta: "Try Card Scanner",
    to: "/meet-nudge",
  },
];

export const BulkPromoSection = () => (
  <section className="py-20 px-4 relative overflow-hidden">
    <div className="container max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-4">
          <Zap className="h-4 w-4" /> NEW · Bulk Mode
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Drop dozens of files. Get all outputs at once.
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Stop running AI Apps one image at a time. Bulk Mode is included free with every Premium plan.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {examples.map((ex, i) => (
          <motion.div
            key={ex.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-6 h-full bg-card/50 backdrop-blur-xl border-primary/20 hover:border-primary/50 transition-colors flex flex-col">
              <ex.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{ex.title}</h3>
              <p className="text-muted-foreground mb-6 flex-1">{ex.desc}</p>
              <Link to={ex.to}>
                <Button variant="outline" className="w-full">
                  {ex.cta}
                </Button>
              </Link>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-10">
        <Link to="/subscription">
          <Button size="lg" className="gap-2">
            <Zap className="h-5 w-5" /> Unlock Bulk Mode with Premium
          </Button>
        </Link>
      </div>
    </div>
  </section>
);
