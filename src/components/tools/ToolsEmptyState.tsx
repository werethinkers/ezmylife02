import { Button } from "@/components/ui/button";
import { Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface ToolsEmptyStateProps {
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const ToolsEmptyState = ({ onClearFilters, hasActiveFilters }: ToolsEmptyStateProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="text-center py-20"
    >
      <div className="relative inline-flex mb-6">
        <div className="relative rounded-full border-2 border-ink bg-sun p-6">
          <Search className="h-10 w-10 text-ink" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-foreground mb-2">No apps match that</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Try a simpler word, like “bill”, “photo” or “salary”. Or ask us to build the app you need.
      </p>
      
      {hasActiveFilters && (
        <Button variant="outline" onClick={onClearFilters} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Clear search
        </Button>
      )}
    </motion.div>
  );
};
