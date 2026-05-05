import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Zap } from "lucide-react";
import { CREDIT_PACKS } from "@/data/creditPacks";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  required?: number;
  balance?: number;
}

export const BuyCreditsDialog = ({ open, onOpenChange, required, balance }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Not enough credits
          </DialogTitle>
          <DialogDescription>
            {required != null && balance != null
              ? `You need ${required} credits to run this tool but have ${balance}.`
              : "Top up your wallet to keep going."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {CREDIT_PACKS.slice(0, 4).map((p) => (
            <Link
              key={p.id}
              to={`/credits?pack=${p.id}`}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm hover:border-primary transition"
              onClick={() => onOpenChange(false)}
            >
              <div className="font-medium">₹{p.inr}</div>
              <div className="text-xs text-muted-foreground">{p.credits} credits</div>
            </Link>
          ))}
        </div>
        <Button asChild className="mt-3 w-full">
          <Link to="/credits" onClick={() => onOpenChange(false)}>See all packs</Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default BuyCreditsDialog;
