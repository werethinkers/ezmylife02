import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, ArrowRight } from "lucide-react";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface ToolCardProps {
  title: string;
  description: string;
  category: string;
  icon: ReactNode;
  toolId: string;
  videoLink: string;
  isLive?: boolean;
}

export const ToolCard = ({ title, description, category, icon, toolId, videoLink, isLive = true }: ToolCardProps) => {
  const navigate = useNavigate();
  
  const getBadgeVariant = (category: string) => {
    switch (category.toLowerCase()) {
      case "popular":
        return "default";
      case "content":
        return "secondary";
      case "research":
        return "outline";
      case "lab":
        return "destructive";
      case "ai agent":
        return "default";
      case "modern science":
        return "secondary";
      case "image tools":
        return "default";
      default:
        return "outline";
    }
  };

  const handleOpenTool = () => {
    navigate(`/tool/${toolId}`);
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card border-border/50">
      <div className="absolute inset-0 bg-sand/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Badge variant="outline" className="text-xs font-semibold bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
          Live
        </Badge>
        <Badge variant={getBadgeVariant(category)} className="uppercase text-xs font-semibold shadow-sm">
          {category}
        </Badge>
        {videoLink && (
          <a 
            href={videoLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="opacity-50 hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Video className="h-4 w-4 text-muted-foreground" />
          </a>
        )}
      </div>
      
      <CardHeader className="pb-4 relative z-10">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sand/70 text-primary border border-primary/20 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <Button 
          onClick={handleOpenTool}
          variant="outline"
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300"
        >
          <span className="flex items-center justify-center gap-2">
            Open Tool
            <ArrowRight className="h-4 w-4" />
          </span>
        </Button>
      </CardContent>
    </Card>
  );
};