import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isIosApp } from "@/lib/nativeApp";

/*
 * "Delete my account" (Apple requires it in any iOS app that has sign-up, guideline 5.1.1(v)).
 * It records a request in account_deletion_requests and signs the person out; an admin then
 * deletes the account and its data within 30 days. Nothing is deleted from the browser.
 */
export default function DeleteAccountCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("account_deletion_requests")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: { data: { status: string } | null }) => setPending(data?.status === "pending"));
  }, [user]);

  const request = async () => {
    if (!user) return;
    setBusy(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("account_deletion_requests").insert({
        user_id: user.id,
        email: user.email ?? null,
        reason: reason.trim() || null,
        source: isIosApp() ? "ios-app" : "web",
      });
      if (error && !/duplicate/i.test(error.message)) throw error;
      toast({ title: "Deletion requested", description: "Your account and its data will be deleted within 30 days. You've been signed out." });
      await supabase.auth.signOut();
      navigate("/");
    } catch (e) {
      toast({ title: "Couldn't send the request", description: "Please try again, or write to support@ezyourlife.com.", variant: "destructive" });
      console.warn("account deletion request", e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5" />Delete my account</CardTitle>
        <CardDescription>
          Deletes your account, your saved work, your websites and cards, and any credits left. This can't be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pending ? (
          <p className="text-sm text-muted-foreground">Your deletion request has been received. It will be done within 30 days.</p>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={busy}>Delete my account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your account, saved work, published websites and cards, and remaining credits will be deleted within 30 days.
                  You'll be signed out now. This can't be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea placeholder="Anything we could have done better? (optional)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>Keep my account</AlertDialogCancel>
                <AlertDialogAction onClick={(e) => { e.preventDefault(); request(); }} disabled={busy} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete my account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
