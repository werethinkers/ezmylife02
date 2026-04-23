import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book as BookIcon, Download, Menu, X, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface BookViewProps {
  content: string;
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

const slugify = (t: string) => t.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

export default function BookView({ content }: BookViewProps) {
  const [open, setOpen] = useState(false);

  const scrollTo = (chapter: string) => {
    const el = document.getElementById(slugify(chapter));
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setOpen(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      <aside className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 w-64 z-40">
        <div className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl border border-border shadow-lg">
          <h3 className="font-serif text-primary font-bold mb-4 flex items-center gap-2">
            <BookIcon size={18} />
            Adhyay
          </h3>
          <nav className="space-y-2">
            {chapters.map((c) => (
              <button key={c} onClick={() => scrollTo(c)} className="w-full text-left text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all flex items-center gap-2 group">
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                {c}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <div className="lg:hidden fixed bottom-8 right-8 z-50">
        <button onClick={() => setOpen(!open)} className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-xl flex items-center justify-center">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="lg:hidden fixed inset-x-4 bottom-24 z-50 bg-card p-6 rounded-3xl shadow-2xl border border-border">
            <h3 className="font-serif text-primary font-bold mb-4">Jump to Chapter</h3>
            <div className="grid grid-cols-1 gap-2">
              {chapters.map((c) => (
                <button key={c} onClick={() => scrollTo(c)} className="text-left py-2 px-4 rounded-xl hover:bg-primary/5 text-foreground font-medium transition-colors">
                  {c}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto px-6 py-12 lg:ml-[25%] xl:mx-auto">
        <div className="bg-card shadow-2xl rounded-sm border border-border p-8 md:p-16 min-h-[80vh] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-primary/30" />
          <div className="absolute bottom-0 left-0 w-full h-2 bg-primary/30" />
          <div className="prose prose-invert max-w-none font-serif text-foreground">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-4xl md:text-6xl text-center mb-12 text-primary border-b border-border pb-8">{children}</h1>,
                h2: ({ children }) => {
                  const c = String(children);
                  return <h2 id={slugify(c)} className="text-2xl md:text-3xl mt-12 mb-6 text-primary/90 italic scroll-mt-24">{children}</h2>;
                },
                p: ({ children }) => <p className="text-lg md:text-xl leading-relaxed mb-6">{children}</p>,
                hr: () => <hr className="my-12 border-border" />,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition shadow-md">
            <Download size={20} />
            Save as PDF
          </button>
        </div>
      </motion.div>
    </div>
  );
}
