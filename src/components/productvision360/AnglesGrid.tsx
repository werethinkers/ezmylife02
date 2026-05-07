import { Card } from "@/components/ui/card";
import { Loader2, AlertCircle, Check } from "lucide-react";
import { AngleResult } from "./types";

interface Props {
  results: AngleResult[];
}

export const AnglesGrid = ({ results }: Props) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {results.map((r) => (
        <Card key={r.angle} className="overflow-hidden bg-card/50 backdrop-blur border-border">
          <div className="aspect-square bg-muted/30 grid place-items-center relative">
            {r.status === "pending" && (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            )}
            {r.status === "failed" && (
              <div className="text-center p-3">
                <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            )}
            {r.status === "done" && r.url && (
              <>
                <img src={r.url} alt={r.angle} className="h-full w-full object-contain" />
                <div className="absolute top-2 right-2 rounded-full bg-primary/90 p-1">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              </>
            )}
          </div>
          <div className="p-2.5 border-t border-border">
            <p className="text-xs font-medium truncate">{r.angle}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};
