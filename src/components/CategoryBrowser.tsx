import { 
  Calculator, 
  Scale, 
  Megaphone, 
  Package, 
  Users, 
  MessageSquare,
  Building2,
  Briefcase,
  Factory,
  Truck,
  Heart,
  Sparkles,
  type LucideIcon
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryBrowserProps {
  onSelectDepartment: (department: string) => void;
  onSelectSector: (sector: string) => void;
  selectedDepartment: string;
  selectedSector: string;
}

// Department icons and colors
const departmentData: Record<string, { icon: LucideIcon; gradient: string; glow: string; subcategories: string[] }> = {
  "Finance & Accounting": { 
    icon: Calculator, 
    gradient: "from-emerald-500 to-teal-600",
    glow: "hover:shadow-emerald-500/25",
    subcategories: ["Billing & Invoicing", "Expense Tracking", "Tax & Compliance", "Profit Analysis", "Debt Recovery"]
  },
  "Legal & Compliance": { 
    icon: Scale, 
    gradient: "from-blue-500 to-indigo-600",
    glow: "hover:shadow-blue-500/25",
    subcategories: ["Contract Management", "Regulatory Compliance", "Dispute Resolution", "Safety & Audits", "Documentation"]
  },
  "Marketing & Sales": { 
    icon: Megaphone, 
    gradient: "from-pink-500 to-rose-600",
    glow: "hover:shadow-pink-500/25",
    subcategories: ["Outreach & Campaigns", "Customer Engagement", "Social Media", "Lead Generation", "Promotions & Offers"]
  },
  "Operations & Inventory": { 
    icon: Package, 
    gradient: "from-amber-500 to-orange-600",
    glow: "hover:shadow-amber-500/25",
    subcategories: ["Stock Management", "Supplier Relations", "Quality Control", "Maintenance", "Shift Operations"]
  },
  "HR & Staffing": { 
    icon: Users, 
    gradient: "from-violet-500 to-purple-600",
    glow: "hover:shadow-violet-500/25",
    subcategories: ["Recruitment", "Payroll & Benefits", "Performance", "Scheduling", "Discipline & Compliance"]
  },
  "Customer Service": { 
    icon: MessageSquare, 
    gradient: "from-cyan-500 to-sky-600",
    glow: "hover:shadow-cyan-500/25",
    subcategories: ["Ticket Management", "FAQ & Knowledge Base", "Feedback & Reviews"]
  },
};

// Industry category icons
const industryData: Record<string, { icon: LucideIcon; gradient: string; glow: string; sectors: string[] }> = {
  "Services & Professional": {
    icon: Briefcase,
    gradient: "from-indigo-500 to-blue-600",
    glow: "hover:shadow-indigo-500/25",
    sectors: ["Banking & Finance", "Legal Services", "Professional Services", "IT & Software", "Education & Training"]
  },
  "Retail & Commerce": {
    icon: Building2,
    gradient: "from-orange-500 to-red-600",
    glow: "hover:shadow-orange-500/25",
    sectors: ["Retail", "Food & Beverage", "Beauty & Wellness", "Hospitality & Tourism"]
  },
  "Industrial & Production": {
    icon: Factory,
    gradient: "from-slate-500 to-zinc-600",
    glow: "hover:shadow-slate-500/25",
    sectors: ["Manufacturing", "Agriculture & Farming", "Construction & Real Estate", "Energy & Utilities"]
  },
  "Logistics & Transport": {
    icon: Truck,
    gradient: "from-teal-500 to-emerald-600",
    glow: "hover:shadow-teal-500/25",
    sectors: ["Logistics", "Automotive & Transport", "Telecommunications"]
  },
  "Lifestyle & Entertainment": {
    icon: Heart,
    gradient: "from-rose-500 to-pink-600",
    glow: "hover:shadow-rose-500/25",
    sectors: ["Entertainment & Media", "Gaming & E-sports", "Sports & Fitness", "Weddings & Events", "Non-Profit & NGO"]
  },
  "Healthcare": {
    icon: Heart,
    gradient: "from-red-500 to-rose-600",
    glow: "hover:shadow-red-500/25",
    sectors: ["Healthcare & Medical"]
  },
};

export const CategoryBrowser = ({ 
  onSelectDepartment, 
  onSelectSector,
  selectedDepartment,
  selectedSector 
}: CategoryBrowserProps) => {
  return (
    <div className="space-y-16">
      {/* Browse by Department */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Browse by Department</h2>
          </div>
          {selectedDepartment !== "All Departments" && (
            <button 
              onClick={() => onSelectDepartment("All Departments")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Clear selection
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.entries(departmentData).map(([dept, data], index) => {
            const Icon = data.icon;
            const isSelected = selectedDepartment === dept;
            
            return (
              <Card 
                key={dept}
                className={cn(
                  "cursor-pointer transition-all duration-500 overflow-hidden group relative",
                  "bg-card/50 backdrop-blur-sm border-border/50",
                  "hover:-translate-y-1 hover:shadow-2xl",
                  data.glow,
                  isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-2xl"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => onSelectDepartment(isSelected ? "All Departments" : dept)}
              >
                {/* Gradient overlay on hover */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500",
                  `bg-gradient-to-br ${data.gradient}`
                )} />
                
                <CardContent className="p-6 relative">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-xl transition-all duration-300",
                      `bg-gradient-to-br ${data.gradient}`,
                      "group-hover:scale-110 group-hover:shadow-lg",
                      isSelected && "scale-110 shadow-lg"
                    )}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base mb-3 group-hover:text-primary transition-colors">{dept}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {data.subcategories.slice(0, 3).map((sub) => (
                          <Badge 
                            key={sub} 
                            variant="secondary" 
                            className="text-xs bg-muted/50 hover:bg-muted transition-colors"
                          >
                            {sub}
                          </Badge>
                        ))}
                        {data.subcategories.length > 3 && (
                          <Badge variant="outline" className="text-xs border-dashed">
                            +{data.subcategories.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Browse by Industry */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20">
              <Building2 className="h-5 w-5 text-accent" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Browse by Industry</h2>
          </div>
          {selectedSector !== "All Sectors" && (
            <button 
              onClick={() => onSelectSector("All Sectors")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Clear selection
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.entries(industryData).map(([industry, data], index) => {
            const Icon = data.icon;
            const isSelected = data.sectors.includes(selectedSector);
            
            return (
              <Card 
                key={industry}
                className={cn(
                  "cursor-pointer transition-all duration-500 overflow-hidden group relative",
                  "bg-card/50 backdrop-blur-sm border-border/50",
                  "hover:-translate-y-1 hover:shadow-2xl",
                  data.glow,
                  isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-2xl"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient overlay on hover */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500",
                  `bg-gradient-to-br ${data.gradient}`
                )} />
                
                <CardContent className="p-6 relative">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-xl transition-all duration-300",
                      `bg-gradient-to-br ${data.gradient}`,
                      "group-hover:scale-110 group-hover:shadow-lg",
                      isSelected && "scale-110 shadow-lg"
                    )}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base mb-3 group-hover:text-primary transition-colors">{industry}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {data.sectors.slice(0, 2).map((sector) => (
                          <Badge 
                            key={sector} 
                            variant="secondary" 
                            className={cn(
                              "text-xs cursor-pointer transition-all duration-300",
                              selectedSector === sector 
                                ? "bg-primary text-primary-foreground shadow-lg" 
                                : "bg-muted/50 hover:bg-muted hover:scale-105"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSector(selectedSector === sector ? "All Sectors" : sector);
                            }}
                          >
                            {sector}
                          </Badge>
                        ))}
                        {data.sectors.length > 2 && (
                          <Badge 
                            variant="outline" 
                            className="text-xs cursor-pointer border-dashed hover:bg-muted/50 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSector(data.sectors[0]);
                            }}
                          >
                            +{data.sectors.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export { departmentData };