import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Download, Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { useWriteBack } from "@/apps/lib/context";
import { ContextBanner } from "@/apps/shell/ContextBanner";
import { useAppStore } from "@/apps/lib/store";

interface Expense {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  paymentMethod: string;
}

const categories = [
  "Office Supplies",
  "Rent & Utilities",
  "Salaries & Wages",
  "Travel & Transport",
  "Marketing",
  "Inventory/Stock",
  "Equipment",
  "Professional Services",
  "Insurance",
  "Taxes & Fees",
  "Miscellaneous"
];

const paymentMethods = ["Cash", "UPI", "Bank Transfer", "Credit Card", "Debit Card", "Cheque"];

export const ExpenseTracker = () => {
  // Expenses are saved (to your account when signed in) instead of vanishing on refresh.
  const saved = useAppStore<{ expenses: Expense[]; budget: string; savedAt?: number }>("tool-2", { expenses: [], budget: "" });
  const expenses = saved.data.expenses ?? [];
  const setExpenses = (e: Expense[]) => saved.update({ expenses: e });
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const budget = saved.data.budget ?? "";
  const setBudget = (b: string) => saved.update({ budget: b });

  // This month's total flows to the Tax Estimator and Profit Calculator.
  const month = new Date().toISOString().slice(0, 7);
  useWriteBack(expenses, (list) => ({ money: { monthlyExpenses: list.filter((e) => e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0) } }));

  const addExpense = () => {
    if (!date || !description || !category || !amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newExpense: Expense = {
      id: Date.now(),
      date,
      description,
      category,
      amount: parseFloat(amount),
      paymentMethod: paymentMethod || "Cash"
    };

    setExpenses([...expenses, newExpense]);
    setDescription("");
    setAmount("");
    toast.success("Expense added!");
  };

  const removeExpense = (id: number) => {
    setExpenses(expenses.filter(e => e.id !== id));
    toast.success("Expense removed");
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  };

  const getCategoryTotals = () => {
    const totals: Record<string, number> = {};
    expenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  };

  const getBudgetRemaining = () => {
    if (!budget) return null;
    return parseFloat(budget) - getTotalExpenses();
  };

  const exportToCSV = () => {
    if (expenses.length === 0) {
      toast.error("No expenses to export");
      return;
    }

    const headers = ["Date", "Description", "Category", "Amount (₹)", "Payment Method"];
    const rows = expenses.map(e => [
      e.date,
      e.description,
      e.category,
      e.amount.toFixed(2),
      e.paymentMethod
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Expenses exported to CSV!");
  };

  const budgetRemaining = getBudgetRemaining();

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <ContextBanner show={["client", "money"]} />
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-medium">Total Expenses</span>
            </div>
            <div className="text-2xl font-bold">₹{getTotalExpenses().toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-500 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Entries</span>
            </div>
            <div className="text-2xl font-bold">{expenses.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-500 mb-1">
              <PiggyBank className="h-4 w-4" />
              <span className="text-xs font-medium">Budget</span>
            </div>
            <Input
              type="number"
              placeholder="Set budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="h-8 text-lg font-bold bg-transparent border-none p-0"
            />
          </CardContent>
        </Card>

        {budgetRemaining !== null && (
          <Card className={`bg-gradient-to-br ${budgetRemaining >= 0 ? 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20' : 'from-red-500/10 to-red-600/5 border-red-500/20'}`}>
            <CardContent className="p-4">
              <div className={`flex items-center gap-2 ${budgetRemaining >= 0 ? 'text-emerald-500' : 'text-red-500'} mb-1`}>
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs font-medium">Remaining</span>
              </div>
              <div className="text-2xl font-bold">₹{budgetRemaining.toFixed(2)}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Expense Form */}
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add Expense
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description *</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was the expense for?"
              />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (₹) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Payment</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Cash" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={addExpense} className="mt-4">
            <Plus className="h-4 w-4 mr-2" /> Add Expense
          </Button>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {getCategoryTotals().length > 0 && (
        <Card className="border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getCategoryTotals().map(([cat, total]) => {
                const percentage = (total / getTotalExpenses()) * 100;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{cat}</span>
                      <span className="font-medium">₹{total.toFixed(2)} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense List */}
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Expense Log</CardTitle>
          {expenses.length > 0 && (
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No expenses logged yet</p>
              <p className="text-sm">Start adding your daily expenses above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.slice().reverse().map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{expense.date}</span>
                      <span className="font-medium">{expense.description}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{expense.category}</span>
                      <span className="text-xs text-muted-foreground">{expense.paymentMethod}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg">₹{expense.amount.toFixed(2)}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeExpense(expense.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
