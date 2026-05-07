import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Download, Upload as UploadIcon } from "lucide-react";
import { compositeImage } from "./utils/compositor";
import { AngleResult } from "./types";
import { toast } from "sonner";

interface Props {
  angles: AngleResult[];
}

const PRESET_COLORS = [
  "#ffffff", "#f5f5f4", "#e7e5e4", "#1c1917", "#0f172a",
  "#1e293b", "#fef3c7", "#dbeafe", "#fce7f3", "#dcfce7",
];

export const BackgroundStudio = ({ angles }: Props) => {
  const done = angles.filter((a) => a.status === "done" && a.transparentUrl);
  const [selectedAngleIdx, setSelectedAngleIdx] = useState(0);
  const [bgKind, setBgKind] = useState<"color" | "image">("color");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [logoScale, setLogoScale] = useState(0.18);
  const [logoX, setLogoX] = useState(0.5);
  const [logoY, setLogoY] = useState(0.92);
  const [productScale, setProductScale] = useState(0.85);
  const [composed, setComposed] = useState<string | null>(null);

  const current = done[selectedAngleIdx];

  useEffect(() => { setSelectedAngleIdx(0); }, [done.length]);

  useEffect(() => {
    if (!current?.transparentUrl) return;
    let cancelled = false;
    compositeImage({
      background: bgKind === "color" || !bgImage
        ? { kind: "color", color: bgColor }
        : { kind: "image", src: bgImage },
      productSrc: current.transparentUrl,
      productScale,
      logo: logoSrc ? { src: logoSrc, scale: logoScale, x: logoX, y: logoY } : undefined,
    }).then((url) => { if (!cancelled) setComposed(url); }).catch(() => {});
    return () => { cancelled = true; };
  }, [current, bgKind, bgColor, bgImage, logoSrc, logoScale, logoX, logoY, productScale]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, target: "bg" | "logo") => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      if (target === "bg") { setBgImage(url); setBgKind("image"); }
      else setLogoSrc(url);
    };
    reader.readAsDataURL(f);
  };

  const download = () => {
    if (!composed || !current) return;
    const a = document.createElement("a");
    a.href = composed;
    a.download = `productvision360_${current.angle}.png`;
    a.click();
    toast.success("Downloaded");
  };

  if (!done.length) {
    return <p className="text-sm text-muted-foreground">No angles available yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      {/* Preview */}
      <Card className="p-4 bg-card/50 backdrop-blur border-border">
        <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted/30 grid place-items-center">
          {composed ? (
            <img src={composed} alt={current.angle} className="h-full w-full object-contain" />
          ) : (
            <p className="text-muted-foreground text-sm">Composing…</p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {done.map((a, i) => (
            <button
              key={a.angle}
              onClick={() => setSelectedAngleIdx(i)}
              className={`rounded-md border-2 p-1 transition ${i === selectedAngleIdx ? "border-primary" : "border-transparent hover:border-border"}`}
            >
              <img src={a.transparentUrl} alt={a.angle} className="h-14 w-14 object-contain bg-muted/40 rounded" />
            </button>
          ))}
        </div>
        <Button onClick={download} className="mt-4 w-full" disabled={!composed}>
          <Download className="h-4 w-4 mr-2" /> Download this composition
        </Button>
      </Card>

      {/* Controls */}
      <Card className="p-4 bg-card/50 backdrop-blur border-border space-y-5">
        <Tabs value={bgKind} onValueChange={(v) => setBgKind(v as "color" | "image")}>
          <TabsList className="w-full">
            <TabsTrigger value="color" className="flex-1">Solid color</TabsTrigger>
            <TabsTrigger value="image" className="flex-1">Custom image</TabsTrigger>
          </TabsList>
          <TabsContent value="color" className="space-y-3 pt-3">
            <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-10 w-full p-1" />
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setBgColor(c)}
                  className={`h-9 rounded-md border-2 ${bgColor === c ? "border-primary" : "border-border"}`}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="image" className="pt-3">
            <label className="flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-border p-3 hover:bg-muted/30">
              <UploadIcon className="h-4 w-4" /> <span className="text-sm">Upload background</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, "bg")} />
            </label>
            {bgImage && <img src={bgImage} alt="bg" className="mt-2 h-20 w-full object-cover rounded" />}
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label className="text-xs">Product size</Label>
          <Slider min={0.3} max={1} step={0.01} value={[productScale]} onValueChange={(v) => setProductScale(v[0])} />
        </div>

        <div className="space-y-3 pt-2 border-t border-border">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Logo / watermark</Label>
          <label className="flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-border p-3 hover:bg-muted/30">
            <UploadIcon className="h-4 w-4" /> <span className="text-sm">{logoSrc ? "Replace logo" : "Upload logo"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, "logo")} />
          </label>
          {logoSrc && (
            <>
              <img src={logoSrc} alt="logo" className="h-12 mx-auto object-contain" />
              <div className="space-y-2">
                <Label className="text-xs">Size</Label>
                <Slider min={0.05} max={0.5} step={0.01} value={[logoScale]} onValueChange={(v) => setLogoScale(v[0])} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Horizontal</Label>
                <Slider min={0} max={1} step={0.01} value={[logoX]} onValueChange={(v) => setLogoX(v[0])} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Vertical</Label>
                <Slider min={0} max={1} step={0.01} value={[logoY]} onValueChange={(v) => setLogoY(v[0])} />
              </div>
              <Button variant="ghost" size="sm" className="w-full" onClick={() => setLogoSrc(null)}>Remove logo</Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
