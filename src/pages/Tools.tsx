import { useState, useMemo, useCallback } from "react";
import { useToolsCatalog, useToolsCatalogStats } from "@/hooks/useToolsCatalog";
import { EnhancedToolCard } from "@/components/tools/EnhancedToolCard";
import { ToolQuickPreview } from "@/components/tools/ToolQuickPreview";
import { ToolsHeader } from "@/components/tools/ToolsHeader";
import { ToolsFilters } from "@/components/tools/ToolsFilters";
import { ToolsEmptyState } from "@/components/tools/ToolsEmptyState";
import { ToolsChatbot } from "@/components/ToolsChatbot";
import { CategoryBrowser } from "@/components/CategoryBrowser";
import { PersonalizedTools } from "@/components/tools/PersonalizedTools";
import {
  expandedTools,
  sectorSpecificTools,
  totalToolCount,
  sectorCategories,
  departments,
  departmentSubcategories,
} from "@/data/expandedTools";
import { tools as liveToolsList, getLiveToolsCount } from "@/data/tools";
import { getToolNamesForType } from "@/data/toolTypes";
import { toolsDatabase, getToolsByType } from "@/data/toolsDatabase";
import { Navbar } from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, Sparkles } from "lucide-react";
...
  // DB-backed tool stats (live counts from database)
  const catalogStats = useToolsCatalogStats();
  const { data: catalogTools = [] } = useToolsCatalog();

  // Merge static + database featured tools and dedupe by toolId
  const featuredLiveTools = useMemo(() => {
    const dbFeaturedTools = catalogTools
      .filter((tool) => tool.source === "featured")
      .map((tool) => ({
        title: tool.name,
        description: tool.description,
        category: tool.category,
        icon: <Sparkles className="h-8 w-8" />,
        toolId: tool.id,
        videoLink: "",
        isLive: tool.is_live,
      }));

    const merged = [...liveToolsList, ...dbFeaturedTools];
    const uniqueById = Array.from(new Map(merged.map((tool) => [tool.toolId, tool])).values());

    return uniqueById.filter((tool) => tool.isLive);
  }, [catalogTools]);

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

    // Filter by tool type using the shared tool type data
    if (selectedToolType !== "All Types") {
      const toolNamesForType = getToolNamesForType(selectedToolType);
      if (toolNamesForType.length > 0) {
        filtered = filtered.filter(tool => toolNamesForType.includes(tool.name));
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
  }, [selectedSector, selectedDepartment, selectedSubcategory, selectedToolType, searchQuery]);

  // Filter featured tools by search and tool type
  const filteredFeaturedTools = useMemo(() => {
    let filtered = featuredLiveTools;
    
    // Filter by tool type
    if (selectedToolType !== "All Types") {
      const toolNamesForType = getToolNamesForType(selectedToolType);
      if (toolNamesForType.length > 0) {
        filtered = filtered.filter(tool => toolNamesForType.includes(tool.title));
      }
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tool =>
        tool.title.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === "a-z") {
      filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "z-a") {
      filtered = [...filtered].sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === "category") {
      filtered = [...filtered].sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
    } else if (sortBy === "newest") {
      filtered = [...filtered].reverse();
    }
    // "oldest" keeps original order, same as "default"
    
    return filtered;
  }, [featuredLiveTools, searchQuery, selectedToolType, sortBy]);

  const currentSubcategories = selectedDepartment !== "All Departments" 
    ? departmentSubcategories[selectedDepartment] || []
    : [];

  // Check if any filters are active (updated to include tool type)
  const hasActiveFilters = selectedSector !== "All Sectors" || 
                           selectedDepartment !== "All Departments" || 
                           selectedSubcategory !== null ||
                           selectedToolType !== "All Types" ||
                           searchQuery.length > 0;

  const clearFilters = useCallback(() => {
    setSelectedSector("All Sectors");
    setSelectedDepartment("All Departments");
    setSelectedSubcategory(null);
    setSelectedToolType("All Types");
    setSearchQuery("");
  }, []);

  const handleDepartmentChange = useCallback((dept: string) => {
    setSelectedDepartment(dept);
    setSelectedSubcategory(null);
    if (dept !== "All Departments") {
      setViewMode("list");
    }
  }, []);

  const handleSectorChange = useCallback((sector: string) => {
    setSelectedSector(sector);
    if (sector !== "All Sectors") {
      setViewMode("list");
    }
  }, []);

  const handleToolTypeChange = useCallback((type: string) => {
    setSelectedToolType(type);
    if (type !== "All Types") {
      const toolsForType = getToolsByType(type);
      const hasFeaturedTools = toolsForType.some(t => t.source === "featured");
      const hasBusinessTools = toolsForType.some(t => t.source === "business");
      
      // If only featured tools exist for this type, switch to featured mode
      if (hasFeaturedTools && !hasBusinessTools) {
        setViewMode("featured");
      } else {
        setViewMode("list");
      }
      
      // Scroll to the tools section so filtered results are visible
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  }, []);

  const handleQuickPreview = useCallback((tool: PreviewTool) => {
    setPreviewTool(tool);
    setPreviewOpen(true);
  }, []);

  const handleViewModeChange = useCallback((mode: "browse" | "list" | "featured" | "personalized") => {
    setViewMode(mode);
    // Reset filters when switching modes (but keep tool type if switching to featured for tool type filtering)
    if (mode === "personalized" || mode === "browse") {
      setSelectedSector("All Sectors");
      setSelectedDepartment("All Departments");
      setSelectedSubcategory(null);
      setSelectedToolType("All Types");
    }
    if (mode === "list") {
      // Keep tool type but reset other filters
      setSelectedSector("All Sectors");
      setSelectedDepartment("All Departments");
      setSelectedSubcategory(null);
    }
  }, []);

  // Determine what to show based on view mode and tool type
  const hasToolTypeFilter = selectedToolType !== "All Types";
  const showTools = viewMode === "list" && !hasToolTypeFilter;
  const showFeatured = viewMode === "featured" || (hasToolTypeFilter && viewMode !== "list");
  const showBrowse = viewMode === "browse" && !searchQuery && !hasToolTypeFilter;
  const showPersonalized = viewMode === "personalized";

  // Compute filtered count for the header
  const filteredCount = useMemo(() => {
    if (showFeatured) return filteredFeaturedTools.length;
    if (showTools) return filteredTools.length;
    return undefined; // Don't show when browsing/personalized
  }, [showFeatured, showTools, filteredFeaturedTools.length, filteredTools.length]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Enhanced Header */}
      <ToolsHeader
        liveCount={catalogStats.live || getLiveToolsCount()}
        totalCount={catalogStats.total || totalToolCount}
        filteredCount={filteredCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        
        {/* Filters - Only show in list mode */}
        <AnimatePresence>
          {viewMode === "list" && (
            <ToolsFilters
              selectedSector={selectedSector}
              selectedDepartment={selectedDepartment}
              selectedSubcategory={selectedSubcategory}
              selectedToolType={selectedToolType}
              onSectorChange={handleSectorChange}
              onDepartmentChange={handleDepartmentChange}
              onSubcategoryChange={setSelectedSubcategory}
              onToolTypeChange={handleToolTypeChange}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
              filteredCount={filteredTools.length}
              sectorCategories={sectorCategories}
              departments={departments}
              subcategories={currentSubcategories}
            />
          )}
        </AnimatePresence>

        {/* Personalized Tools - AI Recommendations */}
        <AnimatePresence mode="wait">
          {showPersonalized && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PersonalizedTools />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Browser - Browse Mode */}
        <AnimatePresence mode="wait">
          {showBrowse && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CategoryBrowser
                onSelectDepartment={handleDepartmentChange}
                onSelectSector={handleSectorChange}
                selectedDepartment={selectedDepartment}
                selectedSector={selectedSector}
                onSelectToolType={handleToolTypeChange}
                selectedToolType={selectedToolType}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Featured Live Tools */}
        <AnimatePresence mode="wait">
          {showFeatured && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Sort + filter badge row */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                {hasToolTypeFilter && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Showing {filteredFeaturedTools.length} tools for:
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {selectedToolType}
                      <button
                        onClick={() => {
                          setSelectedToolType("All Types");
                          setViewMode("browse");
                        }}
                        className="ml-1 hover:text-primary/80"
                      >
                        ×
                      </button>
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className="w-[150px] h-9 text-sm">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="a-z">Name (A → Z)</SelectItem>
                      <SelectItem value="z-a">Name (Z → A)</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {filteredFeaturedTools.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredFeaturedTools.map((tool, index) => (
                    <EnhancedToolCard 
                      key={tool.toolId} 
                      toolId={tool.toolId}
                      title={tool.title}
                      description={tool.description}
                      category={tool.category}
                      isLive={tool.isLive}
                      icon={tool.icon}
                      index={index}
                      onQuickPreview={() => handleQuickPreview({
                        toolId: tool.toolId,
                        title: tool.title,
                        description: tool.description,
                        category: tool.category,
                        isLive: tool.isLive,
                        icon: tool.icon
                      })}
                    />
                  ))}
                </div>
              ) : (
                <ToolsEmptyState 
                  onClearFilters={() => {
                    setSelectedToolType("All Types");
                    setViewMode("browse");
                  }}
                  hasActiveFilters={hasToolTypeFilter}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search results in featured mode */}
        <AnimatePresence mode="wait">
          {viewMode === "featured" && searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {filteredFeaturedTools.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredFeaturedTools.map((tool, index) => (
                    <EnhancedToolCard 
                      key={tool.toolId} 
                      toolId={tool.toolId}
                      title={tool.title}
                      description={tool.description}
                      category={tool.category}
                      isLive={tool.isLive}
                      icon={tool.icon}
                      index={index}
                      onQuickPreview={() => handleQuickPreview({
                        toolId: tool.toolId,
                        title: tool.title,
                        description: tool.description,
                        category: tool.category,
                        isLive: tool.isLive,
                        icon: tool.icon
                      })}
                    />
                  ))}
                </div>
              ) : (
                <ToolsEmptyState 
                  onClearFilters={() => setSearchQuery("")}
                  hasActiveFilters={true}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* All Tools Grid */}
        <AnimatePresence mode="wait">
          {viewMode === "list" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {filteredTools.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredTools.map((tool, index) => (
                    <EnhancedToolCard 
                      key={tool.id} 
                      id={tool.id}
                      name={tool.name}
                      description={tool.description}
                      sector={tool.sector}
                      department={tool.department}
                      isLive={tool.isLive}
                      icon={tool.icon}
                      index={index}
                      onQuickPreview={() => handleQuickPreview({
                        id: tool.id,
                        name: tool.name,
                        description: tool.description,
                        sector: tool.sector,
                        department: tool.department,
                        isLive: tool.isLive,
                        icon: tool.icon
                      })}
                    />
                  ))}
                </div>
              ) : (
                <ToolsEmptyState 
                  onClearFilters={clearFilters}
                  hasActiveFilters={hasActiveFilters}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Quick Preview Modal */}
      <ToolQuickPreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        tool={previewTool}
      />

      {/* Chatbot */}
      <ToolsChatbot />
    </div>
  );
};

export default Tools;
