import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Trash2, Zap, Inbox } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { toast } from "sonner";

interface Job {
  id: string;
  tool_id: string;
  tool_name: string;
  status: string;
  total_items: number;
  completed_items: number;
  failed_items: number;
  output_zip_path: string | null;
  created_at: string;
}

const statusColor: Record<string, string> = {
  queued: "bg-muted",
  running: "bg-blue-500/20 text-blue-300",
  completed: "bg-green-500/20 text-green-300",
  partial: "bg-yellow-500/20 text-yellow-300",
  failed: "bg-red-500/20 text-red-300",
};

const BulkJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("bulk_jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setJobs((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel("bulk_jobs_list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bulk_jobs", filter: `user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  const handleDownload = async (job: Job) => {
    if (!job.output_zip_path) return;
    const { data, error } = await supabase.storage
      .from("bulk-outputs")
      .createSignedUrl(job.output_zip_path, 3600);
    if (error || !data) {
      toast.error("Could not generate download link");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job?")) return;
    await supabase.from("bulk_jobs").delete().eq("id", id);
    setJobs(jobs.filter((j) => j.id !== id));
    toast.success("Deleted");
  };

  return (
    <>
      <SEOHead
        title="Bulk Jobs · EZYOURLIFE"
        description="Track your bulk AI processing jobs — drop dozens of files, get all outputs at once. Included free with EZYOURLIFE Premium."
        path="/bulk/jobs"
        noindex
      />
      <Navbar />
      <div className="container max-w-5xl mx-auto px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary" /> Bulk Jobs
          </h1>
          <p className="text-muted-foreground">
            Drop multiple files into any supported tool · processed in parallel · downloadable as ZIP.
          </p>
        </motion.div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : jobs.length === 0 ? (
          <Card className="p-12 text-center bg-card/50">
            <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No bulk jobs yet</h2>
            <p className="text-muted-foreground mb-4">
              Open any AI App with the ⚡ Bulk Mode pill and drop your files.
            </p>
            <Link to="/ai-apps">
              <Button>Browse AI Apps</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const pct = job.total_items
                ? Math.round((job.completed_items / job.total_items) * 100)
                : 0;
              return (
                <Card key={job.id} className="p-4 bg-card/60 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link to={`/bulk/jobs/${job.id}`} className="font-semibold hover:text-primary">
                          {job.tool_name}
                        </Link>
                        <Badge className={statusColor[job.status] || ""}>{job.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {job.completed_items}/{job.total_items} files
                        {job.failed_items > 0 && ` · ${job.failed_items} failed`} ·{" "}
                        {new Date(job.created_at).toLocaleString()}
                      </p>
                      {job.status === "running" && <Progress value={pct} className="mt-2 h-1.5" />}
                    </div>
                    <div className="flex gap-2">
                      {job.output_zip_path && (
                        <Button size="sm" onClick={() => handleDownload(job)}>
                          <Download className="h-4 w-4 mr-1" /> ZIP
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(job.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default BulkJobs;
