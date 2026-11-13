import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Download, FileText, Calculator } from "lucide-react";
import { usePrefill, useWriteBack } from "@/apps/lib/context";
import { ContextBanner } from "@/apps/shell/ContextBanner";
import { useWorkspace } from "@/apps/lib/workspace";
import { docFromInvoice } from "@/apps/output/buildDoc";
import { makePdf } from "@/apps/output/render";
import { saveFile } from "@/apps/output/save";
import { SaveBar } from "@/apps/output/SaveBar";

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  rate: number;
  gstRate: number;
}

export const InvoiceGenerator = () => {
  const { profile } = useWorkspace();
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyGST, setCompanyGST] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientGST, setClientGST] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, description: "", quantity: 1, rate: 0, gstRate: 18 }
  ]);
  const [notes, setNotes] = useState("");

  // Workspace: your business details and the current client fill in automatically, and the
  // client + invoice totals flow on to Expense Tracker, Tax Estimator, Profit Calculator and
  // the Contract Drafter.
  usePrefill((ctx, p) => {
    setCompanyName((v) => v || p.businessName || "");
    setCompanyAddress((v) => v || [p.address, p.city].filter(Boolean).join(", "));
    setCompanyGST((v) => v || p.gstin || "");
    setClientName((v) => v || ctx.client?.name || "");
    setClientAddress((v) => v || ctx.client?.address || "");
    setClientGST((v) => v || ctx.client?.gstin || "");
    if (ctx.engagement?.service && ctx.engagement.fee)
      setItems((it) => (it.length === 1 && !it[0].description ? [{ ...it[0], description: ctx.engagement!.service!, rate: parseFloat(ctx.engagement!.fee!) || 0 }] : it));
  });
  useWriteBack({ clientName, clientAddress, clientGST, invoiceNumber, items }, (v) => {
    const subtotal = v.items.reduce((s, i) => s + i.quantity * i.rate, 0);
    const gst = v.items.reduce((s, i) => s + (i.quantity * i.rate * i.gstRate) / 100, 0);
    return {
      ...(v.clientName ? { client: { name: v.clientName, address: v.clientAddress, gstin: v.clientGST } } : {}),
      ...(subtotal > 0
        ? { lastInvoice: { number: v.invoiceNumber, subtotal, gst, total: subtotal + gst, items: v.items.filter((i) => i.description).map((i) => ({ description: i.description, quantity: i.quantity, rate: i.rate })) } }
        : {}),
    };
  });

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: "", quantity: 1, rate: 0, gstRate: 18 }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: number, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const calculateTotalGST = () => {
    return items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.rate;
      return sum + (itemTotal * item.gstRate / 100);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTotalGST();
  };

  const ready = !!companyName && !!clientName && items.every((item) => item.description && item.rate > 0);
  const invoiceDoc = ready
    ? docFromInvoice({ companyName, companyAddress, companyGST, clientName, clientAddress, clientGST, invoiceNumber, invoiceDate, dueDate, items, notes, profile })
    : null;

  const generateInvoice = async () => {
    if (!invoiceDoc) {
      toast.error("Please fill in your business name, the customer and every item's description and rate");
      return;
    }
    const t = toast.loading("Making your invoice PDF…");
    try {
      const { blob } = await makePdf(invoiceDoc);
      await saveFile(blob, `${invoiceDoc.fileName}.pdf`, `Invoice ${invoiceNumber}`);
      toast.success("Invoice PDF ready", { id: t });
    } catch {
      toast.error("The PDF could not be made on this device.", { id: t });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <ContextBanner show={["client"]} />
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Invoice Generator
          </CardTitle>
          <CardDescription>Create professional GST-compliant invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Your Business</h3>
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your Company Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="Company Address"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>GSTIN</Label>
                <Input
                  value={companyGST}
                  onChange={(e) => setCompanyGST(e.target.value)}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Client Details</h3>
              <div className="space-y-2">
                <Label>Client Name *</Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client/Company Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Client Address"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Client GSTIN</Label>
                <Input
                  value={clientGST}
                  onChange={(e) => setClientGST(e.target.value)}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Invoice Date</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Items</h3>
              <Button onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-muted/30 rounded-lg">
                  <div className="col-span-4 space-y-1">
                    {index === 0 && <Label className="text-xs">Description *</Label>}
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    {index === 0 && <Label className="text-xs">Qty</Label>}
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    {index === 0 && <Label className="text-xs">Rate (₹)</Label>}
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    {index === 0 && <Label className="text-xs">GST %</Label>}
                    <Input
                      type="number"
                      min="0"
                      max="28"
                      value={item.gstRate}
                      onChange={(e) => updateItem(item.id, 'gstRate', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2 flex justify-between items-center">
                    <span className="text-sm font-medium">₹{(item.quantity * item.rate).toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-right">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">GST:</span>
                <span>₹{calculateTotalGST().toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes / Terms</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment terms, bank details, or any additional notes..."
              rows={3}
            />
          </div>

          <Button onClick={() => void generateInvoice()} className="w-full" size="lg">
            <Download className="h-5 w-5 mr-2" /> Download invoice PDF
          </Button>
        </CardContent>
      </Card>
      <SaveBar toolId="invoice-generator" appName="Invoice Generator" doc={invoiceDoc} />
    </div>
  );
};
