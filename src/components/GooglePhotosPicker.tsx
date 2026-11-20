import { useEffect, useRef, useState, type ReactNode } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  GooglePhotosError,
  createPickerSession,
  deletePickerSession,
  downloadPicks,
  getGooglePhotosToken,
  isGooglePhotosEnabled,
  loadGoogleSignIn,
  waitForPicks,
  type PickerSession,
} from "@/lib/googlePhotos";

type Phase = "connecting" | "ready" | "importing" | "error";

type Props = {
  /** How many photos may be chosen (1 for a single-photo slot). */
  max?: number;
  /** Receives the chosen photos as ordinary files, the same as a normal upload. */
  onFiles: (files: File[]) => void | Promise<void>;
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  disabled?: boolean;
  /** Use your own look for the trigger (for example a small pill). */
  trigger?: (open: () => void, disabled: boolean) => ReactNode;
};

/**
 * "From Google Photos" button + the small window that guides the person through Google's picker.
 * Renders nothing until VITE_GOOGLE_PHOTOS_CLIENT_ID is set, so it never shows as a dead button.
 */
export function GooglePhotosButton({ max = 1, onFiles, label = "From Google Photos", variant = "outline", size = "sm", className, disabled = false, trigger }: Props) {
  const enabled = isGooglePhotosEnabled();
  const { user } = useAuth();
  // If the user signed in with Google, pass their email as a hint so GIS skips the account selector.
  const emailHint = user?.email ?? undefined;
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("connecting");
  const [error, setError] = useState("");
  const [session, setSession] = useState<PickerSession | null>(null);
  const abort = useRef<AbortController | null>(null);
  const run = useRef(0);

  useEffect(() => { if (enabled) loadGoogleSignIn().catch(() => undefined); }, [enabled]);
  useEffect(() => () => abort.current?.abort(), []);

  if (!enabled) return null;

  const close = () => { abort.current?.abort(); setOpen(false); };

  const start = async () => {
    const id = ++run.current;
    const ctl = new AbortController();
    abort.current?.abort();
    abort.current = ctl;
    setOpen(true); setPhase("connecting"); setError(""); setSession(null);
    let token = ""; let sid = "";
    try {
      token = await getGooglePhotosToken(emailHint);
      const s = await createPickerSession(token, max);
      sid = s.id;
      if (id !== run.current || ctl.signal.aborted) throw new GooglePhotosError("Cancelled.", "cancelled");
      setSession(s); setPhase("ready");
      await waitForPicks(token, s, ctl.signal);
      setPhase("importing");
      const files = await downloadPicks(token, s.id, max);
      await onFiles(files);
      setOpen(false);
    } catch (e) {
      if (e instanceof GooglePhotosError && e.code === "cancelled") { if (id === run.current) setOpen(false); }
      else if (id === run.current) { setError(e instanceof Error ? e.message : "Something went wrong with Google Photos."); setPhase("error"); }
    } finally {
      if (token && sid) void deletePickerSession(token, sid);
    }
  };

  return (
    <>
      {trigger ? trigger(start, disabled) : (
        <Button type="button" variant={variant} size={size} className={className} disabled={disabled} onClick={start}>
          <GoogleGlyph /> {label}
        </Button>
      )}
      <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose from Google Photos</DialogTitle>
            <DialogDescription>
              You pick the photos inside Google Photos. We only receive the ones you choose, never your whole library.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2" aria-live="polite">
            {phase === "connecting" && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Connecting to Google…</p>}
            {phase === "ready" && session && (
              <>
                <Button type="button" className="h-11" onClick={() => window.open(`${session.pickerUri}/autoclose`, "_blank", "noopener")}>
                  <ExternalLink className="h-4 w-4 mr-2" /> Open Google Photos
                </Button>
                <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Waiting for you to choose {max > 1 ? `up to ${max} photos` : "a photo"}. Come back here when you tap Done.</p>
              </>
            )}
            {phase === "importing" && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Bringing your photos in…</p>}
            {phase === "error" && (
              <div role="alert" className="space-y-1">
                <p className="text-sm text-destructive">{error}</p>
                <p className="text-xs text-muted-foreground">If Google showed an "unverified app" warning, click <strong>Advanced</strong> → <strong>Go to Ezyourlife</strong> to continue.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            {phase === "error" && <Button type="button" onClick={start}>Try again</Button>}
            <Button type="button" variant="ghost" onClick={close}>{phase === "error" ? "Close" : "Cancel"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2" aria-hidden="true">
      <path fill="#EA4335" d="M12 2a5 5 0 0 1 5 5v5h-5z" />
      <path fill="#4285F4" d="M22 12a5 5 0 0 1-5 5h-5v-5z" />
      <path fill="#34A853" d="M12 22a5 5 0 0 1-5-5v-5h5z" />
      <path fill="#FBBC04" d="M2 12a5 5 0 0 1 5-5h5v5z" />
    </svg>
  );
}
