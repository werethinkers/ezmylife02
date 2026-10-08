import { lazy, Suspense } from "react";
import type { Family, RenderProps } from "../types";

// Each family is code-split, so a birthday page never downloads the restaurant menu.
const R: Record<Family, React.LazyExoticComponent<(p: RenderProps) => JSX.Element>> = {
  celebration: lazy(() => import("./Celebration")),
  festival: lazy(() => import("./Festival")),
  event: lazy(() => import("./Event")),
  business: lazy(() => import("./Business")),
  menu: lazy(() => import("./Menu")),
  profile: lazy(() => import("./Profile")),
};

export function ProductRenderer(props: RenderProps) {
  const C = R[props.product.family];
  return (
    <Suspense fallback={<div style={{ minHeight: "60vh", background: props.theme.c.bg }} />}>
      <C {...props} />
    </Suspense>
  );
}
