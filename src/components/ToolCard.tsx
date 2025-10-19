import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, ExternalLink } from "lucide-react";
import { ReactNode } from "react";

interface ToolCardProps {
  title: string;
  description: string;
  category: string;
  icon: ReactNode;
  link: string;
  videoLink: string;
}

export const ToolCard = ({ title, description, category, icon, link, videoLink }: ToolCardProps) => {
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
      default:
        return "outline";
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-card to-accent/10 border-border/50">
      <div className="absolute top-3 right-3 flex gap-2">
        <Badge variant={getBadgeVariant(category)} className="uppercase text-xs font-semibold">
          {category}
        </Badge>
        {videoLink && (
          <a href={videoLink} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">
            <Video className="h-4 w-4 text-muted-foreground" />
          </a>
        )}
      </div>
      
      <CardHeader className="pb-4">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg">
          {icon}
        </div>
        <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Button 
          asChild 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all"
        >
          <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
            Open Tool
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};
