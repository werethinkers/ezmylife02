import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { toast } from "sonner";

const BulkJobDetail = () => {
  const { id } = useParams();
  const [job, setJob] = useState<any>(null);

  const load = async () => {
    if (!id) return;
    const { data } = await supabase.from("bulk_jobs").select("*").eq("id", id).maybeSingle();
    setJob(data);
  };

  useEffect(() => {
    load();
    if (!id) return;
    const ch = supabase
      .channel(`bulk_job_${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bulk_jobs", filter: `id=eq.${id}` },
        (payload) => setJob(payload.new)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id]);

  const handleDownload = async () => {
    if (!job?.output_zip_path) return;
    const { data, error } = await supabase.storage
      .from("bulk-outputs")
      .createSignedUrl(job.output_zip_path, 3600);
    if (error || !data) return toast.error("Download failed");
    window.open(data.signedUrl, "_blank");
  };

  if (!job) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto pt-24 px-4">Loading...</div>
      </>
    );
  }

  const pct = job.total_items ? Math.round((job.completed_items / job.total_items) * 100) : 0;

  return (
    <>
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 pt-24 pb-16">
        <Link to="/bulk/jobs" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> All bulk jobs
        </Link>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 bg-card/60 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold">{job.tool_name}</h1>
                <p className="text-sm text-muted-foreground">
                  Started {new Date(job.created_at).toLocaleString()}
                </p>
              </div>
              <Badge className="capitalize text-sm px-3 py-1">{job.status}</Badge>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{job.completed_items} / {job.total_items} processed</span>
                <span>{pct}%</span>
              </div>
              <Progress value={pct} />
            </div>

            {job.params && Object.keys(job.params).length > 0 && (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Settings used
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(job.params).map(([k, v]) =>
                    v === "" || v === null || v === undefined ? null : (
                      <Badge key={k} variant="outline" className="text-xs">
                        {k}: {String(v)}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            )}

            {job.output_zip_path && (
              <Button onClick={handleDownload} size="lg" className="w-full">
                <Download className="h-4 w-4 mr-2" /> Download ZIP
              </Button>
            )}

            {Array.isArray(job.outputs) && job.outputs.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Files</h3>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {job.outputs.map((o: any, i: number) => {
                    const meta = Array.isArray(job.per_file_meta) ? job.per_file_meta[i] : null;
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm p-2 rounded bg-muted/30"
                      >
                        {o.status === "ok" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : o.status === "error" ? (
                          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{o.input_filename}</div>
                          {meta && Object.keys(meta).length > 0 && (
                            <div className="text-xs text-muted-foreground truncate">
                              {Object.entries(meta).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                            </div>
                          )}
                        </div>
                        {o.error && <span className="text-xs text-red-400">{o.error}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default BulkJobDetail;
