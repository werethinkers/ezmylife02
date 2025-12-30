import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Download, FileText, Calculator } from "lucide-react";

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  rate: number;
  gstRate: number;
}

export const InvoiceGenerator = () => {
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
  const printRef = useRef<HTMLDivElement>(null);

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

  const generateInvoice = () => {
    if (!companyName || !clientName || items.some(item => !item.description || item.rate <= 0)) {
      toast.error("Please fill in all required fields");
      return;
    }

    const invoiceContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${invoiceNumber}</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
    .company-info h1 { color: #4f46e5; margin: 0; font-size: 28px; }
    .invoice-title { text-align: right; }
    .invoice-title h2 { color: #1f2937; margin: 0; font-size: 32px; }
    .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .bill-to, .invoice-info { width: 45%; }
    .section-title { color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #4f46e5; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .totals { text-align: right; }
    .totals table { width: 300px; margin-left: auto; }
    .totals td { padding: 8px 12px; }
    .total-row { font-weight: bold; font-size: 18px; background: #f3f4f6; }
    .notes { margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; }
    .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>${companyName}</h1>
      <p>${companyAddress}</p>
      ${companyGST ? `<p>GSTIN: ${companyGST}</p>` : ''}
    </div>
    <div class="invoice-title">
      <h2>INVOICE</h2>
      <p>#${invoiceNumber}</p>
    </div>
  </div>
  
  <div class="invoice-details">
    <div class="bill-to">
      <div class="section-title">Bill To</div>
      <strong>${clientName}</strong>
      <p>${clientAddress}</p>
      ${clientGST ? `<p>GSTIN: ${clientGST}</p>` : ''}
    </div>
    <div class="invoice-info">
      <div class="section-title">Invoice Details</div>
      <p><strong>Date:</strong> ${invoiceDate}</p>
      ${dueDate ? `<p><strong>Due Date:</strong> ${dueDate}</p>` : ''}
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Rate (₹)</th>
        <th>GST %</th>
        <th>Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>${item.rate.toFixed(2)}</td>
          <td>${item.gstRate}%</td>
          <td>${(item.quantity * item.rate).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="totals">
    <table>
      <tr>
        <td>Subtotal:</td>
        <td>₹${calculateSubtotal().toFixed(2)}</td>
      </tr>
      <tr>
        <td>GST:</td>
        <td>₹${calculateTotalGST().toFixed(2)}</td>
      </tr>
      <tr class="total-row">
        <td>Total:</td>
        <td>₹${calculateTotal().toFixed(2)}</td>
      </tr>
    </table>
  </div>
  
  ${notes ? `<div class="notes"><strong>Notes:</strong><br/>${notes}</div>` : ''}
  
  <div class="footer">
    <p>Thank you for your business!</p>
  </div>
</body>
</html>`;

    const blob = new Blob([invoiceContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${invoiceNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Invoice downloaded successfully!");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
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

          <Button onClick={generateInvoice} className="w-full" size="lg">
            <Download className="h-5 w-5 mr-2" /> Download Invoice
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
