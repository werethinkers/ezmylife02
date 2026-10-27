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
  fun: t("fun", "Fun", true, { bg: "#2A0E3B", sf: "#3B1652", tx: "#FFF5EA", mu: "#E0CFEA", ac: "#FF4F8B", ac2: "#FFC83D", ac3: "#2ECC9A", on: "#2A0E3B", line: "#54266F" }, FUN_F, FUN_FONTS),
  elegant: t("elegant", "Elegant", true, { bg: "#0E1630", sf: "#17213F", tx: "#F4EFE6", mu: "#B9B4C6", ac: "#D9B77A", ac2: "#F2DDB0", ac3: "#8FA6D9", on: "#0E1630", line: "#2A365C" }, ELEG_F, ELEG_FONTS),
  romantic: t("romantic", "Romantic", false, { bg: "#FFF0F3", sf: "#FFFFFF", tx: "#4A1022", mu: "#8C5566", ac: "#E0245E", ac2: "#F7A1B5", ac3: "#B4134A", on: "#FFFFFF", line: "#F6C9D4" }, ELEG_F, ELEG_FONTS),
  minimal: t("minimal", "Minimal", false, { bg: "#FAFAF7", sf: "#FFFFFF", tx: "#141414", mu: "#6B6B66", ac: "#2445D6", ac2: "#F2C230", ac3: "#E04E6A", on: "#FFFFFF", line: "#E4E3DE" }, EDIT_F, EDIT_FONTS),
  sunny: t("sunny", "Sunshine", false, { bg: "#FFF6D6", sf: "#FFFFFF", tx: "#2B2112", mu: "#7A6A45", ac: "#FF7A1A", ac2: "#2ECC9A", ac3: "#47B2FF", on: "#FFFFFF", line: "#F2DFA0" }, FUN_F, FUN_FONTS),
  solemn: t("solemn", "Quiet", true, { bg: "#1A1F25", sf: "#232A32", tx: "#ECE8E1", mu: "#A7A39B", ac: "#E8B65A", ac2: "#CFC6B5", ac3: "#7E9AA8", on: "#1A1F25", line: "#333B45" }, LUXE_F, LUXE_FONTS),
  lilac: t("lilac", "Lilac", false, { bg: "#F4EEFF", sf: "#FFFFFF", tx: "#2B1650", mu: "#6E5C93", ac: "#7B3FE4", ac2: "#FF8FB1", ac3: "#3CC8B4", on: "#FFFFFF", line: "#E0D3FA" }, CLEAN_F, CLEAN_FONTS),

  // festivals (one signature palette each)
  diwali: t("diwali", "Diya Night", true, { bg: "#2B0710", sf: "#3D0C18", tx: "#FFF1D6", mu: "#E9C9A6", ac: "#FFB300", ac2: "#FF6B2C", ac3: "#E9407A", on: "#2B0710", line: "#5A1424" }, DESI_F, DESI_FONTS),
  rajwada: t("rajwada", "Rajwada Raat", true, { bg: "#2A0609", sf: "#3E0B12", tx: "#FFF1DC", mu: "#E8C79F", ac: "#FF9F1C", ac2: "#F7C948", ac3: "#E4572E", on: "#2A0609", line: "#5E1A22" }, DESI_F, DESI_FONTS),
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

  // added October 2026: a wider library so every product offers ten designs
  neon: t("neon", "Neon Night", true, { bg: "#0A0A12", sf: "#15151F", tx: "#F4F4FF", mu: "#A0A0BC", ac: "#C6FF3D", ac2: "#8B6CFF", ac3: "#FF3D9A", on: "#0A0A12", line: "#272738" }, SPORT_F, SPORT_FONTS, "photo"),
  forest: t("forest", "Forest", true, { bg: "#0F1F18", sf: "#172A21", tx: "#EEF3EC", mu: "#A9BBAE", ac: "#D8BC74", ac2: "#93C2A2", ac3: "#E58F65", on: "#0F1F18", line: "#26392E" }, LUXE_F, LUXE_FONTS, "photo"),
  sand: t("sand", "Sandstone", false, { bg: "#F6EFE6", sf: "#FFFBF6", tx: "#2D2219", mu: "#76634F", ac: "#A9572F", ac2: "#5F7D5C", ac3: "#D9A441", on: "#FFFFFF", line: "#E6D9C8" }, EDIT_F, EDIT_FONTS, "editorial"),
  ocean: t("ocean", "Ocean", false, { bg: "#F2F8FB", sf: "#FFFFFF", tx: "#0B2433", mu: "#4A6676", ac: "#0E7490", ac2: "#F59E0B", ac3: "#0EA5E9", on: "#FFFFFF", line: "#D6E7EF" }, CLEAN_F, CLEAN_FONTS, "split"),
  sunset: t("sunset", "Sunset", false, { bg: "#FFF4EC", sf: "#FFFFFF", tx: "#2B1408", mu: "#7A5642", ac: "#E0531F", ac2: "#FFB547", ac3: "#C2185B", on: "#FFFFFF", line: "#F5D9C6" }, SOFT_F, SOFT_FONTS, "soft"),
  mono: t("mono", "Monochrome", false, { bg: "#FFFFFF", sf: "#F5F5F4", tx: "#0A0A0A", mu: "#5E5E5B", ac: "#0A0A0A", ac2: "#E11D48", ac3: "#737373", on: "#FFFFFF", line: "#E5E5E3" }, SWISS_F, SWISS_FONTS, "minimal"),
  rose: t("rose", "Rose Gold", true, { bg: "#1E1416", sf: "#2A1D20", tx: "#F8ECEC", mu: "#C6ADB1", ac: "#E9AFA6", ac2: "#F3D3B8", ac3: "#B76E79", on: "#1E1416", line: "#3D2B2F" }, LUXE_F, LUXE_FONTS, "photo"),
  sage: t("sage", "Sage", false, { bg: "#EEF2EA", sf: "#FAFBF7", tx: "#1E2A20", mu: "#58695A", ac: "#46664A", ac2: "#C8A97E", ac3: "#A3B18A", on: "#FFFFFF", line: "#D7DFD0" }, SOFT_F, SOFT_FONTS, "soft"),
  cobalt: t("cobalt", "Cobalt", true, { bg: "#0B1530", sf: "#13214B", tx: "#EEF2FF", mu: "#A6B1D2", ac: "#5B85FF", ac2: "#FFD166", ac3: "#06D6A0", on: "#FFFFFF", line: "#213264" }, GROT_F, GROT_FONTS, "bold"),
  terracotta: t("terracotta", "Terracotta", false, { bg: "#FBF1EA", sf: "#FFFFFF", tx: "#3A1D12", mu: "#7E5A49", ac: "#B9492A", ac2: "#2F6B5E", ac3: "#E9B44C", on: "#FFFFFF", line: "#F0D9CB" }, FOOD_F, FOOD_FONTS, "split"),
  saffron: t("saffron", "Saffron", false, { bg: "#FFF8EC", sf: "#FFFFFF", tx: "#3B1A05", mu: "#7A5638", ac: "#D2650A", ac2: "#9C1D1D", ac3: "#2E7D4F", on: "#FFFFFF", line: "#F3E0C2" }, DESI_F, DESI_FONTS, "editorial"),
  charcoal: t("charcoal", "Charcoal", true, { bg: "#1B1C1E", sf: "#242528", tx: "#F2F2F0", mu: "#A8A9AB", ac: "#FF7A1A", ac2: "#FFC20E", ac3: "#4CC9F0", on: "#1B1C1E", line: "#35363A" }, SWISS_F, SWISS_FONTS, "split"),
  ivory: t("ivory", "Ivory & Gold", false, { bg: "#FBF8F1", sf: "#FFFFFF", tx: "#1D1A14", mu: "#6A6253", ac: "#9A7733", ac2: "#1D1A14", ac3: "#7D6B4E", on: "#FFFFFF", line: "#EAE2D0" }, LUXE_F, LUXE_FONTS, "editorial"),
  mint: t("mint", "Mint", false, { bg: "#EFFBF6", sf: "#FFFFFF", tx: "#0F2A22", mu: "#46675C", ac: "#0E9F6E", ac2: "#0F2A22", ac3: "#F59E0B", on: "#FFFFFF", line: "#CFEFE2" }, CLEAN_F, CLEAN_FONTS, "soft"),
  plum: t("plum", "Plum Velvet", true, { bg: "#261231", sf: "#331940", tx: "#F7EEF9", mu: "#D0BCD9", ac: "#E9B949", ac2: "#E07BB4", ac3: "#9AD1D4", on: "#261231", line: "#47295C" }, ELEG_F, ELEG_FONTS, "photo"),
  slate: t("slate", "Slate", false, { bg: "#F1F3F6", sf: "#FFFFFF", tx: "#151C28", mu: "#556074", ac: "#1E293B", ac2: "#2563EB", ac3: "#0EA5E9", on: "#FFFFFF", line: "#DDE2EA" }, GROT_F, GROT_FONTS, "minimal"),
  crimson: t("crimson", "Crimson", true, { bg: "#16090B", sf: "#231013", tx: "#FBEFEA", mu: "#C9A9A6", ac: "#EF3E4A", ac2: "#F4A261", ac3: "#FFFFFF", on: "#FFFFFF", line: "#3A1A1E" }, SPORT_F, SPORT_FONTS, "split"),
  lemon: t("lemon", "Lemonade", false, { bg: "#FFFBE6", sf: "#FFFFFF", tx: "#1C1A0E", mu: "#64603F", ac: "#1C1A0E", ac2: "#FFD23F", ac3: "#2EC4B6", on: "#FFD23F", line: "#F0E7B8" }, GROT_F, GROT_FONTS, "bold"),
  marigold: t("marigold", "Marigold Night", true, { bg: "#2A1206", sf: "#3A1A0A", tx: "#FFF1DE", mu: "#E3C3A2", ac: "#FFA62B", ac2: "#E8463A", ac3: "#7CC39A", on: "#2A1206", line: "#57301A" }, DESI_F, DESI_FONTS, "photo"),
  peacock: t("peacock", "Peacock", true, { bg: "#062A30", sf: "#0B3A41", tx: "#ECF7F5", mu: "#A8CBC7", ac: "#E5B94E", ac2: "#2EC4B6", ac3: "#7B5CD6", on: "#062A30", line: "#174B53" }, DESI_F, DESI_FONTS, "editorial"),
  blossom: t("blossom", "Blossom", false, { bg: "#FFF1F4", sf: "#FFFFFF", tx: "#3D1424", mu: "#86566A", ac: "#D23A6E", ac2: "#F7B2C4", ac3: "#7A9E7E", on: "#FFFFFF", line: "#F7D3DE" }, SOFT_F, SOFT_FONTS, "photo"),
  // added October 2026 for schools, stays and shops: each kind of business gets its own signature look
  campus: t("campus", "Campus", false, { bg: "#F4F6FC", sf: "#FFFFFF", tx: "#0E1F4D", mu: "#4F5D80", ac: "#1D3FA8", ac2: "#F7B500", ac3: "#E2483D", on: "#FFFFFF", line: "#DCE2F1" }, GROT_F, GROT_FONTS, "split"),
  chalk: t("chalk", "Chalkboard", true, { bg: "#13271E", sf: "#1A3328", tx: "#F3F1E7", mu: "#B5C4B4", ac: "#F6D55C", ac2: "#F29E9E", ac3: "#8FD3F4", on: "#13271E", line: "#2A4839" }, FOOD_F, FOOD_FONTS, "bold"),
  crayon: t("crayon", "Crayon Box", false, { bg: "#FFF8EE", sf: "#FFFFFF", tx: "#2A2350", mu: "#6A6390", ac: "#FF5A5F", ac2: "#FFC145", ac3: "#2EC4B6", on: "#FFFFFF", line: "#F3E3CC" }, FUN_F, FUN_FONTS, "soft"),
  heritage: t("heritage", "Haveli", false, { bg: "#F7F1E8", sf: "#FFFCF7", tx: "#2B1E16", mu: "#76614F", ac: "#8C5A2B", ac2: "#C9A45C", ac3: "#3E5C4B", on: "#FFFFFF", line: "#E7DBCA" }, LUXE_F, LUXE_FONTS, "editorial"),
  lagoon: t("lagoon", "Lagoon", true, { bg: "#082B2E", sf: "#0E3A3E", tx: "#EEF7F4", mu: "#A9C9C4", ac: "#F2C57C", ac2: "#5ED1C4", ac3: "#F28C6B", on: "#082B2E", line: "#1B4D52" }, SOFT_F, SOFT_FONTS, "photo"),
  dorm: t("dorm", "Dorm Life", false, { bg: "#F3F0FF", sf: "#FFFFFF", tx: "#1E1640", mu: "#5E5785", ac: "#5B3DF5", ac2: "#FF7A59", ac3: "#22C55E", on: "#FFFFFF", line: "#DED7FB" }, GROT_F, GROT_FONTS, "bold"),
  pharma: t("pharma", "Pharmacy Green", false, { bg: "#F1F9F6", sf: "#FFFFFF", tx: "#082E26", mu: "#47665D", ac: "#0B8A5F", ac2: "#E5484D", ac3: "#2F80ED", on: "#FFFFFF", line: "#D2EAE1" }, CLEAN_F, CLEAN_FONTS, "split"),
  techno: t("techno", "Techno", true, { bg: "#07090F", sf: "#0F1320", tx: "#F2F5FF", mu: "#9AA3BD", ac: "#3DDCFF", ac2: "#A26BFF", ac3: "#FFCF3D", on: "#07090F", line: "#1D2336" }, GROT_F, GROT_FONTS, "bold"),
  volt: t("volt", "Volt", false, { bg: "#F4F6FB", sf: "#FFFFFF", tx: "#0B0F1A", mu: "#556079", ac: "#0A5CFF", ac2: "#FFCC00", ac3: "#00C48C", on: "#FFFFFF", line: "#DDE3EF" }, SWISS_F, SWISS_FONTS, "minimal"),
  grocer: t("grocer", "Fresh Market", false, { bg: "#FFF9EF", sf: "#FFFFFF", tx: "#1F2A12", mu: "#5F6A4C", ac: "#2F8F2F", ac2: "#FF8A00", ac3: "#D7263D", on: "#FFFFFF", line: "#EEE4CC" }, FOOD_F, FOOD_FONTS, "split"),
  steel: t("steel", "Steel & Spark", true, { bg: "#17191C", sf: "#202327", tx: "#F1F1EE", mu: "#A3A6AA", ac: "#FF6B00", ac2: "#FFC20E", ac3: "#4CC9F0", on: "#17191C", line: "#31353A" }, SPORT_F, SPORT_FONTS, "bold"),
  kisan: t("kisan", "Kisan", false, { bg: "#F6FAEC", sf: "#FFFFFF", tx: "#1E2B10", mu: "#5A6B45", ac: "#3F7D20", ac2: "#F2B705", ac3: "#A0522D", on: "#FFFFFF", line: "#DDE8C6" }, DESI_F, DESI_FONTS, "editorial"),
  notebook: t("notebook", "Notebook", false, { bg: "#FDFBF4", sf: "#FFFFFF", tx: "#1B2A4A", mu: "#5A6582", ac: "#E8483B", ac2: "#2D6CDF", ac3: "#F5B700", on: "#FFFFFF", line: "#E6E2D3" }, EDIT_F, EDIT_FONTS, "minimal"),
  optic: t("optic", "Optic", false, { bg: "#F7F7F9", sf: "#FFFFFF", tx: "#111318", mu: "#5D616C", ac: "#111318", ac2: "#00A3A3", ac3: "#FF6F59", on: "#FFFFFF", line: "#E3E4E8" }, EDIT_F, EDIT_FONTS, "split"),
  paws: t("paws", "Paws", false, { bg: "#FFF6EC", sf: "#FFFFFF", tx: "#3A2618", mu: "#7D6352", ac: "#F26B3A", ac2: "#2BB3A3", ac3: "#FFC94A", on: "#FFFFFF", line: "#F3DFCB" }, FUN_F, FUN_FONTS, "soft"),
  depot: t("depot", "Depot", false, { bg: "#EEF2F6", sf: "#FFFFFF", tx: "#0D1B2A", mu: "#4F5F72", ac: "#0D3B66", ac2: "#F4A259", ac3: "#2A9D8F", on: "#FFFFFF", line: "#D7DFE8" }, SWISS_F, SWISS_FONTS, "split"),
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
