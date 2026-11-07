import { Zap } from "lucide-react";

/*
 * Shown in the iOS app wherever the website would sell credits or the kit. Apple doesn't allow
 * digital goods to be sold in an iOS app except through Apple's in-app purchase, and outside the
 * US it also doesn't allow pointing people to another place to pay. So this notice has no link
 * and no price. See docs/ios-app.md.
 */
export const APP_STORE_BUY_TEXT =
  "Credits can't be bought in the iPhone app yet. Your balance and everything already on your account work here as usual.";

export default function AppStoreBuyNotice({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-muted/40 p-4 text-sm ${className}`}>
      <div className="mb-1 flex items-center gap-2 font-semibold">
        <Zap className="h-4 w-4 text-primary" /> Not available in the app
      </div>
      <p className="text-muted-foreground">{APP_STORE_BUY_TEXT}</p>
    </div>
  );
}
