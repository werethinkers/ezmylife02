import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { emitCreditPrompt } from "@/lib/creditPrompt";
import { useBhed } from "@/bhed/lib/store";

const primaryBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-ink bg-pink px-4 text-sm font-semibold text-ink shadow-block-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60";
const saveBtn =
  "inline-flex h-11 items-center justify-center rounded-full border-2 border-ink bg-card px-4 text-sm font-semibold text-ink disabled:opacity-60";

function savedMessage(result: { files: number; skipped: number }) {
  if (result.files > 0 && result.skipped > 0) {
    return `Saved to your account with ${result.files} files. ${result.skipped} were too large to upload.`;
  }
  if (result.files > 0) return `Saved to your account with ${result.files} ${result.files === 1 ? "file" : "files"}.`;
  if (result.skipped > 0) return "Map saved. Some files were too large to upload.";
  return "Saved to your account.";
}

/** Save status and sign-in for the studio. Uses the site's own sign-in, the same as every app. */
export function AccountBar() {
  const { user, loading } = useAuth();
  const ready = useBhed((state) => state.ready);
  const booting = useBhed((state) => state.booting);
  const saveState = useBhed((state) => state.saveState);
  const adoptAccount = useBhed((state) => state.adoptAccount);
  const saveToCloud = useBhed((state) => state.saveToCloud);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Open the maps that belong to whoever is signed in (or the guest maps on this device).
  useEffect(() => {
    if (!mounted || loading) return;
    void adoptAccount(user?.id ?? null);
  }, [mounted, loading, user?.id, adoptAccount]);

  const save = () => {
    if (!user) {
      emitCreditPrompt({ kind: "login" });
      return;
    }
    void saveToCloud()
      .then((result) => toast.success(savedMessage(result)))
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : "Could not save to your account"));
  };

  if (!mounted || loading || !ready) return <div className="h-11 w-28 animate-pulse rounded-full bg-muted" aria-hidden />;

  const label = saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Save";

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button type="button" className={saveBtn} onClick={save}>
          Save
        </button>
        <button type="button" className={primaryBtn} onClick={() => emitCreditPrompt({ kind: "login" })}>
          Sign in
        </button>
      </div>
    );
  }

  return (
    <button type="button" className={primaryBtn} onClick={save} disabled={saveState === "saving" || booting} aria-label="Save to your account">
      {label}
    </button>
  );
}
