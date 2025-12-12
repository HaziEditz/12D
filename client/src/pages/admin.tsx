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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Pencil, 
  Trash2,
  BookOpen,
  Settings,
  Users,
  BarChart3,
  Clock
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
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

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
      setIsDialogOpen(false);
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
      setIsDialogOpen(false);
      setEditingLesson(null);
      form.reset();
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
    },
    onError: () => {
      toast({ title: "Failed to delete lesson", variant: "destructive" });
    },
  });

  const onSubmit = (data: LessonFormData) => {
    if (editingLesson) {
      updateMutation.mutate({ id: editingLesson.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
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
    setIsDialogOpen(true);
  };

  const handleOpenDialog = () => {
    setEditingLesson(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner": return "bg-success/10 text-success";
      case "intermediate": return "bg-chart-4/10 text-chart-4";
      case "advanced": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid md:grid-cols-3 gap-6 mb-8">
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage lessons and platform settings</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{stats?.users ?? 0}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center mb-3">
              <BookOpen className="h-5 w-5 text-chart-2" />
            </div>
            <p className="text-3xl font-bold">{stats?.lessons ?? lessons?.length ?? 0}</p>
            <p className="text-sm text-muted-foreground">Total Lessons</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="h-10 w-10 rounded-lg bg-chart-4/10 flex items-center justify-center mb-3">
              <BarChart3 className="h-5 w-5 text-chart-4" />
            </div>
            <p className="text-3xl font-bold">{stats?.trades ?? 0}</p>
            <p className="text-sm text-muted-foreground">Total Trades</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lessons</CardTitle>
              <CardDescription>Create and manage educational content</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={handleOpenDialog} data-testid="button-create-lesson">
                  <Plus className="h-4 w-4" />
                  Create Lesson
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingLesson ? "Edit Lesson" : "Create Lesson"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Introduction to Trading" data-testid="input-lesson-title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="A brief overview of this lesson..." 
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
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Full lesson content..." 
                              className="min-h-32"
                              data-testid="input-lesson-content"
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <div className="grid grid-cols-2 gap-4">
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
                            <FormLabel>Order</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" data-testid="input-order" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="isPublished"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <FormLabel>Published</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Make this lesson visible to users
                            </p>
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
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-submit-lesson"
                    >
                      {editingLesson ? "Update Lesson" : "Create Lesson"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {(!lessons || lessons.length === 0) ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No lessons yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first lesson to get started.
              </p>
              <Button onClick={handleOpenDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Lesson
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {lessons.map((lesson) => (
                <div 
                  key={lesson.id} 
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  data-testid={`row-lesson-${lesson.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center font-bold text-sm">
                      {lesson.order + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{lesson.title}</p>
                        {!lesson.isPublished && (
                          <Badge variant="outline" className="text-xs">Draft</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className={getDifficultyColor(lesson.difficulty)}>
                          {lesson.difficulty}
                        </Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {lesson.duration} min
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEdit(lesson)}
                      data-testid={`button-edit-lesson-${lesson.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteMutation.mutate(lesson.id)}
                      data-testid={`button-delete-lesson-${lesson.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
