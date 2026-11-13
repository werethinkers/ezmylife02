import { Download, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { canShareFile, saveFile, shareFile } from "./save";
import type { PreparedPdf } from "./usePreparedPdf";

/** The PDF pages as they will print, with Download and (on phones) Share. */
export function PdfView({ prepared, fileName, title }: { prepared: PreparedPdf; fileName: string; title: string }) {
  const pdf = prepared.state === "ready" ? prepared.pdf : prepared.state === "making" ? prepared.previous : undefined;
  const ready = prepared.state === "ready";
  const name = `${fileName}.pdf`;
  const shareable = ready && canShareFile(prepared.pdf.blob, name);

  if (prepared.state === "error") {
    return (
      <p className="rounded-xl border-2 border-coral bg-coral/10 p-3 text-sm">
        The PDF could not be made on this device. Use Word or Text from the Save menu instead.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          className="gap-1.5"
          disabled={!ready}
          onClick={() => ready && void saveFile(prepared.pdf.blob, name, title)}
        >
          {ready ? <Download className="h-3.5 w-3.5" /> : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {ready ? `Download PDF · ${prepared.pdf.pages} ${prepared.pdf.pages === 1 ? "page" : "pages"}` : "Making your PDF…"}
        </Button>
        {shareable && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={async () => {
              if (!(await shareFile(prepared.pdf.blob, name, title))) toast.error("Sharing didn't work here. Download the PDF and send it instead.");
            }}
          >
            <Share2 className="h-3.5 w-3.5" /> Send PDF
          </Button>
        )}
        {prepared.state === "making" && prepared.total > 0 && (
          <span className="text-xs text-muted-foreground" aria-live="polite">
            Page {prepared.done} of {prepared.total}
          </span>
        )}
      </div>
      {pdf ? (
        <div className={ready ? "" : "opacity-60"}>
          <div className="flex snap-x gap-3 overflow-x-auto pb-2">
            {pdf.previews.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Page ${i + 1} of ${pdf.pages}`}
                className="h-auto w-[240px] shrink-0 snap-start rounded border border-ink/20 bg-white shadow-block-sm sm:w-[300px]"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-ink/30 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Laying out the pages…
        </div>
      )}
    </div>
  );
}
