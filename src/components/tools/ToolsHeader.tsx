import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  X, 
  LayoutGrid, 
  List, 
  CheckCircle2, 
  Sparkles,
  Zap,
  UserCircle,
  Download
} from "lucide-react";
import { motion } from "framer-motion";
import { ToolsExportButton } from "./ToolsExportButton";

interface ToolsHeaderProps {
  liveCount: number;
  totalCount: number;
  filteredCount?: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: "browse" | "list" | "featured" | "personalized";
  onViewModeChange: (mode: "browse" | "list" | "featured" | "personalized") => void;
}

export const ToolsHeader = ({
  liveCount,
  totalCount,
  filteredCount,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange
}: ToolsHeaderProps) => {
  const showingFiltered = filteredCount !== undefined && filteredCount !== totalCount;
  return (
    <header className="relative overflow-hidden border-b border-border/40 pt-20 pb-8">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 bg-mesh opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Title area */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Apps</span>
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
              Discover <span className="text-gradient">AI Apps</span>
            </h1>
            
            <p className="text-muted-foreground max-w-xl mx-auto">
              Explore our collection of powerful AI apps designed to solve real problems
            </p>
          </div>

          {/* Stats badges */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex items-center justify-center gap-3 mb-8 flex-wrap"
          >
            {showingFiltered ? (
              <Badge variant="secondary" className="px-4 py-1.5 gap-2 bg-primary/10 text-primary border-primary/30">
                <span className="text-primary/70">Showing</span>
                <span className="font-semibold">{filteredCount}</span>
                <span className="text-primary/70">of {totalCount.toLocaleString()} AI apps</span>
              </Badge>
            ) : (
              <>
                <Badge variant="secondary" className="px-4 py-1.5 gap-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                  <Zap className="h-3.5 w-3.5" />
                  <span className="font-semibold">{liveCount} Live</span>
                </Badge>
                <Badge variant="secondary" className="px-4 py-1.5 gap-2">
                  <span className="font-semibold">{totalCount.toLocaleString()} Total</span>
                </Badge>
              </>
            )}
          </motion.div>

          {/* Search bar */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="max-w-2xl mx-auto mb-6"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search AI apps by name, description, or category..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-12 pr-12 h-12 text-base bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50 rounded-xl shadow-lg"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => onSearchChange("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>

          {/* View mode toggle */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="flex items-center justify-center gap-2"
          >
            <div className="inline-flex items-center p-1 rounded-lg bg-secondary/50 backdrop-blur-sm border border-border/50">
              <Button
                variant={viewMode === "personalized" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("personalized")}
                className={viewMode === "personalized" ? "bg-gradient-to-r from-primary to-primary/80 shadow-md" : "hover:bg-secondary"}
              >
                <UserCircle className="h-4 w-4 mr-1.5" />
                For You
              </Button>
              <Button
                variant={viewMode === "featured" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("featured")}
                className={viewMode === "featured" ? "bg-emerald-600 hover:bg-emerald-700 shadow-md" : "hover:bg-secondary"}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Live Apps
              </Button>
              <Button
                variant={viewMode === "browse" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("browse")}
                className={viewMode === "browse" ? "shadow-md" : "hover:bg-secondary"}
              >
                <LayoutGrid className="h-4 w-4 mr-1.5" />
                Browse
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("list")}
                className={viewMode === "list" ? "shadow-md" : "hover:bg-secondary"}
              >
                <List className="h-4 w-4 mr-1.5" />
                All Apps
              </Button>
            </div>
            <ToolsExportButton className="ml-3" />
          </motion.div>
        </motion.div>
      </div>
    </header>
  );
};
