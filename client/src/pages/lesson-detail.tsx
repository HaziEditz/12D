import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Paywall } from "@/components/paywall";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  BookOpen,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  AlertCircle,
  XCircle,
  RefreshCw
} from "lucide-react";
import type { Lesson, LessonProgress, Quiz, QuizAttempt } from "@shared/schema";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { playLessonCompleteSound } from "@/lib/sounds";

function QuizSection({ lessonId }: { lessonId: string }) {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const { data: quizData, isLoading } = useQuery<{ quiz: Quiz; bestAttempt: QuizAttempt | null }>({
    queryKey: ["/api/lessons", lessonId, "quiz"],
  });

  const submitAttemptMutation = useMutation({
    mutationFn: async (data: { score: number; total: number }) => {
      return apiRequest("POST", `/api/lessons/${lessonId}/quiz/attempt`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", lessonId, "quiz"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/achievements"] });
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!quizData?.quiz) return null;

  const { quiz, bestAttempt } = quizData;
  const questions = (quiz.questions as any[]) || [];
  if (questions.length === 0) return null;

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Calculate score and show results
      let score = 0;
      selectedAnswers.forEach((answer, index) => {
        if (answer === questions[index].correctIndex) {
          score++;
        }
      });
      setShowResults(true);
      submitAttemptMutation.mutate({ score, total: questions.length });
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setQuizStarted(true);
  };

  if (!quizStarted && !showResults) {
    return (
      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <CardTitle>Lesson Quiz</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {bestAttempt ? (
            <div className="mb-4 p-4 bg-background rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Your Best Score</p>
              <p className="text-2xl font-bold text-primary">
                {bestAttempt.score} / {bestAttempt.total}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({Math.round((bestAttempt.score / bestAttempt.total) * 100)}%)
                </span>
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground mb-4">
              Test your knowledge on this lesson. Complete the quiz to earn extra XP!
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={() => setQuizStarted(true)} className="w-full sm:w-auto" data-testid="button-start-quiz">
            {bestAttempt ? "Retake Quiz" : "Start Quiz"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (showResults) {
    const score = selectedAnswers.reduce((acc, ans, idx) => acc + (ans === questions[idx].correctIndex ? 1 : 0), 0);
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <Card className="mb-8 overflow-hidden">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle className="text-center">Quiz Results</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-primary/10 mb-4">
              <span className="text-3xl font-bold text-primary">{percentage}%</span>
            </div>
            <h3 className="text-2xl font-bold">
              {score} / {questions.length} Correct
            </h3>
            <p className="text-muted-foreground">
              {percentage >= 80 ? "Excellent work! You've mastered this lesson." : 
               percentage >= 50 ? "Good effort! Review the content to improve your score." : 
               "Keep studying! Try the lesson again to get a better score."}
            </p>
          </div>

          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={idx} className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-start gap-3 mb-3">
                  {selectedAnswers[idx] === q.correctIndex ? (
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  )}
                  <p className="font-medium">{q.question}</p>
                </div>
                <div className="grid gap-2 ml-8">
                  {q.options.map((opt: string, optIdx: number) => (
                    <div 
                      key={optIdx} 
                      className={`text-sm p-2 rounded ${
                        optIdx === q.correctIndex ? "bg-success/20 text-success-foreground font-medium border border-success/30" :
                        optIdx === selectedAnswers[idx] ? "bg-destructive/10 text-destructive-foreground border border-destructive/20" :
                        "text-muted-foreground"
                      }`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <div className="mt-3 ml-8 p-3 bg-primary/5 rounded-md flex gap-2 text-sm border border-primary/10">
                    <AlertCircle className="h-4 w-4 text-primary shrink-0" />
                    <p><span className="font-bold">Explanation:</span> {q.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4 bg-muted/20 border-t py-6">
          <Button variant="outline" onClick={resetQuiz} className="gap-2" data-testid="button-retake-quiz">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
        <div>
          <CardTitle>Lesson Quiz</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
        <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300" 
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <h3 className="text-xl font-semibold mb-6">{currentQuestion.question}</h3>
        <RadioGroup 
          value={selectedAnswers[currentQuestionIndex]?.toString()} 
          onValueChange={(val) => handleAnswerSelect(parseInt(val))}
          className="grid gap-3"
        >
          {currentQuestion.options.map((option: string, idx: number) => (
            <div 
              key={idx} 
              className={`flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer hover:bg-muted/50 ${
                selectedAnswers[currentQuestionIndex] === idx ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => handleAnswerSelect(idx)}
            >
              <RadioGroupItem value={idx.toString()} id={`opt-${idx}`} data-testid={`radio-option-${idx}`} />
              <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer text-base font-medium">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-between border-t mt-6 pt-6">
        <Button 
          variant="outline" 
          onClick={handlePrevious} 
          disabled={currentQuestionIndex === 0}
          className="gap-2"
          data-testid="button-prev-question"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={selectedAnswers[currentQuestionIndex] === undefined}
          className="gap-2"
          data-testid="button-next-question"
        >
          {currentQuestionIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function LessonDetailPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/lessons/:id");
  const { toast } = useToast();
  const lessonId = params?.id;

  const { data: lesson, isLoading: lessonLoading } = useQuery<Lesson>({
    queryKey: ["/api/lessons", lessonId],
    enabled: !!lessonId,
  });

  const { data: allLessons } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons"],
  });

  const { data: progress } = useQuery<LessonProgress[]>({
    queryKey: ["/api/lessons/progress"],
    enabled: !!user,
  });

  const lessonProgress = progress?.find(p => p.lessonId === lessonId);
  const isCompleted = lessonProgress?.completed ?? false;

  const markCompleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/lessons/${lessonId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/achievements"] });
      playLessonCompleteSound();
      toast({
        title: "Lesson Complete!",
        description: "Great job! You've completed this lesson.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark lesson as complete.",
        variant: "destructive",
      });
    },
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner": return "bg-success/10 text-success";
      case "intermediate": return "bg-chart-4/10 text-chart-4";
      case "advanced": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const currentIndex = allLessons?.findIndex(l => l.id === lessonId) ?? -1;
  const prevLesson = currentIndex > 0 ? allLessons?.[currentIndex - 1] : null;
  const nextLesson = currentIndex < (allLessons?.length ?? 0) - 1 ? allLessons?.[currentIndex + 1] : null;

  if (lessonLoading) {
    return (
      <Paywall featureName="Lessons">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Paywall>
    );
  }

  if (!lesson) {
    return (
      <Paywall featureName="Lessons">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Lesson not found</h3>
              <p className="text-muted-foreground mb-4">
                This lesson doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate("/lessons")} data-testid="button-back-to-lessons">
                Back to Lessons
              </Button>
            </CardContent>
          </Card>
        </div>
      </Paywall>
    );
  }

  return (
    <Paywall featureName="Lessons">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          className="mb-6 gap-2" 
          onClick={() => navigate("/lessons")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lessons
        </Button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <Badge 
              variant="secondary" 
              className={getDifficultyColor(lesson.difficulty)}
            >
              {lesson.difficulty}
            </Badge>
            <Badge variant="outline">
              {lesson.category}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {lesson.duration} min
            </div>
            {isCompleted && (
              <div className="flex items-center gap-1 text-success">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Completed</span>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-lesson-title">{lesson.title}</h1>
          <p className="text-muted-foreground text-lg">{lesson.description}</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Lesson Content</CardTitle>
          </CardHeader>
          <CardContent>
            {lesson.content ? (
              <div 
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: lesson.content }}
                data-testid="lesson-content"
              />
            ) : (
              <p className="text-muted-foreground italic">
                No content available for this lesson yet.
              </p>
            )}
          </CardContent>
        </Card>
        
        <QuizSection lessonId={lesson.id} />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-2">
            {prevLesson && (
              <Button 
                variant="outline" 
                onClick={() => navigate(`/lessons/${prevLesson.id}`)}
                className="gap-2"
                data-testid="button-prev-lesson"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {!isCompleted && (
              <Button 
                onClick={() => markCompleteMutation.mutate()}
                disabled={markCompleteMutation.isPending}
                className="gap-2"
                data-testid="button-mark-complete"
              >
                <CheckCircle2 className="h-4 w-4" />
                {markCompleteMutation.isPending ? "Saving..." : "Mark Complete"}
              </Button>
            )}
            {nextLesson && (
              <Button 
                variant={isCompleted ? "default" : "outline"}
                onClick={() => navigate(`/lessons/${nextLesson.id}`)}
                className="gap-2"
                data-testid="button-next-lesson"
              >
                Next Lesson
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Paywall>
  );
}
