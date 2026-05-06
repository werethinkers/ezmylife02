import { motion } from "framer-motion";
import { Sparkles, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ToolsHeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const ToolsHero = ({ searchQuery, onSearchChange }: ToolsHeroProps) => {
  return (
    <header className="relative overflow-hidden border-b border-border/40 pt-20 pb-12">
      <div className="absolute inset-0 bg-mesh opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-5">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Tools</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Discover <span className="text-gradient">Tools</span>
          </h1>

          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-8">
            Explore our collection of powerful AI tools designed to solve real problems
          </p>

          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tools by name, description, or category..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 pr-12 h-14 text-base bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50 rounded-2xl shadow-lg"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 p-0"
                onClick={() => onSearchChange("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </header>
  );
};

export default ToolsHero;
