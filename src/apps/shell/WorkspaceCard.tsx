import { useState } from "react";
import { Building2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { PROFILE_FIELDS, useWorkspace, type WorkspaceProfile } from "../lib/workspace";
import { cn } from "@/lib/utils";

/** Compact card for the shared business profile, with an editor. */
export function WorkspaceCard({ className, onApply }: { className?: string; onApply?: (p: WorkspaceProfile) => void }) {
  const ws = useWorkspace();
  const [open, setOpen] = useState(false);
  const pct = Math.round((ws.filled / ws.total) * 100);
  return (
    <>
      <div className={cn("rounded-2xl border border-border/60 bg-card p-4", className)}>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{ws.profile.businessName || "Your business profile"}</p>
            <p className="text-xs text-muted-foreground">
              {ws.filled ? `Fills in your details across all apps · ${ws.filled}/${ws.total} done` : "Fill it once — every app prefills your details."}
            </p>
            <Progress value={pct} className="mt-2 h-1.5" />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setOpen(true)}>
            <Pencil className="h-3.5 w-3.5" /> {ws.filled ? "Edit" : "Set up"}
          </Button>
          {onApply && ws.filled > 0 && (
            <Button size="sm" variant="ghost" className="h-8" onClick={() => onApply(ws.profile)}>
              Fill this form
            </Button>
          )}
        </div>
      </div>
      <WorkspaceDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export function WorkspaceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const ws = useWorkspace();
  const [draft, setDraft] = useState<WorkspaceProfile>(ws.profile);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) setDraft(ws.profile);
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Your business profile</DialogTitle>
          <DialogDescription>
            Used to prefill forms in every EZYOURLIFE app. {ws.signedIn ? "Saved to your account." : "Saved in this browser — sign in to keep it on all your devices."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            ws.setProfile(draft);
            onOpenChange(false);
          }}
        >
          {PROFILE_FIELDS.map((f) => (
            <div key={f.key} className={cn("space-y-1", f.half ? "" : "sm:col-span-2")}>
              <Label htmlFor={`ws-${f.key}`} className="text-xs">
                {f.label}
              </Label>
              <Input
                id={`ws-${f.key}`}
                value={draft[f.key] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save profile</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
