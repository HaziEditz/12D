import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Paywall } from "@/components/paywall";
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  PlayCircle,
  ChevronRight,
  Filter,
  Lock,
  Sparkles
} from "lucide-react";
import type { Lesson, LessonProgress } from "@shared/schema";
import { useAuth } from "@/lib/auth-context";
import { useLocation, Link } from "wouter";
import { isTrialUser } from "@/lib/subscription";

export default function LessonsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: lessons, isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons"],
  });

  const { data: progress } = useQuery<LessonProgress[]>({
    queryKey: ["/api/lessons/progress"],
    enabled: !!user,
  });

  const completedLessonIds = new Set(
    progress?.filter(p => p.completed).map(p => p.lessonId) ?? []
  );

  const totalLessons = lessons?.length ?? 0;
  const completedCount = completedLessonIds.size;
  const completionPercentage = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner": return "bg-success/10 text-success";
      case "intermediate": return "bg-chart-4/10 text-chart-4";
      case "advanced": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const isDemoUser = isTrialUser(user);
  
  const isLessonLocked = (lesson: Lesson) => {
    if (!isDemoUser) return false;
    const difficulty = lesson.difficulty.toLowerCase();
    return difficulty === "intermediate" || difficulty === "advanced";
  };

  const availableLessons = lessons?.filter(l => !isLessonLocked(l)) ?? [];
  const lockedLessons = lessons?.filter(l => isLessonLocked(l)) ?? [];
  
  const nextLesson = availableLessons.find(l => !completedLessonIds.has(l.id));

  if (lessonsLoading) {
    return (
      <Paywall featureName="Lessons">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Paywall>
    );
  }

  return (
    <Paywall featureName="Lessons">
      <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Lessons</h1>
          <p className="text-muted-foreground">
            Master trading through our comprehensive curriculum
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Your Progress</h3>
                <p className="text-sm text-muted-foreground">
                  {completedCount} of {totalLessons} lessons completed
                </p>
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <Progress value={completionPercentage} className="h-3" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{Math.round(completionPercentage)}%</p>
              <p className="text-sm text-muted-foreground">Complete</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isDemoUser && (
        <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
          <Lock className="h-4 w-4 text-amber-500" />
          <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
            <span>
              Demo accounts can only access beginner lessons. 
              <span className="font-medium"> Upgrade to unlock all {totalLessons} lessons!</span>
            </span>
            <Link href="/pricing">
              <Button size="sm" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Upgrade Now
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {nextLesson && (
        <Card className="mb-8 border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                  <PlayCircle className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-primary font-medium mb-1">Continue Learning</p>
                  <h3 className="font-semibold text-lg">{nextLesson.title}</h3>
                </div>
              </div>
              <Button 
                className="gap-2" 
                data-testid="button-continue-lesson"
                onClick={() => navigate(`/lessons/${nextLesson.id}`)}
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons?.map((lesson) => {
          const isCompleted = completedLessonIds.has(lesson.id);
          const isLocked = isLessonLocked(lesson);
          return (
            <Card 
              key={lesson.id} 
              className={`${isCompleted ? "opacity-75" : ""} ${isLocked ? "opacity-60" : ""}`}
              data-testid={`card-lesson-${lesson.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant="secondary" 
                        className={`capitalize ${getDifficultyColor(lesson.difficulty)}`}
                      >
                        {lesson.difficulty}
                      </Badge>
                      {isLocked && (
                        <Lock className="h-4 w-4 text-amber-500" />
                      )}
                      {isCompleted && !isLocked && (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      )}
                    </div>
                    <CardTitle className="text-lg">{lesson.title}</CardTitle>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {lesson.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {lesson.duration} min
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {lesson.category}
                    </Badge>
                  </div>
                  {isLocked ? (
                    <Link href="/pricing">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-1"
                        data-testid={`button-unlock-lesson-${lesson.id}`}
                      >
                        <Lock className="h-3 w-3" />
                        Unlock
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      variant={isCompleted ? "outline" : "default"} 
                      size="sm"
                      data-testid={`button-start-lesson-${lesson.id}`}
                      onClick={() => navigate(`/lessons/${lesson.id}`)}
                    >
                      {isCompleted ? "Review" : "Start"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(!lessons || lessons.length === 0) && (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No lessons yet</h3>
            <p className="text-muted-foreground">
              Lessons will appear here once they are created by an admin.
            </p>
          </CardContent>
        </Card>
      )}
      </div>
    </Paywall>
  );
}
