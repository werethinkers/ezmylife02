import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getBulkConfig } from "@/data/bulkTools";
import { BulkDropzone } from "./BulkDropzone";

interface Props {
  toolId: string;
  variant?: "pill" | "inline";
}

/**
 * Renders a "⚡ Bulk Mode" pill on supported tools.
 * Returns null silently if the tool is not in the bulk registry,
 * making it safe to drop into any tool component.
 * Bulk Mode is open to every signed-in user and is paid per file processed with credits
 * (there is no separate subscription any more).
 */
export const BulkModeToggle = ({ toolId, variant = "pill" }: Props) => {
  const config = getBulkConfig(toolId);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!config) return null;

  const handleClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        size={variant === "pill" ? "sm" : "default"}
        variant="outline"
        className="gap-1.5 border-primary/40 hover:border-primary hover:bg-primary/10"
      >
        <Zap className="h-3.5 w-3.5" />
        Bulk Mode
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process multiple files at once</DialogTitle>
          </DialogHeader>
          <BulkDropzone config={config} onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};
