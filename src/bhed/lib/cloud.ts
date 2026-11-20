import { supabase } from "@/integrations/supabase/client";
import { collectMediaIds } from "./tree";
import type { Chart } from "./types";

/*
 * Cloud copy of a signed-in user's charts, in the site's Supabase (tables bhed_charts and
 * bhed_chart_media, see supabase/migrations/20261017180000_bhed_prabhed.sql). Row-level security
 * keeps every row private to its owner, so nothing here passes a user id: the database sets it.
 *
 * The functions keep the { data } call shape the sync layer was written against.
 * The tables are newer than the generated types in src/integrations/supabase/types.ts (that file
 * is regenerated from the database), so they are reached through a loosely typed handle.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (table: string) => any };

const MAX_DOC = 2_000_000;
const MAX_B64 = 8_000_000;

function assertId(id: unknown): string {
  if (typeof id !== "string" || id.length < 1 || id.length > 80) throw new Error("Bad id");
  return id;
}

function fail(error: { message?: string } | null | undefined, fallback: string): never {
  throw new Error(error?.message || fallback);
}

export async function listMyCharts(): Promise<{ id: string; title: string; updated_ms: number }[]> {
  const { data, error } = await db.from("bhed_charts").select("id, title, updated_ms").order("updated_ms", { ascending: false });
  if (error) fail(error, "Could not list your charts");
  return data ?? [];
}

export async function loadMyChart({ data: id }: { data: string }): Promise<string | null> {
  const { data, error } = await db.from("bhed_charts").select("document").eq("id", assertId(id)).maybeSingle();
  if (error) fail(error, "Could not open that chart");
  return data?.document ?? null;
}

export async function saveMyChart({
  data: input,
}: {
  data: { id: string; title: string; document: string; createdMs: number; updatedMs: number };
}): Promise<{ ok: true }> {
  const id = assertId(input?.id);
  if (typeof input.document !== "string" || input.document.length > MAX_DOC) throw new Error("Chart is too large to save");
  const { error } = await db.from("bhed_charts").upsert(
    {
      id,
      title: typeof input.title === "string" ? input.title.slice(0, 500) : "",
      document: input.document,
      created_ms: Number(input.createdMs) || Date.now(),
      updated_ms: Number(input.updatedMs) || Date.now(),
    },
    { onConflict: "user_id,id" },
  );
  if (error) fail(error, "Could not save this chart");
  return { ok: true };
}

export async function deleteMyChart({ data: id }: { data: string }): Promise<{ ok: true }> {
  assertId(id);
  const { data: row } = await db.from("bhed_charts").select("document").eq("id", id).maybeSingle();
  const { error } = await db.from("bhed_charts").delete().eq("id", id);
  if (error) fail(error, "Could not delete that chart");
  // Remove files no other chart still uses.
  let mediaIds: string[] = [];
  try {
    const chart = JSON.parse(row?.document ?? "null") as Chart | null;
    if (chart?.root) mediaIds = collectMediaIds(chart.root);
  } catch {
    mediaIds = [];
  }
  if (mediaIds.length) {
    const { data: others } = await db.from("bhed_charts").select("document");
    const text = (others ?? []).map((r: { document: string }) => r.document).join("\n");
    const orphaned = mediaIds.filter((m) => !text.includes(m));
    if (orphaned.length) await db.from("bhed_chart_media").delete().in("id", orphaned);
  }
  return { ok: true };
}

export async function putMyMedia({
  data: input,
}: {
  data: { chartId: string; id: string; name: string; mime: string; dataBase64: string };
}): Promise<{ ok: true }> {
  const chartId = assertId(input?.chartId);
  const id = assertId(input?.id);
  if (typeof input.dataBase64 !== "string" || input.dataBase64.length > MAX_B64) {
    throw new Error("File is too large to save to your account");
  }
  const dataBase64 = input.dataBase64.includes(",") ? input.dataBase64.slice(input.dataBase64.indexOf(",") + 1) : input.dataBase64;
  const { error } = await db.from("bhed_chart_media").upsert(
    {
      id,
      chart_id: chartId,
      name: typeof input.name === "string" ? input.name.slice(0, 240) : "media",
      mime: typeof input.mime === "string" ? input.mime.slice(0, 120) : "application/octet-stream",
      data_b64: dataBase64,
    },
    { onConflict: "user_id,id" },
  );
  if (error) fail(error, "Could not save that file");
  return { ok: true };
}

export async function pullMyMedia({
  data: ids,
}: {
  data: string[];
}): Promise<{ id: string; name: string; mime: string; data_b64: string }[]> {
  const clean = (Array.isArray(ids) ? ids : []).filter((id) => typeof id === "string" && id.length > 0 && id.length <= 80).slice(0, 12);
  if (!clean.length) return [];
  const { data, error } = await db.from("bhed_chart_media").select("id, name, mime, data_b64").in("id", clean);
  if (error) fail(error, "Could not load your files");
  return data ?? [];
}

export async function deleteMyMedia({ data: id }: { data: string }): Promise<{ ok: true }> {
  const { error } = await db.from("bhed_chart_media").delete().eq("id", assertId(id));
  if (error) fail(error, "Could not delete that file");
  return { ok: true };
}
