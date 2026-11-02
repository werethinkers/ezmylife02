import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// After a new deploy, an open tab may request old file names that no longer exist
// ("Importing a module script failed"). Reload once to pick up the new version.
const RELOAD_KEY = "ez-chunk-reload-at";
const isChunkError = (msg: string) =>
  /Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module|Unable to preload CSS/i.test(msg);
const recover = () => {
  const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
  if (Date.now() - last < 10_000) return; // avoid reload loops
  sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  window.location.reload();
};
window.addEventListener("vite:preloadError", (e) => {
  e.preventDefault();
  recover();
});
window.addEventListener("unhandledrejection", (e) => {
  const msg = String((e.reason && (e.reason.message || e.reason)) || "");
  if (isChunkError(msg)) recover();
});
window.addEventListener("error", (e) => {
  if (isChunkError(String(e.message || ""))) recover();
});

createRoot(document.getElementById("root")!).render(<App />);
