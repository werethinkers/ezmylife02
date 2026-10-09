import { Link, NavLink, Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { gb } from "../lib/business";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBusinessData } from "../components/dash";
import { emptyLocation, saveBusiness, type Location } from "../lib/business";


const FIELDS: { key: keyof Location; label: string; placeholder?: string; wide?: boolean }[] = [
  { key: "name", label: "Location name", placeholder: "e.g. Vijay Nagar branch" },
  { key: "code", label: "Code", placeholder: "e.g. IND-001" },
  { key: "city", label: "City" },
  { key: "area", label: "Area / locality" },
  { key: "address", label: "Address", wide: true },
  { key: "managerName", label: "Manager name" },
  { key: "managerPhone", label: "Manager phone" },
  { key: "staffName", label: "Staff / salesperson name" },
  { key: "staffPhone", label: "Staff phone" },
  { key: "reviewLink", label: "Google review link", placeholder: "https://g.page/r/.../review", wide: true },
  { key: "gbpLocationId", label: "Google Business Profile location ID", placeholder: "Optional — for API posting later", wide: true },
];

export default function Locations() {
  const { id } = useParams() as { id: string; sid: string };
  const { biz } = useBusinessData(id);
  const [editing, setEditing] = useState<Location | null>(null);

  if (!biz) return null;

  function save(loc: Location) {
    const exists = biz!.locations.some((l) => l.id === loc.id);
    saveBusiness({ ...biz!, locations: exists ? biz!.locations.map((l) => (l.id === loc.id ? loc : l)) : [...biz!.locations, loc] });
    setEditing(null);
    toast.success(exists ? "Location updated" : "Location added");
  }

  function remove(loc: Location) {
    if (biz!.locations.length === 1) return toast.error("A business needs at least one location");
    if (!confirm(`Remove ${loc.name}? Its review link will stop working.`)) return;
    saveBusiness({ ...biz!, locations: biz!.locations.filter((l) => l.id !== loc.id) });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Locations</h2>
          <p className="text-sm text-muted-foreground">Each location gets its own review link, QR code and Google review page.</p>
        </div>
        <Button onClick={() => setEditing(emptyLocation({ code: `LOC-${String(biz.locations.length + 1).padStart(3, "0")}`, city: biz.locations[0]?.city ?? "" }))}>
          <Plus className="mr-1 h-4 w-4" /> Add location
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Location</th>
              <th className="px-3 font-medium">City / area</th>
              <th className="px-3 font-medium">Manager</th>
              <th className="px-3 font-medium">Staff</th>
              <th className="px-3 font-medium">Google link</th>
              <th className="px-3 font-medium">Status</th>
              <th className="px-4" />
            </tr>
          </thead>
          <tbody>
            {biz.locations.map((l) => (
              <tr key={l.id} className="border-b last:border-0">
                <td className="px-4 py-2.5">
                  <div className="font-medium">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{l.code}</div>
                </td>
                <td className="px-3">{[l.area, l.city].filter(Boolean).join(", ") || "—"}</td>
                <td className="px-3">
                  <div>{l.managerName || "—"}</div>
                  <div className="text-xs text-muted-foreground">{l.managerPhone}</div>
                </td>
                <td className="px-3">
                  <div>{l.staffName || "—"}</div>
                  <div className="text-xs text-muted-foreground">{l.staffPhone}</div>
                </td>
                <td className="px-3">{l.reviewLink ? <span className="text-emerald-600">Connected</span> : <span className="text-amber-700">Missing</span>}</td>
                <td className="px-3">
                  <span className={l.status === "active" ? "text-emerald-600" : "text-muted-foreground"}>{l.status === "active" ? "Active" : "Inactive"}</span>
                </td>
                <td className="whitespace-nowrap px-4 text-right">
                  <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing(l)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => remove(l)}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing && biz.locations.some((l) => l.id === editing.id) ? "Edit location" : "Add location"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.key} className={f.wide ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
                  <Label>{f.label}</Label>
                  <Input
                    value={String(editing[f.key] ?? "")}
                    placeholder={f.placeholder}
                    onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                  />
                </div>
              ))}
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={editing.status === "active"}
                  onChange={(e) => setEditing({ ...editing, status: e.target.checked ? "active" : "inactive" })}
                />
                Active (inactive locations are hidden from the review links page)
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => editing && save(editing)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
