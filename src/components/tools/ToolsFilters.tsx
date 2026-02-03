import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Filter, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ToolsFiltersProps {
  selectedSector: string;
  selectedDepartment: string;
  selectedSubcategory: string | null;
  selectedToolType: string;
  onSectorChange: (sector: string) => void;
  onDepartmentChange: (department: string) => void;
  onSubcategoryChange: (subcategory: string | null) => void;
  onToolTypeChange: (toolType: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  filteredCount: number;
  sectorCategories: Record<string, string[]>;
  departments: string[];
  subcategories: { name: string; tools: string[] }[];
}

// Tool types list matching CategoryBrowser
const toolTypes = [
  "All Types",
  "Image Tools",
  "Document Tools", 
  "Video Tools",
  "Audio Tools",
  "AI & Automation",
  "Analytics Tools",
  "Developer Tools",
  "Communication",
  "Security Tools",
  "Productivity",
  "Text Tools",
  "QR & Barcode",
  "Calculators",
  "Converters",
  "Social Media",
  "SEO Tools",
  "File Management",
  "Design Tools",
  "Writing Tools",
  "Data Tools",
];

export const ToolsFilters = ({
  selectedSector,
  selectedDepartment,
  selectedSubcategory,
  selectedToolType,
  onSectorChange,
  onDepartmentChange,
  onSubcategoryChange,
  onToolTypeChange,
  onClearFilters,
  hasActiveFilters,
  filteredCount,
  sectorCategories,
  departments,
  subcategories
}: ToolsFiltersProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 mb-6"
    >
      {/* Filter row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        
        <div className="flex flex-wrap gap-2 flex-1">
          <Select value={selectedSector} onValueChange={onSectorChange}>
            <SelectTrigger className={cn(
              "w-[180px] h-9 text-sm",
              selectedSector !== "All Sectors" && "border-primary/50 bg-primary/5"
            )}>
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Sectors">All Industries</SelectItem>
              {Object.entries(sectorCategories).map(([category, sectorList]) => (
                <div key={category}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {category}
                  </div>
                  {sectorList.map((sector) => (
                    <SelectItem key={sector} value={sector} className="pl-4">
                      {sector}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
            <SelectTrigger className={cn(
              "w-[180px] h-9 text-sm",
              selectedDepartment !== "All Departments" && "border-primary/50 bg-primary/5"
            )}>
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedToolType} onValueChange={onToolTypeChange}>
            <SelectTrigger className={cn(
              "w-[180px] h-9 text-sm",
              selectedToolType !== "All Types" && "border-primary/50 bg-primary/5"
            )}>
              <SelectValue placeholder="Tool Type" />
            </SelectTrigger>
            <SelectContent>
              {toolTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearFilters} 
              className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <Badge variant="outline" className="text-xs whitespace-nowrap">
          {filteredCount.toLocaleString()} results
        </Badge>
      </div>

      {/* Subcategory pills */}
      <AnimatePresence>
        {subcategories.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            <Badge
              variant={selectedSubcategory === null ? "default" : "outline"}
              className="cursor-pointer transition-all hover:scale-105"
              onClick={() => onSubcategoryChange(null)}
            >
              All
            </Badge>
            {subcategories.map((sub) => (
              <Badge
                key={sub.name}
                variant={selectedSubcategory === sub.name ? "default" : "outline"}
                className="cursor-pointer transition-all hover:scale-105"
                onClick={() => onSubcategoryChange(selectedSubcategory === sub.name ? null : sub.name)}
              >
                {sub.name}
              </Badge>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active filter badges */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <span className="text-xs text-muted-foreground">Active:</span>
            {selectedSector !== "All Sectors" && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {selectedSector}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => onSectorChange("All Sectors")} 
                />
              </Badge>
            )}
            {selectedDepartment !== "All Departments" && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {selectedDepartment}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => { onDepartmentChange("All Departments"); onSubcategoryChange(null); }} 
                />
              </Badge>
            )}
            {selectedToolType !== "All Types" && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {selectedToolType}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => onToolTypeChange("All Types")} 
                />
              </Badge>
            )}
            {selectedSubcategory && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {selectedSubcategory}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => onSubcategoryChange(null)} 
                />
              </Badge>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
