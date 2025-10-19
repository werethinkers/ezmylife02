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
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card border-border/50">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Badge variant={getBadgeVariant(category)} className="uppercase text-xs font-semibold shadow-sm">
          {category}
        </Badge>
        {videoLink && (
          <a href={videoLink} target="_blank" rel="noopener noreferrer" className="opacity-50 hover:opacity-100 transition-opacity">
            <Video className="h-4 w-4 text-muted-foreground" />
          </a>
        )}
      </div>
      
      <CardHeader className="pb-4 relative z-10">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary border border-primary/20 group-hover:scale-110 transition-transform duration-300">
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
          asChild 
          variant="outline"
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300"
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
