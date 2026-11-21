import { Suspense, createContext, lazy, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

/*
 * Quick Look: tap any app on a phone to see its screenshots, price and an Open button in a bottom
 * drawer you can swipe down. On desktop, the same tap instead goes straight to the full Play
 * Store–style /promo page — a narrow side-panel sheet isn't the "full page" experience desktop
 * deserves, and PromoPage already resolves a raw tool id as its slug. The sheet's code loads on
 * first use so it doesn't slow down the first page view.
 */

const QuickLookPanel = lazy(() => import("./QuickLookPanel"));
const DESKTOP_BREAKPOINT = 768;

interface QuickLookCtx {
  openQuickLook: (toolId: string) => void;
}

const Ctx = createContext<QuickLookCtx>({ openQuickLook: () => {} });

export const useQuickLook = () => useContext(Ctx);

export function QuickLookProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [toolId, setToolId] = useState<string | null>(null);
  const [used, setUsed] = useState(false);
  const openQuickLook = useCallback((id: string) => {
    if (typeof window !== "undefined" && window.innerWidth >= DESKTOP_BREAKPOINT) {
      navigate(`/promo/${id}`);
      return;
    }
    setUsed(true);
    setToolId(id);
  }, [navigate]);
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
