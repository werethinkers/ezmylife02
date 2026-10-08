import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Heart, Sparkles, ArrowRight, RotateCcw, ListChecks, Mic, Pencil, Play, Pause, RefreshCw, Languages, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { useNavigate } from "react-router-dom";
import { supabase as supabaseClient } from "@/integrations/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = supabaseClient as unknown as { from: (table: string) => any };
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { BuyCreditsDialog } from "@/components/wallet/BuyCreditsDialog";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";
import { CreditCostBadge } from "@/components/tools/CreditCostBadge";
import { SEOHead } from "@/components/SEOHead";
import { cn } from "@/lib/utils";
import {
  getNextQuestion,
  refineResponse,
  generateBook,
  generateSpeech,
  translateToHindi,
  type Message,
  type BookStyle,
} from "@/components/virasat/services/virasatService";
import { createPCMController, type AudioController } from "@/components/virasat/lib/audio";
import VoiceRecorder from "@/components/virasat/VoiceRecorder";
import WrittenInput from "@/components/virasat/WrittenInput";
import MediaAttacher, { type AttachedMedia } from "@/components/virasat/MediaAttacher";
import BookView from "@/components/virasat/BookView";

type AppMode = "welcome" | "interview" | "review" | "generating" | "book";
type InputMode = "voice" | "write";

const FIRST_QUESTION =
  "Aap bas aaram se baat kariye. Main aapse dheere dheere sawal puchunga, aur hum milke aapki kahani sanjoyenge — aapke bachche ke liye.\n\nSabse pehle, mujhe apne bachpan ke baare mein bataiye. Koi aisi yaad jo aapke dil ke bahut kareeb ho?";

export default function Virasat() {
  // Only the finished keepsake book is charged; the interview itself is free.
  const { charge: chargeBook, dialogProps: bookDialog, loginDialogProps: bookLogin } = useCredits("virasat");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AppMode>("welcome");
  const [inputMode, setInputMode] = useState<InputMode>("voice");
  const [bookStyle, setBookStyle] = useState<BookStyle>("emotional");
  const [childName, setChildName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [history, setHistory] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookContent, setBookContent] = useState<string>("");
  const [questionCount, setQuestionCount] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasResume, setHasResume] = useState(false);
  const [prefetchedNextAudio, setPrefetchedNextAudio] = useState<string | null>(null);
  const [attachedMedia, setAttachedMedia] = useState<AttachedMedia[]>([]);

  // Narration controls
  type NarrationState = "idle" | "loading" | "playing" | "paused";
  const [narrationState, setNarrationState] = useState<NarrationState>("idle");
  const audioCtrlRef = useRef<AudioController | null>(null);
  const audioCacheRef = useRef<Map<string, string>>(new Map()); // question text -> base64 PCM

  // Hindi (Devanagari) display
  const [showHindi, setShowHindi] = useState(false);
  const [hindiText, setHindiText] = useState<string>("");
  const [hindiLoading, setHindiLoading] = useState(false);
  const hindiCacheRef = useRef<Map<string, string>>(new Map());

  const stopNarration = useCallback(() => {
    if (audioCtrlRef.current) {
      audioCtrlRef.current.stop();
      audioCtrlRef.current = null;
    }
    setNarrationState("idle");
  }, []);

  const startNarration = useCallback(async (text: string, prefetched?: string | null) => {
    if (!text.trim()) return;
    if (audioCtrlRef.current) {
      audioCtrlRef.current.stop();
      audioCtrlRef.current = null;
    }
    setNarrationState("loading");
    let audio = audioCacheRef.current.get(text) || prefetched || null;
    if (!audio) {
      audio = await generateSpeech(text);
      if (audio) audioCacheRef.current.set(text, audio);
    } else {
      audioCacheRef.current.set(text, audio);
    }
    if (!audio) {
      setNarrationState("idle");
      toast.error("Awaaz banane mein dikkat aayi.");
      return;
    }
    const ctrl = createPCMController(audio);
    if (!ctrl) { setNarrationState("idle"); return; }
    audioCtrlRef.current = ctrl;
    setNarrationState("playing");
    ctrl.ended.then(() => {
      if (audioCtrlRef.current === ctrl) {
        audioCtrlRef.current = null;
        setNarrationState("idle");
      }
    });
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (narrationState === "playing" && audioCtrlRef.current) {
      await audioCtrlRef.current.pause();
      setNarrationState("paused");
    } else if (narrationState === "paused" && audioCtrlRef.current) {
      await audioCtrlRef.current.resume();
      setNarrationState("playing");
    } else {
      await startNarration(currentQuestion);
    }
  }, [narrationState, startNarration, currentQuestion]);

  const repeatNarration = useCallback(async () => {
    await startNarration(currentQuestion);
  }, [startNarration, currentQuestion]);

  // Reset Hindi view when question changes
  useEffect(() => {
    setShowHindi(false);
    setHindiText("");
  }, [currentQuestion]);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioCtrlRef.current) audioCtrlRef.current.stop();
    };
  }, []);

  const toggleHindi = useCallback(async () => {
    if (showHindi) { setShowHindi(false); return; }
    if (!currentQuestion.trim()) return;
    const cached = hindiCacheRef.current.get(currentQuestion);
    if (cached) {
      setHindiText(cached);
      setShowHindi(true);
      return;
    }
    setHindiLoading(true);
    try {
      const out = await translateToHindi(currentQuestion);
      hindiCacheRef.current.set(currentQuestion, out);
      setHindiText(out);
      setShowHindi(true);
    } finally {
      setHindiLoading(false);
    }
  }, [showHindi, currentQuestion]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, currentQuestion]);

  // Auth gating handled by ProtectedRoute — no redundant redirect here.

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("virasat_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "in_progress")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setHasResume(true);
    })();
  }, [user]);

  const saveSession = useCallback(
    async (overrides?: Partial<{
      status: string;
      history: Message[];
      currentQuestion: string;
      questionCount: number;
      bookContent: string;
      bookStyle: BookStyle;
      inputMode: InputMode;
      childName: string;
      fatherName: string;
    }>) => {
      if (!user) return null;
      const payload = {
        user_id: user.id,
        status: overrides?.status ?? "in_progress",
        book_style: overrides?.bookStyle ?? bookStyle,
        input_mode: overrides?.inputMode ?? inputMode,
        child_name: overrides?.childName ?? childName,
        father_name: overrides?.fatherName ?? fatherName,
        history: (overrides?.history ?? history) as unknown as never,
        current_question: overrides?.currentQuestion ?? currentQuestion,
        question_count: overrides?.questionCount ?? questionCount,
        book_content: overrides?.bookContent ?? bookContent,
      };
      try {
        if (sessionId) {
          await supabase.from("virasat_sessions").update(payload).eq("id", sessionId);
          return sessionId;
        } else {
          const { data } = await supabase
            .from("virasat_sessions")
            .insert(payload)
            .select("id")
            .single();
          if (data) {
            setSessionId(data.id);
            return data.id as string;
          }
        }
      } catch (e) {
        console.error("Save failed:", e);
      }
      return null;
    },
    [user, sessionId, bookStyle, inputMode, childName, fatherName, history, currentQuestion, questionCount, bookContent]
  );

  const startInterview = useCallback(async () => {
    setMode("interview");
    setCurrentQuestion(FIRST_QUESTION);
    await saveSession({
      currentQuestion: FIRST_QUESTION,
      history: [],
      questionCount: 0,
    });
    if (inputMode === "voice") {
      startNarration(FIRST_QUESTION);
    }
  }, [saveSession, inputMode, startNarration]);

  const resumeInterview = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("virasat_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "in_progress")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) {
      toast.error("Koi adhuri kahani nahi mili.");
      return;
    }
    setSessionId(data.id);
    setBookStyle((data.book_style as BookStyle) || "emotional");
    setInputMode((data.input_mode as InputMode) || "voice");
    setChildName(data.child_name || "");
    setFatherName(data.father_name || "");
    setHistory((data.history as unknown as Message[]) || []);
    setCurrentQuestion(data.current_question || FIRST_QUESTION);
    setQuestionCount(data.question_count || 0);
    setMode("interview");
    toast.success("Aapki kahani phir se shuru hui.");
  }, [user]);

  const handleGenerateBook = useCallback(
    async (finalHistory: Message[], style: BookStyle) => {
      setMode("generating");
      setIsProcessing(true);
      try {
        // Collect media summaries
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: mediaRows } = sessionId ? await (supabase as any)
          .from("virasat_media")
          .select("question_index,media_type,caption")
          .eq("session_id", sessionId) : { data: [] };
        const mediaSummaries = (mediaRows || []).map((m: { question_index: number | null; media_type: string; caption: string | null }) => ({
          question_index: m.question_index,
          type: m.media_type,
          caption: m.caption || undefined,
        }));

        const book = await chargeBook(() =>
          generateBook(finalHistory, style, {
            childName,
            fatherName,
            media: mediaSummaries,
          }),
        );
        if (!book) {
          setMode("review");
          return;
        }
        setBookContent(book);
        setMode("book");
        await saveSession({
          status: "completed",
          history: finalHistory,
          bookContent: book,
          bookStyle: style,
        });
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#8b5e3c", "#a68b7c", "#fdfaf6"],
        });
      } catch (e) {
        console.error(e);
        toast.error("Kitaab banane mein dikkat aayi. Phir se koshish karein.");
        setMode("review");
      } finally {
        setIsProcessing(false);
      }
    },
    [saveSession, sessionId, childName, fatherName, chargeBook]
  );

  const handleTranscript = useCallback(
    async (text: string, audioPath?: string) => {
      if (!text.trim()) return;
      setIsProcessing(true);

      try {
        const [refined, nextQ] = await Promise.all([
          refineResponse(text),
          getNextQuestion([
            ...history,
            { role: "model", text: currentQuestion },
            { role: "user", text },
          ]),
        ]);

        const newHistory: Message[] = [
          ...history,
          { role: "model", text: currentQuestion },
          { role: "user", text: refined, audio_path: audioPath, media_ids: attachedMedia.map((m) => m.id) },
        ];
        const newCount = questionCount + 1;
        setHistory(newHistory);
        setQuestionCount(newCount);
        setCurrentQuestion(nextQ);
        setAttachedMedia([]);
        setIsProcessing(false);

        await saveSession({
          history: newHistory,
          currentQuestion: nextQ,
          questionCount: newCount,
        });

        if (inputMode === "voice") {
          setPrefetchedNextAudio(null);
          startNarration(nextQ, prefetchedNextAudio);
        }
      } catch (e) {
        console.error(e);
        toast.error("Kuch gadbad hui. Phir se koshish karein.");
        setIsProcessing(false);
      }
    },
    [history, currentQuestion, questionCount, prefetchedNextAudio, attachedMedia, inputMode, saveSession, startNarration]
  );

  const goToReview = () => setMode("review");

  const resetApp = () => {
    stopNarration();
    setMode("welcome");
    setHistory([]);
    setCurrentQuestion("");
    setBookContent("");
    setQuestionCount(0);
    setSessionId(null);
    setAttachedMedia([]);
  };

  return (
    <>
      <SEOHead
        title="Virasat: A Personal Keepsake for Your Children"
        description="Record or write your life stories — and turn them into a beautifully personalised keepsake book your children will treasure forever."
        path="/virasat"
      />
      <div className="min-h-screen flex flex-col bg-[hsl(36_55%_97%)] text-[hsl(25_30%_15%)] font-sans">
        <header className="p-6 flex justify-between items-center border-b border-[hsl(25_40%_45%/0.1)] bg-[hsl(36_55%_97%/0.5)] backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[hsl(25_40%_45%)] rounded-full flex items-center justify-center text-white shadow-md">
              <Heart size={20} fill="currentColor" />
            </div>
            <h1 className="text-2xl font-serif font-bold tracking-tight text-[hsl(25_40%_45%)]">Virasat</h1>
          </div>
          {mode !== "welcome" && (
            <button
              onClick={resetApp}
              className="text-[hsl(25_15%_55%)] hover:text-[hsl(25_40%_45%)] transition-colors flex items-center gap-1 text-sm font-medium"
            >
              <RotateCcw size={16} />
              Shuru se shuru karein
            </button>
          )}
        </header>

        <main className="flex-1 flex flex-col relative">
          <AnimatePresence mode="wait">
            {mode === "welcome" && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto"
              >
                <div className="mb-8 relative">
                  <div className="absolute -inset-4 bg-[hsl(25_40%_45%/0.05)] rounded-full blur-2xl -z-10 animate-pulse" />
                  <BookOpen size={80} className="text-[hsl(25_40%_45%)] mx-auto" />
                </div>
                <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
                  Aapki kahani <br />
                  <span className="text-[hsl(25_40%_45%)] italic">aapke bachche ke liye.</span>
                </h2>

                <div className="mb-6 w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="Aapke bachche ka naam"
                    className="px-4 py-3 rounded-xl border-2 border-[hsl(25_40%_45%/0.15)] bg-white focus:border-[hsl(25_40%_45%)] focus:outline-none text-base"
                  />
                  <input
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="Aapka naam (optional)"
                    className="px-4 py-3 rounded-xl border-2 border-[hsl(25_40%_45%/0.15)] bg-white focus:border-[hsl(25_40%_45%)] focus:outline-none text-base"
                  />
                </div>

                <div className="mb-6 w-full max-w-md">
                  <p className="text-sm font-bold uppercase tracking-widest text-[hsl(25_15%_55%)] mb-3">Kaise share karenge?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setInputMode("voice")}
                      className={cn(
                        "px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium flex items-center justify-center gap-2",
                        inputMode === "voice"
                          ? "border-[hsl(25_40%_45%)] bg-[hsl(25_40%_45%/0.05)] text-[hsl(25_40%_45%)]"
                          : "border-[hsl(25_40%_45%/0.1)] text-[hsl(25_15%_55%)] hover:border-[hsl(25_40%_45%/0.3)]"
                      )}
                    >
                      <Mic size={16} /> Bolkar
                    </button>
                    <button
                      onClick={() => setInputMode("write")}
                      className={cn(
                        "px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium flex items-center justify-center gap-2",
                        inputMode === "write"
                          ? "border-[hsl(25_40%_45%)] bg-[hsl(25_40%_45%/0.05)] text-[hsl(25_40%_45%)]"
                          : "border-[hsl(25_40%_45%/0.1)] text-[hsl(25_15%_55%)] hover:border-[hsl(25_40%_45%/0.3)]"
                      )}
                    >
                      <Pencil size={16} /> Likhkar
                    </button>
                  </div>
                </div>

                <div className="mb-8 w-full max-w-md">
                  <p className="text-sm font-bold uppercase tracking-widest text-[hsl(25_15%_55%)] mb-3">Kitaab ka andaaz:</p>
                  <div className="grid grid-cols-3 gap-3">
                    {(["emotional", "factual", "legacy"] as BookStyle[]).map((style) => (
                      <button
                        key={style}
                        onClick={() => setBookStyle(style)}
                        className={cn(
                          "px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium capitalize",
                          bookStyle === style
                            ? "border-[hsl(25_40%_45%)] bg-[hsl(25_40%_45%/0.05)] text-[hsl(25_40%_45%)] shadow-sm"
                            : "border-[hsl(25_40%_45%/0.1)] text-[hsl(25_15%_55%)] hover:border-[hsl(25_40%_45%/0.3)]"
                        )}
                      >
                        {style === "emotional" ? "Dil se" : style === "factual" ? "Sahi yaadein" : "Seekh"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={startInterview}
                    className="group relative px-10 py-4 bg-[hsl(25_40%_45%)] text-white rounded-full text-xl font-medium shadow-xl hover:bg-[hsl(25_40%_40%)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                  >
                    Shuru Karein
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  {hasResume && (
                    <button
                      onClick={resumeInterview}
                      className="text-[hsl(25_40%_45%)] underline underline-offset-4 text-sm font-medium hover:opacity-80"
                    >
                      Adhuri kahani phir se shuru karein →
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {mode === "interview" && (
              <motion.div
                key="interview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 md:p-8"
              >
                <div className="flex items-center justify-between mb-6 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-[hsl(25_40%_45%/0.1)] shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-red-500">On Air</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInputMode(inputMode === "voice" ? "write" : "voice")}
                      className="text-xs text-[hsl(25_40%_45%)] hover:underline flex items-center gap-1 font-medium"
                    >
                      {inputMode === "voice" ? <><Pencil size={12} /> Likhne par jaayein</> : <><Mic size={12} /> Bolne par jaayein</>}
                    </button>
                    <span className="text-xs text-[hsl(25_15%_55%)]">· {questionCount}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto mb-6 space-y-6 pr-2 scroll-smooth" ref={scrollRef}>
                  {history.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn("flex flex-col max-w-[85%]", msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start")}
                    >
                      <div className={cn(
                        "p-5 rounded-2xl shadow-sm",
                        msg.role === "user"
                          ? "bg-[hsl(25_40%_45%)] text-white rounded-tr-none"
                          : "bg-white border border-[hsl(25_40%_45%/0.1)] rounded-tl-none"
                      )}>
                        <p className="text-lg leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </motion.div>
                  ))}

                  {currentQuestion && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex flex-col items-start max-w-[85%] mr-auto"
                    >
                      <div className="p-6 bg-white border border-[hsl(25_40%_45%/0.1)] rounded-2xl rounded-tl-none shadow-md">
                        <p className="text-xl font-serif leading-relaxed italic">
                          {showHindi && hindiText ? hindiText : currentQuestion}
                        </p>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          onClick={togglePlayPause}
                          disabled={narrationState === "loading"}
                          className="group relative flex items-center gap-3 pl-3 pr-5 py-3 rounded-full bg-[hsl(25_40%_45%)] text-white font-semibold hover:bg-[hsl(25_40%_40%)] transition-all shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                          aria-label={narrationState === "playing" ? "Pause narration" : "Play narration"}
                        >
                          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm">
                            {narrationState === "loading" ? (
                              <Loader2 size={26} className="animate-spin" />
                            ) : narrationState === "playing" ? (
                              <Pause size={26} fill="currentColor" />
                            ) : (
                              <Play size={26} fill="currentColor" className="ml-0.5" />
                            )}
                          </span>
                          <span className="text-base">
                            {narrationState === "playing" ? "Ruko" : narrationState === "paused" ? "Aage suno" : "Suno"}
                          </span>
                        </button>
                        <button
                          onClick={repeatNarration}
                          disabled={narrationState === "loading"}
                          className="flex items-center gap-2 pl-2.5 pr-4 py-2 rounded-full border-2 border-[hsl(25_40%_45%/0.3)] text-[hsl(25_40%_45%)] font-semibold hover:bg-[hsl(25_40%_45%/0.06)] hover:border-[hsl(25_40%_45%/0.5)] transition-colors disabled:opacity-60"
                          aria-label="Repeat question"
                        >
                          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[hsl(25_40%_45%/0.08)]">
                            <RefreshCw size={18} />
                          </span>
                          <span className="text-sm">Phir se</span>
                        </button>
                        <button
                          onClick={toggleHindi}
                          disabled={hindiLoading}
                          className={cn(
                            "flex items-center gap-2 pl-2.5 pr-4 py-2 rounded-full border-2 font-semibold transition-colors disabled:opacity-60",
                            showHindi
                              ? "border-[hsl(25_40%_45%)] bg-[hsl(25_40%_45%/0.1)] text-[hsl(25_40%_45%)]"
                              : "border-[hsl(25_40%_45%/0.3)] text-[hsl(25_40%_45%)] hover:bg-[hsl(25_40%_45%/0.06)] hover:border-[hsl(25_40%_45%/0.5)]"
                          )}
                          aria-label="Toggle Hindi script"
                        >
                          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[hsl(25_40%_45%/0.08)]">
                            {hindiLoading ? <Loader2 size={18} className="animate-spin" /> : <Languages size={18} />}
                          </span>
                          <span className="text-sm">{showHindi ? "Hinglish" : "हिन्दी"}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="sticky bottom-0 bg-[hsl(36_55%_97%/0.85)] backdrop-blur-md pt-4 pb-6 border-t border-[hsl(25_40%_45%/0.05)] space-y-3">
                  {inputMode === "voice" ? (
                    <VoiceRecorder
                      onTranscript={handleTranscript}
                      isProcessing={isProcessing}
                      sessionId={sessionId}
                      onRequestWrite={() => setInputMode("write")}
                    />
                  ) : (
                    <WrittenInput onSubmit={(t) => handleTranscript(t)} isProcessing={isProcessing} />
                  )}

                  <MediaAttacher
                    sessionId={sessionId}
                    questionIndex={questionCount}
                    onAttached={(m) => setAttachedMedia((prev) => [...prev, m])}
                    attached={attachedMedia}
                    onRemove={(id) => setAttachedMedia((prev) => prev.filter((x) => x.id !== id))}
                  />

                  <div className="flex justify-center">
                    <button
                      onClick={goToReview}
                      disabled={history.length === 0}
                      className="text-[hsl(25_15%_55%)] hover:text-[hsl(25_40%_45%)] text-sm underline underline-offset-4 font-medium transition-colors disabled:opacity-40 flex items-center gap-2"
                    >
                      <ListChecks size={14} />
                      Bas itna hi, ab kitaab banaiye
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {mode === "review" && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-6"
              >
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-2">
                  Ek baar phir se dekh lijiye
                </h2>
                <p className="text-center text-[hsl(25_15%_55%)] mb-8">
                  Apni kahani ka andaaz chuniye, phir hum aapki kitaab banayenge.
                </p>

                <div className="bg-white border border-[hsl(25_40%_45%/0.1)] rounded-2xl p-6 mb-6 shadow-sm">
                  <p className="text-sm font-bold uppercase tracking-widest text-[hsl(25_15%_55%)] mb-4">Kitaab ka andaaz:</p>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {(["emotional", "factual", "legacy"] as BookStyle[]).map((style) => (
                      <button
                        key={style}
                        onClick={() => setBookStyle(style)}
                        className={cn(
                          "px-4 py-4 rounded-xl border-2 transition-all text-sm font-medium",
                          bookStyle === style
                            ? "border-[hsl(25_40%_45%)] bg-[hsl(25_40%_45%/0.05)] text-[hsl(25_40%_45%)] shadow-sm"
                            : "border-[hsl(25_40%_45%/0.1)] text-[hsl(25_15%_55%)] hover:border-[hsl(25_40%_45%/0.3)]"
                        )}
                      >
                        <div className="font-serif text-lg mb-1">
                          {style === "emotional" ? "Dil se" : style === "factual" ? "Sahi yaadein" : "Seekh"}
                        </div>
                        <div className="text-xs opacity-80 leading-snug">
                          {style === "emotional" ? "Bhavnaon aur yaadon par zor" : style === "factual" ? "Sahi tareekh aur ghatnaayein" : "Zindagi ke sabaq aur salaah"}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-[hsl(25_40%_45%/0.1)] pt-4">
                    <p className="text-sm text-[hsl(25_15%_55%)]">
                      Aapne <span className="font-bold text-[hsl(25_40%_45%)]">{questionCount}</span> kahaniyan share ki hain.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setMode("interview")}
                    className="px-6 py-3 border-2 border-[hsl(25_40%_45%)] text-[hsl(25_40%_45%)] rounded-full font-medium hover:bg-[hsl(25_40%_45%/0.05)] transition-colors"
                  >
                    ← Aur batana hai
                  </button>
                  <button
                    onClick={() => handleGenerateBook(history, bookStyle)}
                    className="px-8 py-3 bg-[hsl(25_40%_45%)] text-white rounded-full font-medium shadow-lg hover:bg-[hsl(25_40%_40%)] hover:scale-105 transition-all flex items-center gap-2 justify-center"
                  >
                    <Sparkles size={18} />
                    Meri kitaab banaiye
                    <CreditCostBadge toolId="virasat" className="border-white/40 bg-white/15 text-white" />
                  </button>
                </div>
              </motion.div>
            )}

            {mode === "generating" && (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="relative w-32 h-32 mb-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                    className="absolute inset-0 border-4 border-dashed border-[hsl(25_40%_45%)] rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles size={48} className="text-[hsl(25_40%_45%)] animate-pulse" />
                  </div>
                </div>
                <h2 className="text-3xl font-serif font-bold mb-4">Aapki yaadon ko sanjo rahe hain...</h2>
                <p className="text-lg text-[hsl(25_15%_55%)] max-w-md mx-auto">
                  Hum aapki baaton ko ek khoobsurat kitaab ka roop de rahe hain. Bas kuch hi pal...
                </p>
              </motion.div>
            )}

            {mode === "book" && (
              <motion.div key="book" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1">
                <BookView
                  content={bookContent}
                  childName={childName}
                  fatherName={fatherName}
                  sessionId={sessionId}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="p-4 text-center text-[hsl(25_15%_55%/0.5)] text-xs font-medium uppercase tracking-widest">
          Made with Love for Indian Families
        </footer>
      </div>
      <BuyCreditsDialog {...bookDialog} />
      <LoginPromptDialog {...bookLogin} />
    </>
  );
}
