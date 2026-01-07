import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Copy, BookOpen, Globe, FileText, Download } from "lucide-react";
import { toast } from "sonner";

type SourceType = "book" | "website" | "journal" | "article";
type CitationStyle = "apa" | "mla" | "chicago" | "harvard";

interface Source {
  id: number;
  type: SourceType;
  authors: string;
  title: string;
  year: string;
  publisher?: string;
  url?: string;
  journal?: string;
  volume?: string;
  pages?: string;
  accessDate?: string;
}

export const BibliographyGenerator = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [style, setStyle] = useState<CitationStyle>("apa");
  const [currentSource, setCurrentSource] = useState<Partial<Source>>({ type: "book" });

  const formatAuthorsAPA = (authors: string): string => {
    const authorList = authors.split(",").map(a => a.trim());
    if (authorList.length === 1) {
      const parts = authorList[0].split(" ");
      if (parts.length >= 2) {
        return `${parts[parts.length - 1]}, ${parts.slice(0, -1).map(n => n[0] + ".").join(" ")}`;
      }
      return authorList[0];
    }
    return authorList.map((author, i) => {
      const parts = author.split(" ");
      if (parts.length >= 2) {
        const formatted = `${parts[parts.length - 1]}, ${parts.slice(0, -1).map(n => n[0] + ".").join(" ")}`;
        if (i === authorList.length - 1) return `& ${formatted}`;
        return formatted;
      }
      return author;
    }).join(", ");
  };

  const formatAuthorsMLA = (authors: string): string => {
    const authorList = authors.split(",").map(a => a.trim());
    if (authorList.length === 1) {
      const parts = authorList[0].split(" ");
      if (parts.length >= 2) {
        return `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(" ")}`;
      }
      return authorList[0];
    }
    return authorList.join(", and ");
  };

  const generateCitation = (source: Source): string => {
    switch (style) {
      case "apa":
        if (source.type === "book") {
          return `${formatAuthorsAPA(source.authors)} (${source.year}). *${source.title}*. ${source.publisher || "Publisher"}.`;
        }
        if (source.type === "website") {
          return `${formatAuthorsAPA(source.authors)} (${source.year}). ${source.title}. Retrieved ${source.accessDate || "Date"}, from ${source.url}`;
        }
        if (source.type === "journal") {
          return `${formatAuthorsAPA(source.authors)} (${source.year}). ${source.title}. *${source.journal}*, ${source.volume || ""}${source.pages ? `, ${source.pages}` : ""}.`;
        }
        return `${formatAuthorsAPA(source.authors)} (${source.year}). ${source.title}.`;

      case "mla":
        if (source.type === "book") {
          return `${formatAuthorsMLA(source.authors)}. *${source.title}*. ${source.publisher || "Publisher"}, ${source.year}.`;
        }
        if (source.type === "website") {
          return `${formatAuthorsMLA(source.authors)}. "${source.title}." *Website Name*, ${source.year}, ${source.url}. Accessed ${source.accessDate || "Date"}.`;
        }
        if (source.type === "journal") {
          return `${formatAuthorsMLA(source.authors)}. "${source.title}." *${source.journal}*, vol. ${source.volume || "X"}, ${source.year}, pp. ${source.pages || "X-X"}.`;
        }
        return `${formatAuthorsMLA(source.authors)}. "${source.title}." ${source.year}.`;

      case "chicago":
        if (source.type === "book") {
          return `${source.authors}. *${source.title}*. ${source.publisher || "Publisher"}, ${source.year}.`;
        }
        if (source.type === "website") {
          return `${source.authors}. "${source.title}." Accessed ${source.accessDate || "Date"}. ${source.url}.`;
        }
        return `${source.authors}. "${source.title}." ${source.year}.`;

      case "harvard":
        if (source.type === "book") {
          return `${formatAuthorsAPA(source.authors)} (${source.year}) *${source.title}*. ${source.publisher || "Publisher"}.`;
        }
        if (source.type === "website") {
          return `${formatAuthorsAPA(source.authors)} (${source.year}) ${source.title}. Available at: ${source.url} (Accessed: ${source.accessDate || "Date"}).`;
        }
        return `${formatAuthorsAPA(source.authors)} (${source.year}) ${source.title}.`;

      default:
        return "";
    }
  };

  const addSource = () => {
    if (!currentSource.authors || !currentSource.title || !currentSource.year) {
      toast.error("Please fill in author(s), title, and year");
      return;
    }

    setSources([...sources, { ...currentSource, id: Date.now() } as Source]);
    setCurrentSource({ type: currentSource.type });
    toast.success("Source added!");
  };

  const removeSource = (id: number) => {
    setSources(sources.filter(s => s.id !== id));
    toast.success("Source removed");
  };

  const copyBibliography = () => {
    const text = sources.map(s => generateCitation(s)).join("\n\n");
    navigator.clipboard.writeText(text.replace(/\*/g, ""));
    toast.success("Bibliography copied to clipboard!");
  };

  const exportBibliography = () => {
    const text = sources.map(s => generateCitation(s)).join("\n\n");
    const blob = new Blob([text.replace(/\*/g, "")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bibliography-${style}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Bibliography exported!");
  };

  const getTypeIcon = (type: SourceType) => {
    switch (type) {
      case "book": return <BookOpen className="h-4 w-4" />;
      case "website": return <Globe className="h-4 w-4" />;
      case "journal": return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Bibliography Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Citation Style */}
          <div className="space-y-2">
            <Label>Citation Style</Label>
            <Select value={style} onValueChange={(v: CitationStyle) => setStyle(v)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apa">APA (7th Edition)</SelectItem>
                <SelectItem value="mla">MLA (9th Edition)</SelectItem>
                <SelectItem value="chicago">Chicago</SelectItem>
                <SelectItem value="harvard">Harvard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Add Source Form */}
          <Card className="bg-muted/20">
            <CardContent className="p-4 space-y-4">
              <Tabs value={currentSource.type} onValueChange={(v) => setCurrentSource({ ...currentSource, type: v as SourceType })}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="book">Book</TabsTrigger>
                  <TabsTrigger value="website">Website</TabsTrigger>
                  <TabsTrigger value="journal">Journal</TabsTrigger>
                  <TabsTrigger value="article">Article</TabsTrigger>
                </TabsList>

                <div className="mt-4 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Author(s) *</Label>
                      <Input
                        value={currentSource.authors || ""}
                        onChange={(e) => setCurrentSource({ ...currentSource, authors: e.target.value })}
                        placeholder="John Doe, Jane Smith"
                      />
                      <p className="text-xs text-muted-foreground">Separate multiple authors with commas</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Year *</Label>
                      <Input
                        value={currentSource.year || ""}
                        onChange={(e) => setCurrentSource({ ...currentSource, year: e.target.value })}
                        placeholder="2024"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      value={currentSource.title || ""}
                      onChange={(e) => setCurrentSource({ ...currentSource, title: e.target.value })}
                      placeholder="Enter the title"
                    />
                  </div>

                  <TabsContent value="book" className="mt-0 space-y-4">
                    <div className="space-y-2">
                      <Label>Publisher</Label>
                      <Input
                        value={currentSource.publisher || ""}
                        onChange={(e) => setCurrentSource({ ...currentSource, publisher: e.target.value })}
                        placeholder="Publisher name"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="website" className="mt-0 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>URL</Label>
                        <Input
                          value={currentSource.url || ""}
                          onChange={(e) => setCurrentSource({ ...currentSource, url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Access Date</Label>
                        <Input
                          type="date"
                          value={currentSource.accessDate || ""}
                          onChange={(e) => setCurrentSource({ ...currentSource, accessDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="journal" className="mt-0 space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Journal Name</Label>
                        <Input
                          value={currentSource.journal || ""}
                          onChange={(e) => setCurrentSource({ ...currentSource, journal: e.target.value })}
                          placeholder="Journal of..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Volume</Label>
                        <Input
                          value={currentSource.volume || ""}
                          onChange={(e) => setCurrentSource({ ...currentSource, volume: e.target.value })}
                          placeholder="12(3)"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Pages</Label>
                        <Input
                          value={currentSource.pages || ""}
                          onChange={(e) => setCurrentSource({ ...currentSource, pages: e.target.value })}
                          placeholder="123-145"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="article" className="mt-0 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Publication</Label>
                        <Input
                          value={currentSource.publisher || ""}
                          onChange={(e) => setCurrentSource({ ...currentSource, publisher: e.target.value })}
                          placeholder="Publication name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>URL (if online)</Label>
                        <Input
                          value={currentSource.url || ""}
                          onChange={(e) => setCurrentSource({ ...currentSource, url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>

              <Button onClick={addSource} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Source
              </Button>
            </CardContent>
          </Card>

          {/* Sources List */}
          {sources.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Bibliography ({sources.length} sources)</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyBibliography}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportBibliography}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {sources.map((source) => (
                  <Card key={source.id} className="bg-muted/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 text-muted-foreground">
                            {getTypeIcon(source.type)}
                          </div>
                          <div 
                            className="text-sm"
                            dangerouslySetInnerHTML={{ 
                              __html: generateCitation(source)
                                .replace(/\*(.*?)\*/g, "<em>$1</em>")
                            }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSource(source.id)}
                          className="shrink-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {sources.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Add your first source to generate a bibliography
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
