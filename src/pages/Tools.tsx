import { useState, useMemo, useCallback } from "react";
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
  departmentSubcategories
} from "@/data/expandedTools";
import { tools as liveToolsList, getLiveToolsCount } from "@/data/tools";
import { getToolNamesForType } from "@/data/toolTypes";
import { Navbar } from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface PreviewTool {
  id?: string;
  toolId?: string;
  name?: string;
  title?: string;
  description: string;
  sector?: string;
  department?: string;
  category?: string;
  isLive: boolean;
  icon: ReactNode;
}

const Tools = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("All Sectors");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedToolType, setSelectedToolType] = useState("All Types");
  const [viewMode, setViewMode] = useState<"browse" | "list" | "featured" | "personalized">("browse");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTool, setPreviewTool] = useState<PreviewTool | null>(null);

  // Get live tools from tools.tsx
  const featuredLiveTools = useMemo(() => {
    return liveToolsList.filter(t => t.isLive);
  }, []);

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
    
    return filtered;
  }, [featuredLiveTools, searchQuery, selectedToolType]);

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
      setViewMode("list");
    }
  }, []);

  const handleQuickPreview = useCallback((tool: PreviewTool) => {
    setPreviewTool(tool);
    setPreviewOpen(true);
  }, []);

  const handleViewModeChange = useCallback((mode: "browse" | "list" | "featured" | "personalized") => {
    setViewMode(mode);
    // Reset filters when switching to featured or personalized mode
    if (mode === "featured" || mode === "personalized") {
      setSelectedSector("All Sectors");
      setSelectedDepartment("All Departments");
      setSelectedSubcategory(null);
      setSelectedToolType("All Types");
    }
  }, []);

  const showTools = viewMode === "list" || (viewMode === "featured" && searchQuery);
  const showFeatured = viewMode === "featured" && !searchQuery;
  const showBrowse = viewMode === "browse" && !searchQuery;
  const showPersonalized = viewMode === "personalized";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Enhanced Header */}
      <ToolsHeader
        liveCount={getLiveToolsCount()}
        totalCount={totalToolCount}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {featuredLiveTools.map((tool, index) => (
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
