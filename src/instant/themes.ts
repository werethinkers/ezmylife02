import type { Theme } from "./types";

// Design variants. Each product picks the ones that suit it; the renderer reads them as CSS variables.
const t = (id: string, name: string, dark: boolean, c: Theme["c"], f: Theme["f"], fonts: string[]): Theme => ({ id, name, dark, c, f, fonts });

const FUN_F = { d: '"Bagel Fat One","Arial Rounded MT Bold",sans-serif', b: '"Outfit",system-ui,sans-serif', h: '"Caveat","Segoe Print",cursive' };
const FUN_FONTS = ["Bagel+Fat+One", "Outfit:wght@400;500;600;700", "Caveat:wght@500;700"];
const ELEG_F = { d: '"Playfair Display",Georgia,serif', b: '"Jost",system-ui,sans-serif', h: '"Dancing Script","Segoe Script",cursive' };
const ELEG_FONTS = ["Playfair+Display:ital,wght@0,500;0,700;1,500", "Jost:wght@400;500;600", "Dancing+Script:wght@500;700"];
const DESI_F = { d: '"Rozha One","Playfair Display",Georgia,serif', b: '"Mukta",system-ui,sans-serif', h: '"Kalam","Caveat",cursive' };
const DESI_FONTS = ["Rozha+One", "Mukta:wght@400;500;600;700", "Kalam:wght@400;700"];
const SPORT_F = { d: '"Anybody","Arial Black",sans-serif', b: '"Instrument Sans",system-ui,sans-serif', h: '"JetBrains Mono",ui-monospace,monospace' };
const SPORT_FONTS = ["Anybody:wdth,wght@50..150,400..900", "Instrument+Sans:wght@400;500;600;700", "JetBrains+Mono:wght@500;700"];
const CLEAN_F = { d: '"Bricolage Grotesque",system-ui,sans-serif', b: '"Figtree",system-ui,sans-serif', h: '"Caveat",cursive' };
const CLEAN_FONTS = ["Bricolage+Grotesque:opsz,wght@12..96,500..800", "Figtree:wght@400;500;600;700", "Caveat:wght@600"];
const LUXE_F = { d: '"Cormorant Garamond",Georgia,serif', b: '"Manrope",system-ui,sans-serif', h: '"Pinyon Script",cursive' };
const LUXE_FONTS = ["Cormorant+Garamond:ital,wght@0,500;0,700;1,500", "Manrope:wght@400;500;600;700", "Pinyon+Script"];
const EDIT_F = { d: '"Instrument Serif",Georgia,serif', b: '"Inter Tight",system-ui,sans-serif', h: '"Caveat",cursive' };
const EDIT_FONTS = ["Instrument+Serif:ital@0;1", "Inter+Tight:wght@400;500;600;700", "Caveat:wght@600"];
const FOOD_F = { d: '"Fraunces",Georgia,serif', b: '"DM Sans",system-ui,sans-serif', h: '"Gochi Hand",cursive' };
const FOOD_FONTS = ["Fraunces:opsz,wght@9..144,600..900", "DM+Sans:wght@400;500;700", "Gochi+Hand"];
const STREET_F = { d: '"Rubik Mono One","Arial Black",sans-serif', b: '"Rubik",system-ui,sans-serif', h: '"Permanent Marker",cursive' };
const STREET_FONTS = ["Rubik+Mono+One", "Rubik:wght@400;500;700", "Permanent+Marker"];

export const THEMES = {
  // celebrations
  fun: t("fun", "Fun", true, { bg: "#2A0E3B", sf: "#3B1652", tx: "#FFF5EA", mu: "#E0CFEA", ac: "#FF4F8B", ac2: "#FFC83D", ac3: "#2ECC9A", on: "#2A0E3B", line: "#54266F" }, FUN_F, FUN_FONTS),
  elegant: t("elegant", "Elegant", true, { bg: "#0E1630", sf: "#17213F", tx: "#F4EFE6", mu: "#B9B4C6", ac: "#D9B77A", ac2: "#F2DDB0", ac3: "#8FA6D9", on: "#0E1630", line: "#2A365C" }, ELEG_F, ELEG_FONTS),
  romantic: t("romantic", "Romantic", false, { bg: "#FFF0F3", sf: "#FFFFFF", tx: "#4A1022", mu: "#8C5566", ac: "#E0245E", ac2: "#F7A1B5", ac3: "#B4134A", on: "#FFFFFF", line: "#F6C9D4" }, ELEG_F, ELEG_FONTS),
  minimal: t("minimal", "Minimal", false, { bg: "#FAFAF7", sf: "#FFFFFF", tx: "#141414", mu: "#6B6B66", ac: "#2445D6", ac2: "#F2C230", ac3: "#E04E6A", on: "#FFFFFF", line: "#E4E3DE" }, EDIT_F, EDIT_FONTS),
  sunny: t("sunny", "Sunshine", false, { bg: "#FFF6D6", sf: "#FFFFFF", tx: "#2B2112", mu: "#7A6A45", ac: "#FF7A1A", ac2: "#2ECC9A", ac3: "#47B2FF", on: "#FFFFFF", line: "#F2DFA0" }, FUN_F, FUN_FONTS),
  solemn: t("solemn", "Quiet", true, { bg: "#1A1F25", sf: "#232A32", tx: "#ECE8E1", mu: "#A7A39B", ac: "#E8B65A", ac2: "#CFC6B5", ac3: "#7E9AA8", on: "#1A1F25", line: "#333B45" }, LUXE_F, LUXE_FONTS),
  lilac: t("lilac", "Lilac", false, { bg: "#F4EEFF", sf: "#FFFFFF", tx: "#2B1650", mu: "#6E5C93", ac: "#7B3FE4", ac2: "#FF8FB1", ac3: "#3CC8B4", on: "#FFFFFF", line: "#E0D3FA" }, CLEAN_F, CLEAN_FONTS),

  // festivals (one signature palette each)
  diwali: t("diwali", "Diya Night", true, { bg: "#2B0710", sf: "#3D0C18", tx: "#FFF1D6", mu: "#E9C9A6", ac: "#FFB300", ac2: "#FF6B2C", ac3: "#E9407A", on: "#2B0710", line: "#5A1424" }, DESI_F, DESI_FONTS),
  holi: t("holi", "Gulaal", false, { bg: "#FFFBF4", sf: "#FFFFFF", tx: "#26123A", mu: "#6C5A78", ac: "#FF2E88", ac2: "#16C172", ac3: "#FFB703", on: "#FFFFFF", line: "#F4E3EE" }, DESI_F, DESI_FONTS),
  rakhi: t("rakhi", "Rakhi Thread", false, { bg: "#FFF4E2", sf: "#FFFFFF", tx: "#4A0D0D", mu: "#8A5A3C", ac: "#C8102E", ac2: "#FF8F1F", ac3: "#E2B33C", on: "#FFFFFF", line: "#F3D9B0" }, DESI_F, DESI_FONTS),
  christmas: t("christmas", "Pine & Snow", true, { bg: "#0F3D2E", sf: "#14503C", tx: "#F6F3EA", mu: "#BFD3C7", ac: "#E23B3B", ac2: "#F4D06F", ac3: "#FFFFFF", on: "#FFFFFF", line: "#1F6A50" }, ELEG_F, ELEG_FONTS),
  newyear: t("newyear", "Midnight Gold", true, { bg: "#0A0F2C", sf: "#141B44", tx: "#F5F2E8", mu: "#B5B8D6", ac: "#F2C66D", ac2: "#C9D1FF", ac3: "#FF6FB5", on: "#0A0F2C", line: "#252E66" }, ELEG_F, ELEG_FONTS),
  eid: t("eid", "Crescent", true, { bg: "#0B3B3C", sf: "#0F4E4F", tx: "#F6F0E1", mu: "#B8D2CC", ac: "#E7C77B", ac2: "#7ED6C2", ac3: "#FFFFFF", on: "#0B3B3C", line: "#1D6667" }, DESI_F, DESI_FONTS),
  tiranga: t("tiranga", "Tiranga", false, { bg: "#FFFFFF", sf: "#FFF8F0", tx: "#0B1A3A", mu: "#4F5B73", ac: "#FF9933", ac2: "#138808", ac3: "#000080", on: "#FFFFFF", line: "#EDE6DA" }, DESI_F, DESI_FONTS),
  womens: t("womens", "She", true, { bg: "#3A1460", sf: "#4B1E78", tx: "#FFF3FB", mu: "#DCC8EE", ac: "#FF8AC5", ac2: "#FFD36E", ac3: "#B7A3FF", on: "#3A1460", line: "#5E2C8E" }, CLEAN_F, CLEAN_FONTS),
  ganesh: t("ganesh", "Modak", false, { bg: "#FFF3DF", sf: "#FFFFFF", tx: "#4A1405", mu: "#8A4B2A", ac: "#E4572E", ac2: "#FFC300", ac3: "#2E9E58", on: "#FFFFFF", line: "#F6D7A8" }, DESI_F, DESI_FONTS),
  navratri: t("navratri", "Garba", true, { bg: "#4A0C3A", sf: "#5E1149", tx: "#FFF0E0", mu: "#F0C9DC", ac: "#FFC300", ac2: "#FF4E8A", ac3: "#2EC4B6", on: "#4A0C3A", line: "#7A1A60" }, DESI_F, DESI_FONTS),
  kite: t("kite", "Kite Sky", false, { bg: "#E6F6FF", sf: "#FFFFFF", tx: "#0D2C4A", mu: "#4A6A86", ac: "#FF5D3A", ac2: "#FFC300", ac3: "#2E9E58", on: "#FFFFFF", line: "#C7E6F7" }, DESI_F, DESI_FONTS),
  jain: t("jain", "Ahimsa", false, { bg: "#FFFDF7", sf: "#FFFFFF", tx: "#3A1208", mu: "#7D5C49", ac: "#E7811F", ac2: "#8E1B1B", ac3: "#2E7D4F", on: "#FFFFFF", line: "#F1E4CC" }, DESI_F, DESI_FONTS),
  harvest: t("harvest", "Harvest", false, { bg: "#FFF8E6", sf: "#FFFFFF", tx: "#2F2108", mu: "#7A6334", ac: "#D9822B", ac2: "#3E8E41", ac3: "#E2B33C", on: "#FFFFFF", line: "#F1E0B3" }, DESI_F, DESI_FONTS),

  // events
  royal: t("royal", "Royal", true, { bg: "#3D0B17", sf: "#520F20", tx: "#FBF1DE", mu: "#E1C4A9", ac: "#D8B061", ac2: "#F3DDA6", ac3: "#E46A7E", on: "#3D0B17", line: "#6E1A2E" }, LUXE_F, LUXE_FONTS),
  floral: t("floral", "Floral", false, { bg: "#FBF6F1", sf: "#FFFFFF", tx: "#2F3A2F", mu: "#6F7B6C", ac: "#C9707F", ac2: "#7F9F7A", ac3: "#E3B9A0", on: "#FFFFFF", line: "#EADFD5" }, ELEG_F, ELEG_FONTS),
  traditional: t("traditional", "Marigold", false, { bg: "#FFF3D6", sf: "#FFFBF0", tx: "#5A0F0F", mu: "#8E5A2A", ac: "#B3261E", ac2: "#F2A900", ac3: "#2E7D4F", on: "#FFFFFF", line: "#F1D79A" }, DESI_F, DESI_FONTS),
  modern: t("modern", "Modern", false, { bg: "#F4F3EF", sf: "#FFFFFF", tx: "#111111", mu: "#5F5E58", ac: "#111111", ac2: "#C9A96E", ac3: "#7A8C7E", on: "#FFFFFF", line: "#DEDCD5" }, EDIT_F, EDIT_FONTS),
  corporate: t("corporate", "Keynote", true, { bg: "#0B1B33", sf: "#112646", tx: "#EEF3FA", mu: "#9FB1C8", ac: "#3D8BFF", ac2: "#7CE0C3", ac3: "#FFC857", on: "#FFFFFF", line: "#1E3A60" }, CLEAN_F, CLEAN_FONTS),
  playful: t("playful", "Playful", false, { bg: "#EFFBF6", sf: "#FFFFFF", tx: "#173A34", mu: "#4F756D", ac: "#FF8A65", ac2: "#4FC3A1", ac3: "#7EB6FF", on: "#FFFFFF", line: "#CDEEE2" }, FUN_F, FUN_FONTS),

  // business
  black: t("black", "Premium Black", true, { bg: "#0C0D0F", sf: "#15171A", tx: "#F1EFE9", mu: "#9A9DA3", ac: "#F2C230", ac2: "#2E6CDB", ac3: "#D9382C", on: "#0C0D0F", line: "#2A2E34" }, SPORT_F, SPORT_FONTS),
  energy: t("energy", "High Energy", true, { bg: "#101114", sf: "#191B20", tx: "#FFFFFF", mu: "#A2A6AF", ac: "#FF4D2E", ac2: "#FFD23F", ac3: "#3DDC97", on: "#FFFFFF", line: "#2B2E35" }, SPORT_F, SPORT_FONTS),
  luxury: t("luxury", "Luxury", true, { bg: "#111010", sf: "#1B1A19", tx: "#F3EEE6", mu: "#ABA399", ac: "#C9A45C", ac2: "#E6D3A8", ac3: "#8C7A5B", on: "#111010", line: "#2E2B28" }, LUXE_F, LUXE_FONTS),
  clean: t("clean", "Clean", false, { bg: "#F7F8FA", sf: "#FFFFFF", tx: "#111827", mu: "#5B6472", ac: "#2453E0", ac2: "#14B8A6", ac3: "#F59E0B", on: "#FFFFFF", line: "#E3E7EE" }, CLEAN_F, CLEAN_FONTS),
  blush: t("blush", "Blush", false, { bg: "#FFF5F4", sf: "#FFFFFF", tx: "#3B1D1F", mu: "#80585B", ac: "#C4566A", ac2: "#E8B4A6", ac3: "#7A9E8E", on: "#FFFFFF", line: "#F3DCD8" }, LUXE_F, LUXE_FONTS),
  fresh: t("fresh", "Fresh", false, { bg: "#F1FAF5", sf: "#FFFFFF", tx: "#0F2E22", mu: "#4D6B5E", ac: "#1E8E5A", ac2: "#F2B134", ac3: "#3A86FF", on: "#FFFFFF", line: "#D2EBDD" }, CLEAN_F, CLEAN_FONTS),
  trade: t("trade", "Toolbox", false, { bg: "#FFF9E8", sf: "#FFFFFF", tx: "#1B1B1B", mu: "#5E5A4E", ac: "#1B1B1B", ac2: "#FFC20E", ac3: "#E2483D", on: "#FFC20E", line: "#EDE2BF" }, SPORT_F, SPORT_FONTS),
  pro: t("pro", "Professional", false, { bg: "#F5F6F8", sf: "#FFFFFF", tx: "#0E1A2B", mu: "#56627A", ac: "#123A73", ac2: "#B08D57", ac3: "#2E7D6B", on: "#FFFFFF", line: "#DEE3EA" }, EDIT_F, EDIT_FONTS),
  clinic: t("clinic", "Care", false, { bg: "#F2FAFA", sf: "#FFFFFF", tx: "#0D2B33", mu: "#4F6E75", ac: "#0F8B8D", ac2: "#F2A65A", ac3: "#3A86FF", on: "#FFFFFF", line: "#D3EBEB" }, CLEAN_F, CLEAN_FONTS),
  studio: t("studio", "Studio", true, { bg: "#121212", sf: "#1C1C1C", tx: "#F2F2F2", mu: "#A3A3A3", ac: "#F5F5F5", ac2: "#FF6B6B", ac3: "#4ECDC4", on: "#121212", line: "#2E2E2E" }, EDIT_F, EDIT_FONTS),

  // menus
  bistro: t("bistro", "Bistro", true, { bg: "#16130F", sf: "#211C16", tx: "#F6EFE3", mu: "#B9AC98", ac: "#E3A33B", ac2: "#7FA37A", ac3: "#D5573B", on: "#16130F", line: "#352D23" }, FOOD_F, FOOD_FONTS),
  street: t("street", "Street", false, { bg: "#FFD60A", sf: "#FFF3B0", tx: "#121212", mu: "#4B4210", ac: "#121212", ac2: "#E63946", ac3: "#1D7A46", on: "#FFD60A", line: "#E6BE00" }, STREET_F, STREET_FONTS),
  cafe: t("cafe", "Cafe", false, { bg: "#F2ECE3", sf: "#FBF8F3", tx: "#3B2A20", mu: "#7A6656", ac: "#3B2A20", ac2: "#8FA382", ac3: "#C77D4A", on: "#F2ECE3", line: "#E0D5C6" }, FOOD_F, FOOD_FONTS),
  pastel: t("pastel", "Pastel", false, { bg: "#FFEEF3", sf: "#FFFFFF", tx: "#4A2A2A", mu: "#8B6262", ac: "#D9457B", ac2: "#7A4E2D", ac3: "#7CC6B1", on: "#FFFFFF", line: "#F6D2DE" }, FOOD_F, FOOD_FONTS),
  dhaba: t("dhaba", "Dhaba", false, { bg: "#FFF4E3", sf: "#FFFFFF", tx: "#3A0F0B", mu: "#7B4A36", ac: "#B3261E", ac2: "#2E7D32", ac3: "#F2A900", on: "#FFFFFF", line: "#F0D8B4" }, DESI_F, DESI_FONTS),
  boutique: t("boutique", "Boutique", false, { bg: "#F7F3EE", sf: "#FFFFFF", tx: "#1F1A17", mu: "#6E645B", ac: "#1F1A17", ac2: "#B48A5A", ac3: "#9C4F4F", on: "#FFFFFF", line: "#E6DED4" }, LUXE_F, LUXE_FONTS),

  // profiles
  paper: t("paper", "Paper", false, { bg: "#F6F6F3", sf: "#FFFFFF", tx: "#121212", mu: "#62625C", ac: "#1F4BFF", ac2: "#121212", ac3: "#FF8A3D", on: "#FFFFFF", line: "#E2E2DC" }, EDIT_F, EDIT_FONTS),
  ink: t("ink", "Ink", true, { bg: "#0F1115", sf: "#171A20", tx: "#ECEEF2", mu: "#9AA1AD", ac: "#7CC4FF", ac2: "#C3F584", ac3: "#FFB86B", on: "#0F1115", line: "#262B33" }, CLEAN_F, CLEAN_FONTS),
  creator: t("creator", "Creator", true, { bg: "#1A0B2E", sf: "#26123F", tx: "#FFF4FA", mu: "#D5C3E6", ac: "#FF5FA2", ac2: "#FFB547", ac3: "#7C5CFF", on: "#FFFFFF", line: "#3A2059" }, FUN_F, FUN_FONTS),
  navy: t("navy", "Executive", true, { bg: "#0A1A2F", sf: "#10243F", tx: "#EEF2F7", mu: "#9EB0C6", ac: "#C9A45C", ac2: "#7FB2E5", ac3: "#E6E1D6", on: "#0A1A2F", line: "#1D3657" }, LUXE_F, LUXE_FONTS),
} satisfies Record<string, Theme>;

export type ThemeId = keyof typeof THEMES;
export const pick = (...ids: ThemeId[]): Theme[] => ids.map((i) => THEMES[i]);

const loaded = new Set<string>();
export function loadThemeFonts(theme: Theme) {
  if (typeof document === "undefined") return;
  const missing = theme.fonts.filter((f) => !loaded.has(f));
  if (!missing.length) return;
  missing.forEach((f) => loaded.add(f));
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?" + missing.map((f) => "family=" + f).join("&") + "&display=swap";
  document.head.appendChild(link);
}

export function themeVars(theme: Theme): Record<string, string> {
  const { c, f } = theme;
  return {
    "--bg": c.bg, "--sf": c.sf, "--tx": c.tx, "--mu": c.mu, "--ac": c.ac, "--ac2": c.ac2, "--ac3": c.ac3,
    "--on": c.on, "--line": c.line, "--fd": f.d, "--fb": f.b, "--fh": f.h,
  };
}
