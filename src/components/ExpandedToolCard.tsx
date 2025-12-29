import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock } from "lucide-react";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface ExpandedToolCardProps {
  id: string;
  name: string;
  description: string;
  sector: string;
  department: string;
  isLive: boolean;
  icon: ReactNode;
}

export const ExpandedToolCard = ({ 
  id,
  name, 
  description, 
  sector, 
  department, 
  isLive,
  icon 
}: ExpandedToolCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/tool-preview/${id}`, { 
      state: { name, description, sector, department, isLive } 
    });
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card border-border/50">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Badge variant="secondary" className="text-xs">
          {department}
        </Badge>
        {isLive ? (
          <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
            Live
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Coming Soon
          </Badge>
        )}
      </div>
      
      <CardHeader className="pb-4 relative z-10">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary border border-primary/20 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
          {name}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {description}
        </CardDescription>
        <p className="text-xs text-muted-foreground mt-2">
          {sector}
        </p>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <Button 
          onClick={handleClick}
          variant="outline"
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300"
        >
          <span className="flex items-center justify-center gap-2">
            {isLive ? "Open Tool" : "Learn More"}
            <ArrowRight className="h-4 w-4" />
          </span>
        </Button>
      </CardContent>
    </Card>
  );
};
