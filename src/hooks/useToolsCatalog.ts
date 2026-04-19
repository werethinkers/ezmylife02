import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CatalogTool {
  id: string;
  name: string;
  description: string;
  category: string;
  tool_types: string[];
  source: "business" | "featured";
  is_live: boolean;
  is_free?: boolean;
  display_order?: number;
  icon_url?: string | null;
  created_at: string;
  updated_at: string;
}

async function fetchToolsCatalog(): Promise<CatalogTool[]> {
  const { data, error } = await supabase
    .from("tools_catalog")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as CatalogTool[]) ?? [];
}

export function useToolsCatalog() {
  return useQuery({
    queryKey: ["tools-catalog"],
    queryFn: fetchToolsCatalog,
    staleTime: 5 * 60 * 1000, // 5 min cache
    gcTime: 30 * 60 * 1000,
  });
}

export function useToolsCatalogStats() {
  const { data: tools = [], isLoading } = useToolsCatalog();
  
  return {
    total: tools.length,
    live: tools.filter(t => t.is_live).length,
    business: tools.filter(t => t.source === "business").length,
    featured: tools.filter(t => t.source === "featured").length,
    isLoading,
  };
}
