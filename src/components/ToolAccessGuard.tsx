// Always render the tool. Login is requested only at the moment a user clicks
// to generate output (handled inside each tool via useCredits / BuyCreditsDialog).
export const ToolAccessGuard = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
