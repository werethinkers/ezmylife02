import { useSyncExternalStore } from "react";

/*
 * Light or dark for the modern look. The choice is remembered in this browser and shared by every
 * modern page, its header and the phone tab bar. The rest of the site has no dark mode, so the
 * choice only applies while a modern page is on screen.
 */

const KEY = "ez.theme.v1";
type Mode = "light" | "dark";

function readMode(): Mode {
  try {
    return localStorage.getItem(KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

let mode: Mode = readMode();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function toggleModernTheme() {
  mode = mode === "dark" ? "light" : "dark";
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* storage blocked: the choice lasts until the page reloads */
  }
  listeners.forEach((l) => l());
}

export function useModernTheme() {
  const dark = useSyncExternalStore(subscribe, () => mode === "dark", () => false);
  return { dark, toggle: toggleModernTheme };
}

/**
 * Pages drawn in the modern look. Parts of the site chrome that live outside the page (the phone
 * tab bar) read this to match. Add a path here when a new page is wrapped in <ModernPage>.
 */
const MODERN_PATHS = [
  /^\/$/,
  /^\/ai-apps\/?$/,
  /^\/websites\/?$/,
  /^\/cards\/?$/,
  /^\/create\/?$/,
  /^\/studios\/?$/,
  /^\/credits\/?$/,
  /^\/about\/?$/,
  /^\/auth\/?$/,
  /^\/creators\/?$/,
  /^\/list-your-app\/?$/,
  /^\/explore\/?$/,
  /^\/promo\/.+$/,
  /^\/make\/.+$/,
];

export const isModernPath = (pathname: string) => MODERN_PATHS.some((r) => r.test(pathname));
