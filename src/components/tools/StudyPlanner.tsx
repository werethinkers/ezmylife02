import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, Calendar, Clock, BookOpen, Target, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StudySession {
  id: number;
  subject: string;
  topic: string;
  duration: number;
  day: string;
  time: string;
  completed: boolean;
}

interface Goal {
  id: number;
  text: string;
  completed: boolean;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const StudyPlanner = () => {
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [goals, setGoals] = useState<Goal[]>([
    { id: 1, text: "", completed: false }
  ]);
  
  // New session form
  const [newSubject, setNewSubject] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [newDuration, setNewDuration] = useState(60);
  const [newDay, setNewDay] = useState("Monday");
  const [newTime, setNewTime] = useState("09:00");

  const addSession = () => {
    if (!newSubject) {
      toast.error("Please enter a subject");
      return;
    }
    setSessions([...sessions, {
      id: Date.now(),
      subject: newSubject,
      topic: newTopic,
      duration: newDuration,
      day: newDay,
      time: newTime,
      completed: false
    }]);
    setNewSubject("");
    setNewTopic("");
    toast.success("Study session added!");
  };

  const removeSession = (id: number) => {
    setSessions(sessions.filter(s => s.id !== id));
  };

  const toggleSession = (id: number) => {
    setSessions(sessions.map(s => 
      s.id === id ? { ...s, completed: !s.completed } : s
    ));
  };

  const addGoal = () => setGoals([...goals, { id: Date.now(), text: "", completed: false }]);
  
  const removeGoal = (id: number) => {
    if (goals.length > 1) {
      setGoals(goals.filter(g => g.id !== id));
    }
  };

  const updateGoal = (id: number, text: string) => {
    setGoals(goals.map(g => g.id === id ? { ...g, text } : g));
  };

  const toggleGoal = (id: number) => {
    setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const getSessionsByDay = (day: string) => 
    sessions.filter(s => s.day === day).sort((a, b) => a.time.localeCompare(b.time));

  const getTotalHours = () => sessions.reduce((sum, s) => sum + s.duration, 0) / 60;
  const getCompletedHours = () => sessions.filter(s => s.completed).reduce((sum, s) => sum + s.duration, 0) / 60;
  const getProgress = () => sessions.length > 0 ? (sessions.filter(s => s.completed).length / sessions.length) * 100 : 0;

  const getDaysUntilExam = () => {
    if (!examDate) return null;
    const diff = new Date(examDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const exportPlan = () => {
    const planData = {
      exam: examName,
      examDate,
      goals: goals.filter(g => g.text),
      sessions: sessions.map(s => ({
        day: s.day,
        time: s.time,
        subject: s.subject,
        topic: s.topic,
        duration: `${s.duration} min`
      }))
    };

    const blob = new Blob([JSON.stringify(planData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${examName || "study"}_plan.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Study plan exported!");
  };

  const daysUntilExam = getDaysUntilExam();

  return (
    <div className="px-4 py-6 md:py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle>Study Planner</CardTitle>
                <CardDescription>Plan your study sessions and track progress</CardDescription>
              </div>
              <Button variant="outline" onClick={exportPlan} className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Exam / Goal Name</Label>
                <Input
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="e.g., Final Exams 2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Target Date</Label>
                <Input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />
              </div>
              {daysUntilExam !== null && (
                <div className="flex items-center justify-center">
                  <Badge variant={daysUntilExam < 7 ? "destructive" : "secondary"} className="text-lg px-4 py-2">
                    {daysUntilExam > 0 ? `${daysUntilExam} days left` : daysUntilExam === 0 ? "Today!" : "Passed"}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-6 w-6 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{getTotalHours().toFixed(1)}h</div>
              <p className="text-sm text-muted-foreground">Total Planned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-6 w-6 mx-auto text-green-500 mb-2" />
              <div className="text-2xl font-bold text-green-500">{getCompletedHours().toFixed(1)}h</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="h-6 w-6 mx-auto text-blue-500 mb-2" />
              <div className="text-2xl font-bold text-blue-500">{sessions.length}</div>
              <p className="text-sm text-muted-foreground">Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-2">
                <div className="text-2xl font-bold">{getProgress().toFixed(0)}%</div>
                <p className="text-sm text-muted-foreground">Progress</p>
              </div>
              <Progress value={getProgress()} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Study Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {goals.map((goal) => (
              <div key={goal.id} className="flex items-center gap-3">
                <Checkbox
                  checked={goal.completed}
                  onCheckedChange={() => toggleGoal(goal.id)}
                />
                <Input
                  value={goal.text}
                  onChange={(e) => updateGoal(goal.id, e.target.value)}
                  placeholder="Enter a study goal..."
                  className={`flex-1 ${goal.completed ? "line-through text-muted-foreground" : ""}`}
                />
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => removeGoal(goal.id)}
                  disabled={goals.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addGoal} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Goal
            </Button>
          </CardContent>
        </Card>

        {/* Add Session */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Study Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Subject *</Label>
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Math"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Topic</Label>
                <Input
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Calculus"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Day</Label>
                <Select value={newDay} onValueChange={setNewDay}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map(day => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Time</Label>
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duration (min)</Label>
                <Input
                  type="number"
                  value={newDuration}
                  onChange={(e) => setNewDuration(parseInt(e.target.value) || 60)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addSession} className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {DAYS.map(day => {
                const daySessions = getSessionsByDay(day);
                return (
                  <div key={day} className="space-y-2">
                    <h4 className="font-medium text-sm text-center py-2 bg-muted rounded-lg">
                      {day.slice(0, 3)}
                    </h4>
                    <div className="space-y-2 min-h-[100px]">
                      {daySessions.map(session => (
                        <Card 
                          key={session.id} 
                          className={`cursor-pointer transition-all ${session.completed ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : ''}`}
                          onClick={() => toggleSession(session.id)}
                        >
                          <CardContent className="p-2 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium truncate">{session.subject}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSession(session.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            {session.topic && (
                              <p className="text-xs text-muted-foreground truncate">{session.topic}</p>
                            )}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {session.time} • {session.duration}m
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {daySessions.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">No sessions</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
