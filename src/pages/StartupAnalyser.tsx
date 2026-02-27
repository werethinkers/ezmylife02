import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, Building2, Globe, Trash2, Clock, FileText, BarChart3, Users, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import type { AnalysisResult, StructuredData, SavedAnalysis, ChartData } from "@/types/startupAnalyser";
import { AnalysisReport } from "@/components/startup-analyser/AnalysisReport";
import { AnalysisChat } from "@/components/startup-analyser/AnalysisChat";
import { CompetitorSection } from "@/components/startup-analyser/CompetitorSection";
import { ExecutiveSummaryView } from "@/components/startup-analyser/ExecutiveSummaryView";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";

const ANALYSER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/startup-analyser`;

const StartupAnalyser = () => {
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [activeTab, setActiveTab] = useState("input");
  const [progress, setProgress] = useState(0);
  const [stageMessage, setStageMessage] = useState("");
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);

  // Load saved analyses on mount
  useEffect(() => {
    if (user) loadSavedAnalyses();
  }, [user]);

  const loadSavedAnalyses = async () => {
    const { data, error } = await supabase
      .from("startup_analyses")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) {
      setSavedAnalyses(data.map((d: any) => ({
        ...d,
        analysis_data: d.analysis_data as AnalysisResult,
      })));
    }
  };

  const resumeAnalysis = (analysis: SavedAnalysis) => {
    setAnalysisResult(analysis.analysis_data);
    setCompanyName(analysis.company_name);
    setCompanyWebsite(analysis.company_website || "");
    setCurrentAnalysisId(analysis.id);
    setActiveTab("report");
  };

  const deleteAnalysis = async (id: string) => {
    const { error } = await supabase.from("startup_analyses").delete().eq("id", id);
    if (!error) {
      setSavedAnalyses(prev => prev.filter(a => a.id !== id));
      toast.success("Analysis deleted");
      if (currentAnalysisId === id) {
        setAnalysisResult(null);
        setCurrentAnalysisId(null);
        setActiveTab("input");
      }
    }
  };

  const saveAnalysis = async (result: AnalysisResult) => {
    if (!user) return;
    
    const record = {
      user_id: user.id,
      company_name: companyName,
      company_website: companyWebsite || null,
      analysis_data: JSON.parse(JSON.stringify(result)),
      markdown_report: result.markdownReport,
      status: "completed",
    };

    if (currentAnalysisId) {
      await supabase.from("startup_analyses").update(record).eq("id", currentAnalysisId);
    } else {
      const { data } = await supabase.from("startup_analyses").insert([record]).select("id").single();
      if (data) setCurrentAnalysisId(data.id);
    }
    loadSavedAnalyses();
  };

  const runAnalysis = async () => {
    if (!companyName.trim()) {
      toast.error("Please enter a company name");
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setStageMessage("Initializing analysis...");
    setActiveTab("analyzing");
    setCurrentAnalysisId(null);

    const stages = [
      { at: 10, msg: "Researching company background..." },
      { at: 25, msg: "Analyzing market & competitors..." },
      { at: 40, msg: "Evaluating team & traction..." },
      { at: 55, msg: "Building financial projections..." },
      { at: 70, msg: "Generating executive summary..." },
      { at: 85, msg: "Structuring IC Note data..." },
      { at: 95, msg: "Finalizing report..." },
    ];

    let stageIdx = 0;
    const progressInterval = setInterval(() => {
      if (stageIdx < stages.length) {
        setProgress(stages[stageIdx].at);
        setStageMessage(stages[stageIdx].msg);
        stageIdx++;
      }
    }, 4000);

    try {
      const resp = await fetch(ANALYSER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ companyName: companyName.trim(), companyWebsite: companyWebsite.trim() }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Analysis failed");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullContent += content;
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      clearInterval(progressInterval);
      setProgress(100);
      setStageMessage("Parsing results...");

      // Parse the response into markdown + JSON
      const result = parseAnalysisResponse(fullContent);
      setAnalysisResult(result);
      await saveAnalysis(result);
      setActiveTab("report");
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error(error instanceof Error ? error.message : "Analysis failed");
      setActiveTab("input");
    } finally {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
    }
  };

  const parseAnalysisResponse = (fullText: string): AnalysisResult => {
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/s;
    const jsonMatch = fullText.match(jsonRegex);
    let markdownReport = fullText;
    let structuredData: StructuredData | null = null;

    if (jsonMatch && jsonMatch[1]) {
      try {
        structuredData = JSON.parse(jsonMatch[1]);
        markdownReport = fullText.replace(jsonRegex, "").trim();
      } catch (e) {
        console.error("Failed to parse JSON:", e);
      }
    }

    return { markdownReport, structuredData };
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Startup Analyser</h1>
          <p className="text-muted-foreground">AI-powered VC-style startup intelligence & pitch deck analysis</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Previous Analyses */}
          <div className="lg:col-span-1">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Previous Analyses
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-[500px]">
                  {savedAnalyses.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">No analyses yet. Start your first one!</p>
                  ) : (
                    <div className="space-y-2">
                      {savedAnalyses.map((analysis) => (
                        <div
                          key={analysis.id}
                          className={`group p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                            currentAnalysisId === analysis.id ? "bg-primary/10 border-primary/30" : "border-border/50"
                          }`}
                          onClick={() => resumeAnalysis(analysis)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{analysis.company_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(analysis.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAnalysis(analysis.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "input" && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    New Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Company Name *</label>
                    <Input
                      placeholder="e.g., Stripe, Razorpay, Zerodha..."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Company Website (optional)</label>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g., https://stripe.com"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={runAnalysis} className="w-full" size="lg" disabled={isAnalyzing}>
                    <Search className="h-4 w-4 mr-2" />
                    Analyze Startup
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === "analyzing" && (
              <Card className="border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                  <h2 className="text-xl font-bold mb-2">Analyzing {companyName}...</h2>
                  <p className="text-muted-foreground mb-6 text-center">{stageMessage}</p>
                  <div className="w-full max-w-md bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{progress}% complete</p>
                </CardContent>
              </Card>
            )}

            {activeTab === "report" && analysisResult && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{analysisResult.structuredData?.name || companyName}</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setActiveTab("input"); setAnalysisResult(null); setCurrentAnalysisId(null); }}>
                      New Analysis
                    </Button>
                  </div>
                </div>

                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="w-full flex flex-wrap h-auto gap-1">
                    <TabsTrigger value="summary" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />Summary
                    </TabsTrigger>
                    <TabsTrigger value="report" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />Full Report
                    </TabsTrigger>
                    <TabsTrigger value="competitors" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />Competitors
                    </TabsTrigger>
                    <TabsTrigger value="data" className="text-xs">
                      <BarChart3 className="h-3 w-3 mr-1" />Charts
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="text-xs">
                      <MessageCircle className="h-3 w-3 mr-1" />Chat
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary">
                    {analysisResult.structuredData?.executiveSummaryData ? (
                      <ExecutiveSummaryView data={analysisResult.structuredData.executiveSummaryData} companyName={analysisResult.structuredData.name} />
                    ) : (
                      <Card className="p-6"><p className="text-muted-foreground">Executive summary data not available.</p></Card>
                    )}
                  </TabsContent>

                  <TabsContent value="report">
                    <AnalysisReport markdown={analysisResult.markdownReport} />
                  </TabsContent>

                  <TabsContent value="competitors">
                    <CompetitorSection
                      indian={analysisResult.structuredData?.indian_competitors || []}
                      global={analysisResult.structuredData?.global_competitors || []}
                    />
                  </TabsContent>

                  <TabsContent value="data">
                    <div className="space-y-6">
                      {analysisResult.structuredData?.market_size_chart_data && (
                        <ChartCard title="Market Size Projection" data={analysisResult.structuredData.market_size_chart_data} />
                      )}
                      {analysisResult.structuredData?.indian_competitor_chart_data && (
                        <ChartCard title="Indian Competitors - Funding" data={analysisResult.structuredData.indian_competitor_chart_data} />
                      )}
                      {analysisResult.structuredData?.global_competitor_chart_data && (
                        <ChartCard title="Global Competitors - Funding" data={analysisResult.structuredData.global_competitor_chart_data} />
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="chat">
                    <AnalysisChat reportContext={analysisResult.markdownReport} />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, data }: { title: string; data: ChartData }) => {

  const chartData = data.labels.map((label, i) => {
    const point: any = { name: label };
    data.datasets.forEach((ds, dsIdx) => {
      point[ds.label || `series${dsIdx}`] = ds.data[i];
    });
    return point;
  });

  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {data.type === "bar" ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              {data.datasets.map((ds, i) => (
                <Bar key={i} dataKey={ds.label || `series${i}`} fill={Array.isArray(ds.backgroundColor) ? ds.backgroundColor[0] : ds.backgroundColor || colors[i % colors.length]} />
              ))}
            </BarChart>
          ) : data.type === "pie" || data.type === "donut" ? (
            <PieChart>
              <Pie data={chartData} dataKey={data.datasets[0]?.label || "series0"} nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {chartData.map((_: any, i: number) => (
                  <Cell key={i} fill={Array.isArray(data.datasets[0]?.backgroundColor) ? (data.datasets[0].backgroundColor as string[])[i] : colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              {data.datasets.map((ds, i) => (
                <Line key={i} type="monotone" dataKey={ds.label || `series${i}`} stroke={typeof ds.borderColor === "string" ? ds.borderColor : colors[i % colors.length]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default StartupAnalyser;
