import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ToolCard } from "@/components/ToolCard";
import { ExpandedToolCard } from "@/components/ExpandedToolCard";
import { ProblemCard } from "@/components/ProblemCard";
import { ToolsChatbot } from "@/components/ToolsChatbot";
import { tools } from "@/data/tools";
import { 
  problemCategories, 
  getUniqueTools, 
  filterToolsByProblem, 
  totalToolCount,
  getToolCountByProblem 
} from "@/data/expandedTools";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ArrowRight, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";

const Tools = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const activeProblem = searchParams.get("problem");

  const categories = ["all", "popular", "ai agent", "content", "research", "modern science", "lab"];

  // Get expanded tools
  const expandedTools = useMemo(() => getUniqueTools(), []);
  
  // Filter live tools (from original tools.tsx)
  const filteredLiveTools = tools.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
                           tool.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter expanded tools based on problem or search
  const filteredExpandedTools = useMemo(() => {
    let filtered = activeProblem 
      ? filterToolsByProblem(activeProblem)
      : expandedTools;
    
    if (searchQuery) {
      filtered = filtered.filter(tool =>
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [activeProblem, searchQuery, expandedTools]);

  const handleProblemClick = (problemId: string) => {
    if (activeProblem === problemId) {
      searchParams.delete("problem");
    } else {
      searchParams.set("problem", problemId);
    }
    setSearchParams(searchParams);
    setSelectedCategory("all");
  };

  const clearProblemFilter = () => {
    searchParams.delete("problem");
    setSearchParams(searchParams);
  };

  const activeProblemData = problemCategories.find(p => p.id === activeProblem);

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
        
        {/* Problem-First Section */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Start with your problem
            </h2>
            <p className="text-muted-foreground">
              Choose what you're trying to solve. We'll show you only the tools you need.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {problemCategories.map((problem) => (
              <ProblemCard
                key={problem.id}
                label={problem.label}
                description={problem.description}
                icon={problem.icon}
                toolCount={getToolCountByProblem(problem.id)}
                onClick={() => handleProblemClick(problem.id)}
                isActive={activeProblem === problem.id}
              />
            ))}
          </div>
        </section>

        {/* Active Problem Filter Banner */}
        {activeProblemData && (
          <div className="mb-8 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <activeProblemData.icon className="h-5 w-5 text-primary" />
              <span className="font-medium">
                Showing tools for: <span className="text-primary">{activeProblemData.label}</span>
              </span>
              <Badge variant="secondary">{filteredExpandedTools.length} tools</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={clearProblemFilter}>
              <X className="h-4 w-4 mr-1" />
              Clear filter
            </Button>
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-12 space-y-6 max-w-4xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base border-border/50 bg-card/50 backdrop-blur-sm focus-visible:ring-primary/20"
            />
          </div>

          {!activeProblem && (
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
        </div>

        {/* Tools Grid - Show expanded tools when problem filter active, otherwise show original tools */}
        {activeProblem ? (
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

        {(activeProblem ? filteredExpandedTools.length === 0 : filteredLiveTools.length === 0) && (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">No tools found matching your search.</p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-muted/50 border border-border/50">
            <span className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">
                {activeProblem ? filteredExpandedTools.length : filteredLiveTools.length}
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
