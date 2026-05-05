// Premium gating removed: monetization is now credit-based, so this is a thin
// alias for ProtectedRoute (login required). Kept to avoid breaking imports.
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const PremiumRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);
