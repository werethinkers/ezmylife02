import { Card, CardContent } from "@/components/ui/card";

interface AnalysisReportProps {
  markdown: string;
}

export const AnalysisReport = ({ markdown }: AnalysisReportProps) => {
  const formatMarkdown = (text: string) => {
    return text
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-6 mb-2 text-foreground">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-8 mb-3 text-foreground border-b border-border pb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-foreground">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1 text-sm">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-3 text-sm text-muted-foreground leading-relaxed">')
      .replace(/\n/g, '<br/>')
      .replace(/\|(.+)\|/g, (match) => {
        const cells = match.split("|").filter(c => c.trim());
        if (cells.every(c => /^[\s-]+$/.test(c))) return '';
        const isHeader = cells.some(c => c.includes("---"));
        if (isHeader) return '';
        return `<tr>${cells.map(c => `<td class="border border-border px-3 py-2 text-xs">${c.trim()}</td>`).join("")}</tr>`;
      });
  };

  return (
    <Card className="border-border/50">
      <CardContent className="p-6">
        <div
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: `<p class="mb-3 text-sm text-muted-foreground leading-relaxed">${formatMarkdown(markdown)}</p>` }}
        />
      </CardContent>
    </Card>
  );
};
