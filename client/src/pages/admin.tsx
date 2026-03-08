import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
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
  Trash2,
  BookOpen,
  Settings,
  Users,
  BarChart3,
  Clock,
  Save,
  EyeOff,
  Loader2,
  FileText,
  ArrowLeft,
  Lightbulb,
  TrendingUp,
  Target,
  Tag
} from "lucide-react";
import type { Lesson, TradingTip, MarketInsight, Strategy } from "@shared/schema";

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

const strategySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  content: z.string().min(1, "Content is required"),
  category: z.string().min(1, "Category is required"),
  difficulty: z.string().min(1, "Difficulty is required"),
  isPublished: z.boolean().default(true),
});

type LessonFormData = z.infer<typeof lessonSchema>;
type TipFormData = z.infer<typeof tipSchema>;
type InsightFormData = z.infer<typeof insightSchema>;
type StrategyFormData = z.infer<typeof strategySchema>;

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("lessons");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedTip, setSelectedTip] = useState<TradingTip | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<MarketInsight | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [isCreatingTip, setIsCreatingTip] = useState(false);
  const [isCreatingInsight, setIsCreatingInsight] = useState(false);
  const [isCreatingStrategy, setIsCreatingStrategy] = useState(false);

  const { data: lessons, isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/admin/lessons"],
  });

  const { data: tips, isLoading: tipsLoading } = useQuery<TradingTip[]>({
    queryKey: ["/api/admin/tips"],
  });

  const { data: insights, isLoading: insightsLoading } = useQuery<MarketInsight[]>({
    queryKey: ["/api/admin/insights"],
  });

  const { data: strategies, isLoading: strategiesLoading } = useQuery<Strategy[]>({
    queryKey: ["/api/admin/strategies"],
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

  const strategyForm = useForm<StrategyFormData>({
    resolver: zodResolver(strategySchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      category: "trend",
      difficulty: "beginner",
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

  const createStrategyMutation = useMutation({
    mutationFn: (data: StrategyFormData) => apiRequest("POST", "/api/admin/strategies", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/strategies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
      toast({ title: "Strategy created successfully" });
      setIsCreatingStrategy(false);
      setSelectedStrategy(null);
      strategyForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to create strategy", variant: "destructive" });
    },
  });

  const updateStrategyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StrategyFormData }) =>
      apiRequest("PATCH", `/api/admin/strategies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/strategies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
      toast({ title: "Strategy updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update strategy", variant: "destructive" });
    },
  });

  const deleteStrategyMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/strategies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/strategies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
      toast({ title: "Strategy deleted" });
      setSelectedStrategy(null);
      setIsCreatingStrategy(false);
    },
    onError: () => {
      toast({ title: "Failed to delete strategy", variant: "destructive" });
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

  const onSubmitStrategy = (data: StrategyFormData) => {
    if (selectedStrategy && !isCreatingStrategy) {
      updateStrategyMutation.mutate({ id: selectedStrategy.id, data });
    } else {
      createStrategyMutation.mutate(data);
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

  const handleSelectStrategy = (strategy: Strategy) => {
    setIsCreatingStrategy(false);
    setSelectedStrategy(strategy);
    strategyForm.reset({
      title: strategy.title,
      description: strategy.description,
      content: strategy.content,
      category: strategy.category,
      difficulty: strategy.difficulty,
      isPublished: strategy.isPublished ?? true,
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

  const handleCreateNewStrategy = () => {
    setSelectedStrategy(null);
    setIsCreatingStrategy(true);
    strategyForm.reset({
      title: "",
      description: "",
      content: "",
      category: "trend",
      difficulty: "beginner",
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

  const handleBackStrategy = () => {
    setSelectedStrategy(null);
    setIsCreatingStrategy(false);
    strategyForm.reset();
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
      <div className="flex items-center justify-center h-screen bg-background" data-testid="unauthorized-message">
        <Card>
          <CardContent className="p-12 text-center">
            <Settings className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
            <h2 className="text-2xl font-bold mb-3">Admin Access Required</h2>
            <p className="text-muted-foreground text-lg">You need admin privileges to access the command center.</p>
            <Button asChild className="mt-8">
              <Link href="/">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (lessonsLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-12 gap-8 bg-background">
        <div className="flex items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h2 className="text-xl font-medium">Initializing Admin Tools...</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-6 w-full max-w-6xl">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-8">
                <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      <header className="h-16 border-b flex items-center justify-between px-6 bg-background shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none" data-testid="text-admin-title">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Platform Management Console</p>
          </div>
        </div>

        <div className="flex items-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none">Total Users</p>
              <p className="font-bold text-base" data-testid="text-stat-users">{stats?.users ?? 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none">Lessons</p>
              <p className="font-bold text-base" data-testid="text-stat-lessons">{stats?.lessons ?? lessons?.length ?? 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none">Trades</p>
              <p className="font-bold text-base" data-testid="text-stat-trades">{stats?.trades ?? 0}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="ml-4 rounded-full px-6">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Exit Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r bg-muted/20 flex flex-col shrink-0 z-10">
          <div className="p-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6">Tools & Content</p>
            <nav className="flex flex-col gap-2">
              <Button
                variant={activeTab === "lessons" ? "default" : "ghost"}
                onClick={() => setActiveTab("lessons")}
                className={`w-full justify-start gap-4 h-12 rounded-xl transition-all ${activeTab === "lessons" ? "shadow-lg shadow-primary/20" : ""}`}
                data-testid="tab-lessons"
              >
                <BookOpen className={`h-5 w-5 ${activeTab === "lessons" ? "text-primary-foreground" : "text-primary"}`} />
                <span className="font-semibold">Lessons</span>
              </Button>
              <Button
                variant={activeTab === "tips" ? "default" : "ghost"}
                onClick={() => setActiveTab("tips")}
                className={`w-full justify-start gap-4 h-12 rounded-xl transition-all ${activeTab === "tips" ? "shadow-lg shadow-primary/20" : ""}`}
                data-testid="tab-tips"
              >
                <Lightbulb className={`h-5 w-5 ${activeTab === "tips" ? "text-primary-foreground" : "text-yellow-500"}`} />
                <span className="font-semibold">Trading Tips</span>
              </Button>
              <Button
                variant={activeTab === "insights" ? "default" : "ghost"}
                onClick={() => setActiveTab("insights")}
                className={`w-full justify-start gap-4 h-12 rounded-xl transition-all ${activeTab === "insights" ? "shadow-lg shadow-primary/20" : ""}`}
                data-testid="tab-insights"
              >
                <TrendingUp className={`h-5 w-5 ${activeTab === "insights" ? "text-primary-foreground" : "text-success"}`} />
                <span className="font-semibold">Market Insights</span>
              </Button>
              <Button
                variant={activeTab === "strategies" ? "default" : "ghost"}
                onClick={() => setActiveTab("strategies")}
                className={`w-full justify-start gap-4 h-12 rounded-xl transition-all ${activeTab === "strategies" ? "shadow-lg shadow-primary/20" : ""}`}
                data-testid="tab-strategies"
              >
                <Target className={`h-5 w-5 ${activeTab === "strategies" ? "text-primary-foreground" : "text-destructive"}`} />
                <span className="font-semibold">Strategies</span>
              </Button>
              <Button
                variant={activeTab === "promo-codes" ? "default" : "ghost"}
                onClick={() => setActiveTab("promo-codes")}
                className={`w-full justify-start gap-4 h-12 rounded-xl transition-all ${activeTab === "promo-codes" ? "shadow-lg shadow-primary/20" : ""}`}
                data-testid="tab-promo-codes"
              >
                <Tag className={`h-5 w-5 ${activeTab === "promo-codes" ? "text-primary-foreground" : "text-orange-500"}`} />
                <span className="font-semibold">Promo Codes</span>
              </Button>
            </nav>
          </div>
          <div className="mt-auto p-6 border-t bg-background/50">
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Pro Tip</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Changes are saved instantly to the platform but may take a moment to reflect for active users.</p>
            </div>
          </div>
        </aside>

        <main className="flex-1 relative overflow-hidden bg-background">
          <Tabs value={activeTab} className="h-full w-full">
            <TabsContent value="lessons" className="h-full w-full m-0 p-0 flex flex-col overflow-hidden data-[state=active]:flex">
              <div className="flex h-full w-full overflow-hidden">
                <div className="w-80 border-r flex flex-col bg-muted/5 shrink-0">
                  <div className="p-6 border-b">
                    <Button onClick={handleCreateNewLesson} className="w-full gap-2 rounded-xl h-12" data-testid="button-create-lesson">
                      <Plus className="h-5 w-5" />
                      Add New Lesson
                    </Button>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-3">
                      {(!lessons || lessons.length === 0) ? (
                        <div className="text-center py-16 px-6" data-testid="empty-lessons">
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-10" />
                          <p className="text-sm font-bold text-muted-foreground">Curriculum Empty</p>
                        </div>
                      ) : (
                        lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            onClick={() => handleSelectLesson(lesson)}
                            className={`p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                              selectedLesson?.id === lesson.id && !isCreatingLesson 
                                ? "bg-primary/5 border-primary shadow-sm" 
                                : "bg-card hover:border-primary/50 border-transparent shadow-sm"
                            }`}
                            data-testid={`lesson-item-${lesson.id}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate leading-tight mb-2">{lesson.title}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={`text-[10px] h-4 px-1.5 uppercase tracking-tighter ${getDifficultyColor(lesson.difficulty)}`}>
                                    {lesson.difficulty}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold">
                                    <Clock className="h-3 w-3" />
                                    {lesson.duration}m
                                  </span>
                                </div>
                              </div>
                              {!(lesson.isPublished ?? true) && (
                                <EyeOff className="h-4 w-4 text-muted-foreground shrink-0 opacity-50" />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
                <div className="flex-1 overflow-hidden bg-background">
                  {(selectedLesson || isCreatingLesson) ? (
                    <div className="h-full flex flex-col">
                      <div className="p-8 border-b flex items-center justify-between shrink-0 bg-background/80 backdrop-blur-xl z-10 sticky top-0">
                        <div className="flex items-center gap-6">
                          <Button variant="outline" size="icon" onClick={handleBackLesson} className="rounded-2xl h-12 w-12 border-2">
                            <ArrowLeft className="h-5 w-5" />
                          </Button>
                          <div>
                            <h2 className="text-2xl font-black tracking-tight">
                              {isCreatingLesson ? "Blueprint New Lesson" : "Edit Module"}
                            </h2>
                            <p className="text-xs text-muted-foreground uppercase font-black tracking-[0.3em] mt-1">Course Content Engine</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {!isCreatingLesson && (
                            <Button
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10 font-bold rounded-xl h-12 px-6"
                              onClick={() => {
                                if (window.confirm("CRITICAL: Delete this lesson permanently?")) {
                                  deleteLessonMutation.mutate(selectedLesson!.id);
                                }
                              }}
                              disabled={deleteLessonMutation.isPending}
                            >
                              <Trash2 className="h-5 w-5 mr-3" />
                              Purge Lesson
                            </Button>
                          )}
                          <Button
                            size="lg"
                            onClick={lessonForm.handleSubmit(onSubmitLesson)}
                            disabled={createLessonMutation.isPending || updateLessonMutation.isPending}
                            className="rounded-xl h-12 px-10 font-black shadow-xl shadow-primary/20"
                          >
                            {(createLessonMutation.isPending || updateLessonMutation.isPending) ? (
                              <Loader2 className="h-5 w-5 animate-spin mr-3" />
                            ) : (
                              <Save className="h-5 w-5 mr-3" />
                            )}
                            {isCreatingLesson ? "Launch Lesson" : "Sync Changes"}
                          </Button>
                        </div>
                      </div>
                      <ScrollArea className="flex-1 bg-muted/5">
                        <div className="max-w-5xl mx-auto p-12">
                          <Form {...lessonForm}>
                            <form className="space-y-12">
                              <div className="grid md:grid-cols-3 gap-12">
                                <div className="md:col-span-2 space-y-8">
                                  <FormField
                                    control={lessonForm.control}
                                    name="title"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Module Heading</FormLabel>
                                        <FormControl>
                                          <Input {...field} placeholder="e.g., Candlestick Psychology Masterclass" className="bg-background h-16 text-xl font-bold rounded-2xl border-2 focus:border-primary px-6" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={lessonForm.control}
                                    name="description"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Executive Summary</FormLabel>
                                        <FormControl>
                                          <Textarea {...field} placeholder="What will students master in this session?" className="bg-background min-h-[160px] resize-none text-lg leading-relaxed rounded-2xl border-2 p-6" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <div className="space-y-8">
                                  <div className="p-8 rounded-3xl bg-background border-2 shadow-sm space-y-6">
                                    <FormField
                                      control={lessonForm.control}
                                      name="category"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Stream</FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                              <SelectTrigger className="bg-muted/50 h-12 rounded-xl border-0 font-bold px-4">
                                                <SelectValue placeholder="Stream" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-2">
                                              <SelectItem value="basics">Fundamentals</SelectItem>
                                              <SelectItem value="technical">Technical Analysis</SelectItem>
                                              <SelectItem value="fundamental">Market Economics</SelectItem>
                                              <SelectItem value="psychology">Trade Psychology</SelectItem>
                                              <SelectItem value="advanced">Advanced Systems</SelectItem>
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
                                          <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Proficiency</FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                              <SelectTrigger className="bg-muted/50 h-12 rounded-xl border-0 font-bold px-4">
                                                <SelectValue placeholder="Proficiency" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-2">
                                              <SelectItem value="beginner">Novice</SelectItem>
                                              <SelectItem value="intermediate">Skilled</SelectItem>
                                              <SelectItem value="advanced">Expert</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                      <FormField
                                        control={lessonForm.control}
                                        name="duration"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Time (min)</FormLabel>
                                            <FormControl>
                                              <Input type="number" {...field} className="bg-muted/50 h-12 rounded-xl border-0 font-bold text-center" />
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
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sequence</FormLabel>
                                            <FormControl>
                                              <Input type="number" {...field} className="bg-muted/50 h-12 rounded-xl border-0 font-bold text-center" />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>
                                    <FormField
                                      control={lessonForm.control}
                                      name="isPublished"
                                      render={({ field }) => (
                                        <FormItem className="flex items-center justify-between pt-4 border-t">
                                          <div>
                                            <FormLabel className="text-sm font-black">Live Status</FormLabel>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Visible to academy</p>
                                          </div>
                                          <FormControl>
                                            <Switch
                                              checked={field.value}
                                              onCheckedChange={field.onChange}
                                              className="data-[state=checked]:bg-primary"
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </div>
                              </div>
                              <FormField
                                control={lessonForm.control}
                                name="content"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 block">Knowledge Base & Curriculum (Rich Markdown)</FormLabel>
                                    <FormControl>
                                      <div className="rounded-3xl border-2 overflow-hidden bg-background">
                                        <RichTextEditor
                                          content={field.value}
                                          onChange={field.onChange}
                                          placeholder="Unleash the professional trading wisdom here..."
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </form>
                          </Form>
                        </div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-24 text-center max-w-2xl mx-auto">
                      <div className="h-32 w-32 rounded-[2.5rem] bg-primary/5 flex items-center justify-center mb-10 shadow-inner">
                        <BookOpen className="h-16 w-16 text-primary opacity-30" />
                      </div>
                      <h3 className="text-4xl font-black tracking-tight mb-4">Academy Architect</h3>
                      <p className="text-xl text-muted-foreground leading-relaxed font-medium">Select a learning module from the ledger or initialize a new sequence to expand the 12Digits curriculum.</p>
                      <Button onClick={handleCreateNewLesson} size="lg" className="mt-12 rounded-2xl h-16 px-12 font-black text-lg shadow-2xl shadow-primary/30">
                        <Plus className="h-6 w-6 mr-4" />
                        Initialize New Module
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tips" className="h-full w-full m-0 p-0 flex flex-col overflow-hidden data-[state=active]:flex">
              <div className="flex h-full w-full overflow-hidden">
                <div className="w-80 border-r flex flex-col bg-muted/5 shrink-0">
                  <div className="p-6 border-b">
                    <Button onClick={handleCreateNewTip} className="w-full gap-2 rounded-xl h-12" data-testid="button-create-tip">
                      <Plus className="h-5 w-5" />
                      Add Daily Tip
                    </Button>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-3">
                      {(!tips || tips.length === 0) ? (
                        <div className="text-center py-16 px-6">
                          <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-10" />
                          <p className="text-sm font-bold text-muted-foreground">Tips Feed Empty</p>
                        </div>
                      ) : (
                        tips.map((tip) => (
                          <div
                            key={tip.id}
                            onClick={() => handleSelectTip(tip)}
                            className={`p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                              selectedTip?.id === tip.id && !isCreatingTip
                                ? "bg-primary/5 border-primary shadow-sm"
                                : "bg-card hover:border-primary/50 border-transparent shadow-sm"
                            }`}
                            data-testid={`tip-item-${tip.id}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate leading-tight mb-2">{tip.title}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={`text-[10px] h-4 px-1.5 uppercase tracking-tighter ${getCategoryColor(tip.category)}`}>
                                    {tip.category}
                                  </Badge>
                                </div>
                              </div>
                              {!(tip.isPublished ?? true) && (
                                <EyeOff className="h-4 w-4 text-muted-foreground shrink-0 opacity-50" />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
                <div className="flex-1 overflow-hidden bg-background">
                  {(selectedTip || isCreatingTip) ? (
                    <div className="h-full flex flex-col">
                      <div className="p-8 border-b flex items-center justify-between shrink-0 bg-background/80 backdrop-blur-xl z-10 sticky top-0">
                        <div className="flex items-center gap-6">
                          <Button variant="outline" size="icon" onClick={handleBackTip} className="rounded-2xl h-12 w-12 border-2">
                            <ArrowLeft className="h-5 w-5" />
                          </Button>
                          <div>
                            <h2 className="text-2xl font-black tracking-tight">
                              {isCreatingTip ? "Draft New Insight" : "Refine Trading Tip"}
                            </h2>
                            <p className="text-xs text-muted-foreground uppercase font-black tracking-[0.3em] mt-1">Wisdom Dispatcher</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {!isCreatingTip && (
                            <Button
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10 font-bold rounded-xl h-12 px-6"
                              onClick={() => {
                                if (window.confirm("CRITICAL: Delete this tip permanently?")) {
                                  deleteTipMutation.mutate(selectedTip!.id);
                                }
                              }}
                              disabled={deleteTipMutation.isPending}
                            >
                              <Trash2 className="h-5 w-5 mr-3" />
                              Purge Tip
                            </Button>
                          )}
                          <Button
                            size="lg"
                            onClick={tipForm.handleSubmit(onSubmitTip)}
                            disabled={createTipMutation.isPending || updateTipMutation.isPending}
                            className="rounded-xl h-12 px-10 font-black shadow-xl shadow-primary/20"
                          >
                            {(createTipMutation.isPending || updateTipMutation.isPending) ? (
                              <Loader2 className="h-5 w-5 animate-spin mr-3" />
                            ) : (
                              <Save className="h-5 w-5 mr-3" />
                            )}
                            {isCreatingTip ? "Launch Tip" : "Sync Changes"}
                          </Button>
                        </div>
                      </div>
                      <ScrollArea className="flex-1 bg-muted/5">
                        <div className="max-w-3xl mx-auto p-12">
                          <Form {...tipForm}>
                            <form className="space-y-8">
                              <FormField
                                control={tipForm.control}
                                name="title"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Insight Headline</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="e.g., The Rule of Three in Price Action" className="bg-background h-16 text-xl font-bold rounded-2xl border-2 focus:border-primary px-6" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="grid grid-cols-2 gap-8">
                                <FormField
                                  control={tipForm.control}
                                  name="category"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Focus Area</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger className="bg-background h-14 rounded-2xl border-2 font-bold px-6">
                                            <SelectValue placeholder="Focus Area" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-2xl border-2">
                                          <SelectItem value="strategy">Tactical Strategy</SelectItem>
                                          <SelectItem value="psychology">Trade Psychology</SelectItem>
                                          <SelectItem value="risk">Risk Protocols</SelectItem>
                                          <SelectItem value="market">Market Structure</SelectItem>
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
                                      <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Complexity</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger className="bg-background h-14 rounded-2xl border-2 font-bold px-6">
                                            <SelectValue placeholder="Complexity" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-2xl border-2">
                                          <SelectItem value="beginner">Core</SelectItem>
                                          <SelectItem value="intermediate">Advanced</SelectItem>
                                          <SelectItem value="advanced">Expert Only</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={tipForm.control}
                                name="content"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Wisdom Transmission</FormLabel>
                                    <FormControl>
                                      <Textarea {...field} placeholder="Distill the trading wisdom here..." className="bg-background min-h-[300px] resize-none text-xl leading-relaxed rounded-3xl border-2 p-8 shadow-sm" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="p-8 rounded-[2rem] bg-background border-2 shadow-sm">
                                <FormField
                                  control={tipForm.control}
                                  name="isPublished"
                                  render={({ field }) => (
                                    <FormItem className="flex items-center justify-between">
                                      <div>
                                        <FormLabel className="text-lg font-black">Broadcast Status</FormLabel>
                                        <p className="text-xs font-bold text-muted-foreground uppercase mt-1">Visible in terminal tips feed</p>
                                      </div>
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                          className="scale-125 data-[state=checked]:bg-primary"
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </form>
                          </Form>
                        </div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-24 text-center max-w-2xl mx-auto">
                      <div className="h-32 w-32 rounded-[2.5rem] bg-primary/5 flex items-center justify-center mb-10 shadow-inner">
                        <Lightbulb className="h-16 w-16 text-primary opacity-30" />
                      </div>
                      <h3 className="text-4xl font-black tracking-tight mb-4">Sage Mode</h3>
                      <p className="text-xl text-muted-foreground leading-relaxed font-medium">Broadcast daily trading nuggets to the community. Keep them sharp, actionable, and professional.</p>
                      <Button onClick={handleCreateNewTip} size="lg" className="mt-12 rounded-2xl h-16 px-12 font-black text-lg shadow-2xl shadow-primary/30">
                        <Plus className="h-6 w-6 mr-4" />
                        Initialize New Tip
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="h-full w-full m-0 p-0 flex flex-col overflow-hidden data-[state=active]:flex">
              <div className="flex h-full w-full overflow-hidden">
                <aside className="w-80 border-r flex flex-col bg-muted/5 shrink-0">
                  <div className="p-6 border-b">
                    <Button onClick={handleCreateNewInsight} className="w-full gap-2 rounded-xl h-12" data-testid="button-create-insight">
                      <Plus className="h-5 w-5" />
                      Add Market Insight
                    </Button>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-3">
                      {(!insights || insights.length === 0) ? (
                        <div className="text-center py-16 px-6">
                          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-10" />
                          <p className="text-sm font-bold text-muted-foreground">Market Feed Empty</p>
                        </div>
                      ) : (
                        insights.map((insight) => (
                          <div
                            key={insight.id}
                            onClick={() => handleSelectInsight(insight)}
                            className={`p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                              selectedInsight?.id === insight.id && !isCreatingInsight
                                ? "bg-primary/5 border-primary shadow-sm"
                                : "bg-card hover:border-primary/50 border-transparent shadow-sm"
                            }`}
                            data-testid={`insight-item-${insight.id}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate leading-tight mb-2">{insight.title}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={`text-[10px] h-4 px-1.5 uppercase tracking-tighter ${getSentimentColor(insight.sentiment)}`}>
                                    {insight.sentiment}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </aside>
                <main className="flex-1 overflow-hidden bg-background">
                  {(selectedInsight || isCreatingInsight) ? (
                    <div className="h-full flex flex-col">
                      <div className="p-8 border-b flex items-center justify-between shrink-0 bg-background/80 backdrop-blur-xl z-10 sticky top-0">
                        <div className="flex items-center gap-6">
                          <Button variant="outline" size="icon" onClick={handleBackInsight} className="rounded-2xl h-12 w-12 border-2">
                            <ArrowLeft className="h-5 w-5" />
                          </Button>
                          <div>
                            <h2 className="text-2xl font-black tracking-tight">
                              {isCreatingInsight ? "Draft Sector Intel" : "Refine Intel"}
                            </h2>
                            <p className="text-xs text-muted-foreground uppercase font-black tracking-[0.3em] mt-1">Market Pulse Engine</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {!isCreatingInsight && (
                            <Button
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10 font-bold rounded-xl h-12 px-6"
                              onClick={() => {
                                if (window.confirm("CRITICAL: Delete this intel permanently?")) {
                                  deleteInsightMutation.mutate(selectedInsight!.id);
                                }
                              }}
                              disabled={deleteInsightMutation.isPending}
                            >
                              <Trash2 className="h-5 w-5 mr-3" />
                              Purge Intel
                            </Button>
                          )}
                          <Button
                            size="lg"
                            onClick={insightForm.handleSubmit(onSubmitInsight)}
                            disabled={createInsightMutation.isPending || updateInsightMutation.isPending}
                            className="rounded-xl h-12 px-10 font-black shadow-xl shadow-primary/20"
                          >
                            {(createInsightMutation.isPending || updateInsightMutation.isPending) ? (
                              <Loader2 className="h-5 w-5 animate-spin mr-3" />
                            ) : (
                              <Save className="h-5 w-5 mr-3" />
                            )}
                            {isCreatingInsight ? "Launch Intel" : "Sync Changes"}
                          </Button>
                        </div>
                      </div>
                      <ScrollArea className="flex-1 bg-muted/5">
                        <div className="max-w-3xl mx-auto p-12">
                          <Form {...insightForm}>
                            <form className="space-y-8">
                              <FormField
                                control={insightForm.control}
                                name="title"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Market Headline</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="e.g., Q3 Tech Sector Deep Dive" className="bg-background h-16 text-xl font-bold rounded-2xl border-2 focus:border-primary px-6" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="grid grid-cols-2 gap-8">
                                <FormField
                                  control={insightForm.control}
                                  name="sentiment"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Sentiment Bias</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger className="bg-background h-14 rounded-2xl border-2 font-bold px-6">
                                            <SelectValue placeholder="Sentiment" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-2xl border-2">
                                          <SelectItem value="bullish" className="text-success font-bold">Bullish Bias</SelectItem>
                                          <SelectItem value="bearish" className="text-destructive font-bold">Bearish Bias</SelectItem>
                                          <SelectItem value="neutral" className="font-bold">Neutral Stance</SelectItem>
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
                                      <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Affected Sector</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger className="bg-background h-14 rounded-2xl border-2 font-bold px-6">
                                            <SelectValue placeholder="Target Sector" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-2xl border-2">
                                          <SelectItem value="Technology">Tech Core</SelectItem>
                                          <SelectItem value="Finance">Global Finance</SelectItem>
                                          <SelectItem value="Healthcare">Bio & Pharma</SelectItem>
                                          <SelectItem value="Energy">Energy Systems</SelectItem>
                                          <SelectItem value="Consumer">Consumer Goods</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={insightForm.control}
                                name="summary"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Intelligence Briefing</FormLabel>
                                    <FormControl>
                                      <Textarea {...field} placeholder="Distill the sector intel here..." className="bg-background min-h-[300px] resize-none text-xl leading-relaxed rounded-3xl border-2 p-8 shadow-sm" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="p-8 rounded-[2rem] bg-background border-2 shadow-sm">
                                <FormField
                                  control={insightForm.control}
                                  name="isPublished"
                                  render={({ field }) => (
                                    <FormItem className="flex items-center justify-between">
                                      <div>
                                        <FormLabel className="text-lg font-black">Live Broadcast</FormLabel>
                                        <p className="text-xs font-bold text-muted-foreground uppercase mt-1">Visible in market feed terminal</p>
                                      </div>
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                          className="scale-125 data-[state=checked]:bg-primary"
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </form>
                          </Form>
                        </div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-24 text-center max-w-2xl mx-auto">
                      <div className="h-32 w-32 rounded-[2.5rem] bg-primary/5 flex items-center justify-center mb-10 shadow-inner">
                        <TrendingUp className="h-16 w-16 text-primary opacity-30" />
                      </div>
                      <h3 className="text-4xl font-black tracking-tight mb-4">Intel Hub</h3>
                      <p className="text-xl text-muted-foreground leading-relaxed font-medium">Broadcast high-impact market analysis. Provide the edge that every 12Digits trader needs to stay profitable.</p>
                      <Button onClick={handleCreateNewInsight} size="lg" className="mt-12 rounded-2xl h-16 px-12 font-black text-lg shadow-2xl shadow-primary/30">
                        <Plus className="h-6 w-6 mr-4" />
                        Initialize New Intel
                      </Button>
                    </div>
                  )}
                </main>
              </div>
            </TabsContent>

            <TabsContent value="strategies" className="h-full w-full m-0 p-0 flex flex-col overflow-hidden data-[state=active]:flex">
              <div className="flex h-full w-full overflow-hidden">
                <div className="w-80 border-r flex flex-col bg-muted/5 shrink-0">
                  <div className="p-6 border-b">
                    <Button onClick={handleCreateNewStrategy} className="w-full gap-2 rounded-xl h-12" data-testid="button-create-strategy">
                      <Plus className="h-5 w-5" />
                      Blueprint Strategy
                    </Button>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-3">
                      {(!strategies || strategies.length === 0) ? (
                        <div className="text-center py-16 px-6">
                          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-10" />
                          <p className="text-sm font-bold text-muted-foreground">Blueprint Vault Empty</p>
                        </div>
                      ) : (
                        strategies.map((strategy) => (
                          <div
                            key={strategy.id}
                            onClick={() => handleSelectStrategy(strategy)}
                            className={`p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                              selectedStrategy?.id === strategy.id && !isCreatingStrategy
                                ? "bg-primary/5 border-primary shadow-sm"
                                : "bg-card hover:border-primary/50 border-transparent shadow-sm"
                            }`}
                            data-testid={`strategy-item-${strategy.id}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate leading-tight mb-2">{strategy.title}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={`text-[10px] h-4 px-1.5 uppercase tracking-tighter ${getDifficultyColor(strategy.difficulty)}`}>
                                    {strategy.difficulty}
                                  </Badge>
                                </div>
                              </div>
                              {!(strategy.isPublished ?? true) && (
                                <EyeOff className="h-4 w-4 text-muted-foreground shrink-0 opacity-50" />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
                <div className="flex-1 overflow-hidden bg-background">
                  {(selectedStrategy || isCreatingStrategy) ? (
                    <div className="h-full flex flex-col">
                      <div className="p-8 border-b flex items-center justify-between shrink-0 bg-background/80 backdrop-blur-xl z-10 sticky top-0">
                        <div className="flex items-center gap-6">
                          <Button variant="outline" size="icon" onClick={handleBackStrategy} className="rounded-2xl h-12 w-12 border-2">
                            <ArrowLeft className="h-5 w-5" />
                          </Button>
                          <div>
                            <h2 className="text-2xl font-black tracking-tight">
                              {isCreatingStrategy ? "Forge Strategy" : "Refine Blueprint"}
                            </h2>
                            <p className="text-xs text-muted-foreground uppercase font-black tracking-[0.3em] mt-1">Alpha Factory</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {!isCreatingStrategy && (
                            <Button
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10 font-bold rounded-xl h-12 px-6"
                              onClick={() => {
                                if (window.confirm("CRITICAL: Delete this strategy permanently?")) {
                                  deleteStrategyMutation.mutate(selectedStrategy!.id);
                                }
                              }}
                              disabled={deleteStrategyMutation.isPending}
                            >
                              <Trash2 className="h-5 w-5 mr-3" />
                              Purge Strategy
                            </Button>
                          )}
                          <Button
                            size="lg"
                            onClick={strategyForm.handleSubmit(onSubmitStrategy)}
                            disabled={createStrategyMutation.isPending || updateStrategyMutation.isPending}
                            className="rounded-xl h-12 px-10 font-black shadow-xl shadow-primary/20"
                          >
                            {(createStrategyMutation.isPending || updateStrategyMutation.isPending) ? (
                              <Loader2 className="h-5 w-5 animate-spin mr-3" />
                            ) : (
                              <Save className="h-5 w-5 mr-3" />
                            )}
                            {isCreatingStrategy ? "Deploy Strategy" : "Sync Blueprint"}
                          </Button>
                        </div>
                      </div>
                      <ScrollArea className="flex-1 bg-muted/5">
                        <div className="max-w-5xl mx-auto p-12">
                          <Form {...strategyForm}>
                            <form className="space-y-12">
                              <div className="grid md:grid-cols-3 gap-12">
                                <div className="md:col-span-2 space-y-8">
                                  <FormField
                                    control={strategyForm.control}
                                    name="title"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Blueprint Name</FormLabel>
                                        <FormControl>
                                          <Input {...field} placeholder="e.g., V-Reversal Trend System" className="bg-background h-16 text-xl font-bold rounded-2xl border-2 focus:border-primary px-6" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={strategyForm.control}
                                    name="description"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Strategic Vision</FormLabel>
                                        <FormControl>
                                          <Textarea {...field} placeholder="Distill the strategic edge of this system..." className="bg-background min-h-[160px] resize-none text-lg leading-relaxed rounded-2xl border-2 p-6" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <div className="space-y-8">
                                  <div className="p-8 rounded-3xl bg-background border-2 shadow-sm space-y-6">
                                    <FormField
                                      control={strategyForm.control}
                                      name="category"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Alpha Type</FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                              <SelectTrigger className="bg-muted/50 h-12 rounded-xl border-0 font-bold px-4">
                                                <SelectValue placeholder="Alpha Type" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-2">
                                              <SelectItem value="trend">Trend Momentum</SelectItem>
                                              <SelectItem value="mean-reversion">Mean Reversion</SelectItem>
                                              <SelectItem value="breakout">Volatility Breakout</SelectItem>
                                              <SelectItem value="scalping">Intraday Scalping</SelectItem>
                                              <SelectItem value="swing">Swing Macro</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={strategyForm.control}
                                      name="difficulty"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Risk Rating</FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                              <SelectTrigger className="bg-muted/50 h-12 rounded-xl border-0 font-bold px-4">
                                                <SelectValue placeholder="Risk Rating" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-2">
                                              <SelectItem value="beginner">Low Risk</SelectItem>
                                              <SelectItem value="intermediate">Active Risk</SelectItem>
                                              <SelectItem value="advanced">High Risk</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={strategyForm.control}
                                      name="isPublished"
                                      render={({ field }) => (
                                        <FormItem className="flex items-center justify-between pt-4 border-t">
                                          <div>
                                            <FormLabel className="text-sm font-black">Elite Access</FormLabel>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Premium members only</p>
                                          </div>
                                          <FormControl>
                                            <Switch
                                              checked={field.value}
                                              onCheckedChange={field.onChange}
                                              className="data-[state=checked]:bg-primary"
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </div>
                              </div>
                              <FormField
                                control={strategyForm.control}
                                name="content"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 block">Rules, Parameters & Edge (Markdown Support)</FormLabel>
                                    <FormControl>
                                      <div className="rounded-3xl border-2 overflow-hidden bg-background">
                                        <RichTextEditor
                                          content={field.value}
                                          onChange={field.onChange}
                                          placeholder="Define the mechanical rules and technical edge..."
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </form>
                          </Form>
                        </div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-24 text-center max-w-2xl mx-auto">
                      <div className="h-32 w-32 rounded-[2.5rem] bg-primary/5 flex items-center justify-center mb-10 shadow-inner">
                        <Target className="h-16 w-16 text-primary opacity-30" />
                      </div>
                      <h3 className="text-4xl font-black tracking-tight mb-4">Alpha Factory</h3>
                      <p className="text-xl text-muted-foreground leading-relaxed font-medium">Forge institutional-grade strategies for premium 12Digits+ members. Precision is the ultimate edge.</p>
                      <Button onClick={handleCreateNewStrategy} size="lg" className="mt-12 rounded-2xl h-16 px-12 font-black text-lg shadow-2xl shadow-primary/30">
                        <Plus className="h-6 w-6 mr-4" />
                        Forging New Strategy
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="promo-codes" className="h-full w-full m-0 p-0 flex flex-col overflow-hidden data-[state=active]:flex">
              <PromoCodesTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

function PromoCodesTab() {
  const { toast } = useToast();

  const { data: codes = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/promo-codes"] });

  const promoSchema = z.object({
    code: z.string().min(1, "Code is required"),
    tier: z.string().min(1, "Tier is required"),
    description: z.string().optional(),
    maxUses: z.coerce.number().nullable().optional(),
    isActive: z.boolean().default(true),
  });

  const form = useForm<z.infer<typeof promoSchema>>({
    resolver: zodResolver(promoSchema),
    defaultValues: { code: "", tier: "school", description: "", maxUses: undefined, isActive: true },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/promo-codes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      form.reset({ code: "", tier: "school", description: "", maxUses: undefined, isActive: true });
      toast({ title: "Promo code created" });
    },
    onError: () => toast({ title: "Failed to create promo code", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/promo-codes/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/promo-codes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      toast({ title: "Promo code deleted" });
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const tierColors: Record<string, string> = { school: "bg-blue-100 text-blue-800", casual: "bg-green-100 text-green-800", premium: "bg-purple-100 text-purple-800" };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-96 border-r flex flex-col bg-muted/5 shrink-0">
        <div className="p-6 border-b">
          <h2 className="text-lg font-bold">Create Promo Code</h2>
        </div>
        <ScrollArea className="flex-1 p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. WELCOME2024" data-testid="input-promo-code" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="tier" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tier</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-promo-tier"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="school">School</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="premium">12Digits+</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. Welcome discount" data-testid="input-promo-description" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="maxUses" render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Uses (optional)</FormLabel>
                  <FormControl><Input {...field} type="number" placeholder="Unlimited" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} data-testid="input-promo-max-uses" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-promo-active" /></FormControl>
                  <FormLabel>Active</FormLabel>
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-create-promo">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" />Create Code</>}
              </Button>
            </form>
          </Form>
        </ScrollArea>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-bold">Promo Codes ({codes.length})</h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
            ) : codes.length === 0 ? (
              <div className="text-center py-16" data-testid="empty-promo-codes">
                <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                <p className="text-sm font-bold text-muted-foreground">No Promo Codes</p>
              </div>
            ) : codes.map((code: any) => (
              <Card key={code.id} className="rounded-xl" data-testid={`card-promo-${code.id}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-base" data-testid={`text-promo-code-${code.id}`}>{code.code}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierColors[code.tier] || "bg-gray-100 text-gray-800"}`}>{code.tier}</span>
                      {!code.isActive && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    {code.description && <p className="text-sm text-muted-foreground truncate">{code.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      Used: {code.usedCount ?? 0}{code.maxUses ? ` / ${code.maxUses}` : " / ∞"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={code.isActive}
                      onCheckedChange={(v) => toggleMutation.mutate({ id: code.id, isActive: v })}
                      data-testid={`switch-active-${code.id}`}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(code.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-promo-${code.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
