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
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-glow" />
        <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 border border-border/50">
          <Search className="h-10 w-10 text-muted-foreground" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-foreground mb-2">No tools found</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Try adjusting your search or filters to find what you're looking for
      </p>
      
      {hasActiveFilters && (
        <Button variant="outline" onClick={onClearFilters} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Clear all filters
        </Button>
      )}
    </motion.div>
  );
};
