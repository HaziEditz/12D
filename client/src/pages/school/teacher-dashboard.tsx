import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import SchoolLayout from "@/layouts/school-layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import {
  Users, GraduationCap, Target, Zap, Plus, Search,
  BarChart3, TrendingUp, Coins, Trash2, CheckCircle2,
  Clock, Sparkles, ChevronRight, Copy
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

const tabs = ["Overview", "Classes", "Students", "Assignments", "Market Events", "Analytics"] as const;
type Tab = typeof tabs[number];

const createClassSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  ageGroup: z.enum(["primary", "intermediate", "high_school"]),
});

const createAssignmentSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(["profit_target", "lesson_completion", "portfolio_balance"]),
  targetValue: z.coerce.number().min(1),
  dueDate: z.string().optional(),
  classId: z.string().optional(),
});

const createEventSchema = z.object({
  classId: z.string().min(1, "Select a class"),
  type: z.enum(["boom", "crash", "news", "tip"]),
  title: z.string().min(2),
  description: z.string().optional(),
});

export default function TeacherCommandCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [studentSearch, setStudentSearch] = useState("");
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  const { data: classes = [] } = useQuery<any[]>({ queryKey: ["/api/teacher/classes"] });
  const { data: students = [] } = useQuery<any[]>({ queryKey: ["/api/teacher/students"] });
  const { data: assignments = [] } = useQuery<any[]>({ queryKey: ["/api/teacher/assignments"] });
  const { data: events = [] } = useQuery<any[]>({ queryKey: ["/api/classroom/events"] });

  const avgBalance = students.length > 0
    ? students.reduce((s: number, u: any) => s + parseFloat(u.simulatorBalance ?? "10000"), 0) / students.length
    : 10000;

  const pendingAssignments = assignments.filter((a: any) => !a.completed).length;

  // Create class
  const classForm = useForm({ resolver: zodResolver(createClassSchema), defaultValues: { name: "", ageGroup: "high_school" as const } });
  const createClassMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/teacher/classes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/classes"] });
      classForm.reset();
      setClassDialogOpen(false);
      toast({ title: "Class created!" });
    },
  });

  // Create assignment
  const assignmentForm = useForm({ resolver: zodResolver(createAssignmentSchema), defaultValues: { title: "", description: "", type: "profit_target" as const, targetValue: 100 } });
  const createAssignmentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/teacher/assignments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/assignments"] });
      assignmentForm.reset();
      setAssignmentDialogOpen(false);
      toast({ title: "Assignment created!" });
    },
  });

  // Create event
  const eventForm = useForm({ resolver: zodResolver(createEventSchema), defaultValues: { classId: "", type: "news" as const, title: "", description: "" } });
  const createEventMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/classroom/events", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classroom/events"] });
      eventForm.reset();
      setEventDialogOpen(false);
      toast({ title: "Event posted!" });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/teacher/classes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/teacher/classes"] }),
  });

  const filteredStudents = students.filter((s: any) =>
    s.displayName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const analyticsData = classes.map((cls: any) => {
    const classStudents = students.filter((s: any) => s.classId === cls.id);
    const avgBal = classStudents.length > 0
      ? classStudents.reduce((sum: number, s: any) => sum + parseFloat(s.simulatorBalance ?? "10000"), 0) / classStudents.length
      : 10000;
    return { name: cls.name, balance: Math.round(avgBal), students: classStudents.length };
  });

  return (
    <SchoolLayout>
      <div className="p-5 max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-teal-700 via-cyan-700 to-blue-800">
          <div className="absolute inset-0 sw-shimmer-bg opacity-20" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Zap className="h-6 w-6 text-teal-300" /> Command Centre
              </h1>
              <p className="text-teal-200 text-sm mt-0.5">Welcome back, {user?.displayName?.split(" ")[0]} — manage your classes below</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-white/15 hover:bg-white/25 text-white border border-white/20 font-bold gap-1.5" data-testid="button-create-class">
                    <Plus className="h-4 w-4" /> New Class
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0f172a] border-white/10">
                  <DialogHeader><DialogTitle className="text-white">Create a Class</DialogTitle></DialogHeader>
                  <Form {...classForm}>
                    <form onSubmit={classForm.handleSubmit(d => createClassMutation.mutate(d))} className="space-y-4">
                      <FormField control={classForm.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel className="text-slate-300">Class Name</FormLabel><FormControl><Input {...field} placeholder="e.g. Period 3 Economics" className="bg-white/5 border-white/20 text-white" data-testid="input-class-name" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={classForm.control} name="ageGroup" render={({ field }) => (
                        <FormItem><FormLabel className="text-slate-300">Age Group</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="bg-white/5 border-white/20 text-white" data-testid="select-age-group"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent className="bg-[#0f172a] border-white/20">
                              <SelectItem value="primary">Primary (Ages 6–10)</SelectItem>
                              <SelectItem value="intermediate">Intermediate (Ages 11–13)</SelectItem>
                              <SelectItem value="high_school">High School (Ages 14–18)</SelectItem>
                            </SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-500 text-white" disabled={createClassMutation.isPending} data-testid="button-submit-class">
                        {createClassMutation.isPending ? "Creating..." : "Create Class"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Students", value: students.length, icon: Users, color: "text-teal-400" },
            { label: "Active Classes", value: classes.length, icon: GraduationCap, color: "text-purple-400" },
            { label: "Pending Assignments", value: pendingAssignments, icon: Target, color: "text-blue-400" },
            { label: "Avg Balance", value: `$${Math.round(avgBalance).toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400" },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl p-4 bg-white/5 border border-white/10" data-testid={`stat-teacher-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-slate-500 text-xs">{stat.label}</p>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
              data-testid={`tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "Overview" && <OverviewTab classes={classes} students={students} assignments={assignments} events={events} />}
        {activeTab === "Classes" && <ClassesTab classes={classes} deleteClass={(id) => deleteClassMutation.mutate(id)} classDialogOpen={classDialogOpen} setClassDialogOpen={setClassDialogOpen} />}
        {activeTab === "Students" && <StudentsTab students={filteredStudents} search={studentSearch} setSearch={setStudentSearch} />}
        {activeTab === "Assignments" && (
          <AssignmentsTab
            assignments={assignments}
            classes={classes}
            dialogOpen={assignmentDialogOpen}
            setDialogOpen={setAssignmentDialogOpen}
            form={assignmentForm}
            onSubmit={(d: any) => createAssignmentMutation.mutate(d)}
            isPending={createAssignmentMutation.isPending}
          />
        )}
        {activeTab === "Market Events" && (
          <MarketEventsTab
            events={events}
            classes={classes}
            dialogOpen={eventDialogOpen}
            setDialogOpen={setEventDialogOpen}
            form={eventForm}
            onSubmit={(d: any) => createEventMutation.mutate(d)}
            isPending={createEventMutation.isPending}
          />
        )}
        {activeTab === "Analytics" && <AnalyticsTab analyticsData={analyticsData} students={students} assignments={assignments} />}
      </div>
    </SchoolLayout>
  );
}

function OverviewTab({ classes, students, assignments, events }: any) {
  const recentStudents = [...students].sort((a, b) => b.xp - a.xp).slice(0, 5);
  const recentEvents = events.slice(0, 3);
  const pendingCount = assignments.filter((a: any) => !a.completed).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="rounded-xl p-5 bg-white/5 border border-white/10">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-400" /> Top Students by XP
        </h3>
        <div className="space-y-2">
          {recentStudents.map((s: any, i: number) => (
            <div key={s.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <span className={`text-sm font-black w-5 ${i === 0 ? "text-amber-400" : "text-slate-600"}`}>#{i+1}</span>
              <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-xs font-black text-white">
                {s.displayName?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-slate-300 flex-1 truncate font-semibold">{s.displayName}</span>
              <div className="flex items-center gap-1 text-purple-400">
                <Zap className="h-3 w-3" />
                <span className="text-xs font-bold">{s.xp ?? 0} XP</span>
              </div>
            </div>
          ))}
          {recentStudents.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No students yet</p>}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl p-5 bg-white/5 border border-white/10">
          <h3 className="font-bold text-white mb-3 text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-400" /> Assignment Status
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-black text-blue-400">{pendingCount}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-emerald-400">{assignments.length - pendingCount}</p>
              <p className="text-xs text-slate-500">Completed</p>
            </div>
            <div className="flex-1">
              <Progress value={assignments.length > 0 ? ((assignments.length - pendingCount) / assignments.length) * 100 : 0} className="h-3" />
              <p className="text-xs text-slate-500 mt-1">{assignments.length > 0 ? Math.round(((assignments.length - pendingCount) / assignments.length) * 100) : 0}% completion rate</p>
            </div>
          </div>
        </div>

        {recentEvents.length > 0 && (
          <div className="rounded-xl p-5 bg-white/5 border border-white/10">
            <h3 className="font-bold text-white mb-3 text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-400" /> Recent Events
            </h3>
            <div className="space-y-2">
              {recentEvents.map((e: any) => (
                <div key={e.id} className={`flex items-center gap-2.5 p-2.5 rounded-lg ${getEventBg(e.type)}`}>
                  <span className="text-xl">{getEventEmoji(e.type)}</span>
                  <div>
                    <p className="text-xs font-bold text-white">{e.title}</p>
                    <p className="text-xs text-slate-500">{getEventLabel(e.type)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ClassesTab({ classes, deleteClass, classDialogOpen, setClassDialogOpen }: any) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      {classes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls: any) => (
            <div key={cls.id} className="rounded-xl p-5 bg-white/5 border border-white/10 hover:border-teal-500/30 transition-all" data-testid={`class-card-${cls.id}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-white">{cls.name}</h3>
                  <Badge className={`mt-1 text-xs ${getAgeGroupStyle(cls.ageGroup)}`}>
                    {getAgeGroupLabel(cls.ageGroup)}
                  </Badge>
                </div>
                <Button size="sm" variant="ghost" className="text-slate-600 hover:text-rose-400 h-7 w-7 p-0" onClick={() => deleteClass(cls.id)} data-testid={`button-delete-class-${cls.id}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <p>Join Code:</p>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-teal-400 text-base font-bold tracking-wider">{cls.joinCode}</code>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-500 hover:text-teal-400" onClick={() => copyCode(cls.joinCode)} data-testid={`button-copy-code-${cls.id}`}>
                    {copied === cls.joinCode ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <GraduationCap className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-400 font-bold mb-1">No classes yet</h3>
          <p className="text-slate-600 text-sm mb-4">Create your first class to get started</p>
          <Button onClick={() => setClassDialogOpen(true)} className="bg-teal-600 hover:bg-teal-500 text-white" data-testid="button-create-first-class">
            <Plus className="h-4 w-4 mr-1.5" /> Create a Class
          </Button>
        </div>
      )}
    </div>
  );
}

function StudentsTab({ students, search, setSearch }: any) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search students..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-white/5 border-white/20 text-white placeholder:text-slate-600"
          data-testid="input-student-search"
        />
      </div>
      {students.length > 0 ? (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-4 sm:grid-cols-6 px-4 py-2.5 bg-white/5 text-xs text-slate-500 font-semibold">
            <span className="col-span-2">Student</span>
            <span className="hidden sm:block">Balance</span>
            <span className="hidden sm:block">XP</span>
            <span>Level</span>
            <span>Tokens</span>
          </div>
          <div className="divide-y divide-white/5 max-h-96 overflow-y-auto scrollbar-hide">
            {students.map((s: any) => {
              const level = Math.min(Math.floor((s.xp ?? 0) / 100) + 1, 100);
              return (
                <div key={s.id} className="grid grid-cols-4 sm:grid-cols-6 px-4 py-3 hover:bg-white/3 transition-colors items-center" data-testid={`student-row-${s.id}`}>
                  <div className="col-span-2 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-xs font-black text-white shrink-0">
                      {s.displayName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-white truncate">{s.displayName}</p>
                      <p className="text-xs text-slate-600 truncate">{s.email}</p>
                    </div>
                  </div>
                  <span className="hidden sm:block text-sm text-emerald-400 font-mono">${parseFloat(s.simulatorBalance ?? "10000").toLocaleString()}</span>
                  <span className="hidden sm:block text-sm text-purple-400 font-bold">{s.xp ?? 0}</span>
                  <span className="text-sm text-teal-400 font-bold">Lv.{level}</span>
                  <span className="text-sm text-amber-400 font-bold flex items-center gap-1">
                    <Coins className="h-3 w-3" />{s.classroomTokens ?? 0}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-500">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No students found. Share your class join code with students.</p>
        </div>
      )}
    </div>
  );
}

function AssignmentsTab({ assignments, classes, dialogOpen, setDialogOpen, form, onSubmit, isPending }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-slate-400 text-sm">{assignments.length} assignment{assignments.length !== 1 ? "s" : ""} total</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-500 text-white gap-1.5" data-testid="button-create-assignment">
              <Plus className="h-4 w-4" /> New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0f172a] border-white/10">
            <DialogHeader><DialogTitle className="text-white">Create Assignment</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel className="text-slate-300">Title</FormLabel><FormControl><Input {...field} placeholder="e.g. Earn $500 profit" className="bg-white/5 border-white/20 text-white" data-testid="input-assignment-title" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel className="text-slate-300">Description (optional)</FormLabel><FormControl><Textarea {...field} placeholder="Describe the assignment..." className="bg-white/5 border-white/20 text-white" data-testid="input-assignment-description" /></FormControl></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel className="text-slate-300">Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="bg-white/5 border-white/20 text-white" data-testid="select-assignment-type"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent className="bg-[#0f172a] border-white/20">
                          <SelectItem value="profit_target">Profit Target</SelectItem>
                          <SelectItem value="lesson_completion">Lesson Completion</SelectItem>
                          <SelectItem value="portfolio_balance">Portfolio Balance</SelectItem>
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="targetValue" render={({ field }) => (
                    <FormItem><FormLabel className="text-slate-300">Target Value</FormLabel><FormControl><Input {...field} type="number" placeholder="100" className="bg-white/5 border-white/20 text-white" data-testid="input-assignment-target" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="dueDate" render={({ field }) => (
                  <FormItem><FormLabel className="text-slate-300">Due Date (optional)</FormLabel><FormControl><Input {...field} type="date" className="bg-white/5 border-white/20 text-white" data-testid="input-assignment-due" /></FormControl></FormItem>
                )} />
                {classes.length > 0 && (
                  <FormField control={form.control} name="classId" render={({ field }) => (
                    <FormItem><FormLabel className="text-slate-300">Assign to Class (optional)</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="bg-white/5 border-white/20 text-white" data-testid="select-assignment-class"><SelectValue placeholder="All classes" /></SelectTrigger></FormControl>
                        <SelectContent className="bg-[#0f172a] border-white/20">
                          {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                )}
                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-500 text-white" disabled={isPending} data-testid="button-submit-assignment">
                  {isPending ? "Creating..." : "Create Assignment"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {assignments.length > 0 ? (
        <div className="space-y-3">
          {assignments.map((a: any) => (
            <div key={a.id} className="rounded-xl p-4 bg-white/5 border border-white/10 hover:border-teal-500/20 transition-all" data-testid={`assignment-card-${a.id}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-bold text-white">{a.title}</p>
                  {a.description && <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={`text-xs ${getAssignmentTypeStyle(a.type)}`}>{getAssignmentTypeLabel(a.type)}</Badge>
                  {a.dueDate && (
                    <span className="text-xs text-slate-600 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{new Date(a.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>Target: <span className="text-white font-semibold">{a.targetValue}</span></span>
                <ChevronRight className="h-3 w-3" />
                <span>Type: <span className="text-teal-400 font-semibold">{getAssignmentTypeLabel(a.type)}</span></span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-500">
          <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="mb-3">No assignments yet</p>
          <Button onClick={() => setDialogOpen(true)} className="bg-teal-600 hover:bg-teal-500 text-white" data-testid="button-create-first-assignment">
            <Plus className="h-4 w-4 mr-1.5" /> Create Assignment
          </Button>
        </div>
      )}
    </div>
  );
}

function MarketEventsTab({ events, classes, dialogOpen, setDialogOpen, form, onSubmit, isPending }: any) {
  const previewType = form.watch?.("type") ?? "news";
  const previewTitle = form.watch?.("title") ?? "Your event title";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-slate-400 text-sm">{events.length} active event{events.length !== 1 ? "s" : ""}</p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-teal-600 hover:bg-teal-500 text-white gap-1.5" data-testid="button-post-event">
                <Plus className="h-4 w-4" /> Post Event
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0f172a] border-white/10">
              <DialogHeader><DialogTitle className="text-white">Post Market Event</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="classId" render={({ field }) => (
                    <FormItem><FormLabel className="text-slate-300">Class</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="bg-white/5 border-white/20 text-white" data-testid="select-event-class"><SelectValue placeholder="Choose a class" /></SelectTrigger></FormControl>
                        <SelectContent className="bg-[#0f172a] border-white/20">
                          {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel className="text-slate-300">Event Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="bg-white/5 border-white/20 text-white" data-testid="select-event-type"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent className="bg-[#0f172a] border-white/20">
                          <SelectItem value="boom">🚀 Market Boom</SelectItem>
                          <SelectItem value="crash">📉 Market Crash</SelectItem>
                          <SelectItem value="news">📰 News Alert</SelectItem>
                          <SelectItem value="tip">💡 Trading Tip</SelectItem>
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel className="text-slate-300">Title</FormLabel><FormControl><Input {...field} placeholder="e.g. Tech stocks surge 20%!" className="bg-white/5 border-white/20 text-white" data-testid="input-event-title" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel className="text-slate-300">Description (optional)</FormLabel><FormControl><Textarea {...field} placeholder="Describe the market event..." className="bg-white/5 border-white/20 text-white" data-testid="input-event-description" /></FormControl></FormItem>
                  )} />
                  <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-500 text-white" disabled={isPending || classes.length === 0} data-testid="button-submit-event">
                    {isPending ? "Posting..." : "Post Event"}
                  </Button>
                  {classes.length === 0 && <p className="text-xs text-rose-400 text-center">Create a class first to post events</p>}
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {events.length > 0 ? (
          <div className="space-y-3">
            {events.map((e: any) => (
              <div key={e.id} className={`rounded-xl p-4 border ${getEventBg(e.type)}`} data-testid={`event-card-${e.id}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{getEventEmoji(e.type)}</span>
                  <div>
                    <p className="font-bold text-white text-sm">{e.title}</p>
                    {e.description && <p className="text-xs text-slate-400 mt-0.5">{e.description}</p>}
                    <Badge className={`mt-1.5 text-xs ${getEventBadgeStyle(e.type)}`}>{getEventLabel(e.type)}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No events posted yet</p>
          </div>
        )}
      </div>

      {/* Live Preview */}
      <div className="rounded-xl p-5 bg-white/5 border border-white/10">
        <h3 className="font-bold text-white mb-4 text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-400" /> Student Preview
        </h3>
        <p className="text-slate-500 text-xs mb-4">This is how students will see the event:</p>
        <div className={`rounded-xl p-4 border ${getEventBg(previewType)}`}>
          <div className="flex items-start gap-3">
            <span className="text-3xl shrink-0 sw-float">{getEventEmoji(previewType)}</span>
            <div>
              <Badge className={`text-xs mb-1 ${getEventBadgeStyle(previewType)}`}>{getEventLabel(previewType)}</Badge>
              <p className="font-black text-white">{previewTitle || "Your event title"}</p>
              <p className="text-xs text-slate-400 mt-1">Just now • From your teacher</p>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/5">
          <p className="text-xs text-slate-500 text-center">
            {getEventHint(previewType)}
          </p>
        </div>
      </div>
    </div>
  );
}

function AnalyticsTab({ analyticsData, students, assignments }: any) {
  const topStudents = [...students].sort((a, b) => parseFloat(b.simulatorBalance ?? "10000") - parseFloat(a.simulatorBalance ?? "10000")).slice(0, 8);

  return (
    <div className="space-y-5">
      <div className="rounded-xl p-5 bg-white/5 border border-white/10">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-teal-400" /> Average Balance by Class
        </h3>
        {analyticsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} />
              <YAxis tick={{ fontSize: 11, fill: "#475569" }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [`$${parseFloat(v).toLocaleString()}`, "Avg Balance"]} contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }} />
              <Bar dataKey="balance" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Create classes and add students to see analytics</p>
          </div>
        )}
      </div>

      <div className="rounded-xl p-5 bg-white/5 border border-white/10">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" /> Top Performers
        </h3>
        {topStudents.length > 0 ? (
          <div className="space-y-2">
            {topStudents.map((s: any, i: number) => {
              const bal = parseFloat(s.simulatorBalance ?? "10000");
              const pct = ((bal - 10000) / 10000 * 100).toFixed(1);
              return (
                <div key={s.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0" data-testid={`analytics-student-${s.id}`}>
                  <span className={`text-xs font-black w-6 text-center ${i === 0 ? "text-amber-400" : "text-slate-600"}`}>#{i+1}</span>
                  <div className="w-7 h-7 rounded-full bg-teal-600/30 border border-teal-500/30 flex items-center justify-center text-xs font-black text-teal-300">
                    {s.displayName?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-300 flex-1 truncate">{s.displayName}</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">${bal.toLocaleString()}</span>
                  <span className={`text-xs font-bold ${parseFloat(pct) >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {parseFloat(pct) >= 0 ? "+" : ""}{pct}%
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-6">No students yet</p>
        )}
      </div>
    </div>
  );
}

/* ===== HELPERS ===== */
function getAgeGroupLabel(g: string) {
  return g === "primary" ? "Primary (6–10)" : g === "intermediate" ? "Intermediate (11–13)" : "High School (14–18)";
}
function getAgeGroupStyle(g: string) {
  return g === "primary" ? "bg-amber-500/20 text-amber-300" : g === "intermediate" ? "bg-purple-500/20 text-purple-300" : "bg-teal-500/20 text-teal-300";
}
function getEventEmoji(type: string) {
  return { boom: "🚀", crash: "📉", news: "📰", tip: "💡" }[type] ?? "📢";
}
function getEventLabel(type: string) {
  return { boom: "Market Boom", crash: "Market Crash", news: "News Alert", tip: "Trading Tip" }[type] ?? "Event";
}
function getEventBg(type: string) {
  return { boom: "bg-emerald-500/10 border-emerald-500/25", crash: "bg-rose-500/10 border-rose-500/25", news: "bg-blue-500/10 border-blue-500/25", tip: "bg-amber-500/10 border-amber-500/25" }[type] ?? "bg-white/5 border-white/10";
}
function getEventBadgeStyle(type: string) {
  return { boom: "bg-emerald-500/20 text-emerald-400", crash: "bg-rose-500/20 text-rose-400", news: "bg-blue-500/20 text-blue-400", tip: "bg-amber-500/20 text-amber-400" }[type] ?? "bg-white/10 text-white";
}
function getEventHint(type: string) {
  return {
    boom: "Students will see this as a positive market signal — great time to buy!",
    crash: "Students will see this as a market warning — time to be cautious or sell.",
    news: "Students will receive this as a general market update.",
    tip: "Students will receive this as a teaching moment from you.",
  }[type] ?? "Students will see this event in their dashboard.";
}
function getAssignmentTypeLabel(type: string) {
  return { profit_target: "Profit Target", lesson_completion: "Lesson", portfolio_balance: "Balance" }[type] ?? type;
}
function getAssignmentTypeStyle(type: string) {
  return { profit_target: "bg-emerald-500/20 text-emerald-400", lesson_completion: "bg-blue-500/20 text-blue-400", portfolio_balance: "bg-purple-500/20 text-purple-400" }[type] ?? "bg-white/10 text-white";
}
