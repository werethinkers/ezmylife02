import { motion } from "framer-motion";
import { BookOpen, Clock, MessageCircle, X, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ResumeInfo {
  id: string;
  title: string;
  status: string;
  question_count: number;
  updated_at: string;
  last_question?: string;
}

interface ContinueStoryCardProps {
  resume: ResumeInfo;
  onResume: () => void;
  onDismiss: () => void;
}

const relativeTime = (iso: string) => {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "abhi";
  if (min < 60) return `${min} min pehle`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ghante pehle`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day} din pehle`;
  return new Date(iso).toLocaleDateString("en-IN");
};

const statusLabel: Record<string, string> = {
  recording: "Recording",
  reviewing: "Review pending",
  done: "Complete",
};

export default function ContinueStoryCard({ resume, onResume, onDismiss }: ContinueStoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mb-6 text-left"
    >
      <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-card/60 to-card/40 backdrop-blur p-5 md:p-6 shadow-lg">
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-primary/15 text-primary">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-primary/80">
              Continue your story
            </p>
            <h3 className="text-lg font-serif font-bold text-foreground leading-tight">
              {resume.title || "Meri Kahani"}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
          <Badge variant="secondary" className="gap-1">
            <MessageCircle className="h-3 w-3" />
            {resume.question_count} kahaniyan
          </Badge>
          <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
            {statusLabel[resume.status] || resume.status}
          </Badge>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            {relativeTime(resume.updated_at)}
          </span>
        </div>

        {resume.last_question && (
          <div className="rounded-lg border border-border/60 bg-background/40 p-3 mb-5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Aakhri sawal
            </p>
            <p className="text-sm font-serif italic text-foreground/90 line-clamp-3">
              "{resume.last_question}"
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={onResume} className="gap-2" size="lg">
            <Sparkles className="h-4 w-4" />
            Yahin se jaari rakhein
          </Button>
          <Button onClick={onDismiss} variant="ghost" size="lg">
            Nayi shuruaat karein
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
