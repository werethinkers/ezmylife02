import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyTextToClipboard } from "../lib/clipboard";

export function CopyButton({ text, label = "Copy", size = "sm", variant = "outline" }: {
  text: string;
  label?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "outline" | "default" | "ghost" | "secondary";
}) {
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={async () => {
        await copyTextToClipboard(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {size !== "icon" && <span className="ml-1">{done ? "Copied" : label}</span>}
    </Button>
  );
}
