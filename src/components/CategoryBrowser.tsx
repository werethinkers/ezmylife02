import { 
  Calculator, 
  Scale, 
  Megaphone, 
  Package, 
  Users, 
  MessageSquare,
  Building2,
  Briefcase,
  Utensils,
  Heart,
  Factory,
  Truck,
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
const departmentData: Record<string, { icon: LucideIcon; color: string; subcategories: string[] }> = {
  "Finance & Accounting": { 
    icon: Calculator, 
    color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-500/50",
    subcategories: ["Billing & Invoicing", "Expense Tracking", "Tax & Compliance", "Profit Analysis", "Debt Recovery"]
  },
  "Legal & Compliance": { 
    icon: Scale, 
    color: "from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-500/50",
    subcategories: ["Contract Management", "Regulatory Compliance", "Dispute Resolution", "Safety & Audits", "Documentation"]
  },
  "Marketing & Sales": { 
    icon: Megaphone, 
    color: "from-pink-500/20 to-pink-600/10 border-pink-500/30 hover:border-pink-500/50",
    subcategories: ["Outreach & Campaigns", "Customer Engagement", "Social Media", "Lead Generation", "Promotions & Offers"]
  },
  "Operations & Inventory": { 
    icon: Package, 
    color: "from-amber-500/20 to-amber-600/10 border-amber-500/30 hover:border-amber-500/50",
    subcategories: ["Stock Management", "Supplier Relations", "Quality Control", "Maintenance", "Shift Operations"]
  },
  "HR & Staffing": { 
    icon: Users, 
    color: "from-violet-500/20 to-violet-600/10 border-violet-500/30 hover:border-violet-500/50",
    subcategories: ["Recruitment", "Payroll & Benefits", "Performance", "Scheduling", "Discipline & Compliance"]
  },
  "Customer Service": { 
    icon: MessageSquare, 
    color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 hover:border-cyan-500/50",
    subcategories: ["Ticket Management", "FAQ & Knowledge Base", "Feedback & Reviews"]
  },
};

// Industry category icons
const industryData: Record<string, { icon: LucideIcon; color: string; sectors: string[] }> = {
  "Services & Professional": {
    icon: Briefcase,
    color: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 hover:border-indigo-500/50",
    sectors: ["Banking & Finance", "Legal Services", "Professional Services", "IT & Software", "Education & Training"]
  },
  "Retail & Commerce": {
    icon: Building2,
    color: "from-orange-500/20 to-orange-600/10 border-orange-500/30 hover:border-orange-500/50",
    sectors: ["Retail", "Food & Beverage", "Beauty & Wellness", "Hospitality & Tourism"]
  },
  "Industrial & Production": {
    icon: Factory,
    color: "from-slate-500/20 to-slate-600/10 border-slate-500/30 hover:border-slate-500/50",
    sectors: ["Manufacturing", "Agriculture & Farming", "Construction & Real Estate", "Energy & Utilities"]
  },
  "Logistics & Transport": {
    icon: Truck,
    color: "from-teal-500/20 to-teal-600/10 border-teal-500/30 hover:border-teal-500/50",
    sectors: ["Logistics", "Automotive & Transport", "Telecommunications"]
  },
  "Lifestyle & Entertainment": {
    icon: Heart,
    color: "from-rose-500/20 to-rose-600/10 border-rose-500/30 hover:border-rose-500/50",
    sectors: ["Entertainment & Media", "Gaming & E-sports", "Sports & Fitness", "Weddings & Events", "Non-Profit & NGO"]
  },
  "Healthcare": {
    icon: Heart,
    color: "from-red-500/20 to-red-600/10 border-red-500/30 hover:border-red-500/50",
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
    <div className="space-y-12">
      {/* Browse by Department */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Browse by Department</h2>
          {selectedDepartment !== "All Departments" && (
            <button 
              onClick={() => onSelectDepartment("All Departments")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear selection
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(departmentData).map(([dept, data]) => {
            const Icon = data.icon;
            const isSelected = selectedDepartment === dept;
            
            return (
              <Card 
                key={dept}
                className={cn(
                  "cursor-pointer transition-all duration-300 overflow-hidden group",
                  "bg-gradient-to-br border",
                  data.color,
                  isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
                onClick={() => onSelectDepartment(isSelected ? "All Departments" : dept)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-background/50 backdrop-blur-sm group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base mb-2">{dept}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {data.subcategories.slice(0, 3).map((sub) => (
                          <Badge 
                            key={sub} 
                            variant="secondary" 
                            className="text-xs bg-background/50 backdrop-blur-sm"
                          >
                            {sub}
                          </Badge>
                        ))}
                        {data.subcategories.length > 3 && (
                          <Badge variant="outline" className="text-xs">
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Browse by Industry</h2>
          {selectedSector !== "All Sectors" && (
            <button 
              onClick={() => onSelectSector("All Sectors")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear selection
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(industryData).map(([industry, data]) => {
            const Icon = data.icon;
            const isSelected = data.sectors.includes(selectedSector);
            
            return (
              <Card 
                key={industry}
                className={cn(
                  "cursor-pointer transition-all duration-300 overflow-hidden group",
                  "bg-gradient-to-br border",
                  data.color,
                  isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-background/50 backdrop-blur-sm group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base mb-2">{industry}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {data.sectors.slice(0, 2).map((sector) => (
                          <Badge 
                            key={sector} 
                            variant="secondary" 
                            className={cn(
                              "text-xs cursor-pointer transition-colors",
                              selectedSector === sector 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-background/50 backdrop-blur-sm hover:bg-background/80"
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
                            className="text-xs cursor-pointer hover:bg-background/50"
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
