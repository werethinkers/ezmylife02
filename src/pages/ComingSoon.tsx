import { useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, X, Clock, Rocket, ArrowRight, Bell } from "lucide-react";
import { expandedTools } from "@/data/expandedTools";
import { tools as liveTools } from "@/data/tools";

const ComingSoon = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Get all coming soon tools from both sources
  const comingSoonTools = useMemo(() => {
    const expandedComingSoon = expandedTools.filter(t => !t.isLive).map(tool => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      category: tool.department,
      sector: tool.sector,
      icon: tool.icon,
    }));

    const liveComingSoon = liveTools.filter(t => !t.isLive).map(tool => ({
      id: tool.toolId,
      name: tool.title,
      description: tool.description,
      category: tool.category,
      sector: "General",
      icon: tool.icon,
    }));

    return [...liveComingSoon, ...expandedComingSoon];
  }, []);

  // Filter based on search
  const filteredTools = useMemo(() => {
    if (!searchQuery) return comingSoonTools;
    const query = searchQuery.toLowerCase();
    return comingSoonTools.filter(tool =>
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.category.toLowerCase().includes(query)
    );
  }, [comingSoonTools, searchQuery]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-mesh pointer-events-none" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <Navbar />
      
      {/* Hero Header */}
      <header className="relative border-b border-border/40 pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-mesh opacity-50" />
        
        <div className="relative container mx-auto px-4 py-12 md:py-20">
          <div className="flex flex-col items-center gap-8 text-center max-w-4xl mx-auto">
            {/* Animated badge */}
            <div className="animate-fade-in-down flex items-center gap-3">
              <Badge variant="secondary" className="text-sm px-5 py-2.5 glass border-amber-500/20">
                <Rocket className="h-4 w-4 mr-2 text-amber-500" />
                <span className="text-amber-500 font-semibold">{comingSoonTools.length}</span>
                <span className="ml-1 text-muted-foreground">Tools Coming Soon</span>
              </Badge>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight animate-fade-in-up">
              <span className="text-foreground">Coming</span>{" "}
              <span className="text-gradient-amber">Soon</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed animate-fade-in stagger-2">
              Preview the next generation of AI Apps we're building. Get notified when they launch.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto px-4 py-12 md:py-16">
        
        {/* Search */}
        <section className="mb-12 max-w-2xl mx-auto animate-fade-in-up">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/50 to-primary/50 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm" />
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-amber-500" />
              <Input
                type="text"
                placeholder="Search upcoming tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-base glass border-border/50 focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50 transition-all"
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
        </section>

        {/* Tools Grid */}
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
              <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card border-border/50">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                    <Clock className="h-3 w-3 mr-1" />
                    Coming Soon
                  </Badge>
                </div>
                
                <CardHeader className="pb-4 relative z-10">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/10 to-primary/10 text-amber-600 border border-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                    {tool.icon}
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground group-hover:text-amber-500 transition-colors">
                    {tool.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {tool.description}
                  </CardDescription>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {tool.category}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <Button 
                    variant="outline"
                    disabled
                    className="w-full border-amber-500/30 text-amber-600"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Bell className="h-4 w-4" />
                      Notify Me
                    </span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-6">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-xl font-medium text-muted-foreground mb-2">No upcoming tools found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search</p>
          </div>
        )}

        {/* Stats */}
        {filteredTools.length > 0 && (
          <div className="mt-16 text-center animate-fade-in">
            <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full glass glow-sm">
              <Rocket className="h-5 w-5 text-amber-500" />
              <span className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{filteredTools.length}</span> tools in development
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative border-t border-border/40 bg-card/30 mt-24">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 <span className="font-bold text-gradient">ezyourlife</span> — Simplifying complexity
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ComingSoon;
