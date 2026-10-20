import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/*
 * Pages added by feature work. App.tsx renders these above the catch-all route.
 * One line per page, each line complete on its own: { path, page, signedIn? }.
 * This file is merged with git's "union" driver (see docs/branching.md), so branches that each
 * add a page never conflict here, while edits to App.tsx itself would.
 */
export type FeatureRoute = { path: string; page: LazyExoticComponent<ComponentType>; signedIn?: boolean };

export const featureRoutes: FeatureRoute[] = [
  { path: "/admin/influencers", page: lazy(() => import("./pages/influencers/AdminInfluencers")), signedIn: true },
  { path: "/admin/refunds", page: lazy(() => import("./pages/refunds/AdminRefunds")), signedIn: true },
  { path: "/studios", page: lazy(() => import("./pages/Studios")) },
  { path: "/studios/site-watch", page: lazy(() => import("./pages/SiteWatchDemo")) },
  { path: "/studios/bhed-prabhed", page: lazy(() => import("./pages/BhedPrabhed")) },
  { path: "/influencer", page: lazy(() => import("./pages/influencers/InfluencerPortal")) },
  { path: "/developer", page: lazy(() => import("./pages/developer/DeveloperHome")), signedIn: true },
  { path: "/developer/apps/:appId", page: lazy(() => import("./pages/developer/DeveloperAppEditor")), signedIn: true },
  { path: "/developer/preview/:versionId", page: lazy(() => import("./pages/developer/DeveloperPreview")), signedIn: true },
  { path: "/creators", page: lazy(() => import("./pages/earn/Creators")) },
  { path: "/list-your-app", page: lazy(() => import("./pages/earn/ListYourApp")) },
  { path: "/admin/developer-apps", page: lazy(() => import("./pages/developer/AdminDeveloperApps")), signedIn: true },
];
