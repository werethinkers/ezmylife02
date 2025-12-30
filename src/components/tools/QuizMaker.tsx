import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Download, CheckCircle, XCircle, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

export const QuizMaker = () => {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, question: "", options: ["", "", "", ""], correctAnswer: 0 }
  ]);
  const [previewMode, setPreviewMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { 
      id: Date.now(), 
      question: "", 
      options: ["", "", "", ""], 
      correctAnswer: 0 
    }]);
  };

  const removeQuestion = (id: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: number, field: string, value: string | number) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const updateOption = (questionId: number, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const selectAnswer = (questionId: number, optionIndex: number) => {
    setSelectedAnswers({ ...selectedAnswers, [questionId]: optionIndex });
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const startQuiz = () => {
    if (!title || questions.some(q => !q.question || q.options.some(o => !o))) {
      toast.error("Please fill in all questions and options");
      return;
    }
    setPreviewMode(true);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const exportQuiz = () => {
    const quizData = {
      title,
      subject,
      questions: questions.map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer
      }))
    };
    
    const blob = new Blob([JSON.stringify(quizData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "quiz"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Quiz exported successfully!");
  };

  if (previewMode) {
    const q = questions[currentQuestion];
    
    if (showResults) {
      const score = calculateScore();
      const percentage = Math.round((score / questions.length) * 100);
      
      return (
        <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-background to-primary/5">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Quiz Results</CardTitle>
              <CardDescription>{title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <div className={`text-6xl font-bold mb-2 ${percentage >= 70 ? 'text-green-500' : percentage >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {percentage}%
                </div>
                <p className="text-lg text-muted-foreground">
                  You scored {score} out of {questions.length}
                </p>
              </div>
              
              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const isCorrect = selectedAnswers[q.id] === q.correctAnswer;
                  return (
                    <div key={q.id} className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200 dark:bg-green-950/20' : 'bg-red-50 border-red-200 dark:bg-red-950/20'}`}>
                      <div className="flex items-start gap-2">
                        {isCorrect ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
                        <div>
                          <p className="font-medium">{idx + 1}. {q.question}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Correct: {q.options[q.correctAnswer]}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex gap-3 justify-center pt-4">
                <Button variant="outline" onClick={() => setPreviewMode(false)}>
                  Edit Quiz
                </Button>
                <Button onClick={() => {
                  setCurrentQuestion(0);
                  setSelectedAnswers({});
                  setShowResults(false);
                }}>
                  Retry Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{subject}</CardDescription>
              </div>
              <Badge variant="secondary">
                {currentQuestion + 1} / {questions.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">{q.question}</h3>
              <div className="space-y-3">
                {q.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectAnswer(q.id, idx)}
                    className={`w-full p-4 text-left rounded-lg border transition-all ${
                      selectedAnswers[q.id] === idx 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                    {option}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              <Button 
                onClick={nextQuestion}
                disabled={selectedAnswers[q.id] === undefined}
              >
                {currentQuestion === questions.length - 1 ? "Finish" : "Next"}
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground"
              onClick={() => setPreviewMode(false)}
            >
              Exit Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Quiz Maker</CardTitle>
                <CardDescription>Create interactive quizzes for students</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Chapter 5 - Photosynthesis"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Biology"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {questions.map((q, idx) => (
          <Card key={q.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Question {idx + 1}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeQuestion(q.id)}
                  disabled={questions.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Question *</Label>
                <Textarea
                  value={q.question}
                  onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
                  placeholder="Enter your question here..."
                />
              </div>
              
              <div className="space-y-3">
                <Label>Options (select correct answer)</Label>
                {q.options.map((option, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuestion(q.id, "correctAnswer", optIdx)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all ${
                        q.correctAnswer === optIdx 
                          ? 'border-green-500 bg-green-500 text-white' 
                          : 'border-border hover:border-green-300'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </button>
                    <Input
                      value={option}
                      onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" onClick={addQuestion} className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Add Question
        </Button>

        <div className="flex flex-wrap gap-3 justify-end">
          <Button variant="outline" onClick={exportQuiz} className="gap-2">
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
          <Button onClick={startQuiz} className="gap-2">
            Preview Quiz
          </Button>
        </div>
      </div>
    </div>
  );
};
