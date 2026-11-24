import type { Style, Theme } from "./types";

// Design variants. Each product offers ten; the renderer reads the colours and fonts as CSS variables
// and the style (`s`) as a layout: bold type, a full photo, a split screen, an editorial page, soft shapes or minimal.
// Theme ids are stored on published pages, so never rename or remove one.
const STYLE: Record<string, Style> = {
  fun: "soft", elegant: "editorial", romantic: "soft", minimal: "minimal", sunny: "soft", solemn: "editorial", lilac: "soft",
  royal: "editorial", floral: "soft", traditional: "editorial", modern: "minimal", corporate: "split", playful: "soft",
  black: "bold", energy: "photo", luxury: "editorial", clean: "split", blush: "soft", fresh: "split", trade: "bold", pro: "editorial", clinic: "split", studio: "photo",
  bistro: "photo", street: "bold", cafe: "editorial", pastel: "soft", dhaba: "bold", boutique: "editorial",
  paper: "minimal", ink: "bold", creator: "photo", navy: "editorial",
  diwali: "photo", rajwada: "bold", holi: "soft", rakhi: "editorial", christmas: "photo", newyear: "photo", eid: "editorial", tiranga: "minimal",
  womens: "soft", ganesh: "editorial", navratri: "photo", kite: "split", jain: "editorial", harvest: "split",
};
const t = (id: string, name: string, dark: boolean, c: Theme["c"], f: Theme["f"], fonts: string[], s?: Style): Theme => ({ id, name, dark, s: s ?? STYLE[id] ?? "bold", c, f, fonts });

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
const GROT_F = { d: '"Syne","Arial Black",sans-serif', b: '"Plus Jakarta Sans",system-ui,sans-serif', h: '"Caveat",cursive' };
const GROT_FONTS = ["Syne:wght@600;700;800", "Plus+Jakarta+Sans:wght@400;500;600;700", "Caveat:wght@600"];
const SOFT_F = { d: '"DM Serif Display",Georgia,serif', b: '"Nunito Sans",system-ui,sans-serif', h: '"Sacramento",cursive' };
const SOFT_FONTS = ["DM+Serif+Display:ital@0;1", "Nunito+Sans:wght@400;600;700;800", "Sacramento"];
const SWISS_F = { d: '"Archivo","Arial Black",sans-serif', b: '"Archivo",system-ui,sans-serif', h: '"Caveat",cursive' };
const SWISS_FONTS = ["Archivo:wdth,wght@62..125,400..900", "Caveat:wght@600"];

export const THEMES = {
  // celebrations
  fun: t("fun", "Fun", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, FUN_F, FUN_FONTS),
  elegant: t("elegant", "Elegant", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, ELEG_F, ELEG_FONTS),
  romantic: t("romantic", "Romantic", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, ELEG_F, ELEG_FONTS),
  minimal: t("minimal", "Minimal", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, EDIT_F, EDIT_FONTS),
  sunny: t("sunny", "Sunshine", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, FUN_F, FUN_FONTS),
  solemn: t("solemn", "Quiet", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, LUXE_F, LUXE_FONTS),
  lilac: t("lilac", "Lilac", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, CLEAN_F, CLEAN_FONTS),

  // festivals (one signature palette each)
  diwali: t("diwali", "Diya Night", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, DESI_F, DESI_FONTS),
  rajwada: t("rajwada", "Rajwada Raat", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, DESI_F, DESI_FONTS),
  holi: t("holi", "Gulaal", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, DESI_F, DESI_FONTS),
  rakhi: t("rakhi", "Rakhi Thread", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, DESI_F, DESI_FONTS),
  christmas: t("christmas", "Pine & Snow", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, ELEG_F, ELEG_FONTS),
  newyear: t("newyear", "Midnight Gold", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, ELEG_F, ELEG_FONTS),
  eid: t("eid", "Crescent", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, DESI_F, DESI_FONTS),
  tiranga: t("tiranga", "Tiranga", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, DESI_F, DESI_FONTS),
  womens: t("womens", "She", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, CLEAN_F, CLEAN_FONTS),
  ganesh: t("ganesh", "Modak", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, DESI_F, DESI_FONTS),
  navratri: t("navratri", "Garba", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, DESI_F, DESI_FONTS),
  kite: t("kite", "Kite Sky", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, DESI_F, DESI_FONTS),
  jain: t("jain", "Ahimsa", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, DESI_F, DESI_FONTS),
  harvest: t("harvest", "Harvest", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, DESI_F, DESI_FONTS),

  // events
  royal: t("royal", "Royal", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, LUXE_F, LUXE_FONTS),
  floral: t("floral", "Floral", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, ELEG_F, ELEG_FONTS),
  traditional: t("traditional", "Marigold", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, DESI_F, DESI_FONTS),
  modern: t("modern", "Modern", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, EDIT_F, EDIT_FONTS),
  corporate: t("corporate", "Keynote", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, CLEAN_F, CLEAN_FONTS),
  playful: t("playful", "Playful", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, FUN_F, FUN_FONTS),

  // business
  black: t("black", "Premium Black", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, SPORT_F, SPORT_FONTS),
  energy: t("energy", "High Energy", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, SPORT_F, SPORT_FONTS),
  luxury: t("luxury", "Luxury", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, LUXE_F, LUXE_FONTS),
  clean: t("clean", "Clean", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, CLEAN_F, CLEAN_FONTS),
  blush: t("blush", "Blush", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, LUXE_F, LUXE_FONTS),
  fresh: t("fresh", "Fresh", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, CLEAN_F, CLEAN_FONTS),
  trade: t("trade", "Toolbox", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, SPORT_F, SPORT_FONTS),
  pro: t("pro", "Professional", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, EDIT_F, EDIT_FONTS),
  clinic: t("clinic", "Care", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, CLEAN_F, CLEAN_FONTS),
  studio: t("studio", "Studio", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, EDIT_F, EDIT_FONTS),

  // menus
  bistro: t("bistro", "Bistro", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, FOOD_F, FOOD_FONTS),
  street: t("street", "Street", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, STREET_F, STREET_FONTS),
  cafe: t("cafe", "Cafe", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, FOOD_F, FOOD_FONTS),
  pastel: t("pastel", "Pastel", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, FOOD_F, FOOD_FONTS),
  dhaba: t("dhaba", "Dhaba", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, DESI_F, DESI_FONTS),
  boutique: t("boutique", "Boutique", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, LUXE_F, LUXE_FONTS),

  // profiles
  paper: t("paper", "Paper", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, EDIT_F, EDIT_FONTS),
  ink: t("ink", "Ink", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, CLEAN_F, CLEAN_FONTS),
  creator: t("creator", "Creator", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, FUN_F, FUN_FONTS),
  navy: t("navy", "Executive", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, LUXE_F, LUXE_FONTS),

  // added October 2026: a wider library so every product offers ten designs
  neon: t("neon", "Neon Night", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, SPORT_F, SPORT_FONTS, "photo"),
  forest: t("forest", "Forest", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, LUXE_F, LUXE_FONTS, "photo"),
  sand: t("sand", "Sandstone", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, EDIT_F, EDIT_FONTS, "editorial"),
  ocean: t("ocean", "Ocean", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, CLEAN_F, CLEAN_FONTS, "split"),
  sunset: t("sunset", "Sunset", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, SOFT_F, SOFT_FONTS, "soft"),
  mono: t("mono", "Monochrome", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, SWISS_F, SWISS_FONTS, "minimal"),
  rose: t("rose", "Rose Gold", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, LUXE_F, LUXE_FONTS, "photo"),
  sage: t("sage", "Sage", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, SOFT_F, SOFT_FONTS, "soft"),
  cobalt: t("cobalt", "Cobalt", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, GROT_F, GROT_FONTS, "bold"),
  terracotta: t("terracotta", "Terracotta", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, FOOD_F, FOOD_FONTS, "split"),
  saffron: t("saffron", "Saffron", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, DESI_F, DESI_FONTS, "editorial"),
  charcoal: t("charcoal", "Charcoal", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, SWISS_F, SWISS_FONTS, "split"),
  ivory: t("ivory", "Ivory & Gold", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, LUXE_F, LUXE_FONTS, "editorial"),
  mint: t("mint", "Mint", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, CLEAN_F, CLEAN_FONTS, "soft"),
  plum: t("plum", "Plum Velvet", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, ELEG_F, ELEG_FONTS, "photo"),
  slate: t("slate", "Slate", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, GROT_F, GROT_FONTS, "minimal"),
  crimson: t("crimson", "Crimson", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, SPORT_F, SPORT_FONTS, "split"),
  lemon: t("lemon", "Lemonade", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, GROT_F, GROT_FONTS, "bold"),
  marigold: t("marigold", "Marigold Night", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, DESI_F, DESI_FONTS, "photo"),
  peacock: t("peacock", "Peacock", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, DESI_F, DESI_FONTS, "editorial"),
  blossom: t("blossom", "Blossom", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, SOFT_F, SOFT_FONTS, "photo"),
  // added October 2026 for schools, stays and shops: each kind of business gets its own signature look
  campus: t("campus", "Campus", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, GROT_F, GROT_FONTS, "split"),
  chalk: t("chalk", "Chalkboard", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, FOOD_F, FOOD_FONTS, "bold"),
  crayon: t("crayon", "Crayon Box", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, FUN_F, FUN_FONTS, "soft"),
  heritage: t("heritage", "Haveli", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, LUXE_F, LUXE_FONTS, "editorial"),
  lagoon: t("lagoon", "Lagoon", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, SOFT_F, SOFT_FONTS, "photo"),
  dorm: t("dorm", "Dorm Life", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, GROT_F, GROT_FONTS, "bold"),
  pharma: t("pharma", "Pharmacy Green", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, CLEAN_F, CLEAN_FONTS, "split"),
  techno: t("techno", "Techno", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, GROT_F, GROT_FONTS, "bold"),
  volt: t("volt", "Volt", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, SWISS_F, SWISS_FONTS, "minimal"),
  grocer: t("grocer", "Fresh Market", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, FOOD_F, FOOD_FONTS, "split"),
  steel: t("steel", "Steel & Spark", true, { bg: "#17130F", sf: "#221C16", tx: "#F5F1E6", mu: "#B8AFA0", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#F5F1E6" }, SPORT_F, SPORT_FONTS, "bold"),
  kisan: t("kisan", "Kisan", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, DESI_F, DESI_FONTS, "editorial"),
  notebook: t("notebook", "Notebook", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, EDIT_F, EDIT_FONTS, "minimal"),
  optic: t("optic", "Optic", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, EDIT_F, EDIT_FONTS, "split"),
  paws: t("paws", "Paws", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, FUN_F, FUN_FONTS, "soft"),
  depot: t("depot", "Depot", false, { bg: "#FAF7F0", sf: "#FFFFFF", tx: "#111111", mu: "#4B4B4B", ac: "#F472D0", ac2: "#FACC15", ac3: "#C8E967", on: "#111111", line: "#111111" }, SWISS_F, SWISS_FONTS, "split"),
} satisfies Record<string, Theme>;

export type ThemeId = keyof typeof THEMES;
export const pick = (...ids: ThemeId[]): Theme[] => ids.map((i) => THEMES[i]);

// Ten designs per product: the product's own picks first (so existing pages keep their design),
// then the mood's list, without repeats.
export const MOODS = {
  fitness: ["black", "energy", "crimson", "neon", "charcoal", "clean", "cobalt", "mono", "luxury", "lemon"],
  wellness: ["fresh", "forest", "sage", "luxury", "sand", "clean", "mint", "blush", "ivory", "plum"],
  beauty: ["blush", "rose", "luxury", "ivory", "blossom", "sand", "mono", "sage", "plum", "black"],
  festive: ["saffron", "traditional", "marigold", "peacock", "blush", "plum", "ivory", "sunset", "rose", "royal"],
  bakery: ["pastel", "cafe", "terracotta", "sunset", "blossom", "fresh", "sand", "lemon", "mono", "forest"],
  learning: ["clean", "fresh", "pro", "cobalt", "lemon", "mint", "ocean", "sunset", "slate", "plum"],
  creative: ["studio", "mono", "sand", "ivory", "charcoal", "neon", "luxury", "slate", "terracotta", "plum"],
  fashion: ["boutique", "luxury", "ivory", "rose", "blossom", "mono", "saffron", "plum", "sand", "black"],
  trade: ["trade", "charcoal", "clean", "ocean", "mint", "cobalt", "lemon", "energy", "slate", "fresh"],
  auto: ["black", "charcoal", "energy", "neon", "crimson", "cobalt", "mono", "clean", "slate", "luxury"],
  professional: ["pro", "navy", "slate", "ivory", "cobalt", "mono", "clean", "forest", "sand", "luxury"],
  property: ["ocean", "fresh", "pro", "sand", "ivory", "luxury", "sunset", "forest", "clean", "mono"],
  health: ["clinic", "mint", "ocean", "clean", "sage", "slate", "pro", "fresh", "sand", "cobalt"],
  restaurant: ["bistro", "dhaba", "cafe", "luxury", "terracotta", "saffron", "forest", "marigold", "charcoal", "mono"],
  cafe: ["cafe", "bistro", "pastel", "sage", "terracotta", "mono", "sand", "forest", "lemon", "ivory"],
  street: ["street", "dhaba", "lemon", "crimson", "charcoal", "marigold", "sunset", "saffron", "neon", "terracotta"],
  sweets: ["traditional", "dhaba", "pastel", "saffron", "marigold", "peacock", "ivory", "royal", "blossom", "sunset"],
  shop: ["clean", "boutique", "fresh", "terracotta", "sand", "mono", "ocean", "sage", "ivory", "charcoal"],
  jewels: ["luxury", "boutique", "royal", "ivory", "rose", "peacock", "plum", "black", "mono", "marigold"],
  gifts: ["pastel", "boutique", "fun", "blossom", "sunset", "lemon", "plum", "sage", "rose", "mono"],
  people: ["navy", "ink", "paper", "luxury", "mono", "sand", "cobalt", "forest", "rose", "slate"],
  makers: ["studio", "paper", "creator", "mono", "neon", "sand", "charcoal", "ivory", "plum", "ocean"],
  young: ["paper", "lilac", "ink", "lemon", "mint", "creator", "sunset", "cobalt", "blossom", "mono"],
  wedding: ["royal", "floral", "traditional", "modern", "ivory", "peacock", "marigold", "blossom", "plum", "sage"],
  party: ["playful", "fun", "sunny", "lemon", "blossom", "neon", "sunset", "mint", "lilac", "cobalt"],
  family: ["traditional", "lilac", "floral", "saffron", "sage", "blossom", "ivory", "mint", "sunset", "peacock"],
  sacred: ["traditional", "jain", "royal", "saffron", "marigold", "peacock", "ivory", "solemn", "sage", "harvest"],
  business: ["corporate", "modern", "clean", "cobalt", "slate", "mono", "studio", "ocean", "navy", "neon"],
  lively: ["energy", "creator", "fun", "neon", "lemon", "crimson", "cobalt", "sunset", "blossom", "studio"],
  love: ["romantic", "elegant", "rose", "blossom", "plum", "fun", "minimal", "ivory", "sunset", "lilac"],
  cheer: ["fun", "sunny", "elegant", "lemon", "mint", "minimal", "cobalt", "blossom", "sunset", "lilac"],
  gentle: ["solemn", "minimal", "elegant", "sage", "ivory", "forest", "sand", "lilac", "ocean", "plum"],
  school: ["campus", "chalk", "clean", "pro", "cobalt", "navy", "fresh", "slate", "ivory", "ocean"],
  kids: ["crayon", "playful", "sunny", "lemon", "mint", "blossom", "lilac", "fun", "sunset", "ocean"],
  stay: ["heritage", "luxury", "lagoon", "ivory", "forest", "sand", "royal", "navy", "ocean", "mono"],
  hostel: ["dorm", "ocean", "clean", "lemon", "cobalt", "mint", "sunset", "charcoal", "slate", "sage"],
  resort: ["lagoon", "forest", "heritage", "sunset", "sage", "sand", "luxury", "ocean", "peacock", "ivory"],
  store: ["sunset", "clean", "lemon", "terracotta", "mono", "ocean", "sage", "charcoal", "saffron", "cobalt"],
  tech: ["techno", "volt", "neon", "cobalt", "charcoal", "mono", "slate", "black", "clean", "crimson"],
  pharmacy: ["pharma", "clinic", "mint", "ocean", "clean", "sage", "slate", "fresh", "pro", "cobalt"],
  grocery: ["grocer", "fresh", "saffron", "lemon", "terracotta", "dhaba", "mint", "sunset", "sage", "marigold"],
  hardware: ["steel", "trade", "charcoal", "energy", "lemon", "cobalt", "slate", "crimson", "mono", "clean"],
  agri: ["kisan", "harvest", "fresh", "forest", "saffron", "sage", "terracotta", "sand", "mint", "lemon"],
  books: ["notebook", "paper", "lemon", "mint", "cobalt", "lilac", "sunset", "mono", "crayon", "ocean"],
  optical: ["optic", "mono", "slate", "ivory", "ocean", "studio", "clean", "cobalt", "luxury", "sand"],
  pets: ["paws", "playful", "sunny", "mint", "sunset", "lemon", "sage", "blossom", "ocean", "terracotta"],
  wholesale: ["depot", "pro", "slate", "charcoal", "cobalt", "trade", "mono", "clean", "navy", "ocean"],
} satisfies Record<string, ThemeId[]>;
export type Mood = keyof typeof MOODS;
export function ten(mood: Mood, ...own: ThemeId[]): Theme[] {
  const ids = Array.from(new Set<ThemeId>([...own, ...(MOODS[mood] as ThemeId[])])).slice(0, 10);
  return ids.map((i) => THEMES[i]);
}

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
