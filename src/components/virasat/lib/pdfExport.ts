import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Render an HTML element into a multi-page A4 PDF preserving images.
 * Videos render as their current frame poster.
 */
export async function exportElementToPdf(
  rootEl: HTMLElement,
  fileName: string,
): Promise<void> {
  // html2canvas can't snapshot <video>; replace each with its poster frame
  const videos = Array.from(rootEl.querySelectorAll("video"));
  const placeholders: Array<{ video: HTMLVideoElement; img: HTMLImageElement }> = [];
  for (const v of videos) {
    try {
      const c = document.createElement("canvas");
      c.width = v.videoWidth || 640;
      c.height = v.videoHeight || 360;
      const ctx = c.getContext("2d");
      if (ctx && v.readyState >= 2) ctx.drawImage(v, 0, 0, c.width, c.height);
      const img = document.createElement("img");
      img.src = c.toDataURL("image/png");
      img.style.cssText = v.style.cssText;
      img.style.width = v.style.width || `${v.clientWidth}px`;
      img.style.maxWidth = "100%";
      img.style.borderRadius = "12px";
      v.parentNode?.insertBefore(img, v);
      v.style.display = "none";
      placeholders.push({ video: v, img });
    } catch {
      /* ignore */
    }
  }

  try {
    const canvas = await html2canvas(rootEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#fdfaf6",
      logging: false,
      windowWidth: rootEl.scrollWidth,
    });

    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    pdf.addImage(dataUrl, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(dataUrl, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(fileName);
  } finally {
    // Restore videos
    for (const { video, img } of placeholders) {
      img.remove();
      video.style.display = "";
    }
  }
}
