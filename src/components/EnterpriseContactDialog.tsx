import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  trigger?: React.ReactNode;
}

export const EnterpriseContactDialog = ({ trigger }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: user?.email ?? "",
    company: "",
    company_size: "",
    use_case: "",
    message: "",
  });

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast({ title: "Missing info", description: "Name and email are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("enterprise_inquiries").insert({
        ...form,
        user_id: user?.id ?? null,
      });
      if (error) throw error;
      setDone(true);
      setTimeout(() => { setOpen(false); setDone(false); }, 1800);
    } catch (err: any) {
      toast({ title: "Could not submit", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg" variant="outline" className="w-full">
            <Building2 className="mr-2 h-4 w-4" /> Talk to Sales
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Talk to our Enterprise team</DialogTitle>
          <DialogDescription>
            Custom tools, SSO, dedicated success manager, and volume pricing. We'll reply within 24 hours.
          </DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <p className="font-medium">Thanks — we'll be in touch shortly.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ename">Name</Label>
                <Input id="ename" value={form.name} onChange={(e) => update("name", e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="eemail">Work email</Label>
                <Input id="eemail" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ecompany">Company</Label>
                <Input id="ecompany" value={form.company} onChange={(e) => update("company", e.target.value)} />
              </div>
              <div>
                <Label>Company size</Label>
                <Select value={form.company_size} onValueChange={(v) => update("company_size", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1–10</SelectItem>
                    <SelectItem value="11-50">11–50</SelectItem>
                    <SelectItem value="51-200">51–200</SelectItem>
                    <SelectItem value="201-1000">201–1000</SelectItem>
                    <SelectItem value="1000+">1000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="ecase">Use case</Label>
              <Input id="ecase" placeholder="e.g. Marketing automation for 50 seats" value={form.use_case} onChange={(e) => update("use_case", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="emsg">Message</Label>
              <Textarea id="emsg" rows={3} value={form.message} onChange={(e) => update("message", e.target.value)} />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send inquiry
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EnterpriseContactDialog;
