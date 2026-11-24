import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, Send, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BTN_OUTLINE, BTN_PRIMARY, CONTAINER } from "@/components/modern/styles";

const field =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-base placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 sm:text-sm dark:border-zinc-800 dark:bg-zinc-950";

/** "Can't find the app you need?" request form. Drawn in the modern look: it sits on the home and business-apps pages. */
const RequestToolSection = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [toolDescription, setToolDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !toolDescription.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("tool_requests" as any).insert({
      name: name.trim(),
      email: email.trim(),
      tool_description: toolDescription.trim(),
    } as any);
    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit. Please try again.");
      return;
    }
    setSubmitted(true);
    toast.success("Request submitted! We'll get back to you soon.");
  };

  return (
    <section className="border-t border-zinc-200/80 py-14 dark:border-zinc-800/80">
      <div className={CONTAINER}>
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-soft-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="relative grid md:grid-cols-2">
              {/* Left side - Message */}
              <div className="flex flex-col justify-center space-y-5 border-b border-zinc-200 bg-orange-50/70 p-6 md:border-b-0 md:border-r md:p-10 dark:border-zinc-800 dark:bg-orange-950/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-[1.5px] border-foreground bg-primary text-primary-foreground shadow-soft-sm">
                  <Wrench className="h-6 w-6" aria-hidden />
                </div>
                <h2 className="font-display text-2xl font-bold leading-tight tracking-tight md:text-3xl">Can't find the app you need?</h2>
                <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Tell us what you're looking for and we'll build it for you within{" "}
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">24–48 hours</span>. Custom-built, just for you.
                </p>
                <div className="flex items-center gap-2 pt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" aria-hidden />
                  <span>24–48 hour turnaround</span>
                </div>
              </div>

              {/* Right side - Form */}
              <div className="p-6 md:p-10">
                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                      >
                        <CheckCircle className="h-16 w-16 text-emerald-600 dark:text-emerald-400" aria-hidden />
                      </motion.div>
                      <h3 className="font-display text-xl font-bold">Request received</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        We'll review your request and get back to you within 24–48 hours.
                      </p>
                      <button
                        type="button"
                        className={BTN_OUTLINE}
                        onClick={() => {
                          setSubmitted(false);
                          setName("");
                          setEmail("");
                          setToolDescription("");
                        }}
                      >
                        Submit another
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit}
                      className="space-y-4"
                    >
                      <div className="space-y-1.5">
                        <label htmlFor="request-name" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Your name</label>
                        <input
                          id="request-name"
                          placeholder="Asha Verma"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          maxLength={100}
                          className={field}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="request-email" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Email</label>
                        <input
                          id="request-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          maxLength={255}
                          className={field}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="request-description" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Describe the app you need</label>
                        <textarea
                          id="request-description"
                          placeholder="I need an app that can…"
                          value={toolDescription}
                          onChange={(e) => setToolDescription(e.target.value)}
                          required
                          maxLength={1000}
                          rows={4}
                          className={field}
                        />
                      </div>
                      <button type="submit" className={cn(BTN_PRIMARY, "h-12 w-full disabled:opacity-60")} disabled={submitting}>
                        {submitting ? (
                          "Submitting..."
                        ) : (
                          <>
                            Request this app
                            <Send className="h-4 w-4" aria-hidden />
                          </>
                        )}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RequestToolSection;
