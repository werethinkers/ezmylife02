import { Suspense, createContext, lazy, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/*
 * Quick Look: tap any app to see its screenshots, price and an Open button in a sheet
 * (bottom drawer you can swipe down on phones, side panel on desktop). Esc closes it.
 * The sheet's code loads on first use so it doesn't slow down the first page view.
 */

const QuickLookPanel = lazy(() => import("./QuickLookPanel"));

interface QuickLookCtx {
  openQuickLook: (toolId: string) => void;
}

const Ctx = createContext<QuickLookCtx>({ openQuickLook: () => {} });

export const useQuickLook = () => useContext(Ctx);

export function QuickLookProvider({ children }: { children: ReactNode }) {
  const [toolId, setToolId] = useState<string | null>(null);
  const [used, setUsed] = useState(false);
  const openQuickLook = useCallback((id: string) => {
    setUsed(true);
    setToolId(id);
  }, []);
  const value = useMemo(() => ({ openQuickLook }), [openQuickLook]);
  return (
    <Ctx.Provider value={value}>
      {children}
      {used && (
        <Suspense fallback={null}>
          <QuickLookPanel toolId={toolId} onClose={() => setToolId(null)} />
        </Suspense>
      )}
    </Ctx.Provider>
  );
}
