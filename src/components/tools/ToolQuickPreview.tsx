import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ExternalLink, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface ToolQuickPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: {
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
  } | null;
}

export const ToolQuickPreview = ({ open, onOpenChange, tool }: ToolQuickPreviewProps) => {
  const navigate = useNavigate();

  if (!tool) return null;

  const toolName = tool.name || tool.title || "";
  const toolId = tool.toolId || tool.id || "";

  const handleOpenTool = () => {
    onOpenChange(false);
    if (tool.isLive) {
      navigate(`/tool/${toolId}`);
    } else {
      navigate(`/tool-preview/${toolId}`, {
        state: { name: toolName, description: tool.description, sector: tool.sector, department: tool.department, isLive: tool.isLive }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0">
        <div className="relative">
          {/* Gradient Header */}
          <div className="h-24 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="p-4 rounded-2xl bg-background/90 backdrop-blur-sm border border-border/50 shadow-lg"
            >
              <div className="text-primary">
                {tool.icon}
              </div>
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-6">
            <DialogHeader className="text-left space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Live
                </Badge>
                {(tool.department || tool.category) && (
                  <Badge variant="secondary">
                    {tool.department || tool.category}
                  </Badge>
                )}
              </div>
              
              <DialogTitle className="text-xl font-bold">
                {toolName}
              </DialogTitle>
              
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                {tool.description}
              </DialogDescription>

              {tool.sector && (
                <p className="text-xs text-muted-foreground/70 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  {tool.sector}
                </p>
              )}
            </DialogHeader>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <Button 
                onClick={handleOpenTool}
                className="flex-1 gap-2"
              >
                Open Tool
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => window.open(`/tool/${toolId}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
