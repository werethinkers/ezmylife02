import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, ArrowRight } from "lucide-react";

interface ProblemCardProps {
  label: string;
  description: string;
  icon: LucideIcon;
  toolCount: number;
  onClick: () => void;
  isActive?: boolean;
}

export const ProblemCard = ({ 
  label, 
  description, 
  icon: Icon, 
  toolCount, 
  onClick,
  isActive 
}: ProblemCardProps) => {
  return (
    <Card 
      onClick={onClick}
      className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 ${
        isActive ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${
            isActive 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground'
          }`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {label}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
            <div className="flex items-center justify-between pt-1">
              <Badge variant="secondary" className="text-xs">
                {toolCount.toLocaleString()}+ tools
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
