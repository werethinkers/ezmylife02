import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Camera, Upload, Loader2 } from "lucide-react";
import { BulkModeToggle } from "@/components/bulk/BulkModeToggle";
import { useCredits } from "@/hooks/useCredits";
import { BuyCreditsDialog } from "@/components/wallet/BuyCreditsDialog";
import { CreditCostBadge } from "@/components/tools/CreditCostBadge";

interface Props {
  userId: string;
  eventId: string;
  eventName: string;
  onSaved: () => void;
}

export default function BusinessCardScanner({ userId, eventId, eventName, onSaved }: Props) {
  const [images, setImages] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [extracted, setExtracted] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { charge, dialogProps } = useCredits("business-card-scanner");

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setImages(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const scan = async () => {
    if (images.length === 0) { toast({ title: "Add at least one image", variant: "destructive" }); return; }
    setScanning(true);
    try {
      await charge(async () => {
        const { data, error } = await supabase.functions.invoke("scan-business-card", { body: { images } });
        if (error) throw error;
        if (data?.contact) setExtracted(data.contact);
        else throw new Error("No contact extracted");
      });
    } catch (e: any) {
      toast({ title: "Scan failed", description: e.message, variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const save = async () => {
    if (!extracted?.name) { toast({ title: "Name is required", variant: "destructive" }); return; }
    const { error } = await supabase.from("meet_nudge_contacts").insert({
      host_id: userId, event_id: eventId, event_name: eventName,
      name: extracted.name, occupation: extracted.occupation || null,
      business_name: extracted.business_name || null, email: extracted.email || null,
      phone: extracted.phone || null, website: extracted.website || null,
      linkedin_url: extracted.linkedin_url || null, location: extracted.location || null,
    });
    if (error) { toast({ title: "Error saving", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Contact saved! ✅" });
    onSaved();
  };

  if (extracted) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Review extracted info:</p>
        {["name", "occupation", "business_name", "email", "phone", "website", "linkedin_url", "location"].map(key => (
          <div key={key}>
            <Label className="text-xs capitalize">{key.replace(/_/g, " ")}</Label>
            <Input value={extracted[key] || ""} onChange={e => setExtracted((p: any) => ({ ...p, [key]: e.target.value }))} />
          </div>
        ))}
        <div className="flex gap-2">
          <Button onClick={save} className="flex-1">Save Contact</Button>
          <Button variant="outline" onClick={() => { setExtracted(null); setImages([]); }}>Re-scan</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4 mr-1" /> Upload
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => {
          const input = document.createElement("input");
          input.type = "file"; input.accept = "image/*"; input.capture = "environment";
          input.onchange = () => handleFiles(input.files);
          input.click();
        }}>
          <Camera className="h-4 w-4 mr-1" /> Camera
        </Button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <img key={i} src={img} className="w-24 h-16 object-cover rounded-md border" alt={`Card ${i + 1}`} />
          ))}
        </div>
      )}
      <Button onClick={scan} disabled={scanning || images.length === 0} className="w-full">
        {scanning ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Scanning...</> : <>Scan & Extract <CreditCostBadge toolId="business-card-scanner" className="ml-2" /></>}
      </Button>
      <div className="flex justify-center pt-1">
        <BulkModeToggle toolId="business-card-scanner" />
      </div>
      <BuyCreditsDialog {...dialogProps} />
    </div>
  );
}
