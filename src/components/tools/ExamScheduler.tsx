import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Calendar, Clock, BookOpen, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Exam {
  id: number;
  subject: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  type: "midterm" | "final" | "quiz" | "test";
  notes: string;
  completed: boolean;
}

interface StudySession {
  id: number;
  examId: number;
  date: string;
  duration: number;
  topics: string;
  completed: boolean;
}

export const ExamScheduler = () => {
  const [exams, setExams] = useState<Exam[]>([
    {
      id: 1,
      subject: "Mathematics",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: "09:00",
      duration: 120,
      location: "Hall A",
      type: "midterm",
      notes: "Chapters 1-5",
      completed: false
    }
  ]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [newExam, setNewExam] = useState<Partial<Exam>>({ type: "test", duration: 60 });
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<"upcoming" | "calendar" | "study">("upcoming");

  const addExam = () => {
    if (!newExam.subject || !newExam.date || !newExam.time) {
      toast.error("Please fill in subject, date, and time");
      return;
    }

    const exam: Exam = {
      id: Date.now(),
      subject: newExam.subject,
      date: newExam.date,
      time: newExam.time,
      duration: newExam.duration || 60,
      location: newExam.location || "",
      type: newExam.type || "test",
      notes: newExam.notes || "",
      completed: false
    };

    setExams([...exams, exam]);
    generateStudySessions(exam);
    setNewExam({ type: "test", duration: 60 });
    setShowForm(false);
    toast.success("Exam added with study schedule!");
  };

  const generateStudySessions = (exam: Exam) => {
    const examDate = new Date(exam.date);
    const today = new Date();
    const daysUntil = Math.floor((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 0) return;

    const sessionsToCreate = Math.min(daysUntil, 5);
    const newSessions: StudySession[] = [];

    for (let i = 1; i <= sessionsToCreate; i++) {
      const sessionDate = new Date(today);
      sessionDate.setDate(today.getDate() + Math.floor((daysUntil / sessionsToCreate) * i) - 1);
      
      newSessions.push({
        id: Date.now() + i,
        examId: exam.id,
        date: sessionDate.toISOString().split('T')[0],
        duration: 60,
        topics: `Study session ${i} for ${exam.subject}`,
        completed: false
      });
    }

    setStudySessions(prev => [...prev, ...newSessions]);
  };

  const deleteExam = (id: number) => {
    setExams(exams.filter(e => e.id !== id));
    setStudySessions(studySessions.filter(s => s.examId !== id));
    toast.success("Exam and related study sessions deleted");
  };

  const toggleExamComplete = (id: number) => {
    setExams(exams.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
  };

  const toggleSessionComplete = (id: number) => {
    setStudySessions(studySessions.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const getDaysUntil = (date: string) => {
    const examDate = new Date(date);
    const today = new Date();
    return Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "final": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "midterm": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "quiz": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-green-500/10 text-green-500 border-green-500/20";
    }
  };

  const upcomingExams = exams
    .filter(e => !e.completed && getDaysUntil(e.date) >= 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcomingSessions = studySessions
    .filter(s => !s.completed && getDaysUntil(s.date) >= 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Exam Scheduler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-muted/30">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{exams.length}</p>
                <p className="text-xs text-muted-foreground">Total Exams</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/10 border-amber-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-amber-500">{upcomingExams.length}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-500">{studySessions.length}</p>
                <p className="text-xs text-muted-foreground">Study Sessions</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-500">
                  {exams.filter(e => e.completed).length}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <Tabs value={view} onValueChange={(v: any) => setView(v)}>
              <TabsList>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="study">Study Plan</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Exam
            </Button>
          </div>

          {/* Add Exam Form */}
          {showForm && (
            <Card className="bg-muted/20">
              <CardContent className="p-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subject *</Label>
                    <Input
                      value={newExam.subject || ""}
                      onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select 
                      value={newExam.type} 
                      onValueChange={(v: any) => setNewExam({ ...newExam, type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="test">Test</SelectItem>
                        <SelectItem value="midterm">Midterm</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={newExam.date || ""}
                      onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time *</Label>
                    <Input
                      type="time"
                      value={newExam.time || ""}
                      onChange={(e) => setNewExam({ ...newExam, time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={newExam.duration || 60}
                      onChange={(e) => setNewExam({ ...newExam, duration: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={newExam.location || ""}
                      onChange={(e) => setNewExam({ ...newExam, location: e.target.value })}
                      placeholder="e.g., Room 101"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes / Topics</Label>
                  <Input
                    value={newExam.notes || ""}
                    onChange={(e) => setNewExam({ ...newExam, notes: e.target.value })}
                    placeholder="Chapters to cover, important topics..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addExam}>Add Exam</Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Exams */}
          {view === "upcoming" && (
            <div className="space-y-3">
              {upcomingExams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No upcoming exams. Add your first exam!
                </div>
              ) : (
                upcomingExams.map((exam) => {
                  const daysUntil = getDaysUntil(exam.date);
                  return (
                    <Card key={exam.id} className={exam.completed ? "opacity-60" : ""}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-primary" />
                              <h3 className="font-medium">{exam.subject}</h3>
                              <Badge variant="outline" className={getTypeColor(exam.type)}>
                                {exam.type}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(exam.date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {exam.time} ({exam.duration} min)
                              </span>
                              {exam.location && <span>📍 {exam.location}</span>}
                            </div>
                            {exam.notes && (
                              <p className="text-sm text-muted-foreground">📝 {exam.notes}</p>
                            )}
                            <div className={`text-sm font-medium ${daysUntil <= 3 ? "text-red-500" : daysUntil <= 7 ? "text-amber-500" : "text-green-500"}`}>
                              {daysUntil === 0 ? (
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="h-4 w-4" /> Today!
                                </span>
                              ) : (
                                `${daysUntil} days until exam`
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleExamComplete(exam.id)}
                            >
                              {exam.completed ? "Undo" : "Complete"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteExam(exam.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {/* Study Plan */}
          {view === "study" && (
            <div className="space-y-3">
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Add exams to generate study sessions automatically!
                </div>
              ) : (
                upcomingSessions.map((session) => {
                  const exam = exams.find(e => e.id === session.examId);
                  const daysUntil = getDaysUntil(session.date);
                  return (
                    <Card key={session.id} className={session.completed ? "opacity-60" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Button
                              variant={session.completed ? "default" : "outline"}
                              size="icon"
                              className="shrink-0 h-8 w-8"
                              onClick={() => toggleSessionComplete(session.id)}
                            >
                              <CheckCircle className={`h-4 w-4 ${session.completed ? "" : "text-muted-foreground"}`} />
                            </Button>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${session.completed ? "line-through" : ""}`}>
                                  {session.topics}
                                </span>
                                {exam && (
                                  <Badge variant="secondary" className="text-xs">
                                    {exam.subject}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                {new Date(session.date).toLocaleDateString()}
                                {daysUntil === 0 && " (Today)"}
                                <span>• {session.duration} min</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
