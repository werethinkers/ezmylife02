import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ExpandedToolCard } from "@/components/ExpandedToolCard";
import { ToolCard } from "@/components/ToolCard";
import { ToolsChatbot } from "@/components/ToolsChatbot";
import { CategoryBrowser } from "@/components/CategoryBrowser";
import { 
  expandedTools,
  sectorSpecificTools, 
  totalToolCount,
  sectorCategories,
  departments,
  departmentSubcategories
} from "@/data/expandedTools";
import { tools as liveToolsList, getLiveToolsCount } from "@/data/tools";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Filter, LayoutGrid, List, CheckCircle2, ChevronDown } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Tools = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("All Sectors");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"browse" | "list" | "featured">("featured");

  // Get live tools from tools.tsx (Pi7, ToolFK, etc.)
  const featuredLiveTools = useMemo(() => {
    return liveToolsList.filter(t => t.isLive);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = selectedSector !== "All Sectors" || 
                           selectedDepartment !== "All Departments" || 
                           selectedSubcategory !== null ||
                           searchQuery.length > 0;

  // Filter tools based on all filters
  const filteredTools = useMemo(() => {
    let filtered = selectedSector !== "All Sectors" ? sectorSpecificTools : expandedTools;
    
    if (selectedSector !== "All Sectors") {
      filtered = filtered.filter(tool => tool.sector === selectedSector);
    }
    
    if (selectedDepartment !== "All Departments") {
      filtered = filtered.filter(tool => tool.department === selectedDepartment);
    }

    if (selectedSubcategory && selectedDepartment !== "All Departments") {
      const subcats = departmentSubcategories[selectedDepartment];
      const subcat = subcats?.find(s => s.name === selectedSubcategory);
      if (subcat) {
        filtered = filtered.filter(tool => subcat.tools.includes(tool.name));
      }
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tool =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.department.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [selectedSector, selectedDepartment, selectedSubcategory, searchQuery]);

  const currentSubcategories = selectedDepartment !== "All Departments" 
    ? departmentSubcategories[selectedDepartment] || []
    : [];

  const clearFilters = () => {
    setSelectedSector("All Sectors");
    setSelectedDepartment("All Departments");
    setSelectedSubcategory(null);
    setSearchQuery("");
  };

  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept);
    setSelectedSubcategory(null);
    if (dept !== "All Departments") {
      setViewMode("list");
    }
  };

  const handleSectorChange = (sector: string) => {
    setSelectedSector(sector);
    if (sector !== "All Sectors") {
      setViewMode("list");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Compact Header */}
      <header className="border-b border-border/40 pt-16 pb-6 bg-gradient-to-b from-primary/3 to-transparent">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Tools
              </h1>
              <p className="text-muted-foreground mt-1">
                {getLiveToolsCount()} live tools • {totalToolCount} total
              </p>
            </div>
            
            {/* View Mode Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "featured" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("featured")}
                className={viewMode === "featured" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Live
              </Button>
              <Button
                variant={viewMode === "browse" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("browse")}
              >
                <LayoutGrid className="h-4 w-4 mr-1.5" />
                Browse
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4 mr-1.5" />
                All
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        
        {/* Search & Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {/* Filters - Only show in list mode */}
          {viewMode === "list" && (
            <div className="flex gap-2">
              <Select value={selectedSector} onValueChange={handleSectorChange}>
                <SelectTrigger className="w-[160px] h-10">
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

              <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
                <SelectTrigger className="w-[160px] h-10">
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

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 text-destructive">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Subcategory Pills */}
        {viewMode === "list" && currentSubcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <Badge
              variant={selectedSubcategory === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedSubcategory(null)}
            >
              All
            </Badge>
            {currentSubcategories.map((sub) => (
              <Badge
                key={sub.name}
                variant={selectedSubcategory === sub.name ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedSubcategory(selectedSubcategory === sub.name ? null : sub.name)}
              >
                {sub.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Active Filters */}
        {hasActiveFilters && viewMode === "list" && (
          <div className="flex items-center gap-2 mb-6 text-sm">
            <span className="text-muted-foreground">Filters:</span>
            {selectedSector !== "All Sectors" && (
              <Badge variant="secondary" className="gap-1">
                {selectedSector}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedSector("All Sectors")} />
              </Badge>
            )}
            {selectedDepartment !== "All Departments" && (
              <Badge variant="secondary" className="gap-1">
                {selectedDepartment}
                <X className="h-3 w-3 cursor-pointer" onClick={() => { setSelectedDepartment("All Departments"); setSelectedSubcategory(null); }} />
              </Badge>
            )}
            <span className="text-muted-foreground ml-2">
              {filteredTools.length} results
            </span>
          </div>
        )}

        {/* Category Browser - Browse Mode */}
        {viewMode === "browse" && !searchQuery && (
          <CategoryBrowser
            onSelectDepartment={handleDepartmentChange}
            onSelectSector={handleSectorChange}
            selectedDepartment={selectedDepartment}
            selectedSector={selectedSector}
          />
        )}

        {/* Featured Live Tools */}
        {viewMode === "featured" && !searchQuery && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {featuredLiveTools.map((tool) => (
              <ToolCard key={tool.toolId} {...tool} />
            ))}
          </div>
        )}

        {/* All Tools Grid */}
        {(viewMode === "list" || searchQuery) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool) => (
              <ExpandedToolCard key={tool.id} {...tool} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {(viewMode === "list" || searchQuery) && filteredTools.length === 0 && (
          <div className="text-center py-16">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">No tools found</p>
            <p className="text-sm text-muted-foreground mb-4">Try adjusting your search or filters</p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Chatbot */}
      <ToolsChatbot />
    </div>
  );
};

export default Tools;
