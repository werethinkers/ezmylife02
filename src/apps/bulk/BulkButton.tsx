import { useMemo, useState } from "react";
import { Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BulkDropzone } from "@/components/bulk/BulkDropzone";
import { getBulkConfig } from "@/data/bulkTools";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { getBulkSpec } from "./specs";
import { BulkRunner } from "./BulkRunner";
import { cn } from "@/lib/utils";

/** The "Bulk mode" button every app shows; opens the right many-at-once flow for that app. */
export function BulkButton({ toolId, className, size = "sm" }: { toolId: string; className?: string; size?: "sm" | "default" }) {
  const [open, setOpen] = useState(false);
  const spec = useMemo(() => getBulkSpec(toolId), [toolId]);
  const { data: catalog = [] } = useToolsCatalog();
  const name = catalog.find((t) => t.id === toolId)?.name ?? "this app";
  if (!spec) return null;
  const config = spec.mode === "dropzone" ? getBulkConfig(spec.configId) : undefined;
  return (
    <>
      <Button size={size} variant="outline" className={cn("h-8 gap-1.5 border-primary/40", className)} onClick={() => setOpen(true)}>
        <Layers3 className="h-3.5 w-3.5" />
        <span className="text-xs">Bulk mode</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk mode · {name}</DialogTitle>
            <DialogDescription>Run {name} on many inputs at once. Each item is charged separately, only when it succeeds.</DialogDescription>
          </DialogHeader>
          {spec.mode === "dropzone" ? config && <BulkDropzone config={config} priceToolId={toolId} onClose={() => setOpen(false)} /> : <BulkRunner toolId={toolId} spec={spec} appName={name} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
