import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, BookOpen, Plus, Trash2, Clock, Target, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Activity {
  id: number;
  title: string;
  duration: number;
  description: string;
  type: "introduction" | "instruction" | "activity" | "assessment" | "closure";
}

export const LessonPlanner = () => {
  const [lessonTitle, setLessonTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [duration, setDuration] = useState(45);
  const [objectives, setObjectives] = useState<string[]>([""]);
  const [materials, setMaterials] = useState("");
  const [activities, setActivities] = useState<Activity[]>([
    { id: 1, title: "", duration: 5, description: "", type: "introduction" }
  ]);
  const [assessment, setAssessment] = useState("");
  const [homework, setHomework] = useState("");

  const addObjective = () => setObjectives([...objectives, ""]);
  const removeObjective = (idx: number) => {
    if (objectives.length > 1) {
      setObjectives(objectives.filter((_, i) => i !== idx));
    }
  };
  const updateObjective = (idx: number, value: string) => {
    const newObjectives = [...objectives];
    newObjectives[idx] = value;
    setObjectives(newObjectives);
  };

  const addActivity = () => {
    setActivities([...activities, { 
      id: Date.now(), 
      title: "", 
      duration: 10, 
      description: "", 
      type: "activity" 
    }]);
  };

  const removeActivity = (id: number) => {
    if (activities.length > 1) {
      setActivities(activities.filter(a => a.id !== id));
    }
  };

  const updateActivity = (id: number, field: keyof Activity, value: string | number) => {
    setActivities(activities.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const getTotalDuration = () => activities.reduce((sum, a) => sum + a.duration, 0);

  const getActivityColor = (type: string) => {
    switch (type) {
      case "introduction": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "instruction": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "activity": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "assessment": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "closure": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const exportLesson = () => {
    if (!lessonTitle || !subject) {
      toast.error("Please fill in lesson title and subject");
      return;
    }

    const lessonHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Lesson Plan - ${lessonTitle}</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #4f46e5; margin: 0 0 10px 0; }
    .meta { display: flex; gap: 20px; flex-wrap: wrap; color: #666; }
    .section { margin-bottom: 30px; }
    .section-title { color: #1f2937; font-size: 18px; font-weight: 600; margin-bottom: 15px; border-left: 4px solid #4f46e5; padding-left: 12px; }
    .objectives { list-style: none; padding: 0; }
    .objectives li { padding: 8px 0; padding-left: 28px; position: relative; }
    .objectives li::before { content: "✓"; position: absolute; left: 0; color: #22c55e; font-weight: bold; }
    .activity { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid; }
    .activity.introduction { border-color: #3b82f6; }
    .activity.instruction { border-color: #8b5cf6; }
    .activity.activity { border-color: #22c55e; }
    .activity.assessment { border-color: #f97316; }
    .activity.closure { border-color: #6b7280; }
    .activity-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .activity-title { font-weight: 600; }
    .activity-duration { color: #666; font-size: 14px; }
    .materials { background: #fef3c7; padding: 15px; border-radius: 8px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${lessonTitle}</h1>
    <div class="meta">
      <span><strong>Subject:</strong> ${subject}</span>
      <span><strong>Grade:</strong> ${grade}</span>
      <span><strong>Duration:</strong> ${duration} minutes</span>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Learning Objectives</h2>
    <ul class="objectives">
      ${objectives.filter(o => o).map(obj => `<li>${obj}</li>`).join('')}
    </ul>
  </div>

  ${materials ? `
  <div class="section">
    <h2 class="section-title">Materials Needed</h2>
    <div class="materials">${materials}</div>
  </div>
  ` : ''}

  <div class="section">
    <h2 class="section-title">Lesson Activities</h2>
    ${activities.map(a => `
    <div class="activity ${a.type}">
      <div class="activity-header">
        <span class="activity-title">${a.title || a.type.charAt(0).toUpperCase() + a.type.slice(1)}</span>
        <span class="activity-duration">${a.duration} min</span>
      </div>
      <p>${a.description}</p>
    </div>
    `).join('')}
  </div>

  ${assessment ? `
  <div class="section">
    <h2 class="section-title">Assessment</h2>
    <p>${assessment}</p>
  </div>
  ` : ''}

  ${homework ? `
  <div class="section">
    <h2 class="section-title">Homework</h2>
    <p>${homework}</p>
  </div>
  ` : ''}

  <div class="footer">
    Generated with EZYOURLIFE Lesson Planner
  </div>
</body>
</html>`;

    const blob = new Blob([lessonHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${lessonTitle.replace(/\s+/g, "_")}_lesson_plan.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Lesson plan exported!");
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Lesson Planner</CardTitle>
                <CardDescription>Create structured lesson plans for your classes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Lesson Title *</Label>
                <Input
                  id="title"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="e.g., Introduction to Fractions"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade Level</Label>
                <Input
                  id="grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g., Class 5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 45)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Learning Objectives
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {objectives.map((obj, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  value={obj}
                  onChange={(e) => updateObjective(idx, e.target.value)}
                  placeholder={`Objective ${idx + 1}: Students will be able to...`}
                  className="flex-1"
                />
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => removeObjective(idx)}
                  disabled={objectives.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addObjective} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Objective
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Activities Timeline
              </CardTitle>
              <Badge variant={getTotalDuration() === duration ? "default" : "destructive"}>
                {getTotalDuration()} / {duration} min
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.map((activity, idx) => (
              <Card key={activity.id} className="border-border/50">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge className={getActivityColor(activity.type)}>
                      {activity.type}
                    </Badge>
                    <Input
                      value={activity.title}
                      onChange={(e) => updateActivity(activity.id, "title", e.target.value)}
                      placeholder="Activity title"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={activity.duration}
                      onChange={(e) => updateActivity(activity.id, "duration", parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeActivity(activity.id)}
                      disabled={activities.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Select 
                      value={activity.type}
                      onValueChange={(v) => updateActivity(activity.id, "type", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="introduction">Introduction</SelectItem>
                        <SelectItem value="instruction">Instruction</SelectItem>
                        <SelectItem value="activity">Activity</SelectItem>
                        <SelectItem value="assessment">Assessment</SelectItem>
                        <SelectItem value="closure">Closure</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={activity.description}
                      onChange={(e) => updateActivity(activity.id, "description", e.target.value)}
                      placeholder="Describe the activity..."
                      className="md:col-span-3"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" onClick={addActivity} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Add Activity
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Materials Needed</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="List required materials, textbooks, worksheets, etc."
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                placeholder="How will you assess student understanding?"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Homework / Extension</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              placeholder="Describe homework or extension activities..."
              rows={2}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={exportLesson} className="gap-2">
            <Download className="h-4 w-4" />
            Export Lesson Plan
          </Button>
        </div>
      </div>
    </div>
  );
};
