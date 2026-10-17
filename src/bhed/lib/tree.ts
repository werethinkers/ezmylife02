import {
  DEFAULT_STYLE,
  depthLabel,
  type BhedNode,
  type Chart,
  type NodePatch,
} from "./types";

export function makeNode(partial: Partial<BhedNode> = {}): BhedNode {
  return {
    id: partial.id ?? crypto.randomUUID(),
    title: partial.title ?? "",
    body: partial.body ?? "",
    style: { ...DEFAULT_STYLE, ...partial.style },
    collapsed: partial.collapsed ?? false,
    media: partial.media ? partial.media.map((item) => ({ ...item })) : [],
    children: partial.children ?? [],
  };
}

export function findNode(root: BhedNode, id: string): BhedNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

export function findParent(root: BhedNode, id: string): BhedNode | null {
  for (const child of root.children) {
    if (child.id === id) return root;
    const found = findParent(child, id);
    if (found) return found;
  }
  return null;
}

export function mapNode(root: BhedNode, id: string, fn: (node: BhedNode) => BhedNode): BhedNode {
  if (root.id === id) return fn(root);
  let changed = false;
  const children = root.children.map((child) => {
    const next = mapNode(child, id, fn);
    if (next !== child) changed = true;
    return next;
  });
  return changed ? { ...root, children } : root;
}

export function patchInTree(root: BhedNode, id: string, patch: NodePatch): BhedNode {
  return mapNode(root, id, (node) => ({
    ...node,
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.body !== undefined ? { body: patch.body } : {}),
    ...(patch.collapsed !== undefined ? { collapsed: patch.collapsed } : {}),
    style: patch.style ? { ...node.style, ...patch.style } : node.style,
  }));
}

export function insertChild(
  root: BhedNode,
  parentId: string,
  child: BhedNode,
  index?: number,
): BhedNode {
  return mapNode(root, parentId, (node) => {
    const children = node.children.slice();
    const at = index == null ? children.length : Math.max(0, Math.min(index, children.length));
    children.splice(at, 0, child);
    return { ...node, children, collapsed: false };
  });
}

export function moveSibling(root: BhedNode, id: string, dir: -1 | 1): BhedNode {
  const parent = findParent(root, id);
  if (!parent) return root;
  const index = parent.children.findIndex((child) => child.id === id);
  const nextIndex = index + dir;
  if (index < 0 || nextIndex < 0 || nextIndex >= parent.children.length) return root;
  const children = parent.children.slice();
  const [item] = children.splice(index, 1);
  children.splice(nextIndex, 0, item!);
  return mapNode(root, parent.id, (node) => ({ ...node, children }));
}

export function detach(root: BhedNode, id: string): { next: BhedNode; removed: BhedNode | null } {
  if (root.id === id) return { next: root, removed: null };
  let removed: BhedNode | null = null;
  const walk = (node: BhedNode): BhedNode => {
    let changed = false;
    const children: BhedNode[] = [];
    for (const child of node.children) {
      if (child.id === id) {
        removed = child;
        changed = true;
        continue;
      }
      const next = walk(child);
      if (next !== child) changed = true;
      children.push(next);
    }
    return changed ? { ...node, children } : node;
  };
  return { next: walk(root), removed };
}

export function ancestors(root: BhedNode, id: string): BhedNode[] {
  const path: BhedNode[] = [];
  const walk = (node: BhedNode): boolean => {
    path.push(node);
    if (node.id === id) return true;
    for (const child of node.children) {
      if (walk(child)) return true;
    }
    path.pop();
    return false;
  };
  walk(root);
  return path;
}

export function depthOf(root: BhedNode, id: string): number {
  return Math.max(0, ancestors(root, id).length - 1);
}

export type InsideStats = { total: number; here: number; levels: number };

/** Every nested item under a node. `total` includes the direct children. */
export function insideStats(node: BhedNode): InsideStats {
  let total = 0;
  let levels = 0;
  const walk = (current: BhedNode, depth: number) => {
    for (const child of current.children) {
      total += 1;
      if (depth > levels) levels = depth;
      walk(child, depth + 1);
    }
  };
  walk(node, 1);
  return { total, here: node.children.length, levels };
}

/** Finest items under a node. A node with no children counts as one. */
export function leafCount(node: BhedNode): number {
  if (!node.children.length) return 1;
  let count = 0;
  for (const child of node.children) count += leafCount(child);
  return count;
}

/** here = this level, next = the split under it, leaves = every प्रभेद under that split. */
export function splitCounts(node: BhedNode): { here: number; next: number; leaves: number } {
  let next = 0;
  let leaves = 0;
  for (const child of node.children) {
    next += child.children.length;
    for (const grand of child.children) leaves += leafCount(grand);
  }
  return { here: node.children.length, next, leaves };
}

export function walk(root: BhedNode, fn: (node: BhedNode, depth: number) => void) {
  const visit = (node: BhedNode, depth: number) => {
    fn(node, depth);
    node.children.forEach((child) => visit(child, depth + 1));
  };
  visit(root, 0);
}

export function collectMediaIds(root: BhedNode): string[] {
  const ids: string[] = [];
  walk(root, (node) => {
    node.media.forEach((item) => ids.push(item.id));
  });
  return ids;
}

export function containsId(root: BhedNode, id: string): boolean {
  return findNode(root, id) != null;
}

export function cloneNode(node: BhedNode): BhedNode {
  return {
    ...node,
    id: crypto.randomUUID(),
    style: { ...node.style },
    media: node.media.map((item) => ({ ...item })),
    children: node.children.map(cloneNode),
  };
}

export function childTitle(parentDepth: number, index: number): string {
  return `${depthLabel(parentDepth + 1)} ${index}`;
}

export function emptyChart(): Chart {
  const now = Date.now();
  const root = makeNode({
    title: "Untitled topic",
    body: "",
    collapsed: false,
  });
  return { id: crypto.randomUUID(), title: root.title, root, createdAt: now, updatedAt: now };
}

export function retitle(chart: Chart, root: BhedNode): Chart {
  return { ...chart, root, title: root.title, updatedAt: Date.now() };
}
