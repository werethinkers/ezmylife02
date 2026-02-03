import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToolsAsCSV, toolStats } from "@/data/toolsDatabase";
import { toast } from "sonner";

interface ToolsExportButtonProps {
  className?: string;
}

export const ToolsExportButton = ({ className }: ToolsExportButtonProps) => {
  const handleExport = () => {
    try {
      const csvContent = exportToolsAsCSV();
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ezmylife-tools-database-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${toolStats.total} tools to CSV`);
    } catch (error) {
      toast.error("Failed to export tools");
      console.error("Export error:", error);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className={className}
    >
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
};

export default ToolsExportButton;
