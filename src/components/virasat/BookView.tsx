import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book as BookIcon, Download, Share2, Menu, X, ChevronRight, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { exportElementToPdf } from "@/components/virasat/lib/pdfExport";
import { toast } from "sonner";

interface MediaItem {
  id: string;
  type: "image" | "video" | "audio";
  storage_path: string;
  question_index: number | null;
  chapter: string | null;
  caption: string | null;
  signed_url?: string;
}

interface BookViewProps {
  content: string;
  childName?: string;
  fatherName?: string;
  sessionId?: string | null;
  mediaItems?: MediaItem[];
}

const chapters = [
  "Bachpan",
  "Jawaani aur Sapne",
  "Sangharsh",
  "Seekh",
  "Parivaar",
  "Zindagi ki Sachchaiyaan",
  "Mere Bachche Ke Naam",
];

const slugify = (text: string) =>
  text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

export default function BookView({ content, childName, fatherName, sessionId, mediaItems: initialMedia }: BookViewProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>(initialMedia || []);
  const [exporting, setExporting] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);

  // Load media for this session if not provided
  useEffect(() => {
    if (initialMedia || !sessionId) return;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("virasat_media")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      if (!data) return;
      const withUrls = await Promise.all(
        (data as MediaItem[]).map(async (m) => {
          const { data: signed } = await supabase.storage
            .from("virasat-media")
            .createSignedUrl(m.storage_path, 60 * 60 * 24);
          return { ...m, signed_url: signed?.signedUrl };
        }),
      );
      setMedia(withUrls);
    })();
  }, [sessionId, initialMedia]);

  const scrollToChapter = (chapter: string) => {
    const id = slugify(chapter);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setIsMenuOpen(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!bookRef.current) return;
    setExporting(true);
    try {
      const fileName = `Virasat-${childName?.replace(/\s+/g, "-") || "Mere-Bachche"}.pdf`;
      await exportElementToPdf(bookRef.current, fileName);
      toast.success("PDF download ho gayi!");
    } catch (e) {
      console.error(e);
      toast.error("PDF banane mein dikkat aayi.");
    } finally {
      setExporting(false);
    }
  };

  // Group media by chapter (only photos/videos render inline; audio handled separately)
  const visualMedia = media.filter((m) => m.type === "image" || m.type === "video");
  const audioMedia = media.filter((m) => m.type === "audio");

  return (
    <div className="relative min-h-screen">
      <aside className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 w-64 z-40">
        <div className="bg-[hsl(36_45%_98%/0.8)] backdrop-blur-sm p-6 rounded-2xl border border-[hsl(25_40%_45%/0.1)] shadow-sm">
          <h3 className="font-serif text-[hsl(25_40%_45%)] font-bold mb-4 flex items-center gap-2">
            <BookIcon size={18} />
            Chapters
          </h3>
          <nav className="space-y-2">
            {chapters.map((chapter) => (
              <button
                key={chapter}
                onClick={() => scrollToChapter(chapter)}
                className="w-full text-left text-sm text-[hsl(25_15%_55%)] hover:text-[hsl(25_40%_45%)] hover:translate-x-1 transition-all flex items-center gap-2 group"
              >
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                {chapter}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <div className="lg:hidden fixed bottom-8 right-8 z-50">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-14 h-14 bg-[hsl(25_40%_45%)] text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="lg:hidden fixed inset-x-4 bottom-24 z-50 bg-[hsl(36_50%_99%)] p-6 rounded-3xl shadow-2xl border border-[hsl(25_40%_45%/0.1)]"
          >
            <h3 className="font-serif text-[hsl(25_40%_45%)] font-bold mb-4">Jump to Chapter</h3>
            <div className="grid grid-cols-1 gap-3">
              {chapters.map((chapter) => (
                <button
                  key={chapter}
                  onClick={() => scrollToChapter(chapter)}
                  className="text-left py-2 px-4 rounded-xl hover:bg-[hsl(25_40%_45%/0.05)] text-[hsl(25_30%_15%)] font-medium transition-colors"
                >
                  {chapter}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto px-6 py-12 lg:ml-[25%] xl:mx-auto"
      >
        {(childName || fatherName) && (
          <div className="mb-6 text-center">
            <p className="text-sm uppercase tracking-widest text-[hsl(25_15%_55%)] mb-2">Ek tohfa</p>
            <p className="font-serif text-2xl text-[hsl(25_40%_45%)] italic">
              {childName ? `${childName} ke liye` : "Mere bachche ke liye"}
              {fatherName ? `, ${fatherName} se` : ""}
            </p>
          </div>
        )}

        <div
          ref={bookRef}
          className="bg-[hsl(36_50%_99%)] shadow-2xl rounded-sm border border-[hsl(25_40%_45%/0.1)] p-8 md:p-16 min-h-[80vh] relative overflow-hidden"
          style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")' }}
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-[hsl(25_40%_45%/0.2)]" />
          <div className="absolute bottom-0 left-0 w-full h-2 bg-[hsl(25_40%_45%/0.2)]" />

          <div className="prose max-w-none font-serif text-[hsl(25_30%_15%)]">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-4xl md:text-6xl text-center mb-12 text-[hsl(25_40%_45%)] border-b border-[hsl(25_40%_45%/0.2)] pb-8">{children}</h1>
                ),
                h2: ({ children }) => {
                  const text = String(children);
                  const id = slugify(text);
                  return (
                    <h2 id={id} className="text-2xl md:text-3xl mt-12 mb-6 text-[hsl(25_40%_45%/0.8)] italic scroll-mt-24">
                      {children}
                    </h2>
                  );
                },
                p: ({ children }) => (
                  <p className="text-lg md:text-xl leading-relaxed mb-6 first-letter:text-4xl first-letter:font-bold first-letter:mr-1 first-letter:float-left">
                    {children}
                  </p>
                ),
                hr: () => <hr className="my-12 border-[hsl(25_40%_45%/0.1)]" />,
              }}
            >
              {content}
            </ReactMarkdown>

            {visualMedia.length > 0 && (
              <div className="mt-16 pt-8 border-t border-[hsl(25_40%_45%/0.2)]">
                <h2 className="text-2xl md:text-3xl mb-6 text-[hsl(25_40%_45%/0.8)] italic">Yaadon ki tasveerein</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {visualMedia.map((m) => (
                    <div key={m.id} className="rounded-lg overflow-hidden border border-[hsl(25_40%_45%/0.15)] shadow-sm bg-white">
                      {m.type === "image" && m.signed_url && (
                        <img src={m.signed_url} alt={m.caption || ""} className="w-full h-auto object-cover" crossOrigin="anonymous" />
                      )}
                      {m.type === "video" && m.signed_url && (
                        <video src={m.signed_url} controls className="w-full h-auto" />
                      )}
                      {m.caption && (
                        <p className="text-xs text-[hsl(25_15%_55%)] italic p-2 text-center">{m.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {audioMedia.length > 0 && (
              <div className="mt-12 pt-6 border-t border-[hsl(25_40%_45%/0.2)]">
                <h2 className="text-2xl md:text-3xl mb-6 text-[hsl(25_40%_45%/0.8)] italic">Aapki awaaz mein</h2>
                <div className="space-y-3">
                  {audioMedia.map((m) => (
                    <audio key={m.id} src={m.signed_url} controls className="w-full" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <button
            onClick={handleDownloadPdf}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-3 bg-[hsl(25_40%_45%)] text-white rounded-full hover:bg-[hsl(25_40%_40%)] transition-colors shadow-md disabled:opacity-60"
          >
            {exporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
            {exporting ? "PDF ban rahi hai..." : "Download PDF"}
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "Virasat", text: content.slice(0, 200) }).catch(() => { /* ignore */ });
              } else {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copy ho gaya!");
              }
            }}
            className="flex items-center gap-2 px-6 py-3 border border-[hsl(25_40%_45%)] text-[hsl(25_40%_45%)] rounded-full hover:bg-[hsl(25_40%_45%/0.05)] transition-colors"
          >
            <Share2 size={20} />
            Apne parivaar ko bhejein
          </button>
        </div>
      </motion.div>
    </div>
  );
}
