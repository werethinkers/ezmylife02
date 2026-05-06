import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useFavorites() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["favorites", user?.id ?? "anon"],
    queryFn: async () => {
      if (!user) return new Set<string>();
      const { data } = await supabase.from("tool_favorites").select("tool_id").eq("user_id", user.id);
      return new Set<string>((data ?? []).map((r: any) => r.tool_id));
    },
    enabled: true,
    staleTime: 60_000,
  });
  return { favorites: q.data ?? new Set<string>(), isLoading: q.isLoading };
}

export function useToggleFavorite() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [loginOpen, setLoginOpen] = useState(false);

  const m = useMutation({
    mutationFn: async ({ toolId, isFav }: { toolId: string; isFav: boolean }) => {
      if (!user) throw new Error("auth_required");
      if (isFav) {
        await supabase.from("tool_favorites").delete().eq("user_id", user.id).eq("tool_id", toolId);
      } else {
        await supabase.from("tool_favorites").insert({ user_id: user.id, tool_id: toolId });
      }
    },
    onMutate: async ({ toolId, isFav }) => {
      const key = ["favorites", user?.id ?? "anon"];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Set<string>>(key);
      const next = new Set(prev ?? []);
      if (isFav) next.delete(toolId);
      else next.add(toolId);
      qc.setQueryData(key, next);
      return { prev };
    },
    onError: (e: any, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["favorites", user?.id ?? "anon"], ctx.prev);
      if (e?.message !== "auth_required") toast.error("Couldn't update favourite");
    },
    onSuccess: (_d, { isFav }) => {
      toast.success(isFav ? "Removed from favourites" : "Added to favourites");
    },
  });

  const toggle = (toolId: string, isFav: boolean) => {
    if (!user) {
      setLoginOpen(true);
      return;
    }
    m.mutate({ toolId, isFav });
  };

  return { toggle, loginOpen, setLoginOpen };
}
