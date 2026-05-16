import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface ToolBackButtonProps {
  to?: string;
  /** When true, render a fixed floating button (for full-bleed tool pages without a navbar). */
  floating?: boolean;
}

/**
 * Universal "Back to AI Apps" button shown on every native/dedicated tool page.
 * Use floating={true} for full-screen tools that don't render the global Navbar.
 */
export const ToolBackButton = ({ to = "/ai-apps", floating = false }: ToolBackButtonProps) => {
  const navigate = useNavigate();

  const base =
    "inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm backdrop-blur transition hover:bg-background hover:shadow-md";

  if (floating) {
    return (
      <button
        type="button"
        onClick={() => navigate(to)}
        className={`fixed top-3 left-3 z-[60] ${base}`}
        aria-label="Back to AI Apps"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to AI Apps</span>
      </button>
    );
  }

  return (
    <div className="container mx-auto px-4 py-3">
      <button
        type="button"
        onClick={() => navigate(to)}
        className={base}
        aria-label="Back to AI Apps"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to AI Apps</span>
      </button>
    </div>
  );
};

export default ToolBackButton;
