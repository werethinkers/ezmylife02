/*
 * Runs only inside the iOS app shell (see docs/ios-app.md). In a browser it returns at once and
 * none of the native plugins are loaded, so the website stays the same size.
 *
 * What it adds inside the app:
 * - Downloads: web views can't save a file the way Safari does, so every download (a[download],
 *   blob: and data: links, FileSaver) opens the iPhone share sheet, with "Save to Files" and
 *   "Save Image" in it.
 * - Sharing: navigator.share opens the native share sheet, files included.
 * - The splash screen and status bar colours.
 */
import { isNativeApp } from "./nativeApp";

type ShareFile = { name: string; type: string; data: string };

const EXT_BY_TYPE: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/gif": "gif",
  "text/plain": "txt",
  "text/csv": "csv",
  "text/html": "html",
  "application/json": "json",
  "application/zip": "zip",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

const safeName = (name: string, type: string) => {
  let clean = (name || "ezyourlife-file").replace(/[\\/:*?"<>|]+/g, "-").trim() || "ezyourlife-file";
  if (!/\.[a-z0-9]{2,5}$/i.test(clean)) {
    const ext = EXT_BY_TYPE[type.split(";")[0].trim()];
    if (ext) clean = `${clean}.${ext}`;
  }
  return clean.slice(0, 120);
};

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

export async function initNativeApp() {
  if (!isNativeApp()) return;

  const [{ Share }, { Filesystem, Directory }, { SplashScreen }, { StatusBar, Style }, { Haptics, ImpactStyle }] =
    await Promise.all([
      import("@capacitor/share"),
      import("@capacitor/filesystem"),
      import("@capacitor/splash-screen"),
      import("@capacitor/status-bar"),
      import("@capacitor/haptics"),
    ]);

  document.documentElement.classList.add("native-app");
  StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  // Give the first page a moment to paint before the splash screen fades.
  setTimeout(() => SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {}), 300);

  const writeToCache = async (files: ShareFile[]) => {
    const uris: string[] = [];
    for (const f of files) {
      const path = `share/${Date.now()}-${f.name}`;
      const res = await Filesystem.writeFile({ path, data: f.data, directory: Directory.Cache, recursive: true });
      uris.push(res.uri);
    }
    return uris;
  };

  const shareFiles = async (files: ShareFile[], text?: string, title?: string) => {
    const uris = await writeToCache(files);
    await Share.share({ files: uris, text, title, dialogTitle: title });
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  };

  // Native share sheet for the site's existing navigator.share calls.
  const nativeShare = async (data: ShareData = {}) => {
    try {
      const files = data.files?.length
        ? await Promise.all(
            data.files.map(async (f) => ({ name: safeName(f.name, f.type), type: f.type, data: await blobToBase64(f) })),
          )
        : [];
      if (files.length) {
        const uris = await writeToCache(files);
        await Share.share({ files: uris, text: data.text, title: data.title, url: data.url });
      } else {
        await Share.share({ text: data.text, title: data.title, url: data.url });
      }
    } catch (e) {
      // Closing the share sheet is not an error for the page; match the web API's AbortError.
      const msg = e instanceof Error ? e.message : String(e);
      if (/cancel/i.test(msg)) throw new DOMException("Share canceled", "AbortError");
      throw e;
    }
  };
  try {
    Object.defineProperty(navigator, "share", { configurable: true, value: nativeShare });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
  } catch {
    /* leave the web version */
  }

  // Downloads → share sheet ("Save to Files", "Save Image", WhatsApp, Mail...).
  const download = async (href: string, suggested: string) => {
    try {
      const res = await fetch(href);
      const blob = await res.blob();
      const fromUrl = (() => {
        try {
          const u = new URL(href);
          return u.protocol.startsWith("http") ? decodeURIComponent(u.pathname.split("/").pop() || "") : "";
        } catch {
          return "";
        }
      })();
      const name = safeName(suggested || fromUrl, blob.type || "");
      await shareFiles([{ name, type: blob.type, data: await blobToBase64(blob) }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!/cancel/i.test(msg)) console.warn("[app] download failed", e);
    }
  };

  const isDownloadLink = (a: HTMLAnchorElement) => {
    const href = a.getAttribute("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) return false;
    return a.hasAttribute("download") || href.startsWith("blob:") || href.startsWith("data:");
  };

  // Real taps on download links that are on the page.
  document.addEventListener(
    "click",
    (e) => {
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !(a instanceof HTMLAnchorElement) || !isDownloadLink(a)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      download(a.href, a.getAttribute("download") || "");
    },
    true,
  );

  // Code-made links that are never added to the page (FileSaver and most "Download" buttons).
  const proto = HTMLAnchorElement.prototype;
  const origClick = proto.click;
  proto.click = function (this: HTMLAnchorElement) {
    if (!this.isConnected && isDownloadLink(this)) {
      download(this.href, this.getAttribute("download") || "");
      return;
    }
    return origClick.call(this);
  };
  const origDispatch = proto.dispatchEvent;
  proto.dispatchEvent = function (this: HTMLAnchorElement, ev: Event) {
    if (ev.type === "click" && !this.isConnected && isDownloadLink(this)) {
      download(this.href, this.getAttribute("download") || "");
      return false;
    }
    return origDispatch.call(this, ev);
  };

  // window.open(blobUrl) is another common way pages "download" a generated file.
  const origOpen = window.open.bind(window);
  window.open = ((url?: string | URL, target?: string, features?: string) => {
    const href = url ? String(url) : "";
    if (href.startsWith("blob:") || href.startsWith("data:")) {
      download(href, "");
      return null;
    }
    return origOpen(url, target, features);
  }) as typeof window.open;
}
