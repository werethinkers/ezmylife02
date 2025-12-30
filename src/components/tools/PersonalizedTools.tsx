import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Send, 
  User, 
  Bot, 
  Loader2, 
  RefreshCw,
  Briefcase,
  GraduationCap,
  Building2,
  Wrench,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UserProfile {
  industry: string;
  role: string;
  challenges: string;
  conversationHistory: string;
  messages: Message[];
  lastMessage: string;
}

const quickStartOptions = [
  { label: "I'm a Business Owner", icon: Briefcase, value: "I'm a business owner looking for tools to manage my company better." },
  { label: "I'm a Student", icon: GraduationCap, value: "I'm a student and need tools to help with my studies and assignments." },
  { label: "I'm a Teacher", icon: Building2, value: "I'm a teacher looking for tools to help plan lessons and track student progress." },
  { label: "I manage Operations", icon: Wrench, value: "I manage operations and inventory for my organization." },
];

export function PersonalizedTools() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [interviewComplete, setInterviewComplete] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const streamResponse = async (profile: Partial<UserProfile>, conversationType: string) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/personalized-tools`;
    
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ userProfile: profile, conversationType }),
      });

      if (!resp.ok) {
        if (resp.status === 429 || resp.status === 402) {
          toast.error("Service is busy. Please try again in a moment.");
          return "";
        }
        throw new Error("Failed to get response");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      let textBuffer = "";

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
            if (content) {
              fullResponse += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => 
                    i === prev.length - 1 ? { ...m, content: fullResponse } : m
                  );
                }
                return [...prev, { role: "assistant", content: fullResponse }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      return fullResponse;
    } catch (error) {
      console.error("Streaming error:", error);
      throw error;
    }
  };

  const sendMessage = async (message: string, isQuickStart = false) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: message };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    const updatedProfile: Partial<UserProfile> = {
      ...userProfile,
      messages: [...(userProfile.messages || []), userMessage],
      lastMessage: message,
      conversationHistory: [...messages, userMessage].map(m => `${m.role}: ${m.content}`).join("\n"),
    };
    setUserProfile(updatedProfile);

    try {
      // Check if this is the interview phase or suggestion phase
      const conversationType = interviewComplete ? "suggest" : "interview";
      const response = await streamResponse(updatedProfile, conversationType);
      
      // Check if AI has enough info to suggest
      if (response.includes("READY_TO_SUGGEST") || messages.length >= 4) {
        setInterviewComplete(true);
        // Get suggestions
        const suggestionProfile = {
          ...updatedProfile,
          industry: extractFromConversation("industry", response),
          role: extractFromConversation("role", response),
          challenges: extractFromConversation("challenges", response),
        };
        setUserProfile(suggestionProfile);
        
        // Remove READY_TO_SUGGEST from display and get actual suggestions
        setMessages(prev => prev.map(m => ({
          ...m,
          content: m.content.replace("READY_TO_SUGGEST", "").trim()
        })));
        
        setTimeout(async () => {
          setIsLoading(true);
          await streamResponse(suggestionProfile, "suggest");
          setIsLoading(false);
          setShowSuggestions(true);
        }, 500);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const extractFromConversation = (field: string, conversation: string): string => {
    // Simple extraction - the AI response should contain context
    const history = messages.map(m => m.content).join(" ");
    return history.slice(0, 200);
  };

  const handleQuickStart = (option: typeof quickStartOptions[0]) => {
    sendMessage(option.value, true);
  };

  const resetConversation = () => {
    setMessages([]);
    setUserProfile({});
    setInterviewComplete(false);
    setShowSuggestions(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">AI-Powered Recommendations</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Find Your Perfect Tools
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Tell us about your work, and we'll recommend the best tools and create a personalized workflow for you.
        </p>
      </div>

      {/* Chat Container */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Messages Area */}
          <div className="h-[400px] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center space-y-6">
                <div className="text-center space-y-2">
                  <Bot className="h-12 w-12 text-primary/50 mx-auto" />
                  <p className="text-muted-foreground">
                    Hi! I'm here to help you find the perfect tools for your work.
                  </p>
                </div>

                {/* Quick Start Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {quickStartOptions.map((option) => (
                    <Button
                      key={option.label}
                      variant="outline"
                      className="h-auto py-3 px-4 justify-start gap-3 hover:bg-primary/5 hover:border-primary/30 transition-all"
                      onClick={() => handleQuickStart(option)}
                    >
                      <option.icon className="h-5 w-5 text-primary" />
                      <span className="text-sm">{option.label}</span>
                      <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-foreground"
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none dark:prose-invert">
                        {message.content.split('\n').map((line, i) => {
                          if (line.startsWith('## ')) {
                            return <h3 key={i} className="text-base font-semibold mt-4 mb-2">{line.replace('## ', '')}</h3>;
                          }
                          if (line.startsWith('- **')) {
                            const match = line.match(/- \*\*(.+?)\*\*:?\s*(.*)/);
                            if (match) {
                              return (
                                <div key={i} className="flex items-start gap-2 my-1">
                                  <Badge variant="secondary" className="text-xs shrink-0">{match[1]}</Badge>
                                  <span>{match[2]}</span>
                                </div>
                              );
                            }
                          }
                          if (line.startsWith('**Step')) {
                            return <p key={i} className="font-medium mt-2">{line.replace(/\*\*/g, '')}</p>;
                          }
                          return <p key={i} className="my-1">{line}</p>;
                        })}
                      </div>
                    </div>
                    {message.role === "user" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted/50 rounded-2xl px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border/50 p-4 bg-background/50">
            <div className="flex gap-2">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetConversation}
                  className="shrink-0"
                  title="Start over"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(inputValue)}
                placeholder="Tell me about your work..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={() => sendMessage(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className="shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tip */}
      <p className="text-center text-xs text-muted-foreground mt-4">
        The more details you share, the better recommendations you'll get!
      </p>
    </motion.div>
  );
}
