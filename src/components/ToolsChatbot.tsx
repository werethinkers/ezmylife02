import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const toolTemplatesData = [
  { name: "Invoice Generator", desc: "Create tax-compliant invoices", category: "Finance & Tax" },
  { name: "Tax Estimator", desc: "Estimate GST liability", category: "Finance & Tax" },
  { name: "Contract Drafter", desc: "Create legal contracts", category: "Legal & Compliance" },
  { name: "Cold Outreach", desc: "Write sales messages", category: "Marketing & Sales" },
  { name: "Expense Tracker", desc: "Track daily expenses", category: "Finance & Tax" },
  { name: "Stock Audit", desc: "Track inventory", category: "Ops & Inventory" },
  { name: "Hiring Job Post", desc: "Write job descriptions", category: "HR & Staff" },
  { name: "Social Media Plan", desc: "Create content calendars", category: "Marketing & Sales" },
  { name: "Compliance Checklist", desc: "Track required permits", category: "Legal & Compliance" },
  { name: "Profit Calculator", desc: "Calculate margins", category: "Finance & Tax" },
];

export const ToolsChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm here to help you find the right tool. Tell me what problem you're trying to solve, and I'll suggest the best tools for you."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for tool-specific questions
    for (const tool of toolTemplatesData) {
      if (lowerMessage.includes(tool.name.toLowerCase())) {
        return `**${tool.name}** - ${tool.desc}\n\nThis tool helps you ${tool.desc.toLowerCase()}. It's part of our ${tool.category} collection.\n\nWould you like me to suggest similar tools?`;
      }
    }
    
    // Check for problem categories
    if (lowerMessage.includes("gst") || lowerMessage.includes("tax") || lowerMessage.includes("invoice") || lowerMessage.includes("compliance")) {
      return "For **GST & Compliance**, I recommend:\n\n• **Invoice Generator** - Create tax-compliant bills\n• **Tax Estimator** - Calculate GST liability\n• **Expense Log** - Track business expenses\n• **Profit Calc** - Calculate margins\n\nClick on 'I need help with GST & compliance' above to see all related tools!";
    }
    
    if (lowerMessage.includes("content") || lowerMessage.includes("social") || lowerMessage.includes("marketing") || lowerMessage.includes("caption")) {
      return "For **Content Creation**, I recommend:\n\n• **Caption Writer** - Social media captions\n• **Script Generator** - Video scripts\n• **Ad Copy Writer** - Marketing copy\n• **Social Plan** - Content calendars\n\nClick on 'I want to create better content' above to explore more!";
    }
    
    if (lowerMessage.includes("pdf") || lowerMessage.includes("document") || lowerMessage.includes("extract") || lowerMessage.includes("scan")) {
      return "For **PDF & Document Analysis**, I recommend:\n\n• **PDF Summarizer** - Quick summaries\n• **Text Extractor** - Extract text from images\n• **OCR Scanner** - Digitize documents\n• **Contract Reviewer** - Analyze contracts\n\nClick on 'I need to analyze PDFs and documents' above!";
    }
    
    if (lowerMessage.includes("automat") || lowerMessage.includes("workflow") || lowerMessage.includes("task") || lowerMessage.includes("schedule")) {
      return "For **Automation**, I recommend:\n\n• **Task Automator** - Automate repetitive work\n• **Workflow Builder** - Create custom flows\n• **Follow-up Bot** - Automated emails\n• **Schedule Bot** - Smart scheduling\n\nClick on 'I want to automate business tasks' above!";
    }
    
    if (lowerMessage.includes("learn") || lowerMessage.includes("study") || lowerMessage.includes("education") || lowerMessage.includes("quiz")) {
      return "For **Learning & Studying**, I recommend:\n\n• **Quiz Maker** - Interactive quizzes\n• **Flashcard Creator** - Study flashcards\n• **Study Planner** - Schedule planning\n• **Concept Explainer** - Simple explanations\n\nClick on 'I need help studying or learning' above!";
    }
    
    if (lowerMessage.includes("coming soon") || lowerMessage.includes("upcoming")) {
      return "Many of our tools are marked as **'Coming Soon'** - these are currently in development and will be available shortly.\n\nYou can still browse these tools to understand what they'll do. When they launch, you'll have immediate access!\n\nIs there a specific tool you're interested in?";
    }
    
    if (lowerMessage.includes("how") || lowerMessage.includes("use") || lowerMessage.includes("work")) {
      return "Here's how to use ezmy.life:\n\n1. **Choose a problem** - Click one of the problem cards at the top\n2. **Browse tools** - See all relevant tools for that problem\n3. **Open a tool** - Click 'Open Tool' to start using it\n4. **Coming Soon tools** - Browse and learn about upcoming features\n\nNeed help with a specific problem?";
    }
    
    // Default response
    return "I can help you find the right tool! Try asking about:\n\n• GST & tax compliance\n• Content creation\n• PDF & document analysis\n• Business automation\n• Learning & studying\n\nOr tell me what problem you're trying to solve, and I'll suggest the best tools!";
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    // Simulate AI thinking
    setTimeout(() => {
      const response = generateResponse(userMessage);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
      setIsLoading(false);
    }, 500);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 w-[350px] md:w-[400px] shadow-2xl border-border/50 animate-in slide-in-from-bottom-4 duration-300">
          <CardHeader className="border-b border-border/50 bg-muted/30 py-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5 text-primary" />
              Tool Assistant
            </CardTitle>
            <p className="text-xs text-muted-foreground">Ask which tool to use and why</p>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages */}
            <div className="h-[300px] overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border/50 p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about tools..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
