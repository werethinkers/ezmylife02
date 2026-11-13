/*
 * ID, passport and exam photos laid out at their exact print size on A4 or 4×6 inch paper,
 * with cut marks. Drawn straight with jsPDF in millimetres, so a print at 100% gives the true size.
 */

export type Paper = "a4" | "4x6";

const PAPER: Record<Paper, { w: number; h: number; label: string }> = {
  a4: { w: 210, h: 297, label: "A4" },
  "4x6": { w: 101.6, h: 152.4, label: "4 × 6 inch" },
};

/** How many photos fit, in columns and rows, with a 3 mm gap and an 8 mm edge. */
export function sheetFit(paper: Paper, wMm: number, hMm: number) {
  const p = PAPER[paper];
  const gap = 3;
  const edge = paper === "a4" ? 12 : 5;
  const foot = paper === "a4" ? 16 : 9;
  const cols = Math.max(1, Math.floor((p.w - 2 * edge + gap) / (wMm + gap)));
  const rows = Math.max(1, Math.floor((p.h - edge - foot + gap) / (hMm + gap)));
  return { cols, rows, per: cols * rows, gap, edge, foot };
}

export async function makePhotoSheetPdf(opts: {
  /** One finished photo (already cropped to the right shape), as a data URL. */
  photo: string;
  wMm: number;
  hMm: number;
  /** Copies wanted; the sheet is filled up to what fits. */
  copies: number;
  paper: Paper;
  label: string;
}): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const p = PAPER[opts.paper];
  const fit = sheetFit(opts.paper, opts.wMm, opts.hMm);
  const n = Math.min(Math.max(1, opts.copies), fit.per * 4);
  const pages = Math.ceil(n / fit.per);
  const pdf = new jsPDF({ unit: "mm", format: [p.w, p.h], orientation: "portrait", compress: true });
  pdf.setProperties({ title: `${opts.label} photos`, creator: "ezyourlife.com" });
  const gridW = fit.cols * opts.wMm + (fit.cols - 1) * fit.gap;
  const x0 = (p.w - gridW) / 2;
  const fmt = opts.photo.startsWith("data:image/png") ? "PNG" : "JPEG";
  for (let pg = 0; pg < pages; pg++) {
    if (pg) pdf.addPage([p.w, p.h], "portrait");
    const onPage = Math.min(fit.per, n - pg * fit.per);
    for (let i = 0; i < onPage; i++) {
      const x = x0 + (i % fit.cols) * (opts.wMm + fit.gap);
      const y = fit.edge + Math.floor(i / fit.cols) * (opts.hMm + fit.gap);
      pdf.addImage(opts.photo, fmt, x, y, opts.wMm, opts.hMm, "photo", "FAST");
      // Cut marks just outside each corner.
      pdf.setDrawColor(150);
      pdf.setLineWidth(0.15);
      const m = 1.2;
      for (const [cx, cy, dx, dy] of [
        [x, y, -1, -1],
        [x + opts.wMm, y, 1, -1],
        [x, y + opts.hMm, -1, 1],
        [x + opts.wMm, y + opts.hMm, 1, 1],
      ]) {
        pdf.line(cx, cy + dy * 0.3, cx, cy + dy * (0.3 + m));
        pdf.line(cx + dx * 0.3, cy, cx + dx * (0.3 + m), cy);
      }
    }
    const fs = opts.paper === "a4" ? 8.5 : 6;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(fs);
    pdf.setTextColor(20);
    const by = p.h - fit.foot + (opts.paper === "a4" ? 6 : 3.5);
    pdf.setDrawColor(20);
    pdf.setLineWidth(0.25);
    pdf.line(x0, by - fs * 0.5, p.w - x0, by - fs * 0.5);
    pdf.text(`${opts.label} · ${opts.wMm} × ${opts.hMm} mm`, x0, by);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${onPage} photos on ${p.label} paper. Print at 100% (turn off "fit to page"), then cut along the marks.`, x0, by + fs * 0.45);
    pdf.text(`Made with ezyourlife.com${pages > 1 ? ` · Page ${pg + 1} of ${pages}` : ""}`, p.w - x0, by, { align: "right" });
  }
  return pdf.output("blob");
}
