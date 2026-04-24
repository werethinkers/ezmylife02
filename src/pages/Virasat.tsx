import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, BookOpen, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import VoiceRecorder from "@/components/virasat/VoiceRecorder";
import BookView from "@/components/virasat/BookView";
import ReviewPanel from "@/components/virasat/ReviewPanel";
import PodcastPlayer from "@/components/virasat/PodcastPlayer";
import ContinueStoryCard, { type ResumeInfo } from "@/components/virasat/ContinueStoryCard";
import { virasatService, type VirasatMessage } from "@/components/virasat/services/virasatService";
import { playPCMAudio, stopPlayback } from "@/components/virasat/lib/audio";

type Mode = "welcome" | "interview" | "review" | "book";

const FIRST_QUESTION = "Namaste Papa. Chaliye, shuruaat aapke bachpan se karte hain. Aapko apne bachpan ka sabse pehla yaadgaar pal yaad hai? Thoda batayiye.";

export default function Virasat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("welcome");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<VirasatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>(FIRST_QUESTION);
  const [bookStyle, setBookStyle] = useState<string>("emotional");
  const [bookContent, setBookContent] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoStartMic, setAutoStartMic] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasResume, setHasResume] = useState<ResumeInfo | null>(null);
  const [lastQuestionAudio, setLastQuestionAudio] = useState<string | null>(null);

  const saveTimer = useRef<number | null>(null);
  const prefetchedAudio = useRef<string | null>(null);

  // Look for the latest unfinished session and preload preview details
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("virasat_sessions")
        .select("id, updated_at, status, title, question_count, conversation")
        .eq("user_id", user.id)
        .neq("status", "done")
        .order("updated_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        const row = data[0] as any;
        const conv = (row.conversation as any[]) || [];
        const lastModel = [...conv].reverse().find((m) => m.role === "model");
        setHasResume({
          id: row.id,
          updated_at: row.updated_at,
          status: row.status,
          title: row.title || "Meri Kahani",
          question_count: row.question_count || conv.filter((m: any) => m.role === "user").length || 0,
          last_question: lastModel?.text,
        });
      }
    })();
  }, [user]);

  // Debounced upsert
  const persist = useCallback((updates: Record<string, any>) => {
    if (!sessionId) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      await supabase.from("virasat_sessions").update(updates).eq("id", sessionId);
    }, 300);
  }, [sessionId]);

  const startNewSession = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("virasat_sessions")
      .insert({
        user_id: user.id,
        title: "Meri Kahani",
        book_style: "emotional",
        conversation: [{ role: "model", text: FIRST_QUESTION, createdAt: new Date().toISOString() }] as any,
        status: "recording",
      })
      .select("id")
      .single();
    if (error || !data) {
      toast({ title: "Session nahi bani", description: error?.message, variant: "destructive" });
      return;
    }
    setSessionId(data.id);
    setConversation([{ role: "model", text: FIRST_QUESTION, createdAt: new Date().toISOString() }]);
    setCurrentQuestion(FIRST_QUESTION);
    setMode("interview");
    // Speak intro
    playIntro(FIRST_QUESTION);
  };

  const resumeSession = async () => {
    if (!hasResume) return;
    const { data } = await supabase
      .from("virasat_sessions")
      .select("*")
      .eq("id", hasResume.id)
      .single();
    if (!data) return;
    setSessionId(data.id);
    const conv = (data.conversation as any[]) || [];
    setConversation(conv as VirasatMessage[]);
    setBookStyle(data.book_style || "emotional");
    const lastModel = [...conv].reverse().find((m) => m.role === "model");
    setCurrentQuestion(lastModel?.text || FIRST_QUESTION);
    if (data.status === "done" && data.book_content) {
      setBookContent(data.book_content);
      setMode("book");
    } else if (data.status === "reviewing") {
      setMode("review");
    } else {
      setMode("interview");
    }
  };

  const playIntro = async (text: string) => {
    try {
      const { audio } = await virasatService.tts(text);
      if (audio) {
        setLastQuestionAudio(audio);
        await playPCMAudio(audio);
      }
    } catch (e) {
      console.warn("TTS failed, using browser fallback", e);
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "hi-IN";
        window.speechSynthesis.speak(u);
      } catch {}
    } finally {
      setAutoStartMic(true);
    }
  };

  const handleTranscript = useCallback(async (raw: string) => {
    if (!raw.trim()) return;
    setAutoStartMic(false);
    setIsProcessing(true);

    const userMsgRaw: VirasatMessage = { role: "user", text: raw, createdAt: new Date().toISOString() };
    // Optimistic: add raw immediately, save to DB
    const optimistic = [...conversation, userMsgRaw];
    setConversation(optimistic);
    persist({ conversation: optimistic as any, question_count: optimistic.filter(m => m.role === "user").length });

    try {
      // Parallel: refine + nextQ
      const [refineRes, nextQRes] = await Promise.all([
        virasatService.refineResponse(raw).catch(() => ({ text: raw })),
        virasatService.nextQuestion(optimistic),
      ]);
      const refined = refineRes.text || raw;
      const nextQ = nextQRes.text;

      // Replace last user msg with refined version + add model question
      const updated: VirasatMessage[] = [
        ...optimistic.slice(0, -1),
        { ...userMsgRaw, text: refined },
        { role: "model", text: nextQ, createdAt: new Date().toISOString() },
      ];
      setConversation(updated);
      setCurrentQuestion(nextQ);
      persist({ conversation: updated as any, question_count: updated.filter(m => m.role === "user").length });

      // Pre-fetch TTS for next question
      virasatService.tts(nextQ).then(({ audio }) => { prefetchedAudio.current = audio; }).catch(() => {});

      setIsProcessing(false);
      // Play question audio asap
      const audio = prefetchedAudio.current;
      prefetchedAudio.current = null;
      if (audio) {
        setLastQuestionAudio(audio);
        await playPCMAudio(audio);
      } else {
        // Fallback: synth in parallel
        try {
          const r = await virasatService.tts(nextQ);
          if (r.audio) {
            setLastQuestionAudio(r.audio);
            await playPCMAudio(r.audio);
          }
        } catch {
          try {
            const u = new SpeechSynthesisUtterance(nextQ);
            u.lang = "hi-IN";
            window.speechSynthesis.speak(u);
          } catch {}
        }
      }
      // Auto-start mic after speaking
      if (!isPaused) setAutoStartMic(true);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Kuch gadbad hui", description: e?.message || "Phir try karein", variant: "destructive" });
      setIsProcessing(false);
    }
  }, [conversation, persist, isPaused, toast]);

  const togglePause = () => {
    setIsPaused((p) => {
      const next = !p;
      if (next) { stopPlayback(); setAutoStartMic(false); }
      else { setAutoStartMic(true); }
      return next;
    });
  };

  const goToReview = async () => {
    stopPlayback();
    setAutoStartMic(false);
    if (sessionId) {
      await supabase.from("virasat_sessions").update({ status: "reviewing", book_style: bookStyle }).eq("id", sessionId);
    }
    setMode("review");
  };

  const generateBook = async () => {
    if (!sessionId) return;
    setIsGenerating(true);
    try {
      const { book } = await virasatService.generateBook(conversation, bookStyle);
      setBookContent(book);
      await supabase.from("virasat_sessions").update({
        status: "done",
        book_content: book,
        book_style: bookStyle,
        conversation: conversation as any,
      }).eq("id", sessionId);
      setMode("book");
    } catch (e: any) {
      toast({ title: "Kitaab nahi ban payi", description: e?.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const userStoryCount = conversation.filter((m) => m.role === "user").length;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Virasat — A Father's Legacy | EZYOURLIFE"
        description="Record your life stories by voice. AI turns them into a beautiful Hindi/Hinglish book for your children."
        canonicalUrl="https://ezyourlife.com/virasat"
      />
      <Navbar />

      <div className="container mx-auto pt-24 pb-16">
        <AnimatePresence mode="wait">
          {mode === "welcome" && (
            <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto text-center px-4">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 3 }} className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                <Heart className="h-10 w-10 text-primary" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-foreground">Virasat</h1>
              <p className="text-lg text-muted-foreground mb-2">A Father's Legacy</p>
              <p className="text-foreground/80 mb-8">
                Apni zindagi ki kahaniyan apni awaaz mein record kijiye. Hum unhe ek khoobsurat kitaab mein badal denge — aapke bachchon ke liye, hamesha ke liye.
              </p>

              <Card className="p-6 mb-6 text-left bg-card/50 backdrop-blur border-border">
                <h3 className="font-semibold mb-3 text-foreground">Kya milega aapko:</h3>
                <ul className="space-y-2 text-sm text-foreground/80">
                  <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> Warm AI host jo aapse Hindi mein baat karega</li>
                  <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> Har answer turant save — kuch nahi khoyega</li>
                  <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> Kitaab banane se pehle aap sab review kar sakte hain</li>
                  <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> Jitni chahein utni kahaniyan — koi limit nahi</li>
                </ul>
              </Card>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" onClick={startNewSession} className="gap-2">
                  <Sparkles className="h-5 w-5" /> Shuru Karein
                </Button>
                {hasResume && (
                  <Button size="lg" variant="outline" onClick={resumeSession} className="gap-2">
                    <BookOpen className="h-5 w-5" /> Pichli kahani jaari rakhein
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {mode === "interview" && (
            <motion.div key="interview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto px-4">
              <div className="text-center mb-6">
                <p className="text-xs text-muted-foreground mb-2">{userStoryCount} kahaniyan record ki gayi hain</p>
                <Card className="p-6 bg-card/50 backdrop-blur border-border">
                  <p className="text-lg md:text-xl font-serif text-foreground italic">"{currentQuestion}"</p>
                </Card>
              </div>

              <VoiceRecorder
                onTranscript={handleTranscript}
                isProcessing={isProcessing}
                isPaused={isPaused}
                onTogglePause={togglePause}
                autoStart={autoStartMic}
              />

              {userStoryCount >= 3 && (
                <div className="text-center mt-10">
                  <Button variant="outline" onClick={goToReview} className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    Bas itna hi, ab review karein
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {mode === "review" && (
            <ReviewPanel
              key="review"
              conversation={conversation}
              bookStyle={bookStyle}
              onStyleChange={(s) => { setBookStyle(s); persist({ book_style: s }); }}
              onUpdateConversation={(next) => { setConversation(next); persist({ conversation: next as any }); }}
              onBack={() => setMode("interview")}
              onGenerate={generateBook}
              isGenerating={isGenerating}
            />
          )}

          {mode === "book" && (
            <motion.div key="book" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BookView content={bookContent} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
