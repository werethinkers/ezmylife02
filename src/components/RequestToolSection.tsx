import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, Send, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl border-2 border-ink bg-card shadow-block-lg"
          >
            {/* Background accent */}

            <div className="relative grid md:grid-cols-2 gap-0">
              {/* Left side - Message */}
              <div className="p-8 md:p-12 flex flex-col justify-center space-y-6 border-b md:border-b-0 md:border-r border-ink border-b-2 md:border-r-2 bg-sky/40">
                <motion.div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-ink bg-sun"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                >
                  <Wrench className="h-7 w-7 text-ink" />
                </motion.div>
                <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight">
                  Can't find the app you need?
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Tell us what you're looking for and we'll build it for you within{" "}
                  <span className="font-semibold text-foreground">24–48 hours</span>. Custom-built, just for you.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 text-ink" />
                    <span>24–48 hour turnaround</span>
                  </div>
                </div>
              </div>

              {/* Right side - Form */}
              <div className="p-8 md:p-12">
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
                        <CheckCircle className="h-16 w-16 text-primary" />
                      </motion.div>
                      <h3 className="text-xl font-bold">Request received</h3>
                      <p className="text-muted-foreground text-sm">
                        We'll review your request and get back to you within 24–48 hours.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSubmitted(false);
                          setName("");
                          setEmail("");
                          setToolDescription("");
                        }}
                      >
                        Submit Another
                      </Button>
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
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Your name</label>
                        <Input
                          placeholder="Asha Verma"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          maxLength={255}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Describe the app you need</label>
                        <Textarea
                          placeholder="I need an app that can…"
                          value={toolDescription}
                          onChange={(e) => setToolDescription(e.target.value)}
                          required
                          maxLength={1000}
                          rows={4}
                        />
                      </div>
                      <Button type="submit" className="w-full h-12" disabled={submitting}>
                        {submitting ? (
                          "Submitting..."
                        ) : (
                          <>
                            Request this app
                            <Send className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default RequestToolSection;
