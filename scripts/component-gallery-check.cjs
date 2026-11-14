/*
 * Finds which components in the private gallery (/admin/components) visibly work, so the page can
 * show only those. Opens each saved snapshot in a headless browser, inside the same kind of frame the
 * gallery uses, and decides:
 *   moves      the picture changes by itself (CSS animation, loop, marquee, spinner)
 *   responds   nothing moves alone, but hovering or clicking something changes the picture
 *   static     nothing changes: dropped
 *   blank      nothing visible, or mostly broken images: dropped
 *
 * Usage:
 *   node scripts/component-gallery-check.cjs <path to a clone of wundercorp/awesome-components> [--workers 4] [--limit N] [--all-variants] [--statuses file.json]
 * Writes src/pages/admin/workingComponents.json: { commit, checked, kept, items: { "<author>/<component>/<variant>": "moves" | "responds" } }
 * Needs Playwright and a local copy of the Tailwind browser build (public/vendor/tailwind-browser-*.js, already in the repo).
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const repoDir = args.find((a) => !a.startsWith("--") && !/^\d+$/.test(a));
const opt = (name, d) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : d;
};
if (!repoDir) throw new Error("Pass the path of the awesome-components clone.");
const WORKERS = Number(opt("workers", 4));
const LIMIT = Number(opt("limit", 0));
const ALL = args.includes("--all-variants");

const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(p, "utf8");
const tailwind = read(path.join(root, "public/vendor/tailwind-browser-4.1.11.js"));
const twAnimate = read(path.join(root, "src/pages/admin/tw-animate.css"));
const frameCss = read(path.join(root, "src/pages/admin/previewFrameCss.css"));
const gallery = read(path.join(root, "src/pages/admin/ComponentGallery.tsx"));
const OURS = gallery.match(/const OURS = `([^`]*)`/)[1];
const TOKENS = JSON.parse(gallery.match(/const TOKENS = (\[[^\]]*\])/)[1]);
const colors = TOKENS.map((t) => `--color-${t}:hsl(var(--${t}));`).join("");
const brand = ["ink", "pink", "sun", "teal", "sky", "lime", "coral"].map((t) => `--color-${t}:hsl(var(--${t}));`).join("");

const doc = (html) => `<!doctype html><html><head><meta charset="utf-8">
<style>:root{${OURS}}</style>
<style type="text/tailwindcss">
@custom-variant dark (&:where(.dark, .dark *));
@theme inline{${colors}${brand}--radius-sm:calc(var(--radius) - 4px);--radius-md:calc(var(--radius) - 2px);--radius-lg:var(--radius);--radius-xl:calc(var(--radius) + 4px)}
@layer base{*{border-color:var(--color-border)}body{background:var(--color-background);color:var(--color-foreground)}}
${twAnimate}
${frameCss}
</style>
<script>${tailwind}</script>
</head><body>${html}<script>document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a');if(a)e.preventDefault()},true);</script></body></html>`;

const INTERACTIVE = 'button, a, input, select, textarea, summary, [role="button"], [role="tab"], [role="switch"], [role="checkbox"], [role="menuitem"], [tabindex], [class*="hover:"], [class*="group"]';

async function check(page, item) {
  const html = read(path.join(repoDir, item.htmlPath));
  await page.setContent(doc(html), { waitUntil: "load" });
  await page.waitForTimeout(1100);

  const facts = await page.evaluate(() => {
    const body = document.body;
    const els = [...body.querySelectorAll("*")].filter((e) => !["SCRIPT", "STYLE"].includes(e.tagName));
    let minX = 1e9, minY = 1e9, maxX = 0, maxY = 0;
    for (const e of els) {
      const r = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      if (r.width < 2 || r.height < 2 || cs.visibility === "hidden" || cs.display === "none") continue;
      minX = Math.min(minX, r.left); minY = Math.min(minY, r.top); maxX = Math.max(maxX, r.right); maxY = Math.max(maxY, r.bottom);
    }
    const text = (body.innerText || "").trim().length;
    const media = body.querySelectorAll("svg, canvas, video, img").length;
    const imgs = [...body.querySelectorAll("img")];
    const relBroken = imgs.filter((i) => { const s = i.getAttribute("src") || ""; return s && !/^(https?:|data:|blob:|\/\/)/.test(s) && !i.naturalWidth; }).length;
    const infinite = document.getAnimations().filter((a) => a.playState === "running" && a.effect && a.effect.getComputedTiming().iterations === Infinity).length;
    return { w: maxX - minX, h: maxY - minY, text, media, imgs: imgs.length, relBroken, infinite, running: document.getAnimations().filter((a) => a.playState === "running").length };
  });

  if (facts.w < 30 || facts.h < 16 || (facts.text < 2 && facts.media === 0)) return "blank";
  if (facts.imgs > 0 && facts.relBroken / facts.imgs > 0.5 && facts.text < 12) return "blank";

  const shot = () => page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 960, height: 720 } });
  const a = await shot();
  await page.waitForTimeout(700);
  const b = await shot();
  if (facts.infinite > 0 || !a.equals(b)) return "moves";

  // Nothing moves alone: does it react to a hover or a click?
  const handles = await page.$$(INTERACTIVE);
  const targets = [];
  for (const h of handles) {
    if (targets.length >= 6) break;
    const box = await h.boundingBox().catch(() => null);
    if (box && box.width > 4 && box.height > 4 && box.x < 960 && box.y < 720) targets.push(h);
  }
  let prev = b;
  for (const t of targets) {
    try {
      await t.hover({ timeout: 800 });
      await page.waitForTimeout(450);
      let cur = await shot();
      if (!cur.equals(prev)) return "responds";
      await t.click({ timeout: 800, noWaitAfter: true });
      await page.waitForTimeout(450);
      cur = await shot();
      if (!cur.equals(prev)) return "responds";
      prev = cur;
    } catch (e) { /* element moved or detached: try the next one */ }
  }
  return "static";
}

(async () => {
  const meta = JSON.parse(read(path.join(repoDir, "data/components.json")));
  let list = meta.filter((m) => ALL || m.variant === "default");
  if (LIMIT) list = list.slice(0, LIMIT);
  const commit = require("child_process").execSync("git rev-parse HEAD", { cwd: repoDir }).toString().trim();
  const results = {};
  const all = {};
  const counts = { moves: 0, responds: 0, static: 0, blank: 0, error: 0 };
  let next = 0, done = 0;
  const t0 = Date.now();

  const browser = await chromium.launch();
  const worker = async () => {
    const ctx = await browser.newContext({ viewport: { width: 960, height: 720 }, deviceScaleFactor: 1 });
    await ctx.route("**/*", (r) => r.abort());
    let page = await ctx.newPage();
    page.on("dialog", (d) => d.dismiss().catch(() => {}));
    page.on("pageerror", () => {});
    while (next < list.length) {
      const item = list[next++];
      const id = `${item.author}/${item.component}/${item.variant}`;
      let status;
      try {
        status = await Promise.race([check(page, item), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 25000))]);
      } catch (e) {
        status = "error";
        await page.close().catch(() => {});
        page = await ctx.newPage();
        page.on("dialog", (d) => d.dismiss().catch(() => {}));
        page.on("pageerror", () => {});
      }
      counts[status]++;
      all[id] = status;
      if (status === "moves" || status === "responds") results[id] = status;
      if (++done % 100 === 0) console.log(`${done}/${list.length}`, JSON.stringify(counts), `${Math.round((Date.now() - t0) / 1000)}s`);
    }
    await ctx.close();
  };
  await Promise.all(Array.from({ length: WORKERS }, worker));
  await browser.close();

  const sorted = Object.fromEntries(Object.entries(results).sort(([x], [y]) => x.localeCompare(y)));
  const out = { commit, checked: list.length, kept: Object.keys(sorted).length, items: sorted };
  if (opt("statuses", "")) fs.writeFileSync(opt("statuses", ""), JSON.stringify(all));
  fs.writeFileSync(path.join(root, "src/pages/admin/workingComponents.json"), JSON.stringify(out));
  console.log("done", JSON.stringify(counts), `${Math.round((Date.now() - t0) / 1000)}s`);
})();
