import { useRef, useState } from "react";
import { Image as ImageIcon, Video, Mic, X, Loader2, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface AttachedMedia {
  id: string;
  type: "image" | "video" | "audio";
  storage_path: string;
  preview_url: string;
  caption?: string;
}

interface MediaAttacherProps {
  sessionId: string | null;
  questionIndex: number;
  onAttached: (m: AttachedMedia) => void;
  attached: AttachedMedia[];
  onRemove: (id: string) => void;
}

const MAX_VIDEO_MB = 50;
const MAX_IMAGE_MB = 10;

export default function MediaAttacher({
  sessionId,
  questionIndex,
  onAttached,
  attached,
  onRemove,
}: MediaAttacherProps) {
  const { user } = useAuth();
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const audioInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File, type: "image" | "video" | "audio") => {
    if (!user || !sessionId) {
      toast.error("Pehle apni kahani shuru kijiye.");
      return;
    }
    const sizeMb = file.size / (1024 * 1024);
    if (type === "video" && sizeMb > MAX_VIDEO_MB) {
      toast.error(`Video bahut badi hai (max ${MAX_VIDEO_MB}MB).`);
      return;
    }
    if (type === "image" && sizeMb > MAX_IMAGE_MB) {
      toast.error(`Tasveer bahut badi hai (max ${MAX_IMAGE_MB}MB).`);
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || (type === "image" ? "jpg" : type === "video" ? "mp4" : "webm");
      const path = `${user.id}/${sessionId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("virasat-media")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: row, error: dbErr } = await (supabase as any)
        .from("virasat_media")
        .insert({
          session_id: sessionId,
          user_id: user.id,
          question_index: questionIndex,
          media_type: type,
          storage_path: path,
        })
        .select("id")
        .single();
      if (dbErr) throw dbErr;

      const { data: signed } = await supabase.storage
        .from("virasat-media")
        .createSignedUrl(path, 60 * 60 * 24);

      onAttached({
        id: row.id,
        type,
        storage_path: path,
        preview_url: signed?.signedUrl || "",
      });
      toast.success("Jod diya!");
    } catch (e) {
      console.error(e);
      toast.error("Upload nahi ho paya.");
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (type: "image" | "video" | "audio") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload(f, type);
    e.target.value = "";
  };

  const removeMedia = async (m: AttachedMedia) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("virasat_media").delete().eq("id", m.id);
      await supabase.storage.from("virasat-media").remove([m.storage_path]);
      onRemove(m.id);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span className="text-xs text-[hsl(25_15%_55%)] flex items-center gap-1 mr-1">
          <Paperclip size={12} /> Jodiye:
        </span>
        <button
          onClick={() => imageInput.current?.click()}
          disabled={uploading || !sessionId}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(25_40%_45%/0.2)] text-xs text-[hsl(25_40%_45%)] hover:bg-[hsl(25_40%_45%/0.05)] disabled:opacity-40 transition-colors"
        >
          <ImageIcon size={14} /> Tasveer
        </button>
        <button
          onClick={() => videoInput.current?.click()}
          disabled={uploading || !sessionId}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(25_40%_45%/0.2)] text-xs text-[hsl(25_40%_45%)] hover:bg-[hsl(25_40%_45%/0.05)] disabled:opacity-40 transition-colors"
        >
          <Video size={14} /> Video
        </button>
        <button
          onClick={() => audioInput.current?.click()}
          disabled={uploading || !sessionId}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(25_40%_45%/0.2)] text-xs text-[hsl(25_40%_45%)] hover:bg-[hsl(25_40%_45%/0.05)] disabled:opacity-40 transition-colors"
        >
          <Mic size={14} /> Awaaz
        </button>
        {uploading && <Loader2 size={14} className="animate-spin text-[hsl(25_40%_45%)]" />}
      </div>

      <input ref={imageInput} type="file" accept="image/*" hidden onChange={handleFile("image")} />
      <input ref={videoInput} type="file" accept="video/*" hidden onChange={handleFile("video")} />
      <input ref={audioInput} type="file" accept="audio/*" hidden onChange={handleFile("audio")} />

      <AnimatePresence>
        {attached.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex gap-2 flex-wrap justify-center"
          >
            {attached.map((m) => (
              <div key={m.id} className="relative group">
                {m.type === "image" && (
                  <img src={m.preview_url} alt="" className="w-20 h-20 object-cover rounded-lg border border-[hsl(25_40%_45%/0.15)]" />
                )}
                {m.type === "video" && (
                  <div className="w-20 h-20 rounded-lg border border-[hsl(25_40%_45%/0.15)] bg-black/80 flex items-center justify-center text-white">
                    <Video size={28} />
                  </div>
                )}
                {m.type === "audio" && (
                  <div className="w-20 h-20 rounded-lg border border-[hsl(25_40%_45%/0.15)] bg-[hsl(25_40%_45%/0.1)] flex items-center justify-center text-[hsl(25_40%_45%)]">
                    <Mic size={28} />
                  </div>
                )}
                <button
                  onClick={() => removeMedia(m)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
