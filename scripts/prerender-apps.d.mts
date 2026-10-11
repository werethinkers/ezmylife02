import type { Plugin } from "vite";
export function appPages(): Plugin;
export function prerenderApps(options?: { dist?: string; log?: (message: string) => void }): Promise<number>;
