import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, Eye, BookHeart, Image as ImageIcon, Video, Mic } from "lucide-react";
import { format } from "date-fns";
import BookView from "@/components/virasat/BookView";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  display_name: string | null;
}

interface VirasatSession {
  id: string;
  user_id: string;
  status: string;
  book_style: string;
  input_mode: string;
  child_name: string | null;
  father_name: string | null;
  history: Array<{ role: "user" | "model"; text: string; audio_path?: string }>;
  question_count: number;
  book_content: string | null;
  created_at: string;
  updated_at: string;
}

interface MediaItem {
  id: string;
  session_id: string;
  question_index: number | null;
  chapter: string | null;
  media_type: "image" | "video" | "audio";
  storage_path: string;
  mp4_storage_path?: string | null;
  transcode_status?: string | null;
  caption: string | null;
  created_at: string;
  signed_url?: string;
  is_mp4?: boolean;
}

export default function VirasatArchive() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<VirasatSession[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [mediaCounts, setMediaCounts] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<VirasatSession | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [view, setView] = useState<"transcript" | "media" | "book">("transcript");
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: ses } = await (supabase as any)
        .from("virasat_sessions")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(500);
      const sessionsData = (ses as VirasatSession[]) || [];
      setSessions(sessionsData);

      const userIds = Array.from(new Set(sessionsData.map((s) => s.user_id)));
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,email,full_name,display_name")
          .in("id", userIds);
        const map: Record<string, Profile> = {};
        (profs || []).forEach((p) => { map[p.id] = p as Profile; });
        setProfiles(map);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: media } = await (supabase as any)
        .from("virasat_media")
        .select("session_id");
      const counts: Record<string, number> = {};
      (media || []).forEach((m: { session_id: string }) => {
        counts[m.session_id] = (counts[m.session_id] || 0) + 1;
      });
      setMediaCounts(counts);
      setLoading(false);
    })();
  }, []);

  const openSession = async (s: VirasatSession) => {
    setSelected(s);
    setView("transcript");
    setSelectedMedia([]);
    setAudioUrls({});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: media } = await (supabase as any)
      .from("virasat_media")
      .select("*")
      .eq("session_id", s.id)
      .order("created_at", { ascending: true });

    const items = (media as MediaItem[]) || [];
    const withUrls = await Promise.all(
      items.map(async (m) => {
        const preferMp4 = !!(m.media_type === "audio" && m.mp4_storage_path);
        const path = preferMp4 ? (m.mp4_storage_path as string) : m.storage_path;
        const { data: signed } = await supabase.storage
          .from("virasat-media")
          .createSignedUrl(path, 60 * 60 * 24);
        return { ...m, signed_url: signed?.signedUrl, is_mp4: preferMp4 };
      }),
    );
    setSelectedMedia(withUrls);

    // Build webm-path -> mp4-path map for transcript audio playback
    const mp4ByWebm: Record<string, string> = {};
    for (const m of items) {
      if (m.media_type === "audio" && m.mp4_storage_path) {
        mp4ByWebm[m.storage_path] = m.mp4_storage_path;
      }
    }

    // Per-turn audio (history audio_path) — prefer mp4 when available
    const audioMap: Record<string, string> = {};
    for (const turn of s.history || []) {
      if (turn.audio_path) {
        const path = mp4ByWebm[turn.audio_path] || turn.audio_path;
        const { data: signed } = await supabase.storage
          .from("virasat-media")
          .createSignedUrl(path, 60 * 60 * 24);
        if (signed?.signedUrl) audioMap[turn.audio_path] = signed.signedUrl;
      }
    }
    setAudioUrls(audioMap);
  };

  const userLabel = (uid: string) => profiles[uid]?.email || profiles[uid]?.full_name || profiles[uid]?.display_name || uid.slice(0, 8);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookHeart className="h-5 w-5" />
            Virasat Archive ({sessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Child / Storyteller</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Style</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Stories</TableHead>
                <TableHead className="text-right">Media</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm">{userLabel(s.user_id)}</TableCell>
                  <TableCell className="text-sm">
                    {s.child_name || "—"}
                    {s.father_name && <span className="text-muted-foreground"> / {s.father_name}</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.status === "completed" ? "default" : "outline"}>{s.status}</Badge>
                  </TableCell>
                  <TableCell><Badge variant="outline">{s.book_style}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.input_mode}</TableCell>
                  <TableCell className="text-right">{s.question_count}</TableCell>
                  <TableCell className="text-right">{mediaCounts[s.id] || 0}</TableCell>
                  <TableCell className="text-xs">{format(new Date(s.updated_at), "MMM d, HH:mm")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openSession(s)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {sessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Koi Virasat session abhi tak nahi.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <BookHeart className="h-5 w-5" />
                  {selected.child_name || "Virasat"} — {userLabel(selected.user_id)}
                </SheetTitle>
              </SheetHeader>

              <div className="flex gap-2 mt-4 mb-6 border-b pb-2">
                {(["transcript", "media", "book"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-3 py-1.5 text-sm rounded ${view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {v === "transcript" ? "Transcript" : v === "media" ? `Media (${selectedMedia.length})` : "Book"}
                  </button>
                ))}
              </div>

              {view === "transcript" && (
                <div className="space-y-4">
                  {(selected.history || []).map((turn, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${turn.role === "model" ? "bg-muted/50" : "bg-primary/5"}`}>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                        {turn.role === "model" ? "AI Host" : "Storyteller"}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{turn.text}</p>
                      {turn.audio_path && audioUrls[turn.audio_path] && (
                        <audio src={audioUrls[turn.audio_path]} controls className="w-full h-8 mt-2" />
                      )}
                    </div>
                  ))}
                  {(!selected.history || selected.history.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">No conversation yet.</p>
                  )}
                </div>
              )}

              {view === "media" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedMedia.map((m) => (
                    <div key={m.id} className="border rounded-lg overflow-hidden bg-muted/30">
                      {m.media_type === "image" && m.signed_url && (
                        <img src={m.signed_url} alt="" className="w-full h-32 object-cover" />
                      )}
                      {m.media_type === "video" && m.signed_url && (
                        <video src={m.signed_url} controls className="w-full h-32 object-cover" />
                      )}
                      {m.media_type === "audio" && m.signed_url && (
                        <div className="p-3">
                          <Mic className="h-6 w-6 text-primary mb-2" />
                          <audio src={m.signed_url} controls className="w-full h-8" />
                        </div>
                      )}
                      <div className="px-2 py-1 flex items-center gap-1 text-xs text-muted-foreground">
                        {m.media_type === "image" && <ImageIcon className="h-3 w-3" />}
                        {m.media_type === "video" && <Video className="h-3 w-3" />}
                        {m.media_type === "audio" && <Mic className="h-3 w-3" />}
                        {m.media_type}
                        {m.question_index != null && <span className="ml-auto">Q{m.question_index + 1}</span>}
                      </div>
                    </div>
                  ))}
                  {selectedMedia.length === 0 && (
                    <p className="col-span-full text-center text-muted-foreground py-8">No media attached.</p>
                  )}
                </div>
              )}

              {view === "book" && (
                <div className="-mx-6">
                  {selected.book_content ? (
                    <BookView
                      content={selected.book_content}
                      childName={selected.child_name || undefined}
                      fatherName={selected.father_name || undefined}
                      sessionId={selected.id}
                      mediaItems={selectedMedia.map((m) => ({
                        id: m.id,
                        type: m.media_type,
                        storage_path: m.storage_path,
                        question_index: m.question_index,
                        chapter: m.chapter,
                        caption: m.caption,
                        signed_url: m.signed_url,
                      }))}
                    />
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Book not generated yet.</p>
                  )}
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
