import { useState, useMemo } from "react";
import { ExpandedToolCard } from "@/components/ExpandedToolCard";
import { ToolsChatbot } from "@/components/ToolsChatbot";
import { 
  expandedTools, 
  totalToolCount,
  sectors,
  sectorCategories,
  departments,
  inputModes,
  personaCategories
} from "@/data/expandedTools";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ArrowRight, Sparkles, Filter } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Tools = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("All Sectors");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [selectedPersona, setSelectedPersona] = useState("All Personas");

  // Check if any filters are active
  const hasActiveFilters = selectedSector !== "All Sectors" || 
                           selectedDepartment !== "All Departments" || 
                           selectedPersona !== "All Personas" ||
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
  }, [selectedSector, selectedDepartment, selectedPersona, searchQuery]);

  const clearFilters = () => {
    setSelectedSector("All Sectors");
    setSelectedDepartment("All Departments");
    setSelectedPersona("All Personas");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Header */}
      <header className="relative border-b border-border/40 bg-background/80 backdrop-blur-xl pt-20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />
        <div className="relative container mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col items-center gap-6 text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Digital Tools
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              A comprehensive collection of tools for learning and productivity
            </p>

            {/* Tool Count Badge */}
            <Badge variant="secondary" className="text-sm px-4 py-2 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-4 w-4 mr-2" />
              Total Tools: {totalToolCount.toLocaleString()}+ (including upcoming tools)
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 md:py-16">
        
        {/* Search and Filters Section */}
        <section className="mb-12 space-y-6 max-w-5xl mx-auto">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tools by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-base border-border/50 bg-card/50 backdrop-blur-sm focus-visible:ring-primary/20"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filter Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filter by:</span>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {/* Sector Filter with Categories */}
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger className="w-[220px] bg-card/50">
                  <SelectValue placeholder="Select Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Sectors">All Industries</SelectItem>
                  {Object.entries(sectorCategories).map(([category, sectorList]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
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
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[180px] bg-card/50">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* User Persona Filter with Categories */}
              <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                <SelectTrigger className="w-[200px] bg-card/50">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Personas">All Roles</SelectItem>
                  {Object.entries(personaCategories).map(([category, personaList]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
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
                <Button variant="outline" size="default" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Banner */}
          {hasActiveFilters && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-medium text-sm">Active filters:</span>
                {selectedSector !== "All Sectors" && (
                  <Badge variant="secondary" className="gap-1">
                    Sector: {selectedSector}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSelectedSector("All Sectors")} 
                    />
                  </Badge>
                )}
                {selectedDepartment !== "All Departments" && (
                  <Badge variant="secondary" className="gap-1">
                    Department: {selectedDepartment}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSelectedDepartment("All Departments")} 
                    />
                  </Badge>
                )}
                {selectedPersona !== "All Personas" && (
                  <Badge variant="secondary" className="gap-1">
                    User: {selectedPersona}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSelectedPersona("All Personas")} 
                    />
                  </Badge>
                )}
                <Badge variant="outline">{filteredTools.length} tools found</Badge>
              </div>
            </div>
          )}
        </section>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {filteredTools.map((tool, index) => (
            <div 
              key={tool.id} 
              className="animate-in fade-in-50 duration-500" 
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <ExpandedToolCard {...tool} />
            </div>
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">No tools found matching your search.</p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Clear all filters
              </Button>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-muted/50 border border-border/50">
            <span className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">
                {filteredTools.length}
              </span> of{" "}
              <span className="font-bold text-foreground">{totalToolCount.toLocaleString()}+</span> tools available
            </span>
          </div>
        </div>

        {/* Final CTA Section */}
        <section className="mt-24 py-16 border-t border-border/40">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Stop searching for tools.<br />
              Start solving problems.
            </h2>
            <p className="text-muted-foreground mb-8">
              One subscription. Thousands of focused tools.
            </p>
            <Button size="lg" className="gap-2">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30 mt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 <span className="font-semibold text-foreground">ezmy.life</span> — Simplifying complexity
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
