import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { 
  Users, 
  Plus, 
  Trash2, 
  Copy, 
  TrendingUp, 
  BookOpen,
  DollarSign,
  BarChart3,
  GraduationCap,
  ChevronRight
} from "lucide-react";

interface Class {
  id: string;
  name: string;
  description: string | null;
  joinCode: string;
  createdAt: string;
}

interface StudentProgress {
  id: string;
  displayName: string;
  email: string;
  lessonsCompleted: number;
  totalProfit: number;
  simulatorBalance: number;
  totalTrades: number;
  profitableTrades: number;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentPassword, setNewStudentPassword] = useState("");
  const [createClassOpen, setCreateClassOpen] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);

  const { data: classes, isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ["/api/teacher/classes"],
  });

  const { data: students, isLoading: studentsLoading } = useQuery<StudentProgress[]>({
    queryKey: ["/api/teacher/classes", selectedClass?.id, "students"],
    enabled: !!selectedClass,
  });

  const createClassMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/teacher/classes", { name: newClassName, description: newClassDescription });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/classes"] });
      setNewClassName("");
      setNewClassDescription("");
      setCreateClassOpen(false);
      toast({ title: "Class created successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create class", description: error.message, variant: "destructive" });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (classId: string) => {
      return apiRequest("DELETE", `/api/teacher/classes/${classId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/classes"] });
      setSelectedClass(null);
      toast({ title: "Class deleted" });
    },
  });

  const addStudentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/teacher/classes/${selectedClass?.id}/students`, {
        displayName: newStudentName,
        email: newStudentEmail,
        password: newStudentPassword,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/classes", selectedClass?.id, "students"] });
      setNewStudentName("");
      setNewStudentEmail("");
      setNewStudentPassword("");
      setAddStudentOpen(false);
      toast({ title: "Student account created!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to add student", description: error.message, variant: "destructive" });
    },
  });

  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      return apiRequest("DELETE", `/api/teacher/classes/${selectedClass?.id}/students/${studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/classes", selectedClass?.id, "students"] });
      toast({ title: "Student removed from class" });
    },
  });

  const copyJoinCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Join code copied!" });
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewStudentPassword(password);
  };

  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">You need to be a teacher to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4 gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Teacher Dashboard
          </h1>
          <p className="text-muted-foreground">Manage your classes and track student progress</p>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        <Card className="w-80 flex-shrink-0 flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg">Your Classes</CardTitle>
              <Dialog open={createClassOpen} onOpenChange={setCreateClassOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" data-testid="button-create-class">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Class</DialogTitle>
                    <DialogDescription>
                      Create a class to organize your students. You can add students after creating the class.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium">Class Name</label>
                      <Input
                        placeholder="e.g., Period 3 Finance"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        data-testid="input-class-name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description (optional)</label>
                      <Input
                        placeholder="e.g., Intro to investing course"
                        value={newClassDescription}
                        onChange={(e) => setNewClassDescription(e.target.value)}
                        data-testid="input-class-description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => createClassMutation.mutate()}
                      disabled={!newClassName || createClassMutation.isPending}
                      data-testid="button-submit-class"
                    >
                      Create Class
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-2">
            {classesLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
            ) : !classes || classes.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No classes yet</p>
                <p className="text-xs text-muted-foreground">Create your first class to get started</p>
              </div>
            ) : (
              classes.map((cls) => (
                <div
                  key={cls.id}
                  className={`p-3 rounded-lg cursor-pointer hover-elevate ${
                    selectedClass?.id === cls.id ? "bg-accent" : "bg-muted/50"
                  }`}
                  onClick={() => setSelectedClass(cls)}
                  data-testid={`class-item-${cls.id}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{cls.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      Code: {cls.joinCode}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {!selectedClass ? (
            <Card className="flex-1 flex items-center justify-center">
              <CardContent className="text-center">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Select a Class</h2>
                <p className="text-muted-foreground">
                  Choose a class from the sidebar to view students and their progress
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <CardTitle>{selectedClass.name}</CardTitle>
                      {selectedClass.description && (
                        <CardDescription>{selectedClass.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyJoinCode(selectedClass.joinCode)}
                        data-testid="button-copy-code"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Join Code: {selectedClass.joinCode}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteClassMutation.mutate(selectedClass.id)}
                        data-testid="button-delete-class"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="flex-1 overflow-hidden flex flex-col">
                <CardHeader className="pb-3 flex-shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">Students</CardTitle>
                      <CardDescription>{students?.length ?? 0} students enrolled</CardDescription>
                    </div>
                    <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" data-testid="button-add-student">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Student
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Student Account</DialogTitle>
                          <DialogDescription>
                            Create a login for your student. Share these credentials with them so they can access the platform.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <label className="text-sm font-medium">Student Name</label>
                            <Input
                              placeholder="e.g., John Smith"
                              value={newStudentName}
                              onChange={(e) => setNewStudentName(e.target.value)}
                              data-testid="input-student-name"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Email</label>
                            <Input
                              type="email"
                              placeholder="e.g., john.smith@school.edu"
                              value={newStudentEmail}
                              onChange={(e) => setNewStudentEmail(e.target.value)}
                              data-testid="input-student-email"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Password</label>
                            <div className="flex gap-2">
                              <Input
                                type="text"
                                placeholder="Create a password"
                                value={newStudentPassword}
                                onChange={(e) => setNewStudentPassword(e.target.value)}
                                data-testid="input-student-password"
                              />
                              <Button variant="outline" onClick={generatePassword} type="button">
                                Generate
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Share this password with your student so they can log in
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => addStudentMutation.mutate()}
                            disabled={!newStudentName || !newStudentEmail || !newStudentPassword || addStudentMutation.isPending}
                            data-testid="button-submit-student"
                          >
                            Create Account
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  {studentsLoading ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Loading students...</p>
                  ) : !students || students.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No students yet</p>
                      <p className="text-xs text-muted-foreground">Add your first student to this class</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {students.map((student) => (
                        <div
                          key={student.id}
                          className="p-4 rounded-lg bg-muted/50 hover-elevate"
                          data-testid={`student-row-${student.id}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">{student.displayName}</span>
                                <Badge variant="outline" className="text-xs">{student.email}</Badge>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Lessons</p>
                                    <p className="font-medium">{student.lessonsCompleted}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Balance</p>
                                    <p className="font-medium">${student.simulatorBalance.toLocaleString()}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Total Profit</p>
                                    <p className={`font-medium ${student.totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                                      {student.totalProfit >= 0 ? '+' : ''}${student.totalProfit.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Trades</p>
                                    <p className="font-medium">
                                      {student.profitableTrades}/{student.totalTrades} wins
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeStudentMutation.mutate(student.id)}
                              data-testid={`button-remove-student-${student.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
