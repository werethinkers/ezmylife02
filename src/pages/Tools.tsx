import { useState, useMemo } from "react";
import { ExpandedToolCard } from "@/components/ExpandedToolCard";
import { ToolsChatbot } from "@/components/ToolsChatbot";
import { CategoryBrowser } from "@/components/CategoryBrowser";
import { 
  expandedTools, 
  totalToolCount,
  sectorCategories,
  departments,
  personaCategories,
  departmentSubcategories
} from "@/data/expandedTools";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ArrowRight, Sparkles, Filter, LayoutGrid, List, Zap, Download } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Tools = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("All Sectors");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [selectedPersona, setSelectedPersona] = useState("All Personas");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [showCategoryBrowser, setShowCategoryBrowser] = useState(true);
  const [viewMode, setViewMode] = useState<"browse" | "list">("browse");

  // Check if any filters are active
  const hasActiveFilters = selectedSector !== "All Sectors" || 
                           selectedDepartment !== "All Departments" || 
                           selectedPersona !== "All Personas" ||
                           selectedSubcategory !== null ||
                           searchQuery.length > 0;

  // Filter tools based on all filters
  const filteredTools = useMemo(() => {
    let filtered = expandedTools;
    
    if (selectedSector !== "All Sectors") {
      filtered = filtered.filter(tool => tool.sector === selectedSector);
    }
    
    if (selectedDepartment !== "All Departments") {
      filtered = filtered.filter(tool => tool.department === selectedDepartment);
    }
    
    if (selectedPersona !== "All Personas") {
      filtered = filtered.filter(tool => tool.userPersona === selectedPersona);
    }

    // Filter by subcategory (tool names within that subcategory)
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
        tool.sector.toLowerCase().includes(query) ||
        tool.department.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [selectedSector, selectedDepartment, selectedPersona, selectedSubcategory, searchQuery]);

  // Get subcategories for selected department
  const currentSubcategories = selectedDepartment !== "All Departments" 
    ? departmentSubcategories[selectedDepartment] || []
    : [];

  const clearFilters = () => {
    setSelectedSector("All Sectors");
    setSelectedDepartment("All Departments");
    setSelectedPersona("All Personas");
    setSelectedSubcategory(null);
    setSearchQuery("");
  };

  // Export tools to CSV
  const exportToCSV = () => {
    const headers = ["ID", "Tool Name", "Description", "Sector", "User Persona", "Department"];
    const csvContent = [
      headers.join(","),
      ...expandedTools.map(tool => [
        tool.id,
        `"${tool.name.replace(/"/g, '""')}"`,
        `"${tool.description.replace(/"/g, '""')}"`,
        `"${tool.sector.replace(/"/g, '""')}"`,
        `"${tool.userPersona.replace(/"/g, '""')}"`,
        `"${tool.department.replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ezmylife_tools_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept);
    setSelectedSubcategory(null);
    if (dept !== "All Departments") {
      setViewMode("list");
      setShowCategoryBrowser(false);
    }
  };

  const handleSectorChange = (sector: string) => {
    setSelectedSector(sector);
    if (sector !== "All Sectors") {
      setViewMode("list");
      setShowCategoryBrowser(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-mesh pointer-events-none" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
      
      <Navbar />
      
      {/* Hero Header */}
      <header className="relative border-b border-border/40 pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-mesh opacity-50" />
        
        <div className="relative container mx-auto px-4 py-12 md:py-20">
          <div className="flex flex-col items-center gap-8 text-center max-w-4xl mx-auto">
            {/* Animated badge */}
            <div className="animate-fade-in-down flex items-center gap-3">
              <Badge variant="secondary" className="text-sm px-5 py-2.5 glass border-primary/20 glow-sm">
                <Zap className="h-4 w-4 mr-2 text-primary" />
                <span className="text-gradient font-semibold">{totalToolCount.toLocaleString()}+</span>
                <span className="ml-1 text-muted-foreground">Tools Available</span>
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="glass border-primary/30 hover:border-primary/50 hover:bg-primary/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight animate-fade-in-up">
              <span className="text-foreground">Digital</span>{" "}
              <span className="text-gradient animate-gradient-text bg-gradient-to-r from-primary via-accent to-primary">Tools</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed animate-fade-in stagger-2">
              A comprehensive collection of AI-powered tools designed for maximum productivity and seamless workflows
            </p>

            {/* Floating decorative elements */}
            <div className="absolute -left-10 top-1/2 w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 blur-sm animate-float opacity-50 hidden lg:block" />
            <div className="absolute -right-5 top-1/3 w-16 h-16 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 blur-sm animate-float stagger-3 opacity-50 hidden lg:block" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto px-4 py-12 md:py-16">
        
        {/* Search and Filters Section */}
        <section className="mb-12 space-y-6 max-w-6xl mx-auto">
          {/* View Mode Toggle + Search */}
          <div className="flex flex-col md:flex-row gap-4 animate-fade-in-up stagger-3">
            {/* Search Bar */}
            <div className="relative flex-1 group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-accent/50 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm" />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  type="text"
                  placeholder="Search tools by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-base glass border-border/50 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* View Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "browse" | "list")} className="w-auto">
              <TabsList className="h-14 p-1.5 glass">
                <TabsTrigger value="browse" className="gap-2 h-full px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Browse</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2 h-full px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">All Tools</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Filter Row - Only show in list mode */}
          {viewMode === "list" && (
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center animate-fade-in-up">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Filter className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">Filter by:</span>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {/* Sector Filter with Categories */}
                <Select value={selectedSector} onValueChange={handleSectorChange}>
                  <SelectTrigger className="w-[220px] glass hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Select Industry" />
                  </SelectTrigger>
                  <SelectContent className="glass-strong">
                    <SelectItem value="All Sectors">All Industries</SelectItem>
                    {Object.entries(sectorCategories).map(([category, sectorList]) => (
                      <div key={category}>
                        <div className="px-2 py-2 text-xs font-bold text-primary bg-primary/5 sticky top-0">
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

                {/* Department Filter */}
                <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
                  <SelectTrigger className="w-[200px] glass hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent className="glass-strong">
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* User Persona Filter with Categories */}
                <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                  <SelectTrigger className="w-[200px] glass hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent className="glass-strong">
                    <SelectItem value="All Personas">All Roles</SelectItem>
                    {Object.entries(personaCategories).map(([category, personaList]) => (
                      <div key={category}>
                        <div className="px-2 py-2 text-xs font-bold text-primary bg-primary/5 sticky top-0">
                          {category}
                        </div>
                        {personaList.map((persona) => (
                          <SelectItem key={persona} value={persona} className="pl-4">
                            {persona}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button 
                    variant="outline" 
                    size="default" 
                    onClick={clearFilters}
                    className="glass border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Subcategory Pills - Show when department is selected */}
          {viewMode === "list" && currentSubcategories.length > 0 && (
            <div className="flex flex-wrap gap-2 p-5 glass rounded-2xl animate-fade-in">
              <span className="text-sm font-semibold text-muted-foreground mr-3 self-center">
                Subcategories:
              </span>
              <Badge
                variant={selectedSubcategory === null ? "default" : "outline"}
                className={`cursor-pointer transition-all hover-scale ${
                  selectedSubcategory === null 
                    ? "bg-primary text-primary-foreground glow-sm" 
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedSubcategory(null)}
              >
                All
              </Badge>
              {currentSubcategories.map((sub) => (
                <Badge
                  key={sub.name}
                  variant={selectedSubcategory === sub.name ? "default" : "outline"}
                  className={`cursor-pointer transition-all hover-scale ${
                    selectedSubcategory === sub.name 
                      ? "bg-primary text-primary-foreground glow-sm" 
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedSubcategory(selectedSubcategory === sub.name ? null : sub.name)}
                >
                  {sub.name}
                  <span className="ml-1.5 text-xs opacity-70">({sub.tools.length})</span>
                </Badge>
              ))}
            </div>
          )}

          {/* Active Filters Banner */}
          {hasActiveFilters && viewMode === "list" && (
            <div className="p-5 glass rounded-2xl border-primary/20 flex items-center justify-between flex-wrap gap-4 animate-fade-in">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-sm text-primary">Active filters:</span>
                {selectedSector !== "All Sectors" && (
                  <Badge variant="secondary" className="gap-1.5 bg-primary/10 text-primary border-primary/20">
                    {selectedSector}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => setSelectedSector("All Sectors")} 
                    />
                  </Badge>
                )}
                {selectedDepartment !== "All Departments" && (
                  <Badge variant="secondary" className="gap-1.5 bg-primary/10 text-primary border-primary/20">
                    {selectedDepartment}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => {
                        setSelectedDepartment("All Departments");
                        setSelectedSubcategory(null);
                      }} 
                    />
                  </Badge>
                )}
                {selectedSubcategory && (
                  <Badge variant="secondary" className="gap-1.5 bg-accent/10 text-accent border-accent/20">
                    {selectedSubcategory}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => setSelectedSubcategory(null)} 
                    />
                  </Badge>
                )}
                {selectedPersona !== "All Personas" && (
                  <Badge variant="secondary" className="gap-1.5 bg-primary/10 text-primary border-primary/20">
                    {selectedPersona}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => setSelectedPersona("All Personas")} 
                    />
                  </Badge>
                )}
                <Badge className="bg-foreground/10 text-foreground font-bold">
                  {filteredTools.length} tools found
                </Badge>
              </div>
            </div>
          )}
        </section>

        {/* Category Browser - Browse Mode */}
        {viewMode === "browse" && (
          <section className="mb-16 max-w-6xl mx-auto animate-fade-in-up stagger-4">
            <CategoryBrowser
              onSelectDepartment={handleDepartmentChange}
              onSelectSector={handleSectorChange}
              selectedDepartment={selectedDepartment}
              selectedSector={selectedSector}
            />
          </section>
        )}

        {/* Tools Grid - Show in list mode or when search is active */}
        {(viewMode === "list" || searchQuery) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {filteredTools.map((tool, index) => (
              <div 
                key={tool.id} 
                className="animate-fade-in-up opacity-0" 
                style={{ 
                  animationDelay: `${Math.min(index, 20) * 50}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                <ExpandedToolCard {...tool} />
              </div>
            ))}
          </div>
        )}

        {(viewMode === "list" || searchQuery) && filteredTools.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-6">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-xl font-medium text-muted-foreground mb-2">No tools found</p>
            <p className="text-sm text-muted-foreground mb-4">Try adjusting your search or filters</p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="glass">
                Clear all filters
              </Button>
            )}
          </div>
        )}

        {/* Stats */}
        {(viewMode === "list" || searchQuery) && filteredTools.length > 0 && (
          <div className="mt-16 text-center animate-fade-in">
            <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full glass glow-sm">
              <Sparkles className="h-5 w-5 text-primary animate-pulse-glow" />
              <span className="text-sm text-muted-foreground">
                Showing <span className="font-bold text-foreground">{filteredTools.length}</span> of{" "}
                <span className="font-bold text-gradient">{totalToolCount.toLocaleString()}+</span> tools
              </span>
            </div>
          </div>
        )}

        {/* Final CTA Section */}
        <section className="mt-32 py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent rounded-3xl" />
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 animate-fade-in-up">
              Stop searching for tools.
              <br />
              <span className="text-gradient">Start solving problems.</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 animate-fade-in stagger-2">
              One platform. Thousands of focused tools. Unlimited possibilities.
            </p>
            <Button 
              size="lg" 
              className="gap-2 px-8 py-6 text-lg bg-gradient-hero hover:opacity-90 transition-all glow animate-fade-in-up stagger-3 hover-lift"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-border/40 bg-card/30 mt-24">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 <span className="font-bold text-gradient">ezmy.life</span> — Simplifying complexity
            </p>
            <p className="text-xs text-muted-foreground">
              All tools designed for maximum efficiency
            </p>
          </div>
        </div>
      </footer>

      {/* Chatbot */}
      <ToolsChatbot />
    </div>
  );
};

export default Tools;