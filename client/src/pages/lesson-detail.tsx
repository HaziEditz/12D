import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Paywall } from "@/components/paywall";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  BookOpen,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import type { Lesson, LessonProgress } from "@shared/schema";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { playLessonCompleteSound } from "@/lib/sounds";

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
