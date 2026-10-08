// Image handling in the browser: shrink uploads before they're stored, and paint sample art
// for the gallery and builder previews (so samples look finished before real photos are added).

export function shrinkImage(file: File, max = 1400, quality = 0.84): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Choose an image file."));
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("Couldn't read that file."));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That image couldn't be opened."));
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        // Re-encoding drops EXIF, including GPS location from phone cameras.
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.src = String(fr.result);
    };
    fr.readAsDataURL(file);
  });
}

const cache = new Map<string, string>();
export function sampleArt(key: string, S = 640): string {
  const k = key + S;
  const hit = cache.get(k);
  if (hit) return hit;
  if (typeof document === "undefined") return "";
  const c = document.createElement("canvas"); c.width = c.height = S;
  const x = c.getContext("2d")!;
  let seed = [...key].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) % 2147483647 || 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const grad = (stops: [number, string][]) => { const g = x.createLinearGradient(0, 0, 0, S); stops.forEach(([p, col]) => g.addColorStop(p, col)); return g; };
  const HEX = ["#FF4F8B", "#FFC83D", "#2ECC9A", "#47B2FF", "#C9A7F5"];
  if (key === "beach") {
    x.fillStyle = grad([[0, "#3B1E6E"], [0.45, "#FF6F91"], [0.62, "#FFC371"]]); x.fillRect(0, 0, S, S);
    x.fillStyle = "#FFE29A"; x.beginPath(); x.arc(S * 0.5, S * 0.6, S * 0.14, Math.PI, 0); x.fill();
    x.fillStyle = grad([[0.6, "#2B4C7E"], [1, "#16274A"]]); x.fillRect(0, S * 0.6, S, S * 0.4);
    x.strokeStyle = "rgba(255,226,154,.6)"; x.lineWidth = 3;
    for (let i = 0; i < 14; i++) { const y = S * 0.63 + i * 14, w = S * (0.32 - i * 0.018); x.beginPath(); x.moveTo(S * 0.5 - w / 2 + rnd() * 20, y); x.lineTo(S * 0.5 + w / 2 - rnd() * 20, y); x.stroke(); }
    x.strokeStyle = "#1A0F22"; x.lineWidth = 12; x.lineCap = "round"; x.beginPath(); x.moveTo(S * 0.14, S); x.quadraticCurveTo(S * 0.2, S * 0.7, S * 0.3, S * 0.42); x.stroke();
    x.fillStyle = "#1A0F22"; for (let a = 0; a < 6; a++) { x.save(); x.translate(S * 0.3, S * 0.42); x.rotate(-2.6 + a * 0.7); x.beginPath(); x.ellipse(70, 0, 80, 16, 0, 0, 7); x.fill(); x.restore(); }
  } else if (key === "hills") {
    x.fillStyle = grad([[0, "#9AD0FF"], [0.6, "#E8F4FF"]]); x.fillRect(0, 0, S, S);
    const layer = (base: number, amp: number, col: string, snow: boolean) => {
      x.fillStyle = col; x.beginPath(); x.moveTo(0, S); x.lineTo(0, base); const pts: [number, number][] = [];
      for (let px = 0; px <= S; px += S / 6) { const y = base - rnd() * amp; pts.push([px, y]); x.lineTo(px, y); }
      x.lineTo(S, S); x.fill();
      if (snow) { x.fillStyle = "#fff"; pts.forEach(([X, Y]) => { if (Y < base - amp * 0.5) { x.beginPath(); x.moveTo(X - 26, Y + 30); x.lineTo(X, Y); x.lineTo(X + 26, Y + 30); x.fill(); } }); }
    };
    layer(S * 0.5, S * 0.3, "#7B8FC9", true); layer(S * 0.66, S * 0.2, "#4C5E9E", false); layer(S * 0.82, S * 0.14, "#2E3B6E", false);
    x.fillStyle = "#1C244A"; x.fillRect(0, S * 0.9, S, S * 0.1);
  } else if (key === "lights") {
    x.fillStyle = grad([[0, "#12061F"], [1, "#3A1340"]]); x.fillRect(0, 0, S, S);
    for (let i = 0; i < 60; i++) {
      const r = 8 + rnd() * 34; const g = x.createRadialGradient(0, 0, 0, 0, 0, r);
      const col = ["255,200,61", "255,122,26", "255,79,139", "255,236,170"][i % 4];
      g.addColorStop(0, `rgba(${col},.9)`); g.addColorStop(1, `rgba(${col},0)`);
      x.save(); x.translate(rnd() * S, rnd() * S * 0.75); x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, 7); x.fill(); x.restore();
    }
    for (let i = 0; i < 4; i++) {
      const X = S * (0.2 + i * 0.2), Y = S * 0.86; x.fillStyle = "#C26A2E"; x.beginPath(); x.ellipse(X, Y, 34, 14, 0, 0, Math.PI); x.fill();
      const g = x.createRadialGradient(X, Y - 18, 0, X, Y - 18, 50); g.addColorStop(0, "rgba(255,236,170,.95)"); g.addColorStop(0.3, "rgba(255,170,40,.6)"); g.addColorStop(1, "rgba(255,120,20,0)");
      x.fillStyle = g; x.beginPath(); x.arc(X, Y - 18, 50, 0, 7); x.fill();
    }
  } else if (key === "city") {
    x.fillStyle = grad([[0, "#2A0E3B"], [0.55, "#B04A7E"], [1, "#FF9E6B"]]); x.fillRect(0, 0, S, S);
    for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.6})`; x.fillRect(rnd() * S, rnd() * S * 0.4, 2, 2); }
    let X = 0;
    while (X < S) {
      const w = 40 + rnd() * 70, h = S * (0.2 + rnd() * 0.35); x.fillStyle = "#1A0A26"; x.fillRect(X, S - h, w, h);
      for (let wy = S - h + 14; wy < S - 10; wy += 22) for (let wx = X + 8; wx < X + w - 10; wx += 16) if (rnd() > 0.55) { x.fillStyle = `rgba(255,200,61,${0.5 + rnd() * 0.5})`; x.fillRect(wx, wy, 7, 10); }
      X += w + 4;
    }
  } else {
    // abstract: soft gradient field with confetti, tinted by the key
    const a = HEX[Math.floor(rnd() * 5)], b = HEX[Math.floor(rnd() * 5)];
    const g = x.createLinearGradient(0, 0, S, S); g.addColorStop(0, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 18; i++) { x.fillStyle = `rgba(255,255,255,${0.08 + rnd() * 0.18})`; x.beginPath(); x.arc(rnd() * S, rnd() * S, 20 + rnd() * 120, 0, 7); x.fill(); }
  }
  const url = c.toDataURL("image/jpeg", 0.86);
  cache.set(k, url);
  return url;
}
