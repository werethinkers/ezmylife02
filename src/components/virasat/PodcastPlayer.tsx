import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { pcmBase64ToWavBlobUrl, stopPlayback } from "./lib/audio";

interface PodcastPlayerProps {
  /** base64 PCM (16-bit mono 24kHz) returned by Gemini TTS */
  audioBase64: string | null;
  /** the spoken question — used as caption / aria-label */
  questionText?: string;
  /** called when user manually starts playing — caller can pause auto-mic */
  onUserPlay?: () => void;
}

const SPEEDS = [1, 1.25, 1.5];

const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export default function PodcastPlayer({ audioBase64, questionText, onUserPlay }: PodcastPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(0);

  const url = useMemo(() => (audioBase64 ? pcmBase64ToWavBlobUrl(audioBase64) : null), [audioBase64]);

  // Revoke blob URL on unmount / when audio changes
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  // Reset transport when source changes
  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [url]);

  // Apply playback rate when speed changes
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[speedIdx];
  }, [speedIdx]);

  const toggle = async () => {
    const el = audioRef.current;
    if (!el || !url) return;
    if (playing) {
      el.pause();
    } else {
      // Stop any auto-play happening via WebAudio path so they don't overlap
      stopPlayback();
      onUserPlay?.();
      try {
        el.playbackRate = SPEEDS[speedIdx];
        await el.play();
      } catch (e) {
        console.warn("Audio play blocked:", e);
      }
    }
  };

  const replay = async () => {
    const el = audioRef.current;
    if (!el || !url) return;
    stopPlayback();
    onUserPlay?.();
    el.currentTime = 0;
    try {
      el.playbackRate = SPEEDS[speedIdx];
      await el.play();
    } catch (e) {
      console.warn("Audio replay blocked:", e);
    }
  };

  const onSeek = (vals: number[]) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    const t = (vals[0] / 100) * duration;
    el.currentTime = t;
    setCurrentTime(t);
  };

  if (!audioBase64 || !url) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground italic">
        Audio taiyaar ho rahi hai…
      </div>
    );
  }

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="rounded-2xl border border-border bg-card/60 backdrop-blur p-4 shadow-sm"
      aria-label={questionText ? `Podcast playback for: ${questionText}` : "Podcast playback"}
    >
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration || 0)}
        onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          if (audioRef.current) audioRef.current.currentTime = 0;
          setCurrentTime(0);
        }}
      />

      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="icon"
          onClick={toggle}
          className="h-11 w-11 rounded-full shrink-0"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </Button>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={replay}
          className="h-9 w-9 rounded-full shrink-0"
          aria-label="Replay from start"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <div className="flex-1 min-w-0">
          <Slider
            value={[pct]}
            min={0}
            max={100}
            step={0.1}
            onValueChange={onSeek}
            aria-label="Seek audio"
          />
          <div className="mt-1 flex items-center justify-between text-[11px] tabular-nums text-muted-foreground">
            <span>{fmt(currentTime)}</span>
            <span className="flex items-center gap-1">
              <Volume2 className="h-3 w-3" /> Sawal sun rahe hain
            </span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setSpeedIdx((i) => (i + 1) % SPEEDS.length)}
          className="h-9 px-2 text-xs tabular-nums shrink-0"
          aria-label={`Playback speed ${SPEEDS[speedIdx]}x`}
        >
          {SPEEDS[speedIdx]}×
        </Button>
      </div>
    </div>
  );
}
