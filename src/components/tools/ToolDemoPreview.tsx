import { useState } from "react";
import { ChevronDown, Sparkles, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

interface ToolDemoPreviewProps {
  demoInput?: string | null;
  demoOutput?: string | null;
  toolName?: string;
}

export const ToolDemoPreview = ({ demoInput, demoOutput, toolName }: ToolDemoPreviewProps) => {
  const [open, setOpen] = useState(false);

  if (!demoInput?.trim() || !demoOutput?.trim()) return null;

  return (
    <section className="border-t border-border/40 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 group"
          aria-expanded={open}
        >
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-semibold text-foreground">
                See an example
              </h2>
              <p className="text-xs text-muted-foreground">
                {open ? "Hide preview" : `What ${toolName || "this app"} produces`}
              </p>
            </div>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="grid md:grid-cols-2 gap-4 pt-4 pb-2">
                {/* Input */}
                <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                      If you enter
                    </span>
                  </div>
                  <div className="text-sm text-foreground/90 whitespace-pre-wrap font-mono leading-relaxed">
                    {demoInput}
                  </div>
                </div>

                {/* Output */}
                <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-4 relative">
                  <div className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-background border border-border items-center justify-center">
                    <ArrowRight className="h-3 w-3 text-primary" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-primary">
                      You'll get
                    </span>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground/90 leading-relaxed">
                    <ReactMarkdown>{demoOutput}</ReactMarkdown>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground text-center pb-2">
                Example only — your actual output will be tailored to your input.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
