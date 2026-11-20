import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { appPagePath } from "@/lib/appLink";

/* Tapping any app opens its full store page (src/pages/PromoPage.tsx). */

interface QuickLookCtx {
  openQuickLook: (toolId: string) => void;
}

const Ctx = createContext<QuickLookCtx>({ openQuickLook: () => {} });

export const useQuickLook = () => useContext(Ctx);

export function QuickLookProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { data: catalog = [] } = useToolsCatalog();
  const openQuickLook = useCallback(
    (id: string) => navigate(appPagePath(catalog.find((t) => t.id === id) ?? { id })),
    [navigate, catalog],
  );
  const value = useMemo(() => ({ openQuickLook }), [openQuickLook]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
