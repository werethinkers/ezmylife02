import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Calculator, TrendingUp, TrendingDown, DollarSign, Percent, PieChart, Download } from "lucide-react";
import { usePrefill } from "@/apps/lib/context";
import { ContextBanner } from "@/apps/shell/ContextBanner";

export const ProfitCalculator = () => {
  // Basic Calculator
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  
  // Advanced Costs
  const [rawMaterial, setRawMaterial] = useState<number>(0);
  const [labor, setLabor] = useState<number>(0);
  const [overhead, setOverhead] = useState<number>(0);
  const [packaging, setPackaging] = useState<number>(0);
  const [shipping, setShipping] = useState<number>(0);
  const [marketing, setMarketing] = useState<number>(0);
  const [otherCosts, setOtherCosts] = useState<number>(0);
  
  // Taxes & Fees
  const [gstRate, setGstRate] = useState<number>(18);
  const [platformFee, setPlatformFee] = useState<number>(0);
  const [paymentGatewayFee, setPaymentGatewayFee] = useState<number>(2);

  // Margin Calculator
  const [targetMargin, setTargetMargin] = useState<number>(30);

  // Workspace: this month's sales and costs (from invoices / the expense tracker) as the
  // starting point — a whole-month view with quantity 1.
  usePrefill((ctx) => {
    const sales = ctx.money?.monthlyRevenue || ctx.lastInvoice?.subtotal;
    if (sales) setSellingPrice((v) => v || Math.round(sales));
    if (ctx.money?.monthlyExpenses) setCostPrice((v) => v || Math.round(ctx.money!.monthlyExpenses!));
  });

  // Calculate total cost
  const calculateTotalCost = () => {
    return rawMaterial + labor + overhead + packaging + shipping + marketing + otherCosts;
  };

  // Use either direct cost or itemized
  const getEffectiveCost = () => {
    const itemizedTotal = calculateTotalCost();
    return itemizedTotal > 0 ? itemizedTotal : costPrice;
  };

  // Calculate fees
  const calculatePlatformFee = () => {
    return (sellingPrice * platformFee) / 100;
  };

  const calculatePaymentFee = () => {
    return (sellingPrice * paymentGatewayFee) / 100;
  };

  const calculateGST = () => {
    return (sellingPrice * gstRate) / 100 / (1 + gstRate / 100);
  };

  // Net calculations
  const calculateGrossProfit = () => {
    return sellingPrice - getEffectiveCost();
  };

  const calculateNetProfit = () => {
    const gross = calculateGrossProfit();
    const fees = calculatePlatformFee() + calculatePaymentFee();
    return gross - fees;
  };

  const calculateMargin = () => {
    if (sellingPrice === 0) return 0;
    return (calculateNetProfit() / sellingPrice) * 100;
  };

  const calculateMarkup = () => {
    const cost = getEffectiveCost();
    if (cost === 0) return 0;
    return ((sellingPrice - cost) / cost) * 100;
  };

  // Suggested price based on target margin
  const calculateSuggestedPrice = () => {
    const cost = getEffectiveCost();
    if (cost === 0) return 0;
    const totalFeePercent = platformFee + paymentGatewayFee;
    const priceBeforeFees = cost / (1 - targetMargin / 100);
    return priceBeforeFees / (1 - totalFeePercent / 100);
  };

  // Break-even
  const calculateBreakEven = () => {
    const cost = getEffectiveCost();
    const totalFeePercent = platformFee + paymentGatewayFee;
    return cost / (1 - totalFeePercent / 100);
  };

  const exportReport = () => {
    const report = `
PROFIT ANALYSIS REPORT
======================
Generated: ${new Date().toLocaleDateString('en-IN')}

PRICING
-------
Selling Price: ₹${sellingPrice.toLocaleString('en-IN')}
Cost Price: ₹${getEffectiveCost().toLocaleString('en-IN')}
Quantity: ${quantity}

COST BREAKDOWN
--------------
Raw Material: ₹${rawMaterial.toLocaleString('en-IN')}
Labor: ₹${labor.toLocaleString('en-IN')}
Overhead: ₹${overhead.toLocaleString('en-IN')}
Packaging: ₹${packaging.toLocaleString('en-IN')}
Shipping: ₹${shipping.toLocaleString('en-IN')}
Marketing: ₹${marketing.toLocaleString('en-IN')}
Other: ₹${otherCosts.toLocaleString('en-IN')}
Total Cost: ₹${getEffectiveCost().toLocaleString('en-IN')}

FEES & DEDUCTIONS
-----------------
Platform Fee (${platformFee}%): ₹${calculatePlatformFee().toFixed(2)}
Payment Gateway (${paymentGatewayFee}%): ₹${calculatePaymentFee().toFixed(2)}
GST Collected (${gstRate}%): ₹${calculateGST().toFixed(2)}

PROFIT ANALYSIS
---------------
Gross Profit: ₹${calculateGrossProfit().toFixed(2)}
Net Profit: ₹${calculateNetProfit().toFixed(2)}
Profit Margin: ${calculateMargin().toFixed(2)}%
Markup: ${calculateMarkup().toFixed(2)}%

INSIGHTS
--------
Break-even Price: ₹${calculateBreakEven().toFixed(2)}
Target Margin (${targetMargin}%) Price: ₹${calculateSuggestedPrice().toFixed(2)}
Total Revenue (${quantity} units): ₹${(sellingPrice * quantity).toLocaleString('en-IN')}
Total Profit (${quantity} units): ₹${(calculateNetProfit() * quantity).toFixed(2)}
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'profit-analysis-report.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <ContextBanner show={["invoice", "money"]} />
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={`bg-gradient-to-br ${calculateNetProfit() >= 0 ? 'from-green-500/10 to-green-600/5 border-green-500/20' : 'from-red-500/10 to-red-600/5 border-red-500/20'}`}>
          <CardContent className="p-4">
            <div className={`flex items-center gap-2 ${calculateNetProfit() >= 0 ? 'text-green-500' : 'text-red-500'} mb-1`}>
              {calculateNetProfit() >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="text-xs font-medium">Net Profit</span>
            </div>
            <div className="text-xl font-bold">₹{calculateNetProfit().toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <Percent className="h-4 w-4" />
              <span className="text-xs font-medium">Margin</span>
            </div>
            <div className="text-xl font-bold">{calculateMargin().toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-500 mb-1">
              <PieChart className="h-4 w-4" />
              <span className="text-xs font-medium">Markup</span>
            </div>
            <div className="text-xl font-bold">{calculateMarkup().toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">Break-even</span>
            </div>
            <div className="text-xl font-bold">₹{calculateBreakEven().toFixed(0)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Profit Calculator
          </CardTitle>
          <CardDescription>Calculate true profit margin after all costs</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="costs">Cost Breakdown</TabsTrigger>
              <TabsTrigger value="fees">Fees & Taxes</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Selling Price (₹)</Label>
                  <Input
                    type="number"
                    value={sellingPrice || ""}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cost Price (₹)</Label>
                  <Input
                    type="number"
                    value={costPrice || ""}
                    onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-4">
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3">Per Unit Analysis</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Revenue:</span>
                        <span>₹{sellingPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cost:</span>
                        <span>₹{getEffectiveCost().toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fees:</span>
                        <span>₹{(calculatePlatformFee() + calculatePaymentFee()).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-bold">
                        <span>Net Profit:</span>
                        <span className={calculateNetProfit() >= 0 ? 'text-green-500' : 'text-red-500'}>
                          ₹{calculateNetProfit().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3">Total ({quantity} units)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Revenue:</span>
                        <span>₹{(sellingPrice * quantity).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Cost:</span>
                        <span>₹{(getEffectiveCost() * quantity).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-bold">
                        <span>Total Profit:</span>
                        <span className={calculateNetProfit() >= 0 ? 'text-green-500' : 'text-red-500'}>
                          ₹{(calculateNetProfit() * quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="costs" className="space-y-4 pt-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Raw Material (₹)</Label>
                  <Input
                    type="number"
                    value={rawMaterial || ""}
                    onChange={(e) => setRawMaterial(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Labor (₹)</Label>
                  <Input
                    type="number"
                    value={labor || ""}
                    onChange={(e) => setLabor(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Overhead (₹)</Label>
                  <Input
                    type="number"
                    value={overhead || ""}
                    onChange={(e) => setOverhead(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Packaging (₹)</Label>
                  <Input
                    type="number"
                    value={packaging || ""}
                    onChange={(e) => setPackaging(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shipping (₹)</Label>
                  <Input
                    type="number"
                    value={shipping || ""}
                    onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Marketing (₹)</Label>
                  <Input
                    type="number"
                    value={marketing || ""}
                    onChange={(e) => setMarketing(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Other Costs (₹)</Label>
                <Input
                  type="number"
                  value={otherCosts || ""}
                  onChange={(e) => setOtherCosts(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex justify-between font-semibold">
                  <span>Total Cost per Unit:</span>
                  <span>₹{calculateTotalCost().toFixed(2)}</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fees" className="space-y-4 pt-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>GST Rate (%)</Label>
                  <Input
                    type="number"
                    value={gstRate}
                    onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Platform Fee (%)</Label>
                  <Input
                    type="number"
                    value={platformFee || ""}
                    onChange={(e) => setPlatformFee(parseFloat(e.target.value) || 0)}
                    placeholder="e.g., Amazon 15%"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Gateway (%)</Label>
                  <Input
                    type="number"
                    value={paymentGatewayFee}
                    onChange={(e) => setPaymentGatewayFee(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Target Profit Margin (%)</Label>
                <Input
                  type="number"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(parseFloat(e.target.value) || 0)}
                />
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Recommended Selling Price</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    To achieve {targetMargin}% profit margin after all fees:
                  </p>
                  <div className="text-3xl font-bold text-primary">
                    ₹{calculateSuggestedPrice().toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Button onClick={exportReport} className="w-full mt-6" variant="outline">
            <Download className="h-4 w-4 mr-2" /> Export Profit Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
