import { useCallback, useEffect, useRef } from "react";

interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; r: number }

/** Firework sparks on a canvas: glowing trails that fade, instead of paper confetti. */
export function useSparks(colors: string[]) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const ps = useRef<P[]>([]);
  const raf = useRef(0);
  const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const tick = useCallback(() => {
    const cv = ref.current; if (!cv) { raf.current = 0; return; }
    const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(r.width * d)) { cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); }
    const x = cv.getContext("2d")!; x.setTransform(d, 0, 0, d, 0, 0);
    x.globalCompositeOperation = "destination-out"; x.fillStyle = "rgba(0,0,0,.18)"; x.fillRect(0, 0, r.width, r.height);
    x.globalCompositeOperation = "lighter";
    ps.current = ps.current.filter((p) => p.life < p.max);
    for (const p of ps.current) {
      p.life++; p.vx *= 0.975; p.vy = p.vy * 0.975 + 0.07; p.x += p.vx; p.y += p.vy;
      x.globalAlpha = Math.max(0, 1 - p.life / p.max); x.fillStyle = p.c;
      x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill();
    }
    raf.current = ps.current.length ? requestAnimationFrame(tick) : 0;
    if (!ps.current.length) x.clearRect(0, 0, r.width, r.height);
  }, []);

  const burst = useCallback((clientX?: number, clientY?: number, n = 70) => {
    const cv = ref.current; if (!cv || reduce) return;
    const r = cv.getBoundingClientRect();
    const x0 = clientX == null ? r.width / 2 : clientX - r.left, y0 = clientY == null ? r.height * 0.35 : clientY - r.top;
    const base = Math.floor(Math.random() * colors.length);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.2, v = 2 + Math.random() * 4.2;
      ps.current.push({ x: x0, y: y0, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 55 + Math.random() * 35, c: colors[(base + (i % 3)) % colors.length], r: 1.2 + Math.random() * 1.6 });
    }
    if (!raf.current) raf.current = requestAnimationFrame(tick);
  }, [colors, reduce, tick]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return { ref, burst };
}
