import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { RichTextEditor } from "@/components/rich-text-editor";
import { 
  Plus, 
  Pencil, 
  Trash2,
  BookOpen,
  Settings,
  Users,
  BarChart3,
  Clock,
  ChevronRight,
  Save,
  Eye,
  EyeOff,
  Loader2,
  FileText,
  ArrowLeft,
  Lightbulb,
  TrendingUp
} from "lucide-react";
import type { Lesson, TradingTip, MarketInsight } from "@shared/schema";

const lessonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  content: z.string().min(1, "Content is required"),
  category: z.string().min(1, "Category is required"),
  difficulty: z.string().min(1, "Difficulty is required"),
  duration: z.coerce.number().positive("Duration must be positive"),
  order: z.coerce.number().min(0),
  isPublished: z.boolean().default(true),
});

const tipSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category: z.string().min(1, "Category is required"),
  difficulty: z.string().min(1, "Difficulty is required"),
  iconName: z.string().min(1, "Icon is required"),
  isPublished: z.boolean().default(true),
});

const insightSchema = z.object({
  title: z.string().min(1, "Title is required"),
  summary: z.string().min(1, "Summary is required"),
  sentiment: z.string().min(1, "Sentiment is required"),
  sector: z.string().min(1, "Sector is required"),
  isPublished: z.boolean().default(true),
});

type LessonFormData = z.infer<typeof lessonSchema>;
type TipFormData = z.infer<typeof tipSchema>;
type InsightFormData = z.infer<typeof insightSchema>;

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("lessons");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedTip, setSelectedTip] = useState<TradingTip | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<MarketInsight | null>(null);
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [isCreatingTip, setIsCreatingTip] = useState(false);
  const [isCreatingInsight, setIsCreatingInsight] = useState(false);

  const { data: lessons, isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/admin/lessons"],
  });

  const { data: tips, isLoading: tipsLoading } = useQuery<TradingTip[]>({
    queryKey: ["/api/admin/tips"],
  });

  const { data: insights, isLoading: insightsLoading } = useQuery<MarketInsight[]>({
    queryKey: ["/api/admin/insights"],
  });

  const { data: stats } = useQuery<{ users: number; lessons: number; trades: number }>({
    queryKey: ["/api/admin/stats"],
  });

  const lessonForm = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      category: "basics",
      difficulty: "beginner",
      duration: 10,
      order: 0,
      isPublished: true,
    },
  });

  const tipForm = useForm<TipFormData>({
    resolver: zodResolver(tipSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "strategy",
      difficulty: "beginner",
      iconName: "Lightbulb",
      isPublished: true,
    },
  });

  const insightForm = useForm<InsightFormData>({
    resolver: zodResolver(insightSchema),
    defaultValues: {
      title: "",
      summary: "",
      sentiment: "neutral",
      sector: "Technology",
      isPublished: true,
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: (data: LessonFormData) => apiRequest("POST", "/api/admin/lessons", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      toast({ title: "Lesson created successfully" });
      setIsCreatingLesson(false);
      setSelectedLesson(null);
      lessonForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to create lesson", variant: "destructive" });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LessonFormData }) =>
      apiRequest("PATCH", `/api/admin/lessons/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      toast({ title: "Lesson updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update lesson", variant: "destructive" });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/lessons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      toast({ title: "Lesson deleted" });
      setSelectedLesson(null);
      setIsCreatingLesson(false);
    },
    onError: () => {
      toast({ title: "Failed to delete lesson", variant: "destructive" });
    },
  });

  const createTipMutation = useMutation({
    mutationFn: (data: TipFormData) => apiRequest("POST", "/api/admin/tips", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tips"] });
      toast({ title: "Tip created successfully" });
      setIsCreatingTip(false);
      setSelectedTip(null);
      tipForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to create tip", variant: "destructive" });
    },
  });

  const updateTipMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TipFormData }) =>
      apiRequest("PATCH", `/api/admin/tips/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tips"] });
      toast({ title: "Tip updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update tip", variant: "destructive" });
    },
  });

  const deleteTipMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/tips/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tips"] });
      toast({ title: "Tip deleted" });
      setSelectedTip(null);
      setIsCreatingTip(false);
    },
    onError: () => {
      toast({ title: "Failed to delete tip", variant: "destructive" });
    },
  });

  const createInsightMutation = useMutation({
    mutationFn: (data: InsightFormData) => apiRequest("POST", "/api/admin/insights", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/insights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      toast({ title: "Insight created successfully" });
      setIsCreatingInsight(false);
      setSelectedInsight(null);
      insightForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to create insight", variant: "destructive" });
    },
  });

  const updateInsightMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsightFormData }) =>
      apiRequest("PATCH", `/api/admin/insights/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/insights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      toast({ title: "Insight updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update insight", variant: "destructive" });
    },
  });

  const deleteInsightMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/insights/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/insights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      toast({ title: "Insight deleted" });
      setSelectedInsight(null);
      setIsCreatingInsight(false);
    },
    onError: () => {
      toast({ title: "Failed to delete insight", variant: "destructive" });
    },
  });

  const onSubmitLesson = (data: LessonFormData) => {
    if (selectedLesson && !isCreatingLesson) {
      updateLessonMutation.mutate({ id: selectedLesson.id, data });
    } else {
      createLessonMutation.mutate(data);
    }
  };

  const onSubmitTip = (data: TipFormData) => {
    if (selectedTip && !isCreatingTip) {
      updateTipMutation.mutate({ id: selectedTip.id, data });
    } else {
      createTipMutation.mutate(data);
    }
  };

  const onSubmitInsight = (data: InsightFormData) => {
    if (selectedInsight && !isCreatingInsight) {
      updateInsightMutation.mutate({ id: selectedInsight.id, data });
    } else {
      createInsightMutation.mutate(data);
    }
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setIsCreatingLesson(false);
    setSelectedLesson(lesson);
    lessonForm.reset({
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      category: lesson.category,
      difficulty: lesson.difficulty,
      duration: lesson.duration,
      order: lesson.order,
      isPublished: lesson.isPublished ?? true,
    });
  };

  const handleSelectTip = (tip: TradingTip) => {
    setIsCreatingTip(false);
    setSelectedTip(tip);
    tipForm.reset({
      title: tip.title,
      content: tip.content,
      category: tip.category,
      difficulty: tip.difficulty,
      iconName: tip.iconName,
      isPublished: tip.isPublished ?? true,
    });
  };

  const handleSelectInsight = (insight: MarketInsight) => {
    setIsCreatingInsight(false);
    setSelectedInsight(insight);
    insightForm.reset({
      title: insight.title,
      summary: insight.summary,
      sentiment: insight.sentiment,
      sector: insight.sector,
      isPublished: insight.isPublished ?? true,
    });
  };

  const handleCreateNewLesson = () => {
    setSelectedLesson(null);
    setIsCreatingLesson(true);
    lessonForm.reset({
      title: "",
      description: "",
      content: "",
      category: "basics",
      difficulty: "beginner",
      duration: 10,
      order: lessons?.length ?? 0,
      isPublished: true,
    });
  };

  const handleCreateNewTip = () => {
    setSelectedTip(null);
    setIsCreatingTip(true);
    tipForm.reset({
      title: "",
      content: "",
      category: "strategy",
      difficulty: "beginner",
      iconName: "Lightbulb",
      isPublished: true,
    });
  };

  const handleCreateNewInsight = () => {
    setSelectedInsight(null);
    setIsCreatingInsight(true);
    insightForm.reset({
      title: "",
      summary: "",
      sentiment: "neutral",
      sector: "Technology",
      isPublished: true,
    });
  };

  const handleBackLesson = () => {
    setSelectedLesson(null);
    setIsCreatingLesson(false);
    lessonForm.reset();
  };

  const handleBackTip = () => {
    setSelectedTip(null);
    setIsCreatingTip(false);
    tipForm.reset();
  };

  const handleBackInsight = () => {
    setSelectedInsight(null);
    setIsCreatingInsight(false);
    insightForm.reset();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner": return "bg-success/10 text-success";
      case "intermediate": return "bg-chart-4/10 text-chart-4";
      case "advanced": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "strategy": return "bg-primary/10 text-primary";
      case "psychology": return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
      case "risk": return "bg-destructive/10 text-destructive";
      case "market": return "bg-success/10 text-success";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "bullish": return "bg-success/10 text-success";
      case "bearish": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]" data-testid="unauthorized-message">
        <Card>
          <CardContent className="p-6 text-center">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (lessonsLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col p-4 gap-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-10 w-10 rounded-lg mb-3" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center gap-4 p-4 border-b bg-background">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold" data-testid="text-admin-title">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage lessons, tips, and insights</p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium" data-testid="text-stat-users">{stats?.users ?? 0}</span>
            <span className="text-muted-foreground">users</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium" data-testid="text-stat-lessons">{stats?.lessons ?? lessons?.length ?? 0}</span>
            <span className="text-muted-foreground">lessons</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium" data-testid="text-stat-trades">{stats?.trades ?? 0}</span>
            <span className="text-muted-foreground">trades</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b px-4">
          <TabsList className="h-12">
            <TabsTrigger value="lessons" className="gap-2" data-testid="tab-lessons">
              <BookOpen className="h-4 w-4" />
              Lessons
            </TabsTrigger>
            <TabsTrigger value="tips" className="gap-2" data-testid="tab-tips">
              <Lightbulb className="h-4 w-4" />
              Trading Tips
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2" data-testid="tab-insights">
              <TrendingUp className="h-4 w-4" />
              Market Insights
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="lessons" className="flex-1 flex overflow-hidden m-0">
          <div className="w-72 border-r flex flex-col bg-muted/30">
            <div className="p-3 border-b">
              <Button onClick={handleCreateNewLesson} className="w-full gap-2" data-testid="button-create-lesson">
                <Plus className="h-4 w-4" />
                New Lesson
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {(!lessons || lessons.length === 0) ? (
                  <div className="text-center py-8 px-4" data-testid="empty-lessons">
                    <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No lessons yet</p>
                    <p className="text-xs text-muted-foreground">Create your first lesson</p>
                  </div>
                ) : (
                  lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      onClick={() => handleSelectLesson(lesson)}
                      className={`p-3 rounded-lg cursor-pointer hover-elevate ${
                        selectedLesson?.id === lesson.id && !isCreatingLesson ? "bg-accent" : "bg-background"
                      }`}
                      data-testid={`lesson-item-${lesson.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">#{lesson.order + 1}</span>
                            {!lesson.isPublished && (
                              <EyeOff className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          <p className="font-medium truncate" data-testid={`text-lesson-title-${lesson.id}`}>{lesson.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className={`text-xs ${getDifficultyColor(lesson.difficulty)}`}>
                              {lesson.difficulty}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {lesson.duration}m
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-hidden">
            {!selectedLesson && !isCreatingLesson ? (
              <div className="h-full flex items-center justify-center" data-testid="no-lesson-selected">
                <div className="text-center">
                  <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Lesson Editor</h2>
                  <p className="text-muted-foreground mb-4">
                    Select a lesson from the sidebar or create a new one
                  </p>
                  <Button onClick={handleCreateNewLesson} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Lesson
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between gap-4 p-4 border-b">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={handleBackLesson} data-testid="button-back">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-lg font-semibold" data-testid="text-editor-title">
                      {isCreatingLesson ? "Create New Lesson" : "Edit Lesson"}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isCreatingLesson && selectedLesson && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteLessonMutation.mutate(selectedLesson.id)}
                        disabled={deleteLessonMutation.isPending}
                        className="gap-2 text-destructive"
                        data-testid="button-delete-lesson"
                      >
                        {deleteLessonMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={lessonForm.handleSubmit(onSubmitLesson)}
                      disabled={createLessonMutation.isPending || updateLessonMutation.isPending}
                      className="gap-2"
                      data-testid="button-save-lesson"
                    >
                      {(createLessonMutation.isPending || updateLessonMutation.isPending) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isCreatingLesson ? "Create Lesson" : "Save Changes"}
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <Form {...lessonForm}>
                    <form className="p-4 space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={lessonForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lesson Title</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Introduction to Trading Basics" 
                                  data-testid="input-lesson-title" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={lessonForm.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-category">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="basics">Basics</SelectItem>
                                    <SelectItem value="technical">Technical Analysis</SelectItem>
                                    <SelectItem value="fundamental">Fundamental Analysis</SelectItem>
                                    <SelectItem value="strategies">Strategies</SelectItem>
                                    <SelectItem value="psychology">Trading Psychology</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={lessonForm.control}
                            name="difficulty"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Difficulty</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-difficulty">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="beginner">Beginner</SelectItem>
                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <FormField
                        control={lessonForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Short Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="A brief overview of what students will learn in this lesson..." 
                                className="resize-none"
                                data-testid="input-lesson-description"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={lessonForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lesson Content</FormLabel>
                            <FormControl>
                              <RichTextEditor
                                content={field.value}
                                onChange={field.onChange}
                                placeholder="Write your lesson content here. Use the toolbar to format text, add headings, lists, and more..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-4 md:grid-cols-3">
                        <FormField
                          control={lessonForm.control}
                          name="duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration (minutes)</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" data-testid="input-duration" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={lessonForm.control}
                          name="order"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Display Order</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" data-testid="input-order" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={lessonForm.control}
                          name="isPublished"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3 h-[68px]">
                              <div className="flex items-center gap-2">
                                {field.value ? (
                                  <Eye className="h-4 w-4 text-success" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                )}
                                <div>
                                  <FormLabel className="mb-0">Published</FormLabel>
                                </div>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-published"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </form>
                  </Form>
                </ScrollArea>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tips" className="flex-1 flex overflow-hidden m-0">
          <div className="w-72 border-r flex flex-col bg-muted/30">
            <div className="p-3 border-b">
              <Button onClick={handleCreateNewTip} className="w-full gap-2" data-testid="button-create-tip">
                <Plus className="h-4 w-4" />
                New Tip
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {tipsLoading ? (
                  <div className="p-4 space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : (!tips || tips.length === 0) ? (
                  <div className="text-center py-8 px-4" data-testid="empty-tips">
                    <Lightbulb className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No tips yet</p>
                    <p className="text-xs text-muted-foreground">Create your first trading tip</p>
                  </div>
                ) : (
                  tips.map((tip) => (
                    <div
                      key={tip.id}
                      onClick={() => handleSelectTip(tip)}
                      className={`p-3 rounded-lg cursor-pointer hover-elevate ${
                        selectedTip?.id === tip.id && !isCreatingTip ? "bg-accent" : "bg-background"
                      }`}
                      data-testid={`tip-item-${tip.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {!tip.isPublished && (
                              <EyeOff className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          <p className="font-medium truncate" data-testid={`text-tip-title-${tip.id}`}>{tip.title}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className={`text-xs ${getDifficultyColor(tip.difficulty)}`}>
                              {tip.difficulty}
                            </Badge>
                            <Badge variant="secondary" className={`text-xs ${getCategoryColor(tip.category)}`}>
                              {tip.category}
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-hidden">
            {!selectedTip && !isCreatingTip ? (
              <div className="h-full flex items-center justify-center" data-testid="no-tip-selected">
                <div className="text-center">
                  <Lightbulb className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Tip Editor</h2>
                  <p className="text-muted-foreground mb-4">
                    Select a tip from the sidebar or create a new one
                  </p>
                  <Button onClick={handleCreateNewTip} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Tip
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between gap-4 p-4 border-b">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={handleBackTip} data-testid="button-back-tip">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-lg font-semibold" data-testid="text-tip-editor-title">
                      {isCreatingTip ? "Create New Tip" : "Edit Tip"}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isCreatingTip && selectedTip && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTipMutation.mutate(selectedTip.id)}
                        disabled={deleteTipMutation.isPending}
                        className="gap-2 text-destructive"
                        data-testid="button-delete-tip"
                      >
                        {deleteTipMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={tipForm.handleSubmit(onSubmitTip)}
                      disabled={createTipMutation.isPending || updateTipMutation.isPending}
                      className="gap-2"
                      data-testid="button-save-tip"
                    >
                      {(createTipMutation.isPending || updateTipMutation.isPending) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isCreatingTip ? "Create Tip" : "Save Changes"}
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <Form {...tipForm}>
                    <form className="p-4 space-y-6">
                      <FormField
                        control={tipForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tip Title</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Always Use Stop Losses" 
                                data-testid="input-tip-title" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={tipForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tip Content</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Explain the trading tip in detail..." 
                                className="resize-none min-h-[120px]"
                                data-testid="input-tip-content"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={tipForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-tip-category">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="strategy">Strategy</SelectItem>
                                  <SelectItem value="psychology">Psychology</SelectItem>
                                  <SelectItem value="risk">Risk Management</SelectItem>
                                  <SelectItem value="market">Market Analysis</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={tipForm.control}
                          name="difficulty"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Difficulty</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-tip-difficulty">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="beginner">Beginner</SelectItem>
                                  <SelectItem value="intermediate">Intermediate</SelectItem>
                                  <SelectItem value="advanced">Advanced</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={tipForm.control}
                          name="iconName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Icon</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-tip-icon">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Lightbulb">Lightbulb</SelectItem>
                                  <SelectItem value="TrendingUp">Trending Up</SelectItem>
                                  <SelectItem value="TrendingDown">Trending Down</SelectItem>
                                  <SelectItem value="Target">Target</SelectItem>
                                  <SelectItem value="Shield">Shield</SelectItem>
                                  <SelectItem value="AlertTriangle">Alert</SelectItem>
                                  <SelectItem value="BookOpen">Book</SelectItem>
                                  <SelectItem value="Clock">Clock</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={tipForm.control}
                          name="isPublished"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3 h-[68px]">
                              <div className="flex items-center gap-2">
                                {field.value ? (
                                  <Eye className="h-4 w-4 text-success" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                )}
                                <div>
                                  <FormLabel className="mb-0">Published</FormLabel>
                                </div>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-tip-published"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </form>
                  </Form>
                </ScrollArea>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="flex-1 flex overflow-hidden m-0">
          <div className="w-72 border-r flex flex-col bg-muted/30">
            <div className="p-3 border-b">
              <Button onClick={handleCreateNewInsight} className="w-full gap-2" data-testid="button-create-insight">
                <Plus className="h-4 w-4" />
                New Insight
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {insightsLoading ? (
                  <div className="p-4 space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : (!insights || insights.length === 0) ? (
                  <div className="text-center py-8 px-4" data-testid="empty-insights">
                    <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No insights yet</p>
                    <p className="text-xs text-muted-foreground">Create your first market insight</p>
                  </div>
                ) : (
                  insights.map((insight) => (
                    <div
                      key={insight.id}
                      onClick={() => handleSelectInsight(insight)}
                      className={`p-3 rounded-lg cursor-pointer hover-elevate ${
                        selectedInsight?.id === insight.id && !isCreatingInsight ? "bg-accent" : "bg-background"
                      }`}
                      data-testid={`insight-item-${insight.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {!insight.isPublished && (
                              <EyeOff className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          <p className="font-medium truncate" data-testid={`text-insight-title-${insight.id}`}>{insight.title}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className={`text-xs ${getSentimentColor(insight.sentiment)}`}>
                              {insight.sentiment}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {insight.sector}
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-hidden">
            {!selectedInsight && !isCreatingInsight ? (
              <div className="h-full flex items-center justify-center" data-testid="no-insight-selected">
                <div className="text-center">
                  <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Insight Editor</h2>
                  <p className="text-muted-foreground mb-4">
                    Select an insight from the sidebar or create a new one
                  </p>
                  <Button onClick={handleCreateNewInsight} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Insight
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between gap-4 p-4 border-b">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={handleBackInsight} data-testid="button-back-insight">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-lg font-semibold" data-testid="text-insight-editor-title">
                      {isCreatingInsight ? "Create New Insight" : "Edit Insight"}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isCreatingInsight && selectedInsight && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteInsightMutation.mutate(selectedInsight.id)}
                        disabled={deleteInsightMutation.isPending}
                        className="gap-2 text-destructive"
                        data-testid="button-delete-insight"
                      >
                        {deleteInsightMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={insightForm.handleSubmit(onSubmitInsight)}
                      disabled={createInsightMutation.isPending || updateInsightMutation.isPending}
                      className="gap-2"
                      data-testid="button-save-insight"
                    >
                      {(createInsightMutation.isPending || updateInsightMutation.isPending) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isCreatingInsight ? "Create Insight" : "Save Changes"}
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <Form {...insightForm}>
                    <form className="p-4 space-y-6">
                      <FormField
                        control={insightForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Insight Title</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Tech Sector Shows Strength" 
                                data-testid="input-insight-title" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={insightForm.control}
                        name="summary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Summary</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the market insight..." 
                                className="resize-none min-h-[120px]"
                                data-testid="input-insight-summary"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={insightForm.control}
                          name="sentiment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Market Sentiment</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-insight-sentiment">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="bullish">Bullish</SelectItem>
                                  <SelectItem value="bearish">Bearish</SelectItem>
                                  <SelectItem value="neutral">Neutral</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={insightForm.control}
                          name="sector"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sector</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-insight-sector">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Technology">Technology</SelectItem>
                                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                                  <SelectItem value="Finance">Finance</SelectItem>
                                  <SelectItem value="Energy">Energy</SelectItem>
                                  <SelectItem value="Consumer">Consumer</SelectItem>
                                  <SelectItem value="Industrial">Industrial</SelectItem>
                                  <SelectItem value="Macro">Macro</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={insightForm.control}
                        name="isPublished"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex items-center gap-2">
                              {field.value ? (
                                <Eye className="h-4 w-4 text-success" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div>
                                <FormLabel className="mb-0">Published</FormLabel>
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-insight-published"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </ScrollArea>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
