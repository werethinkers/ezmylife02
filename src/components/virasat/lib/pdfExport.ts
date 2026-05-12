import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Render a Virasat book DOM tree into a clean, A4 "book-style" PDF.
 *
 * Strategy:
 *   1. Build an offscreen, fixed-width A4 clone of the book content with
 *      print-tuned typography (serif, drop caps, indent, generous leading).
 *   2. Walk every element marked [data-pdf-section] and rasterise each one
 *      individually with html2canvas.
 *   3. Place each section onto the jsPDF page; if it would overflow, push
 *      a new page first. This avoids the mid-paragraph slicing that the
 *      old "rasterise everything then chop" approach produced.
 */
export async function exportElementToPdf(
  rootEl: HTMLElement,
  fileName: string,
): Promise<void> {
  // A4 in mm
  const PAGE_W_MM = 210;
  const PAGE_H_MM = 297;
  const MARGIN_MM = 18;
  const CONTENT_W_MM = PAGE_W_MM - MARGIN_MM * 2;
  const CONTENT_H_MM = PAGE_H_MM - MARGIN_MM * 2;
  const SECTION_GAP_MM = 3;

  // Pixel width matching A4 content area (≈ 96dpi). 794px ≈ 210mm; we use
  // 720px so the on-page typography reads at ~ book-page size.
  const CLONE_PX_W = 720;

  // Build offscreen clone of the book element
  const clone = rootEl.cloneNode(true) as HTMLElement;

  // Replace videos with their current frame (html2canvas can't snapshot <video>)
  clone.querySelectorAll("video").forEach((v) => {
    try {
      const original = rootEl.querySelector(
        `video[src="${(v as HTMLVideoElement).src}"]`,
      ) as HTMLVideoElement | null;
      const c = document.createElement("canvas");
      c.width = original?.videoWidth || 640;
      c.height = original?.videoHeight || 360;
      const ctx = c.getContext("2d");
      if (ctx && original && original.readyState >= 2) {
        ctx.drawImage(original, 0, 0, c.width, c.height);
      }
      const img = document.createElement("img");
      img.src = c.toDataURL("image/png");
      img.style.width = "100%";
      img.style.borderRadius = "12px";
      v.replaceWith(img);
    } catch {
      /* ignore */
    }
  });

  // Wrapper that mimics a printed book page
  const stage = document.createElement("div");
  stage.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    `width:${CLONE_PX_W}px`,
    "padding:48px 56px",
    "background:#fdfaf6",
    "color:#2a1d12",
    "font-family:'Georgia','Cambria','Times New Roman',serif",
    "font-size:16px",
    "line-height:1.85",
    "box-sizing:border-box",
    "z-index:-1",
  ].join(";");

  // Inject print-tuned CSS scoped to the stage
  const style = document.createElement("style");
  style.textContent = `
    .pdf-stage h1 { font-size: 32px; line-height: 1.25; text-align: center;
      color:#8b5e3c; margin: 0 0 28px; padding-bottom: 16px;
      border-bottom: 1px solid rgba(139,94,60,0.25); font-weight: 700; }
    .pdf-stage h2 { font-size: 22px; line-height: 1.3; color:#a06b3b;
      font-style: italic; margin: 28px 0 14px; font-weight: 600; }
    .pdf-stage h3 { font-size: 18px; color:#8b5e3c; margin: 20px 0 10px; }
    .pdf-stage p  { font-size: 16px; line-height: 1.85; margin: 0 0 14px;
      text-align: justify; text-indent: 1.6em; hyphens: auto; }
    .pdf-stage p:first-of-type, .pdf-stage h1 + p, .pdf-stage h2 + p, .pdf-stage h3 + p { text-indent: 0; }
    .pdf-stage h1 + p::first-letter, .pdf-stage h2 + p::first-letter {
      font-size: 3.2em; font-weight: 700; float: left; line-height: 0.9;
      padding: 4px 8px 0 0; color:#8b5e3c; font-family: 'Georgia',serif;
    }
    .pdf-stage hr { border: none; border-top: 1px solid rgba(139,94,60,0.18);
      margin: 22px auto; width: 60%; }
    .pdf-stage img { max-width: 100%; height: auto; border-radius: 8px; }
    .pdf-stage [data-pdf-section] { page-break-inside: avoid; }
    .pdf-stage .pdf-media-grid { display: grid; grid-template-columns: 1fr 1fr;
      gap: 12px; margin: 12px 0; }
    .pdf-stage .pdf-media-grid figure { margin: 0; text-align: center;
      border: 1px solid rgba(139,94,60,0.15); border-radius: 8px; overflow: hidden;
      background: #fff; }
    .pdf-stage .pdf-media-grid figcaption { font-size: 11px; padding: 4px;
      color: #7a6a5a; font-style: italic; }
  `;

  stage.classList.add("pdf-stage");
  stage.appendChild(style);
  // Use the cloned book *inner* content (drop the outer chrome backgrounds)
  stage.appendChild(clone);
  document.body.appendChild(stage);

  // Wait for fonts + images to settle
  await new Promise((r) => setTimeout(r, 60));
  try {
    const fonts = (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts;
    if (fonts?.ready) await fonts.ready;
  } catch { /* ignore */ }
  await Promise.all(
    Array.from(stage.querySelectorAll("img")).map(
      (img) =>
        new Promise<void>((res) => {
          if ((img as HTMLImageElement).complete) return res();
          img.addEventListener("load", () => res(), { once: true });
          img.addEventListener("error", () => res(), { once: true });
        }),
    ),
  );

  try {
    let sections = Array.from(
      stage.querySelectorAll<HTMLElement>("[data-pdf-section]"),
    );
    // Fallback: if the source DOM wasn't tagged, treat each direct prose child as a section.
    if (sections.length === 0) {
      const prose = stage.querySelector<HTMLElement>(".prose") || stage;
      sections = Array.from(prose.children) as HTMLElement[];
    }

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    let cursorY = MARGIN_MM;
    let firstSection = true;

    for (const section of sections) {
      if (!section || section.offsetHeight === 0) continue;

      const canvas = await html2canvas(section, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fdfaf6",
        logging: false,
        windowWidth: CLONE_PX_W,
      });
      const sectionWidthPx = canvas.width / 2;
      const sectionHeightPx = canvas.height / 2;
      const heightMM = (sectionHeightPx * CONTENT_W_MM) / sectionWidthPx;

      // If a single section is taller than a page, slice it across pages.
      if (heightMM > CONTENT_H_MM) {
        const sliceMM = CONTENT_H_MM;
        const slicePx = (sliceMM / heightMM) * canvas.height;
        let yPx = 0;
        while (yPx < canvas.height) {
          if (!firstSection) {
            pdf.addPage();
          }
          firstSection = false;
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = Math.min(slicePx, canvas.height - yPx);
          const sctx = sliceCanvas.getContext("2d");
          if (sctx) {
            sctx.fillStyle = "#fdfaf6";
            sctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
            sctx.drawImage(canvas, 0, -yPx);
          }
          const sliceHeightMM = (sliceCanvas.height / canvas.height) * heightMM;
          pdf.addImage(
            sliceCanvas.toDataURL("image/jpeg", 0.92),
            "JPEG",
            MARGIN_MM,
            MARGIN_MM,
            CONTENT_W_MM,
            sliceHeightMM,
          );
          yPx += sliceCanvas.height;
          cursorY = MARGIN_MM + sliceHeightMM + SECTION_GAP_MM;
        }
        continue;
      }

      const remaining = PAGE_H_MM - MARGIN_MM - cursorY;
      if (heightMM > remaining && !firstSection) {
        pdf.addPage();
        cursorY = MARGIN_MM;
      }
      firstSection = false;

      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.92),
        "JPEG",
        MARGIN_MM,
        cursorY,
        CONTENT_W_MM,
        heightMM,
      );
      cursorY += heightMM + SECTION_GAP_MM;
    }

    pdf.save(fileName);
  } finally {
    stage.remove();
  }
}
