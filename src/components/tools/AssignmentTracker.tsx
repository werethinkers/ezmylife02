import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, CheckCircle2, Clock, AlertTriangle, Calendar, Filter } from "lucide-react";
import { toast } from "sonner";

interface Assignment {
  id: number;
  title: string;
  subject: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed";
  description: string;
}

export const AssignmentTracker = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: 1,
      title: "Math Homework Chapter 5",
      subject: "Mathematics",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: "high",
      status: "pending",
      description: "Complete exercises 1-20"
    }
  ]);
  const [newAssignment, setNewAssignment] = useState<Partial<Assignment>>({
    priority: "medium",
    status: "pending"
  });
  const [filter, setFilter] = useState<"all" | "pending" | "in-progress" | "completed">("all");
  const [showForm, setShowForm] = useState(false);

  const addAssignment = () => {
    if (!newAssignment.title || !newAssignment.subject || !newAssignment.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setAssignments([
      ...assignments,
      {
        id: Date.now(),
        title: newAssignment.title,
        subject: newAssignment.subject,
        dueDate: newAssignment.dueDate,
        priority: newAssignment.priority || "medium",
        status: newAssignment.status || "pending",
        description: newAssignment.description || ""
      }
    ]);
    setNewAssignment({ priority: "medium", status: "pending" });
    setShowForm(false);
    toast.success("Assignment added!");
  };

  const updateStatus = (id: number, status: Assignment["status"]) => {
    setAssignments(assignments.map(a => 
      a.id === id ? { ...a, status } : a
    ));
    toast.success(`Status updated to ${status}`);
  };

  const deleteAssignment = (id: number) => {
    setAssignments(assignments.filter(a => a.id !== id));
    toast.success("Assignment deleted");
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "low": return "bg-green-500/10 text-green-500 border-green-500/20";
      default: return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in-progress": return <Clock className="h-4 w-4 text-amber-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const filteredAssignments = assignments.filter(a => 
    filter === "all" || a.status === filter
  ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const stats = {
    total: assignments.length,
    completed: assignments.filter(a => a.status === "completed").length,
    pending: assignments.filter(a => a.status === "pending").length,
    overdue: assignments.filter(a => getDaysUntilDue(a.dueDate) < 0 && a.status !== "completed").length
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Assignment Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-muted/30">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/10 border-amber-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-500">{stats.overdue}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter & Add */}
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Assignment
            </Button>
          </div>

          {/* Add Form */}
          {showForm && (
            <Card className="bg-muted/20">
              <CardContent className="p-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      value={newAssignment.title || ""}
                      onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                      placeholder="Assignment title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject *</Label>
                    <Input
                      value={newAssignment.subject || ""}
                      onChange={(e) => setNewAssignment({ ...newAssignment, subject: e.target.value })}
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date *</Label>
                    <Input
                      type="date"
                      value={newAssignment.dueDate || ""}
                      onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select 
                      value={newAssignment.priority} 
                      onValueChange={(v: any) => setNewAssignment({ ...newAssignment, priority: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newAssignment.description || ""}
                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                    placeholder="Additional details..."
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addAssignment}>Add Assignment</Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assignments List */}
          <div className="space-y-3">
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No assignments found. Add your first assignment!
              </div>
            ) : (
              filteredAssignments.map((assignment) => {
                const daysUntil = getDaysUntilDue(assignment.dueDate);
                return (
                  <Card key={assignment.id} className={`transition-all ${assignment.status === "completed" ? "opacity-60" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(assignment.status)}
                            <h3 className={`font-medium ${assignment.status === "completed" ? "line-through" : ""}`}>
                              {assignment.title}
                            </h3>
                            <Badge variant="outline" className={getPriorityColor(assignment.priority)}>
                              {assignment.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{assignment.subject}</span>
                            <span>•</span>
                            <span className={daysUntil < 0 && assignment.status !== "completed" ? "text-red-500" : ""}>
                              {daysUntil === 0 ? "Due today" : 
                               daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : 
                               `${daysUntil} days left`}
                            </span>
                          </div>
                          {assignment.description && (
                            <p className="text-sm text-muted-foreground">{assignment.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Select 
                            value={assignment.status} 
                            onValueChange={(v: any) => updateStatus(assignment.id, v)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteAssignment(assignment.id)}
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
        </CardContent>
      </Card>
    </div>
  );
};
