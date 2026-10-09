import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Calculator, TrendingUp, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Subject {
  id: number;
  name: string;
  marks: number;
  maxMarks: number;
  credits: number;
}

export const GradeCalculator = () => {
  const [mode, setMode] = useState<"percentage" | "cgpa">("percentage");
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: 1, name: "", marks: 0, maxMarks: 100, credits: 1 }
  ]);

  const addSubject = () => {
    setSubjects([...subjects, { 
      id: Date.now(), 
      name: "", 
      marks: 0, 
      maxMarks: 100, 
      credits: 1 
    }]);
  };

  const removeSubject = (id: number) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter(s => s.id !== id));
    }
  };

  const updateSubject = (id: number, field: keyof Subject, value: string | number) => {
    setSubjects(subjects.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const getGrade = (percentage: number): string => {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B+";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C";
    if (percentage >= 40) return "D";
    return "F";
  };

  const getGradePoint = (percentage: number): number => {
    if (percentage >= 90) return 10;
    if (percentage >= 80) return 9;
    if (percentage >= 70) return 8;
    if (percentage >= 60) return 7;
    if (percentage >= 50) return 6;
    if (percentage >= 40) return 5;
    return 0;
  };

  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case "A+": return "text-green-600 bg-green-100 dark:bg-green-900/30";
      case "A": return "text-green-500 bg-green-50 dark:bg-green-900/20";
      case "B+": return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
      case "B": return "text-blue-500 bg-blue-50 dark:bg-blue-900/20";
      case "C": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
      case "D": return "text-orange-600 bg-orange-100 dark:bg-orange-900/30";
      default: return "text-red-600 bg-red-100 dark:bg-red-900/30";
    }
  };

  const calculatePercentage = (marks: number, maxMarks: number): number => {
    return maxMarks > 0 ? (marks / maxMarks) * 100 : 0;
  };

  const getTotalMarks = () => subjects.reduce((sum, s) => sum + s.marks, 0);
  const getTotalMaxMarks = () => subjects.reduce((sum, s) => sum + s.maxMarks, 0);
  const getOverallPercentage = () => {
    const total = getTotalMaxMarks();
    return total > 0 ? (getTotalMarks() / total) * 100 : 0;
  };

  const calculateCGPA = (): number => {
    const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
    if (totalCredits === 0) return 0;
    
    const weightedSum = subjects.reduce((sum, s) => {
      const percentage = calculatePercentage(s.marks, s.maxMarks);
      const gradePoint = getGradePoint(percentage);
      return sum + (gradePoint * s.credits);
    }, 0);
    
    return weightedSum / totalCredits;
  };

  const overallPercentage = getOverallPercentage();
  const overallGrade = getGrade(overallPercentage);
  const cgpa = calculateCGPA();

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calculator className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Grade Calculator</CardTitle>
                  <CardDescription>Calculate your grades, percentage, and CGPA</CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={mode === "percentage" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("percentage")}
                >
                  Percentage
                </Button>
                <Button 
                  variant={mode === "cgpa" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("cgpa")}
                >
                  CGPA
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Results Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-sand/70">
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-primary mb-2" />
                <div className="text-3xl font-bold text-primary">
                  {overallPercentage.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">Overall Percentage</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className={getGradeColor(overallGrade)}>
            <CardContent className="pt-6">
              <div className="text-center">
                <Award className="h-8 w-8 mx-auto mb-2" />
                <div className="text-3xl font-bold">
                  {overallGrade}
                </div>
                <p className="text-sm opacity-70">Overall Grade</p>
              </div>
            </CardContent>
          </Card>

          {mode === "cgpa" && (
            <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/5">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Calculator className="h-8 w-8 mx-auto text-violet-500 mb-2" />
                  <div className="text-3xl font-bold text-violet-500">
                    {cgpa.toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground">CGPA (10 Scale)</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Subjects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subjects / Courses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjects.map((subject, idx) => {
              const percentage = calculatePercentage(subject.marks, subject.maxMarks);
              const grade = getGrade(percentage);
              
              return (
                <Card key={subject.id} className="border-border/50">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex-1 min-w-[150px]">
                        <Label className="text-xs text-muted-foreground">Subject Name</Label>
                        <Input
                          value={subject.name}
                          onChange={(e) => updateSubject(subject.id, "name", e.target.value)}
                          placeholder={`Subject ${idx + 1}`}
                        />
                      </div>
                      <div className="w-24">
                        <Label className="text-xs text-muted-foreground">Marks</Label>
                        <Input
                          type="number"
                          value={subject.marks}
                          onChange={(e) => updateSubject(subject.id, "marks", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="w-24">
                        <Label className="text-xs text-muted-foreground">Max Marks</Label>
                        <Input
                          type="number"
                          value={subject.maxMarks}
                          onChange={(e) => updateSubject(subject.id, "maxMarks", parseFloat(e.target.value) || 100)}
                        />
                      </div>
                      {mode === "cgpa" && (
                        <div className="w-20">
                          <Label className="text-xs text-muted-foreground">Credits</Label>
                          <Input
                            type="number"
                            value={subject.credits}
                            onChange={(e) => updateSubject(subject.id, "credits", parseFloat(e.target.value) || 1)}
                          />
                        </div>
                      )}
                      <div className="w-16 text-center">
                        <Label className="text-xs text-muted-foreground">Grade</Label>
                        <Badge className={`mt-1 ${getGradeColor(grade)}`}>
                          {grade}
                        </Badge>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeSubject(subject.id)}
                        disabled={subjects.length === 1}
                        className="mt-5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{subject.name || `Subject ${idx + 1}`}</span>
                        <span>{percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            <Button variant="outline" onClick={addSubject} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Add Subject
            </Button>
          </CardContent>
        </Card>

        {/* Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Subject</th>
                    <th className="text-center py-2">Marks</th>
                    <th className="text-center py-2">%</th>
                    <th className="text-center py-2">Grade</th>
                    {mode === "cgpa" && <th className="text-center py-2">GP</th>}
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject, idx) => {
                    const percentage = calculatePercentage(subject.marks, subject.maxMarks);
                    const grade = getGrade(percentage);
                    const gp = getGradePoint(percentage);
                    
                    return (
                      <tr key={subject.id} className="border-b">
                        <td className="py-2">{subject.name || `Subject ${idx + 1}`}</td>
                        <td className="text-center py-2">{subject.marks}/{subject.maxMarks}</td>
                        <td className="text-center py-2">{percentage.toFixed(1)}%</td>
                        <td className="text-center py-2">
                          <Badge className={getGradeColor(grade)} variant="secondary">{grade}</Badge>
                        </td>
                        {mode === "cgpa" && <td className="text-center py-2">{gp}</td>}
                      </tr>
                    );
                  })}
                  <tr className="font-medium bg-muted/50">
                    <td className="py-2">Total</td>
                    <td className="text-center py-2">{getTotalMarks()}/{getTotalMaxMarks()}</td>
                    <td className="text-center py-2">{overallPercentage.toFixed(1)}%</td>
                    <td className="text-center py-2">
                      <Badge className={getGradeColor(overallGrade)}>{overallGrade}</Badge>
                    </td>
                    {mode === "cgpa" && <td className="text-center py-2">{cgpa.toFixed(2)}</td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
