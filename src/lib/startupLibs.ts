// The Startup Analyser relies on a few large browser libraries (Chart.js, Showdown,
// Mermaid, PDF.js) that it reads from `window`. They used to load in index.html on every
// page, blocking first paint site-wide; now they load only when the analyser needs them.

const SCRIPTS = [
  "https://cdn.jsdelivr.net/npm/chart.js",
  "https://cdnjs.cloudflare.com/ajax/libs/showdown/2.1.0/showdown.min.js",
  "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
];
const PDF_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

let pending: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing?.dataset.loaded === "true") return resolve();
    const el = existing ?? document.createElement("script");
    el.addEventListener("load", () => {
      el.dataset.loaded = "true";
      resolve();
    });
    el.addEventListener("error", () => reject(new Error(`Could not load ${src}`)));
    if (!existing) {
      el.src = src;
      el.async = true;
      document.head.appendChild(el);
    }
  });
}

/** Loads the analyser's libraries once; later calls reuse the same promise. */
export function ensureStartupLibs(): Promise<void> {
  if (!pending) {
    pending = Promise.all(SCRIPTS.map(loadScript))
      .then(() => {
        const w = window as unknown as {
          mermaid?: { initialize: (cfg: Record<string, unknown>) => void };
          pdfjsLib?: { GlobalWorkerOptions: { workerSrc: string } };
        };
        w.mermaid?.initialize({ startOnLoad: false, theme: "neutral" });
        if (w.pdfjsLib) w.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER;
      })
      .catch((err) => {
        pending = null; // allow a retry on the next call
        throw err;
      });
  }
  return pending;
}
