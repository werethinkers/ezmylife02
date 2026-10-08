import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Calculator, IndianRupee, Percent, FileText, TrendingDown } from "lucide-react";
import { usePrefill, useWriteBack } from "@/apps/lib/context";
import { ContextBanner } from "@/apps/shell/ContextBanner";

const gstRates = [
  { value: "0", label: "0% (Exempt)" },
  { value: "5", label: "5% (Essential items)" },
  { value: "12", label: "12% (Standard)" },
  { value: "18", label: "18% (Standard)" },
  { value: "28", label: "28% (Luxury)" },
];

const tdsCategories = [
  { value: "194C", label: "194C - Contractors (1%/2%)", rate: 2 },
  { value: "194J", label: "194J - Professional Fees (10%)", rate: 10 },
  { value: "194H", label: "194H - Commission (5%)", rate: 5 },
  { value: "194I", label: "194I - Rent (10%)", rate: 10 },
  { value: "194A", label: "194A - Interest (10%)", rate: 10 },
  { value: "194Q", label: "194Q - Purchase of Goods (0.1%)", rate: 0.1 },
];

export const TaxEstimator = () => {
  // GST Calculator
  const [gstAmount, setGstAmount] = useState<number>(0);
  const [gstRate, setGstRate] = useState<string>("18");
  const [gstType, setGstType] = useState<"exclusive" | "inclusive">("exclusive");
  
  // TDS Calculator
  const [tdsAmount, setTdsAmount] = useState<number>(0);
  const [tdsCategory, setTdsCategory] = useState<string>("194J");
  const [isPAN, setIsPAN] = useState<boolean>(true);

  // Monthly Summary
  const [monthlySales, setMonthlySales] = useState<number>(0);
  const [monthlyPurchases, setMonthlyPurchases] = useState<number>(0);
  const [salesGstRate, setSalesGstRate] = useState<string>("18");
  const [purchaseGstRate, setPurchaseGstRate] = useState<string>("18");

  // Workspace: the last invoice and this month's sales / expenses fill the calculators.
  usePrefill((ctx) => {
    const inv = ctx.lastInvoice;
    if (inv?.subtotal) {
      setGstAmount((v) => v || Math.round(inv.subtotal! * 100) / 100);
      setTdsAmount((v) => v || Math.round(inv.subtotal! * 100) / 100);
    }
    const sales = ctx.money?.monthlyRevenue || inv?.subtotal;
    if (sales) setMonthlySales((v) => v || Math.round(sales));
    if (ctx.money?.monthlyExpenses) setMonthlyPurchases((v) => v || Math.round(ctx.money!.monthlyExpenses!));
  });
  useWriteBack(monthlySales, (v) => (v > 0 ? { money: { monthlyRevenue: v } } : null));

  // GST Calculations
  const calculateGST = () => {
    const rate = parseFloat(gstRate) / 100;
    if (gstType === "exclusive") {
      const gst = gstAmount * rate;
      const total = gstAmount + gst;
      return { baseAmount: gstAmount, gst, total, cgst: gst / 2, sgst: gst / 2 };
    } else {
      const baseAmount = gstAmount / (1 + rate);
      const gst = gstAmount - baseAmount;
      return { baseAmount, gst, total: gstAmount, cgst: gst / 2, sgst: gst / 2 };
    }
  };

  // TDS Calculations
  const calculateTDS = () => {
    const category = tdsCategories.find(c => c.value === tdsCategory);
    let rate = category?.rate || 10;
    
    // If no PAN, TDS rate is 20% or higher of the two
    if (!isPAN) {
      rate = Math.max(rate, 20);
    }
    
    const tds = tdsAmount * (rate / 100);
    const netAmount = tdsAmount - tds;
    
    return { tds, netAmount, rate };
  };

  // Monthly GST Summary
  const calculateMonthlyGST = () => {
    const outputGST = monthlySales * (parseFloat(salesGstRate) / 100);
    const inputGST = monthlyPurchases * (parseFloat(purchaseGstRate) / 100);
    const netGST = outputGST - inputGST;
    
    return { outputGST, inputGST, netGST };
  };

  const gstResult = calculateGST();
  const tdsResult = calculateTDS();
  const monthlyGST = calculateMonthlyGST();

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <ContextBanner show={["client", "invoice", "money"]} />
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Tax Estimator
          </CardTitle>
          <CardDescription>Calculate GST, TDS, and monthly tax liability</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="gst" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="gst">GST Calculator</TabsTrigger>
              <TabsTrigger value="tds">TDS Calculator</TabsTrigger>
              <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
            </TabsList>

            {/* GST Calculator */}
            <TabsContent value="gst" className="space-y-6 pt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Amount (₹)</Label>
                    <Input
                      type="number"
                      value={gstAmount || ""}
                      onChange={(e) => setGstAmount(parseFloat(e.target.value) || 0)}
                      placeholder="Enter amount"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>GST Rate</Label>
                    <Select value={gstRate} onValueChange={setGstRate}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {gstRates.map(rate => (
                          <SelectItem key={rate.value} value={rate.value}>{rate.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Calculation Type</Label>
                    <Select value={gstType} onValueChange={(v: "exclusive" | "inclusive") => setGstType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exclusive">GST Exclusive (Add GST)</SelectItem>
                        <SelectItem value="inclusive">GST Inclusive (Extract GST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Card className="bg-muted/30">
                  <CardContent className="p-4 space-y-3">
                    <h4 className="font-semibold text-lg">GST Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base Amount:</span>
                        <span className="font-medium">₹{gstResult.baseAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CGST ({parseFloat(gstRate) / 2}%):</span>
                        <span className="font-medium">₹{gstResult.cgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SGST ({parseFloat(gstRate) / 2}%):</span>
                        <span className="font-medium">₹{gstResult.sgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-muted-foreground">Total GST:</span>
                        <span className="font-bold text-primary">₹{gstResult.gst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between bg-primary/10 p-2 rounded">
                        <span className="font-semibold">Total Amount:</span>
                        <span className="font-bold text-lg">₹{gstResult.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TDS Calculator */}
            <TabsContent value="tds" className="space-y-6 pt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Payment Amount (₹)</Label>
                    <Input
                      type="number"
                      value={tdsAmount || ""}
                      onChange={(e) => setTdsAmount(parseFloat(e.target.value) || 0)}
                      placeholder="Enter payment amount"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>TDS Section</Label>
                    <Select value={tdsCategory} onValueChange={setTdsCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tdsCategories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="pan"
                      checked={isPAN}
                      onChange={(e) => setIsPAN(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="pan" className="cursor-pointer">Payee has PAN</Label>
                  </div>
                  
                  {!isPAN && (
                    <p className="text-sm text-amber-500 bg-amber-500/10 p-2 rounded">
                      ⚠️ Without PAN, TDS will be deducted at 20% or applicable rate, whichever is higher.
                    </p>
                  )}
                </div>

                <Card className="bg-muted/30">
                  <CardContent className="p-4 space-y-3">
                    <h4 className="font-semibold text-lg">TDS Calculation</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gross Amount:</span>
                        <span className="font-medium">₹{tdsAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TDS Rate:</span>
                        <span className="font-medium">{tdsResult.rate}%</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-muted-foreground">TDS Deducted:</span>
                        <span className="font-bold text-red-500">₹{tdsResult.tds.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between bg-primary/10 p-2 rounded">
                        <span className="font-semibold">Net Payable:</span>
                        <span className="font-bold text-lg">₹{tdsResult.netAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Monthly Summary */}
            <TabsContent value="monthly" className="space-y-6 pt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Sales (Output GST)</h4>
                  <div className="space-y-2">
                    <Label>Total Sales Value (₹)</Label>
                    <Input
                      type="number"
                      value={monthlySales || ""}
                      onChange={(e) => setMonthlySales(parseFloat(e.target.value) || 0)}
                      placeholder="Enter monthly sales"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GST Rate on Sales</Label>
                    <Select value={salesGstRate} onValueChange={setSalesGstRate}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {gstRates.map(rate => (
                          <SelectItem key={rate.value} value={rate.value}>{rate.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Purchases (Input GST)</h4>
                  <div className="space-y-2">
                    <Label>Total Purchases Value (₹)</Label>
                    <Input
                      type="number"
                      value={monthlyPurchases || ""}
                      onChange={(e) => setMonthlyPurchases(parseFloat(e.target.value) || 0)}
                      placeholder="Enter monthly purchases"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GST Rate on Purchases</Label>
                    <Select value={purchaseGstRate} onValueChange={setPurchaseGstRate}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {gstRates.map(rate => (
                          <SelectItem key={rate.value} value={rate.value}>{rate.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-lg mb-4">Monthly GST Liability</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-500/10 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Output GST (Collected)</div>
                      <div className="text-2xl font-bold text-green-500">
                        ₹{monthlyGST.outputGST.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Input GST (Credit)</div>
                      <div className="text-2xl font-bold text-blue-500">
                        ₹{monthlyGST.inputGST.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className={`text-center p-4 rounded-lg ${monthlyGST.netGST >= 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                      <div className="text-sm text-muted-foreground mb-1">
                        {monthlyGST.netGST >= 0 ? 'GST Payable' : 'GST Credit'}
                      </div>
                      <div className={`text-2xl font-bold ${monthlyGST.netGST >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        ₹{Math.abs(monthlyGST.netGST).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  
                  {monthlyGST.netGST >= 0 && monthlyGST.netGST > 0 && (
                    <p className="text-sm text-muted-foreground mt-4 text-center">
                      You need to pay ₹{monthlyGST.netGST.toLocaleString('en-IN')} as GST this month
                    </p>
                  )}
                  {monthlyGST.netGST < 0 && (
                    <p className="text-sm text-emerald-500 mt-4 text-center">
                      You have ₹{Math.abs(monthlyGST.netGST).toLocaleString('en-IN')} GST credit to carry forward
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
