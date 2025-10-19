import { useState } from "react";
import { ToolCard } from "@/components/ToolCard";
import { tools } from "@/data/tools";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["all", "popular", "content", "research", "lab"];

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
                           tool.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                जैन डिजिटल टूल्स
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl">
              आध्यात्मिक उन्नति और स्वाध्याय में आपकी सहायता के लिए बनाए गए उपकरणों का एक व्यापक संग्रह।
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Search and Filter */}
        <div className="mb-12 space-y-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg border-border/50 bg-card/50 backdrop-blur-sm focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="max-w-2xl mx-auto">
            <TabsList className="grid w-full grid-cols-5 bg-card/50 backdrop-blur-sm">
              {categories.map((category) => (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  className="capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool, index) => (
            <div key={index} className="animate-in fade-in-50 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
              <ToolCard {...tool} />
            </div>
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">No tools found matching your search.</p>
          </div>
        )}

        {/* Total Count */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Showing <span className="font-bold text-foreground">{filteredTools.length}</span> of{" "}
            <span className="font-bold text-foreground">{tools.length}</span> tools
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">
            Powered by <span className="font-semibold text-foreground">ezmy.life</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
