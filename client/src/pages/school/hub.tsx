import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import SchoolLayout from "@/layouts/school-layout";
import { getLevelInfo } from "@/lib/levels";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, Gamepad2, BookOpen, Trophy, Zap,
  Coins, Star, TrendingUp, Users, ChevronRight, Sparkles
} from "lucide-react";
import { Link } from "wouter";

export default function SchoolHub() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isTeacher = user?.role === "teacher";

  const { data: classData } = useQuery<any>({
    queryKey: ["/api/classroom"],
    enabled: user?.role === "student",
  });

  const { data: teacherClasses } = useQuery<any[]>({
    queryKey: ["/api/teacher/classes"],
    enabled: isTeacher,
  });

  const ageGroup = classData?.class?.ageGroup ?? "high_school";
  const isPrimary = ageGroup === "primary";
  const levelInfo = getLevelInfo(user?.xp ?? 0);
  const tokens = (user as any)?.classroomTokens ?? 0;

  const studentActions = [
    {
      emoji: "🏫",
      title: "My Classroom",
      desc: "See your class, assignments & leaderboard",
      href: "/school/student",
      color: isPrimary ? "from-pink-400 to-rose-500" : "from-teal-500 to-cyan-600",
      big: true,
    },
    {
      emoji: "🎮",
      title: "Fun Zone",
      desc: "Play games and earn tokens",
      href: "/school/fun-zone",
      color: isPrimary ? "from-purple-400 to-violet-500" : "from-purple-500 to-violet-600",
      big: true,
    },
    {
      emoji: "📚",
      title: "Lessons",
      desc: "Learn and complete quizzes",
      href: "/lessons",
      color: isPrimary ? "from-blue-400 to-indigo-500" : "from-blue-500 to-indigo-600",
    },
    {
      emoji: "🏆",
      title: "Leaderboard",
      desc: "See how you rank",
      href: "/leaderboard",
      color: isPrimary ? "from-amber-400 to-orange-500" : "from-amber-500 to-orange-600",
    },
  ];

  const teacherActions = [
    {
      emoji: "⚡",
      title: "Command Centre",
      desc: "Manage classes, students & assignments",
      href: "/school/teacher",
      color: "from-teal-500 to-cyan-600",
      big: true,
    },
    {
      emoji: "📊",
      title: "Analytics",
      desc: "Track class performance",
      href: "/school/teacher",
      color: "from-purple-500 to-violet-600",
    },
    {
      emoji: "📚",
      title: "Browse Lessons",
      desc: "Preview lesson content",
      href: "/lessons",
      color: "from-blue-500 to-indigo-600",
    },
    {
      emoji: "🏆",
      title: "Leaderboard",
      desc: "See student rankings",
      href: "/leaderboard",
      color: "from-amber-500 to-orange-600",
    },
  ];

  const actions = isTeacher ? teacherActions : studentActions;
  const greeting = getGreeting();

  return (
    <SchoolLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <div className={`relative overflow-hidden rounded-3xl p-8 ${
          isPrimary
            ? "bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400"
            : "bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-700"
        }`}>
          <div className="absolute inset-0 sw-shimmer-bg opacity-30" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className={`text-sm font-semibold mb-1 ${isPrimary ? "text-amber-100" : "text-teal-100"}`}>
                {greeting}
              </p>
              <h1 className="text-3xl font-black text-white">
                {isPrimary ? `Hey ${user?.displayName?.split(" ")[0] ?? "there"}! 👋` : `Welcome back, ${user?.displayName?.split(" ")[0] ?? "there"}`}
              </h1>
              <p className={`mt-1 ${isPrimary ? "text-amber-100" : "text-cyan-100"}`}>
                {isTeacher
                  ? `You have ${teacherClasses?.length ?? 0} class${(teacherClasses?.length ?? 0) !== 1 ? "es" : ""} active`
                  : classData?.class?.name
                    ? `You're in ${classData.class.name}`
                    : "Ready to learn and earn today?"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {!isTeacher && (
                <div className={`px-5 py-3 rounded-2xl text-center ${isPrimary ? "bg-white/25" : "bg-white/15"} sw-token-glow`}>
                  <div className="flex items-center gap-1.5">
                    <Coins className="h-5 w-5 text-amber-300" />
                    <span className="text-2xl font-black text-white">{tokens}</span>
                  </div>
                  <p className={`text-xs mt-0.5 font-semibold ${isPrimary ? "text-amber-100" : "text-cyan-100"}`}>Tokens</p>
                </div>
              )}
              <div className={`px-5 py-3 rounded-2xl text-center ${isPrimary ? "bg-white/25" : "bg-white/15"}`}>
                <div className="flex items-center gap-1.5">
                  <Star className="h-5 w-5 text-yellow-300" />
                  <span className="text-2xl font-black text-white">Lv.{levelInfo.level}</span>
                </div>
                <p className={`text-xs mt-0.5 font-semibold ${isPrimary ? "text-amber-100" : "text-cyan-100"}`}>{levelInfo.title}</p>
              </div>
            </div>
          </div>
          {isPrimary && (
            <div className="absolute top-3 right-6 text-4xl sw-float opacity-60">🌟</div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className={`text-lg font-black mb-4 ${isPrimary ? "text-amber-900" : "text-white"}`}>
            {isPrimary ? "✨ What do you want to do?" : "Quick Actions"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map((action, i) => (
              <Link key={action.href + i} href={action.href}>
                <div
                  className={`relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-200 hover:scale-105 hover:-translate-y-1 ${
                    action.big ? "p-5" : "p-4"
                  } bg-gradient-to-br ${action.color} shadow-lg`}
                  data-testid={`card-hub-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity" />
                  <div className={`text-${action.big ? "4xl" : "3xl"} mb-2 sw-bounce-in`}>{action.emoji}</div>
                  <p className="font-black text-white text-base leading-tight">{action.title}</p>
                  <p className="text-white/70 text-xs mt-1">{action.desc}</p>
                  <ChevronRight className="absolute bottom-3 right-3 h-4 w-4 text-white/50" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats / Info Row */}
        {!isTeacher && classData?.class && (
          <div className={`rounded-2xl p-5 border ${
            isPrimary
              ? "bg-amber-50 border-amber-200"
              : "bg-white/5 border-white/10"
          }`}>
            <h3 className={`text-sm font-bold mb-3 ${isPrimary ? "text-amber-800" : "text-slate-400"}`}>
              {isPrimary ? "📋 My Class Info" : "Class Overview"}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: isPrimary ? "My Class 🏫" : "Class", value: classData.class.name, icon: GraduationCap },
                { label: isPrimary ? "My Teacher 👩‍🏫" : "Teacher", value: classData.teacher?.displayName ?? "—", icon: Users },
                { label: isPrimary ? "My Level ⭐" : "Level", value: `${levelInfo.level} (${levelInfo.title})`, icon: Star },
                { label: isPrimary ? "My XP 🔥" : "XP", value: `${user?.xp ?? 0} pts`, icon: Zap },
              ].map(stat => (
                <div key={stat.label} className={`rounded-xl p-3 ${isPrimary ? "bg-white border border-amber-100" : "bg-white/5"}`}>
                  <p className={`text-xs mb-1 ${isPrimary ? "text-amber-700" : "text-slate-500"}`}>{stat.label}</p>
                  <p className={`font-bold text-sm truncate ${isPrimary ? "text-amber-900" : "text-white"}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {isTeacher && (
          <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
            <h3 className="text-sm font-bold mb-3 text-slate-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-400" />
              Your Classes
            </h3>
            {teacherClasses && teacherClasses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {teacherClasses.map((cls: any) => (
                  <Link key={cls.id} href="/school/teacher">
                    <div className="rounded-xl p-4 bg-white/5 border border-white/10 hover:border-teal-500/30 hover:bg-teal-500/5 transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-bold text-white text-sm">{cls.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          cls.ageGroup === "primary" ? "bg-amber-500/20 text-amber-300" :
                          cls.ageGroup === "intermediate" ? "bg-purple-500/20 text-purple-300" :
                          "bg-teal-500/20 text-teal-300"
                        }`}>
                          {cls.ageGroup === "primary" ? "Primary" : cls.ageGroup === "intermediate" ? "Intermediate" : "High School"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Join code: <span className="text-teal-400 font-mono">{cls.joinCode}</span></p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm mb-3">No classes yet</p>
                <Link href="/school/teacher">
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-500 text-white">Create Your First Class</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </SchoolLayout>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning ☀️";
  if (h < 17) return "Good afternoon 🌤️";
  return "Good evening 🌙";
}
