import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_INFO, GOALS, type CategoryRow } from "@/data/goals";

/** A category as the admin sees it: its wording and where it sits, whether built in or made in admin. */
export interface AdminCategory {
  name: string;
  goal: string;
  line: string;
  give: string;
  get_text: string;
  kind: string;
  doc_give: string | null;
  doc_get: string | null;
  sort_order: number;
  /** In the database table (editable), or only in the built-in map (still shown, saved on first edit). */
  saved: boolean;
}

/**
 * Every category the admin can pick: rows of catalog_categories, plus built-in ones the table does
 * not have yet (so the picker is complete even before the database update is applied).
 */
export function useCategoryRows() {
  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: async (): Promise<AdminCategory[]> => {
      const { data } = await supabase.from("catalog_categories").select("*");
      const rows = new Map<string, AdminCategory>();
      for (const r of (data ?? []) as unknown as (CategoryRow & { give: string; line: string })[]) {
        rows.set(r.name, {
          name: r.name,
          goal: r.goal,
          line: r.line ?? "",
          give: r.give ?? "",
          get_text: r.get_text ?? "",
          kind: r.kind ?? "document",
          doc_give: r.doc_give ?? null,
          doc_get: r.doc_get ?? null,
          sort_order: r.sort_order ?? 0,
          saved: true,
        });
      }
      for (const [name, i] of Object.entries(CATEGORY_INFO)) {
        if (!rows.has(name)) {
          rows.set(name, { name, goal: i.goal, line: i.line, give: i.give, get_text: i.get, kind: i.kind, doc_give: i.docGive ?? null, doc_get: i.docGet ?? null, sort_order: 0, saved: false });
        }
      }
      const goalIndex = (g: string) => {
        const i = GOALS.findIndex((x) => x.id === g);
        return i < 0 ? 99 : i;
      };
      return [...rows.values()].sort((a, b) => goalIndex(a.goal) - goalIndex(b.goal) || (a.sort_order || 9999) - (b.sort_order || 9999) || a.name.localeCompare(b.name));
    },
    staleTime: 30_000,
  });
}

/** After any grouping change: reload the lists here and make the store pick it up straight away. */
export function useRefreshGroupings() {
  const qc = useQueryClient();
  return () => {
    try {
      localStorage.removeItem("ez.catalog.v3");
      localStorage.removeItem("ez.categories.v1");
    } catch {
      /* storage blocked */
    }
    void qc.invalidateQueries({ queryKey: ["admin-categories"] });
    void qc.invalidateQueries({ queryKey: ["tools-catalog"] });
    void qc.invalidateQueries({ queryKey: ["admin-grouping-tools"] });
  };
}
