import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LogIn, UserPlus } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Where to send the user back after auth. Defaults to current location. */
  returnTo?: string;
}

export const LoginPromptDialog = ({ open, onOpenChange, returnTo }: Props) => {
  const handleClick = () => {
    try {
      const path = returnTo ?? window.location.pathname + window.location.search;
      localStorage.setItem("auth_redirect_to", path);
    } catch { /* ignore */ }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Sign in to continue</DialogTitle>
          <DialogDescription>
            You need an account to use this tool. New users get free credits to try it instantly.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 mt-2">
          <Button asChild onClick={handleClick}>
            <Link to="/auth"><LogIn className="h-4 w-4 mr-2" /> Sign in</Link>
          </Button>
          <Button asChild variant="outline" onClick={handleClick}>
            <Link to="/auth?mode=signup"><UserPlus className="h-4 w-4 mr-2" /> Create account</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginPromptDialog;
