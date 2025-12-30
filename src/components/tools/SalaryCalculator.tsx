import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calculator, Download, IndianRupee, Percent, MinusCircle, PlusCircle } from "lucide-react";

export const SalaryCalculator = () => {
  const [basicSalary, setBasicSalary] = useState<number>(0);
  const [hra, setHra] = useState<number>(0);
  const [specialAllowance, setSpecialAllowance] = useState<number>(0);
  const [otherAllowances, setOtherAllowances] = useState<number>(0);
  const [overtimeHours, setOvertimeHours] = useState<number>(0);
  const [overtimeRate, setOvertimeRate] = useState<number>(0);
  const [bonus, setBonus] = useState<number>(0);
  
  // Deductions
  const [pf, setPf] = useState<number>(0);
  const [esi, setEsi] = useState<number>(0);
  const [professionalTax, setProfessionalTax] = useState<number>(200);
  const [tds, setTds] = useState<number>(0);
  const [loanDeduction, setLoanDeduction] = useState<number>(0);
  const [advanceDeduction, setAdvanceDeduction] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);
  
  // Leave
  const [totalWorkingDays, setTotalWorkingDays] = useState<number>(26);
  const [daysWorked, setDaysWorked] = useState<number>(26);
  const [lop, setLop] = useState<number>(0);

  const [autoCalculatePF, setAutoCalculatePF] = useState(true);
  const [autoCalculateESI, setAutoCalculateESI] = useState(true);

  useEffect(() => {
    if (autoCalculatePF && basicSalary > 0) {
      setPf(Math.round(basicSalary * 0.12));
    }
  }, [basicSalary, autoCalculatePF]);

  useEffect(() => {
    if (autoCalculateESI) {
      const grossForESI = basicSalary + hra + specialAllowance + otherAllowances;
      if (grossForESI <= 21000) {
        setEsi(Math.round(grossForESI * 0.0075));
      } else {
        setEsi(0);
      }
    }
  }, [basicSalary, hra, specialAllowance, otherAllowances, autoCalculateESI]);

  useEffect(() => {
    setLop(totalWorkingDays - daysWorked);
  }, [totalWorkingDays, daysWorked]);

  const calculateGrossEarnings = () => {
    const overtimePay = overtimeHours * overtimeRate;
    return basicSalary + hra + specialAllowance + otherAllowances + overtimePay + bonus;
  };

  const calculateTotalDeductions = () => {
    return pf + esi + professionalTax + tds + loanDeduction + advanceDeduction + otherDeductions;
  };

  const calculateLOPDeduction = () => {
    if (lop <= 0 || totalWorkingDays <= 0) return 0;
    const perDaySalary = calculateGrossEarnings() / totalWorkingDays;
    return Math.round(perDaySalary * lop);
  };

  const calculateNetSalary = () => {
    return calculateGrossEarnings() - calculateTotalDeductions() - calculateLOPDeduction();
  };

  const generatePayslip = () => {
    const payslipHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Payslip - ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #4f46e5; margin: 0; }
    .section { margin-bottom: 25px; }
    .section-title { background: #4f46e5; color: white; padding: 8px 15px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 10px 15px; border-bottom: 1px solid #e5e7eb; }
    .label { color: #6b7280; }
    .amount { text-align: right; font-weight: 500; }
    .total-row { background: #f3f4f6; font-weight: bold; }
    .net-pay { background: #4f46e5; color: white; font-size: 1.2em; }
    .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>SALARY SLIP</h1>
    <p>For the month of ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
  </div>

  <div class="section">
    <div class="section-title">Earnings</div>
    <table>
      <tr><td class="label">Basic Salary</td><td class="amount">₹${basicSalary.toLocaleString('en-IN')}</td></tr>
      <tr><td class="label">HRA</td><td class="amount">₹${hra.toLocaleString('en-IN')}</td></tr>
      <tr><td class="label">Special Allowance</td><td class="amount">₹${specialAllowance.toLocaleString('en-IN')}</td></tr>
      <tr><td class="label">Other Allowances</td><td class="amount">₹${otherAllowances.toLocaleString('en-IN')}</td></tr>
      ${overtimeHours > 0 ? `<tr><td class="label">Overtime (${overtimeHours} hrs)</td><td class="amount">₹${(overtimeHours * overtimeRate).toLocaleString('en-IN')}</td></tr>` : ''}
      ${bonus > 0 ? `<tr><td class="label">Bonus</td><td class="amount">₹${bonus.toLocaleString('en-IN')}</td></tr>` : ''}
      <tr class="total-row"><td>Gross Earnings</td><td class="amount">₹${calculateGrossEarnings().toLocaleString('en-IN')}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Deductions</div>
    <table>
      <tr><td class="label">Provident Fund (PF)</td><td class="amount">₹${pf.toLocaleString('en-IN')}</td></tr>
      ${esi > 0 ? `<tr><td class="label">ESI</td><td class="amount">₹${esi.toLocaleString('en-IN')}</td></tr>` : ''}
      <tr><td class="label">Professional Tax</td><td class="amount">₹${professionalTax.toLocaleString('en-IN')}</td></tr>
      ${tds > 0 ? `<tr><td class="label">TDS</td><td class="amount">₹${tds.toLocaleString('en-IN')}</td></tr>` : ''}
      ${loanDeduction > 0 ? `<tr><td class="label">Loan Deduction</td><td class="amount">₹${loanDeduction.toLocaleString('en-IN')}</td></tr>` : ''}
      ${advanceDeduction > 0 ? `<tr><td class="label">Advance Deduction</td><td class="amount">₹${advanceDeduction.toLocaleString('en-IN')}</td></tr>` : ''}
      ${otherDeductions > 0 ? `<tr><td class="label">Other Deductions</td><td class="amount">₹${otherDeductions.toLocaleString('en-IN')}</td></tr>` : ''}
      ${lop > 0 ? `<tr><td class="label">LOP Deduction (${lop} days)</td><td class="amount">₹${calculateLOPDeduction().toLocaleString('en-IN')}</td></tr>` : ''}
      <tr class="total-row"><td>Total Deductions</td><td class="amount">₹${(calculateTotalDeductions() + calculateLOPDeduction()).toLocaleString('en-IN')}</td></tr>
    </table>
  </div>

  <div class="section">
    <table>
      <tr class="net-pay"><td>Net Salary</td><td class="amount">₹${calculateNetSalary().toLocaleString('en-IN')}</td></tr>
    </table>
  </div>

  <div class="footer">
    <p>This is a computer-generated payslip and does not require a signature.</p>
    <p>Generated on ${new Date().toLocaleDateString('en-IN')}</p>
  </div>
</body>
</html>`;

    const blob = new Blob([payslipHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payslip-${new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Payslip downloaded!");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-500 mb-1">
              <PlusCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Gross Earnings</span>
            </div>
            <div className="text-xl font-bold">₹{calculateGrossEarnings().toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-500 mb-1">
              <MinusCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Deductions</span>
            </div>
            <div className="text-xl font-bold">₹{(calculateTotalDeductions() + calculateLOPDeduction()).toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <Calculator className="h-4 w-4" />
              <span className="text-xs font-medium">Days Worked</span>
            </div>
            <div className="text-xl font-bold">{daysWorked} / {totalWorkingDays}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <IndianRupee className="h-4 w-4" />
              <span className="text-xs font-medium">Net Salary</span>
            </div>
            <div className="text-xl font-bold">₹{calculateNetSalary().toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Earnings */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <PlusCircle className="h-5 w-5" />
              Earnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Basic Salary (₹)</Label>
                <Input
                  type="number"
                  value={basicSalary || ""}
                  onChange={(e) => setBasicSalary(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>HRA (₹)</Label>
                <Input
                  type="number"
                  value={hra || ""}
                  onChange={(e) => setHra(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Special Allowance (₹)</Label>
                <Input
                  type="number"
                  value={specialAllowance || ""}
                  onChange={(e) => setSpecialAllowance(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Other Allowances (₹)</Label>
                <Input
                  type="number"
                  value={otherAllowances || ""}
                  onChange={(e) => setOtherAllowances(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <Label className="text-sm text-muted-foreground mb-2 block">Overtime & Bonus</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">OT Hours</Label>
                  <Input
                    type="number"
                    value={overtimeHours || ""}
                    onChange={(e) => setOvertimeHours(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">OT Rate/hr</Label>
                  <Input
                    type="number"
                    value={overtimeRate || ""}
                    onChange={(e) => setOvertimeRate(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Bonus</Label>
                  <Input
                    type="number"
                    value={bonus || ""}
                    onChange={(e) => setBonus(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deductions */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <MinusCircle className="h-5 w-5" />
              Deductions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  PF (₹) 
                  <span className="text-xs text-muted-foreground">(12% auto)</span>
                </Label>
                <Input
                  type="number"
                  value={pf || ""}
                  onChange={(e) => {
                    setPf(parseFloat(e.target.value) || 0);
                    setAutoCalculatePF(false);
                  }}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  ESI (₹)
                  <span className="text-xs text-muted-foreground">(0.75%)</span>
                </Label>
                <Input
                  type="number"
                  value={esi || ""}
                  onChange={(e) => {
                    setEsi(parseFloat(e.target.value) || 0);
                    setAutoCalculateESI(false);
                  }}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Professional Tax (₹)</Label>
                <Input
                  type="number"
                  value={professionalTax || ""}
                  onChange={(e) => setProfessionalTax(parseFloat(e.target.value) || 0)}
                  placeholder="200"
                />
              </div>
              <div className="space-y-2">
                <Label>TDS (₹)</Label>
                <Input
                  type="number"
                  value={tds || ""}
                  onChange={(e) => setTds(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Loan Deduction (₹)</Label>
                <Input
                  type="number"
                  value={loanDeduction || ""}
                  onChange={(e) => setLoanDeduction(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Advance Deduction (₹)</Label>
                <Input
                  type="number"
                  value={advanceDeduction || ""}
                  onChange={(e) => setAdvanceDeduction(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Other Deductions (₹)</Label>
              <Input
                type="number"
                value={otherDeductions || ""}
                onChange={(e) => setOtherDeductions(parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Working Days */}
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">Attendance & LOP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Total Working Days</Label>
              <Input
                type="number"
                value={totalWorkingDays}
                onChange={(e) => setTotalWorkingDays(parseInt(e.target.value) || 26)}
              />
            </div>
            <div className="space-y-2">
              <Label>Days Worked</Label>
              <Input
                type="number"
                value={daysWorked}
                onChange={(e) => setDaysWorked(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>LOP Days</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={lop}
                  readOnly
                  className="bg-muted"
                />
                {lop > 0 && (
                  <span className="text-sm text-red-500 whitespace-nowrap">
                    -₹{calculateLOPDeduction().toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={generatePayslip} className="w-full" size="lg">
        <Download className="h-5 w-5 mr-2" /> Download Payslip
      </Button>
    </div>
  );
};
