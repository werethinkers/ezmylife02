/* Runs inside a component preview frame in the private gallery (/admin/components).
 * Shows what a component does: a cursor glides to each button, link, tab or field, hovers it and clicks it.
 * The parent page starts and stops it with postMessage({ ezDemo: "start" | "stop" }).
 * A script can't switch on a real :hover, so every ":hover" rule gets a twin that works on [data-hv]. */
(function () {
  var SEL = 'button, a[href], input, select, textarea, summary, [role="button"], [role="tab"], [role="switch"], [role="checkbox"], [role="menuitem"], [tabindex]:not([tabindex="-1"]), [class*="hover:"], [class*="group-hover"]';
  var token = 0;
  var cursor = null;
  var hovered = [];

  function twinHoverRules(parent) {
    var rules;
    try { rules = parent.cssRules; } catch (e) { return; }
    for (var i = rules.length - 1; i >= 0; i--) {
      var r = rules[i];
      if (r.cssRules && r.cssRules.length) twinHoverRules(r); /* media rules, layers and nested selectors */
      if (r.selectorText === undefined) continue;
      if (r.selectorText.indexOf(":hover") < 0) continue;
      var sel = r.selectorText.replace(/:hover/g, "[data-hv]");
      var next = rules[i + 1];
      if (next && next.selectorText === sel) continue;
      try { parent.insertRule(sel + r.cssText.slice(r.cssText.indexOf("{")), i + 1); } catch (e) { /* skip rules the browser refuses */ }
    }
  }
  function prepare() {
    for (var i = 0; i < document.styleSheets.length; i++) twinHoverRules(document.styleSheets[i]);
  }

  function makeCursor() {
    var c = document.createElement("div");
    c.setAttribute("aria-hidden", "true");
    c.style.cssText = "position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:48px;height:48px;transition:transform .9s cubic-bezier(.4,0,.2,1),opacity .3s;opacity:0;filter:drop-shadow(1px 2px 1px rgba(0,0,0,.35))";
    c.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24"><path d="M4 2l15 9-6.6 1.6L9.4 19z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    var ring = document.createElement("div");
    ring.style.cssText = "position:absolute;left:-16px;top:-16px;width:40px;height:40px;border-radius:50%;border:5px solid #ff5ec4;opacity:0;transform:scale(.3);transition:transform .45s ease-out,opacity .45s ease-out";
    c.appendChild(ring);
    c.ring = ring;
    document.body.appendChild(c);
    return c;
  }
  function moveTo(x, y) { cursor.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)"; }
  function click() {
    var ring = cursor.ring;
    ring.style.transition = "none"; ring.style.opacity = "1"; ring.style.transform = "scale(.3)";
    void ring.offsetWidth;
    ring.style.transition = "transform .45s ease-out,opacity .45s ease-out"; ring.style.opacity = "0"; ring.style.transform = "scale(1.6)";
  }

  function visible(el) {
    var r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8 || r.bottom < 0 || r.right < 0 || r.top > innerHeight || r.left > innerWidth) return false;
    var cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0";
  }
  function targets() {
    var all = Array.prototype.filter.call(document.querySelectorAll(SEL), visible);
    var leaves = all.filter(function (a) { return !all.some(function (b) { return b !== a && a.contains(b); }); });
    if (leaves.length > 6) {
      var step = leaves.length / 6;
      leaves = [0, 1, 2, 3, 4, 5].map(function (i) { return leaves[Math.floor(i * step)]; });
    }
    return leaves;
  }

  function setHover(el, on) {
    if (!on) { hovered.forEach(function (n) { n.removeAttribute("data-hv"); }); hovered = []; return; }
    for (var n = el; n && n !== document.documentElement; n = n.parentElement) { n.setAttribute("data-hv", ""); hovered.push(n); }
  }
  function wait(ms, t) { return new Promise(function (res) { setTimeout(function () { res(t === token); }, ms); }); }

  async function loop(t) {
    if (!cursor) cursor = makeCursor();
    cursor.style.opacity = "1";
    moveTo(innerWidth * 0.12, innerHeight * 0.88);
    if (!(await wait(500, t))) return;
    while (t === token) {
      prepare();
      var list = targets();
      if (!list.length) {
        var pts = [[0.3, 0.4], [0.7, 0.45], [0.5, 0.65]];
        for (var p = 0; p < pts.length; p++) { moveTo(innerWidth * pts[p][0], innerHeight * pts[p][1]); if (!(await wait(1000, t))) return; }
        continue;
      }
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        if (!el.isConnected) continue;
        var r = el.getBoundingClientRect();
        moveTo(Math.min(Math.max(r.left + r.width / 2, 6), innerWidth - 40), Math.min(Math.max(r.top + r.height / 2, 6), innerHeight - 40));
        if (!(await wait(950, t))) { setHover(null, false); return; }
        setHover(el, true);
        try { el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })); el.dispatchEvent(new MouseEvent("mouseenter")); } catch (e) { /* ignore */ }
        if (!(await wait(750, t))) { setHover(null, false); return; }
        click();
        try { if (el.tagName === "SELECT") el.focus(); else el.click(); } catch (e) { /* ignore */ }
        if (!(await wait(900, t))) { setHover(null, false); return; }
        setHover(null, false);
      }
      moveTo(innerWidth * 0.12, innerHeight * 0.88);
      if (!(await wait(900, t))) return;
    }
  }

  function start() { token++; setHover(null, false); loop(token); }
  function stop() { token++; setHover(null, false); if (cursor) cursor.style.opacity = "0"; }

  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || typeof d !== "object") return;
    if (d.ezDemo === "start") setTimeout(start, 350);
    else if (d.ezDemo === "stop") stop();
  });
})();
