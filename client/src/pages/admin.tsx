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
  ArrowLeft
} from "lucide-react";
import type { Lesson } from "@shared/schema";

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

type LessonFormData = z.infer<typeof lessonSchema>;

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: lessons, isLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/admin/lessons"],
  });

  const { data: stats } = useQuery<{ users: number; lessons: number; trades: number }>({
    queryKey: ["/api/admin/stats"],
  });

  const form = useForm<LessonFormData>({
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

  const createMutation = useMutation({
    mutationFn: (data: LessonFormData) => apiRequest("POST", "/api/admin/lessons", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      toast({ title: "Lesson created successfully" });
      setIsCreating(false);
      setSelectedLesson(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create lesson", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/lessons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      toast({ title: "Lesson deleted" });
      setSelectedLesson(null);
      setIsCreating(false);
    },
    onError: () => {
      toast({ title: "Failed to delete lesson", variant: "destructive" });
    },
  });

  const onSubmit = (data: LessonFormData) => {
    if (selectedLesson && !isCreating) {
      updateMutation.mutate({ id: selectedLesson.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setIsCreating(false);
    setSelectedLesson(lesson);
    form.reset({
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

  const handleCreateNew = () => {
    setSelectedLesson(null);
    setIsCreating(true);
    form.reset({
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

  const handleBack = () => {
    setSelectedLesson(null);
    setIsCreating(false);
    form.reset();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner": return "bg-success/10 text-success";
      case "intermediate": return "bg-chart-4/10 text-chart-4";
      case "advanced": return "bg-destructive/10 text-destructive";
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

  if (isLoading) {
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
          <p className="text-sm text-muted-foreground">Manage lessons and content</p>
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

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 border-r flex flex-col bg-muted/30">
          <div className="p-3 border-b">
            <Button onClick={handleCreateNew} className="w-full gap-2" data-testid="button-create-lesson">
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
                      selectedLesson?.id === lesson.id && !isCreating ? "bg-accent" : "bg-background"
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
          {!selectedLesson && !isCreating ? (
            <div className="h-full flex items-center justify-center" data-testid="no-lesson-selected">
              <div className="text-center">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Lesson Editor</h2>
                <p className="text-muted-foreground mb-4">
                  Select a lesson from the sidebar or create a new one
                </p>
                <Button onClick={handleCreateNew} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Lesson
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between gap-4 p-4 border-b">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={handleBack} data-testid="button-back">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg font-semibold" data-testid="text-editor-title">
                    {isCreating ? "Create New Lesson" : "Edit Lesson"}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {!isCreating && selectedLesson && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(selectedLesson.id)}
                      disabled={deleteMutation.isPending}
                      className="gap-2 text-destructive"
                      data-testid="button-delete-lesson"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="gap-2"
                    data-testid="button-save-lesson"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isCreating ? "Create Lesson" : "Save Changes"}
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <Form {...form}>
                  <form className="p-4 space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
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
                          control={form.control}
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
                          control={form.control}
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
                      control={form.control}
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
                      control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
      </div>
    </div>
  );
}
