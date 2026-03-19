import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, CheckCircle2, Eye, Sparkles } from "lucide-react";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getToolTypeConfig } from "@/data/toolTypes";
import { getToolIconUrl } from "@/data/toolIconMap";

interface EnhancedToolCardProps {
  id?: string;
  toolId?: string;
  name?: string;
  title?: string;
  description: string;
  sector?: string;
  department?: string;
  category?: string;
  isLive: boolean;
  icon: ReactNode;
  onQuickPreview?: () => void;
  index?: number;
}

export const EnhancedToolCard = ({ 
  id,
  toolId,
  name,
  title,
  description, 
  sector,
  department, 
  category,
  isLive,
  icon,
  onQuickPreview,
  index = 0
}: EnhancedToolCardProps) => {
  const navigate = useNavigate();
  const displayName = name || title || "";
  const displayId = toolId || id || "";
  const displayCategory = department || category || "";
  
  // Get tool type info for the icon badge
  const toolTypeConfig = getToolTypeConfig(displayName);
  const ToolTypeIcon = toolTypeConfig?.icon;
  
  // Get AI-generated icon
  const aiIconUrl = getToolIconUrl(displayId, displayCategory);

  const handleClick = () => {
    if (isLive) {
      navigate(`/tool/${displayId}`);
    } else {
      navigate(`/tool-preview/${displayId}`, { 
        state: { name: displayName, description, sector, department, isLive } 
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Card 
        className={cn(
          "group relative overflow-hidden transition-all duration-500",
          "bg-card/80 backdrop-blur-sm border-border/50",
          "hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10",
          "cursor-pointer",
          !isLive && "opacity-80"
        )}
        onClick={handleClick}
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>

        <CardContent className="p-5 relative">
          {/* Header row with icon and badges */}
          <div className="flex items-start justify-between mb-4">
            <div className={cn(
              "p-3 rounded-xl transition-all duration-500",
              "bg-gradient-to-br from-primary/10 to-accent/10",
              "border border-primary/20",
              "group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20"
            )}>
              <div className="text-primary h-6 w-6 flex items-center justify-center">
                {icon}
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              {isLive ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Soon
                </Badge>
              )}
            </div>
          </div>

          {/* Title and description */}
          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-1">
            {displayName}
          </h3>
          
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
            {description}
          </p>

          {/* Category, sector badges, and tool type indicator */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {/* Tool Type Icon Badge */}
            {ToolTypeIcon && (
              <div 
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                  "bg-gradient-to-r opacity-90",
                  toolTypeConfig?.gradient,
                  "text-white"
                )}
                title={`Tool Type: ${displayCategory}`}
              >
                <ToolTypeIcon className="h-3 w-3" />
              </div>
            )}
            {displayCategory && (
              <Badge variant="secondary" className="text-xs bg-secondary/50">
                {displayCategory}
              </Badge>
            )}
            {sector && (
              <span className="text-xs text-muted-foreground/70 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {sector}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm"
              className={cn(
                "flex-1 transition-all duration-300",
                "group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              <span className="flex items-center gap-2">
                {isLive ? 'Open' : 'Preview'}
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
            
            {onQuickPreview && (
              <Button
                variant="ghost"
                size="sm"
                className="px-3"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickPreview();
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
