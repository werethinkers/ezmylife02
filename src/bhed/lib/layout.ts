import type { BhedNode, MapStyle, TabMark, TabTone, TabWeight } from "./types";

export type Geom = {
  id: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  depth: number;
  tone: TabTone;
  mark: TabMark;
  weight: TabWeight;
  italic: boolean;
  hasMedia: boolean;
  folded: boolean;
  childCount: number;
};

export type Edge = { x1: number; y1: number; x2: number; y2: number };

export type Scene = {
  width: number;
  height: number;
  nodes: Geom[];
  edges: Edge[];
  kind: MapStyle;
};

const PAD = 32;

function titleOf(node: BhedNode): string {
  return node.title.trim() || "Untitled";
}

function geomFrom(node: BhedNode, depth: number, x: number, y: number, w: number, h: number): Geom {
  return {
    id: node.id,
    title: titleOf(node),
    x,
    y,
    w,
    h,
    depth,
    tone: node.style.tone,
    mark: node.style.mark,
    weight: node.style.weight,
    italic: node.style.italic,
    hasMedia: node.media.length > 0,
    folded: node.collapsed && node.children.length > 0,
    childCount: node.children.length,
  };
}

function shown(node: BhedNode): BhedNode[] {
  return node.collapsed ? [] : node.children;
}

export function ellipsize(title: string, width: number): string {
  const max = Math.max(0, Math.floor((width - 22) / 7.2));
  if (title.length <= max) return title;
  if (max <= 1) return "";
  return title.slice(0, max - 1) + "…";
}

function leafCount(node: BhedNode): number {
  const kids = shown(node);
  if (!kids.length) return 1;
  return kids.reduce((sum, child) => sum + leafCount(child), 0);
}

function bounds(nodes: Geom[], edges: Edge[], kind: MapStyle): Scene {
  let maxX = PAD;
  let maxY = PAD;
  for (const node of nodes) {
    maxX = Math.max(maxX, node.x + node.w);
    maxY = Math.max(maxY, node.y + node.h);
  }
  for (const edge of edges) {
    maxX = Math.max(maxX, edge.x1, edge.x2);
    maxY = Math.max(maxY, edge.y1, edge.y2);
  }
  return { width: maxX + PAD, height: maxY + PAD, nodes, edges, kind };
}

function layoutOrtho(root: BhedNode, horizontal: boolean): Scene {
  const pillW = 176;
  const pillH = 44;
  const depthStep = horizontal ? pillW + 72 : pillH + 64;
  const slot = horizontal ? pillH + 14 : pillW + 18;
  const nodes: Geom[] = [];
  const edges: Edge[] = [];

  const rec = (node: BhedNode, depth: number, crossStart: number): { crossEnd: number; center: number } => {
    const main = PAD + depth * depthStep;
    const kids = shown(node);
    if (!kids.length) {
      const x = horizontal ? main : crossStart;
      const y = horizontal ? crossStart : main;
      nodes.push(geomFrom(node, depth, x, y, pillW, pillH));
      return {
        crossEnd: crossStart + slot,
        center: crossStart + (horizontal ? pillH : pillW) / 2,
      };
    }
    let cursor = crossStart;
    const infos: { center: number }[] = [];
    for (const child of kids) {
      const placed = rec(child, depth + 1, cursor);
      infos.push(placed);
      cursor = placed.crossEnd;
    }
    const center = (infos[0]!.center + infos[infos.length - 1]!.center) / 2;
    const x = horizontal ? main : center - pillW / 2;
    const y = horizontal ? center - pillH / 2 : main;
    nodes.push(geomFrom(node, depth, x, y, pillW, pillH));
    const parentX = horizontal ? x + pillW : x + pillW / 2;
    const parentY = horizontal ? y + pillH / 2 : y + pillH;
    for (let i = 0; i < kids.length; i++) {
      const childMain = PAD + (depth + 1) * depthStep;
      const childCenter = infos[i]!.center;
      edges.push({
        x1: parentX,
        y1: parentY,
        x2: horizontal ? childMain : childCenter,
        y2: horizontal ? childCenter : childMain,
      });
    }
    return { crossEnd: cursor, center };
  };

  rec(root, 0, PAD);
  return bounds(nodes, edges, horizontal ? "cascade" : "ledger");
}

function layoutRadial(root: BhedNode): Scene {
  const pillW = 150;
  const pillH = 40;
  const nodes: Geom[] = [];
  const edges: Edge[] = [];

  const rec = (
    node: BhedNode,
    depth: number,
    a0: number,
    a1: number,
    minR: number,
  ): { ax: number; ay: number; r: number } => {
    const span = Math.max(a1 - a0, 0.0001);
    const radius = depth === 0 ? 0 : Math.max(minR, (pillW + 32) / span);
    const angle = (a0 + a1) / 2;
    const ax = Math.cos(angle) * radius;
    const ay = Math.sin(angle) * radius;
    nodes.push(geomFrom(node, depth, ax - pillW / 2, ay - pillH / 2, pillW, pillH));
    if (!shown(node).length) return { ax, ay, r: radius };
    const kids = shown(node);
    const total = kids.reduce((sum, child) => sum + leafCount(child), 0);
    let cursor = a0;
    for (const child of kids) {
      const share = span * (leafCount(child) / total);
      const placed = rec(child, depth + 1, cursor, cursor + share, radius + 196);
      edges.push({ x1: ax, y1: ay, x2: placed.ax, y2: placed.ay });
      cursor += share;
    }
    return { ax, ay, r: radius };
  };

  if (!root.children.length) rec(root, 0, 0, 0, 0);
  else rec(root, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2, 0);

  let minX = Infinity;
  let minY = Infinity;
  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
  }
  const shiftX = PAD - minX;
  const shiftY = PAD - minY;
  for (const node of nodes) {
    node.x += shiftX;
    node.y += shiftY;
  }
  for (const edge of edges) {
    edge.x1 += shiftX;
    edge.y1 += shiftY;
    edge.x2 += shiftX;
    edge.y2 += shiftY;
  }
  return bounds(nodes, edges, "radial");
}

function layoutIcicle(root: BhedNode): Scene {
  const row = 58;
  const leafW = 168;
  const gap = 8;
  const nodes: Geom[] = [];
  const totalW = Math.max(leafCount(root), 1) * leafW;

  const rec = (node: BhedNode, depth: number, x: number, w: number) => {
    nodes.push(geomFrom(node, depth, x, PAD + depth * row, Math.max(28, w - gap), row - gap));
    const kids = shown(node);
    if (!kids.length) return;
    const total = leafCount(node);
    let cursor = x;
    for (const child of kids) {
      const share = w * (leafCount(child) / total);
      rec(child, depth + 1, cursor, share);
      cursor += share;
    }
  };

  rec(root, 0, PAD, totalW);
  return bounds(nodes, [], "icicle");
}

export function layoutScene(root: BhedNode, style: MapStyle): Scene {
  if (style === "ledger") return layoutOrtho(root, false);
  if (style === "radial") return layoutRadial(root);
  if (style === "icicle") return layoutIcicle(root);
  return layoutOrtho(root, true);
}

export function edgePath(edge: Edge, kind: MapStyle): string {
  if (kind === "cascade") {
    const mid = (edge.x1 + edge.x2) / 2;
    return `M ${edge.x1} ${edge.y1} H ${mid} V ${edge.y2} H ${edge.x2}`;
  }
  if (kind === "ledger") {
    const mid = (edge.y1 + edge.y2) / 2;
    return `M ${edge.x1} ${edge.y1} V ${mid} H ${edge.x2} V ${edge.y2}`;
  }
  return `M ${edge.x1} ${edge.y1} L ${edge.x2} ${edge.y2}`;
}
