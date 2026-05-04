import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2 } from "lucide-react";
import type { BulkParamField, BulkToolConfig } from "@/data/bulkTools";

interface Props {
  config: BulkToolConfig;
  values: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
}

export const BulkParamsForm = ({ config, values, onChange }: Props) => {
  if (!config.params || config.params.length === 0) return null;

  const set = (key: string, v: any) => onChange({ ...values, [key]: v });

  // Conditional: hide background_hex unless background === "custom"
  const visibleFields = config.params.filter((p) => {
    if (p.key === "background_hex" && values.background !== "custom") return false;
    return true;
  });

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Settings2 className="h-4 w-4 text-primary" />
        Settings (applied to every file)
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibleFields.map((field) => (
          <FieldRenderer
            key={field.key}
            field={field}
            value={values[field.key]}
            onChange={(v) => set(field.key, v)}
          />
        ))}
      </div>
    </div>
  );
};

const FieldRenderer = ({
  field,
  value,
  onChange,
}: {
  field: BulkParamField;
  value: any;
  onChange: (v: any) => void;
}) => {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{field.label}</Label>
      {field.type === "select" && (
        <Select value={String(value ?? field.default)} onValueChange={onChange}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {field.type === "number" && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            className="h-9"
            min={field.min}
            max={field.max}
            step={field.step}
            value={value ?? field.default}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          {field.suffix && (
            <span className="text-xs text-muted-foreground">{field.suffix}</span>
          )}
        </div>
      )}
      {field.type === "text" && (
        <Input
          className="h-9"
          placeholder={field.placeholder}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {field.type === "toggle" && (
        <div className="flex items-center h-9">
          <Switch checked={!!value} onCheckedChange={onChange} />
        </div>
      )}
      {field.help && (
        <p className="text-[11px] text-muted-foreground">{field.help}</p>
      )}
    </div>
  );
};
