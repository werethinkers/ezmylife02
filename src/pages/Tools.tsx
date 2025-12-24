import { useState, useMemo } from "react";
import { ExpandedToolCard } from "@/components/ExpandedToolCard";
import { ToolsChatbot } from "@/components/ToolsChatbot";
import { 
  getUniqueTools, 
  totalToolCount,
  sectors,
  departments,
  inputModes
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

  // Get all expanded tools
  const allTools = useMemo(() => getUniqueTools(), []);
  
  // Check if any filters are active
  const hasActiveFilters = selectedSector !== "All Sectors" || 
                           selectedDepartment !== "All Departments" || 
                           selectedPersona !== "All Personas" ||
                           searchQuery.length > 0;

  // Filter tools based on all filters
  const filteredTools = useMemo(() => {
    let filtered = allTools;
    
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
  }, [selectedSector, selectedDepartment, selectedPersona, searchQuery, allTools]);

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
      <header className="relative border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />
        <div className="relative container mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col items-center gap-6 text-center max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Digital Tools
              </h1>
            </div>
            
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
              {/* Sector Filter */}
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger className="w-[200px] bg-card/50">
                  <SelectValue placeholder="Select Sector" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Input Mode Filter */}
              <Select value={selectedInputMode} onValueChange={setSelectedInputMode}>
                <SelectTrigger className="w-[180px] bg-card/50">
                  <SelectValue placeholder="Select Mode" />
                </SelectTrigger>
                <SelectContent>
                  {inputModes.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
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
                {selectedInputMode !== "All Modes" && (
                  <Badge variant="secondary" className="gap-1">
                    Mode: {selectedInputMode}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSelectedInputMode("All Modes")} 
                    />
                  </Badge>
                )}
                <Badge variant="outline">{filteredExpandedTools.length} tools found</Badge>
              </div>
            </div>
          )}

          {/* Category Tabs */}
          {!hasActiveFilters && (
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="flex flex-wrap h-auto gap-2 bg-muted/50 p-2">
                {categories.map((category) => (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    className="capitalize text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-4 py-2"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </section>

        {/* Tools Grid - Show expanded tools when filters active, otherwise show original tools */}
        {hasActiveFilters || searchQuery ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {filteredExpandedTools.map((tool, index) => (
              <div 
                key={tool.id} 
                className="animate-in fade-in-50 duration-500" 
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <ExpandedToolCard {...tool} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {filteredLiveTools.map((tool, index) => (
              <div 
                key={tool.toolId} 
                className="animate-in fade-in-50 duration-500" 
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <ToolCard {...tool} />
              </div>
            ))}
          </div>
        )}

        {((hasActiveFilters || searchQuery) ? filteredExpandedTools.length === 0 : filteredLiveTools.length === 0) && (
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
                {(hasActiveFilters || searchQuery) ? filteredExpandedTools.length : filteredLiveTools.length}
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