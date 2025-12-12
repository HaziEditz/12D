import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  ChevronRight,
  Loader2,
  Trophy,
  Crown,
  Medal,
  CreditCard,
  Lock
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

interface NewStudentResult {
  id: string;
  displayName: string;
  email: string;
  temporaryPassword: string;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [createClassOpen, setCreateClassOpen] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<NewStudentResult | null>(null);

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
      const response = await apiRequest("POST", `/api/teacher/classes/${selectedClass?.id}/students`, {
        displayName: newStudentName,
        email: newStudentEmail,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/classes", selectedClass?.id, "students"] });
      setCreatedStudent(data.student);
      setNewStudentName("");
      setNewStudentEmail("");
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

  const copyCredentials = () => {
    if (createdStudent) {
      const text = `Email: ${createdStudent.email}\nPassword: ${createdStudent.temporaryPassword}`;
      navigator.clipboard.writeText(text);
      toast({ title: "Login credentials copied!" });
    }
  };

  const closeStudentDialog = () => {
    setAddStudentOpen(false);
    setCreatedStudent(null);
    setNewStudentName("");
    setNewStudentEmail("");
  };

  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]" data-testid="unauthorized-message">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">You need to be a teacher to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasActiveSubscription = user.role === "admin" || (user.membershipTier === "school" && user.membershipStatus === "active");

  if (!hasActiveSubscription && user.role === "teacher") {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]" data-testid="subscription-required">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">Subscription Required</h2>
            <p className="text-muted-foreground mb-6">
              To access the Teacher Dashboard and manage your students, you need an active School Plan subscription.
            </p>
            <div className="rounded-lg bg-muted p-4 mb-6 text-left">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                School Plan - $8.49/student/month
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Create unlimited classes</li>
                <li>Add and manage student accounts</li>
                <li>Track student progress and performance</li>
                <li>Class leaderboards and analytics</li>
              </ul>
            </div>
            <Link href="/pricing">
              <Button className="w-full" data-testid="button-subscribe">
                Subscribe Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4 gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
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
                      {createClassMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Class
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-2">
            {classesLoading ? (
              <div className="flex items-center justify-center py-8" data-testid="loading-classes">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !classes || classes.length === 0 ? (
              <div className="text-center py-8" data-testid="empty-classes">
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
                    <span className="font-medium" data-testid={`text-class-name-${cls.id}`}>{cls.name}</span>
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
            <Card className="flex-1 flex items-center justify-center" data-testid="no-class-selected">
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
                      <CardTitle data-testid="text-selected-class-name">{selectedClass.name}</CardTitle>
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
                        disabled={deleteClassMutation.isPending}
                        data-testid="button-delete-class"
                      >
                        {deleteClassMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {students && students.length > 0 && (
                <Card data-testid="card-class-leaderboard">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      Class Leaderboard
                    </CardTitle>
                    <CardDescription>Top performing students by total profit</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[...students]
                        .sort((a, b) => (b.totalProfit ?? 0) - (a.totalProfit ?? 0))
                        .slice(0, 5)
                        .map((student, index) => (
                          <div 
                            key={student.id}
                            className={`flex items-center gap-3 p-3 rounded-lg ${
                              index === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' :
                              index === 1 ? 'bg-slate-400/10 border border-slate-400/20' :
                              index === 2 ? 'bg-orange-600/10 border border-orange-600/20' :
                              'bg-muted/50'
                            }`}
                            data-testid={`leaderboard-row-${index + 1}`}
                          >
                            <div className="flex items-center justify-center w-8 h-8">
                              {index === 0 ? (
                                <Crown className="h-6 w-6 text-yellow-500" />
                              ) : index === 1 ? (
                                <Medal className="h-5 w-5 text-slate-400" />
                              ) : index === 2 ? (
                                <Medal className="h-5 w-5 text-orange-600" />
                              ) : (
                                <span className="text-lg font-bold text-muted-foreground">{index + 1}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium" data-testid={`leaderboard-name-${index + 1}`}>{student.displayName}</p>
                              <p className="text-xs text-muted-foreground">
                                {student.lessonsCompleted} lessons | {student.profitableTrades}/{student.totalTrades} wins
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${student.totalProfit >= 0 ? 'text-success' : 'text-destructive'}`} data-testid={`leaderboard-profit-${index + 1}`}>
                                {student.totalProfit >= 0 ? '+' : ''}${student.totalProfit.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">${student.simulatorBalance.toLocaleString()}</p>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="flex-1 overflow-hidden flex flex-col">
                <CardHeader className="pb-3 flex-shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">Students</CardTitle>
                      <CardDescription data-testid="text-student-count">{students?.length ?? 0} students enrolled</CardDescription>
                    </div>
                    <Dialog open={addStudentOpen} onOpenChange={(open) => {
                      if (!open) closeStudentDialog();
                      else setAddStudentOpen(true);
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" data-testid="button-add-student">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Student
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        {createdStudent ? (
                          <>
                            <DialogHeader>
                              <DialogTitle>Student Account Created</DialogTitle>
                              <DialogDescription>
                                Share these login credentials with your student. They can use these to sign in.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="p-4 rounded-lg bg-muted">
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Student Name</p>
                                    <p className="font-medium" data-testid="text-created-student-name">{createdStudent.displayName}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Email</p>
                                    <p className="font-medium" data-testid="text-created-student-email">{createdStudent.email}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Temporary Password</p>
                                    <p className="font-mono font-medium text-lg" data-testid="text-created-student-password">{createdStudent.temporaryPassword}</p>
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                The student should change their password after logging in for the first time.
                              </p>
                            </div>
                            <DialogFooter className="gap-2">
                              <Button variant="outline" onClick={copyCredentials} data-testid="button-copy-credentials">
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Credentials
                              </Button>
                              <Button onClick={closeStudentDialog} data-testid="button-done-creating">
                                Done
                              </Button>
                            </DialogFooter>
                          </>
                        ) : (
                          <>
                            <DialogHeader>
                              <DialogTitle>Create Student Account</DialogTitle>
                              <DialogDescription>
                                Enter the student's details. A secure password will be automatically generated.
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
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => addStudentMutation.mutate()}
                                disabled={!newStudentName || !newStudentEmail || addStudentMutation.isPending}
                                data-testid="button-submit-student"
                              >
                                {addStudentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Create Account
                              </Button>
                            </DialogFooter>
                          </>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  {studentsLoading ? (
                    <div className="flex items-center justify-center py-8" data-testid="loading-students">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : !students || students.length === 0 ? (
                    <div className="text-center py-8" data-testid="empty-students">
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
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="font-medium" data-testid={`text-student-name-${student.id}`}>{student.displayName}</span>
                                <Badge variant="outline" className="text-xs">{student.email}</Badge>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Lessons</p>
                                    <p className="font-medium" data-testid={`text-lessons-${student.id}`}>{student.lessonsCompleted}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Balance</p>
                                    <p className="font-medium" data-testid={`text-balance-${student.id}`}>${student.simulatorBalance.toLocaleString()}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Total Profit</p>
                                    <p className={`font-medium ${student.totalProfit >= 0 ? 'text-success' : 'text-destructive'}`} data-testid={`text-profit-${student.id}`}>
                                      {student.totalProfit >= 0 ? '+' : ''}${student.totalProfit.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Trades</p>
                                    <p className="font-medium" data-testid={`text-trades-${student.id}`}>
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
                              disabled={removeStudentMutation.isPending}
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
