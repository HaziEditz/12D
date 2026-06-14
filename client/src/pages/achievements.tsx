import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import {
  TrendingUp, DollarSign, Zap, Award, BookOpen, GraduationCap,
  Wallet, CreditCard, Crown, User, Image, UserPlus, Users, Heart,
  Star, Trophy, Lock, ArrowUp, ArrowDown, Clock, Timer, Cpu, Layers,
  Target, Shield, ShieldCheck, RefreshCw, CheckCircle, Moon, Scale,
  Search, Brain, HelpCircle, CheckSquare, BookMarked, Rocket, Lightbulb,
  BarChart2, Activity, FileText, Shuffle, Coins, Globe, Flame, Edit,
  Bookmark, PiggyBank, MessageCircle, MessageSquare, Mail, Share2, Flag,
  Medal, Terminal, Eye, Calendar, BarChart, Percent, ArrowUpCircle,
  Sunrise, Gem,
} from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement: number;
  xpReward: number;
  unlocked?: boolean;
  unlockedAt?: string;
  progress?: number;
}

const iconMap: Record<string, any> = {
  TrendingUp, DollarSign, Zap, Award, BookOpen, GraduationCap,
  Wallet, CreditCard, Crown, User, Image, UserPlus, Users, Heart,
  Star, Trophy, Lock, ArrowUp, ArrowDown, Clock, Timer, Cpu, Layers,
  Target, Shield, ShieldCheck, RefreshCw, CheckCircle, Moon, Scale,
  Search, Brain, HelpCircle, CheckSquare, BookMarked, Rocket, Lightbulb,
  BarChart2, Activity, FileText, Shuffle, Coins, Globe, Flame, Edit,
  Bookmark, PiggyBank, MessageCircle, MessageSquare, Mail, Share2, Flag,
  Medal, Terminal, Eye, Calendar, BarChart, Percent, ArrowUpCircle,
  Sunrise, Gem,
};

const categoryMeta: Record<string, { label: string; color: string; glow: string; bg: string; border: string; iconColor: string }> = {
  trading: {
    label: "Trading",
    color: "from-blue-500 to-cyan-500",
    glow: "shadow-blue-500/40",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    iconColor: "text-blue-400",
  },
  learning: {
    label: "Learning",
    color: "from-emerald-500 to-green-400",
    glow: "shadow-emerald-500/40",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    iconColor: "text-emerald-400",
  },
  balance: {
    label: "Balance",
    color: "from-amber-500 to-yellow-400",
    glow: "shadow-amber-500/40",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    iconColor: "text-amber-400",
  },
  social: {
    label: "Social",
    color: "from-purple-500 to-pink-500",
    glow: "shadow-purple-500/40",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    iconColor: "text-purple-400",
  },
  milestone: {
    label: "Milestones",
    color: "from-orange-500 to-red-500",
    glow: "shadow-orange-500/40",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    iconColor: "text-orange-400",
  },
};

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const [hovered, setHovered] = useState(false);
  const IconComponent = iconMap[achievement.icon] || Award;
  const isUnlocked = achievement.unlocked;
  const progress = achievement.progress ?? 0;
  const meta = categoryMeta[achievement.category] || categoryMeta.milestone;

  return (
    <div
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid={`badge-achievement-${achievement.id}`}
    >
      {/* Badge */}
      <div
        className={`
          relative flex flex-col items-center justify-center w-full aspect-square rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden
          ${isUnlocked
            ? `${meta.bg} ${meta.border} shadow-lg ${meta.glow} scale-100 hover:scale-105 hover:shadow-xl`
            : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-600 hover:scale-105"
          }
        `}
      >
        {/* Unlocked shimmer */}
        {isUnlocked && (
          <div className={`absolute inset-0 bg-gradient-to-br ${meta.color} opacity-5 pointer-events-none`} />
        )}

        {/* Icon */}
        <div className={`
          relative z-10 w-10 h-10 rounded-xl flex items-center justify-center mb-2
          ${isUnlocked ? `bg-gradient-to-br ${meta.color} shadow-md` : "bg-zinc-800"}
        `}>
          {isUnlocked
            ? <IconComponent className="w-5 h-5 text-white" />
            : <Lock className="w-4 h-4 text-zinc-600" />
          }
        </div>

        {/* Name */}
        <p className={`
          text-center font-semibold leading-tight px-1 text-[11px] line-clamp-2
          ${isUnlocked ? "text-foreground" : "text-zinc-600"}
        `}>
          {achievement.name}
        </p>

        {/* XP badge for unlocked */}
        {isUnlocked && (
          <span className={`
            mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${meta.color} text-white
          `}>
            +{achievement.xpReward} XP
          </span>
        )}

        {/* Progress bar for locked with progress */}
        {!isUnlocked && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1">
            <div
              className={`h-full bg-gradient-to-r ${meta.color} opacity-70 transition-all duration-500`}
              style={{ width: `${Math.min(progress, 99)}%` }}
            />
          </div>
        )}
      </div>

      {/* Tooltip on hover */}
      {hovered && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className={`
            rounded-xl border p-3 shadow-2xl backdrop-blur-sm
            ${isUnlocked
              ? `bg-zinc-900/95 ${meta.border}`
              : "bg-zinc-900/95 border-zinc-700"
            }
          `}>
            {/* Tooltip title */}
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br ${meta.color}`}>
                <IconComponent className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="font-semibold text-sm text-foreground">{achievement.name}</p>
            </div>

            <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>

            {/* Status */}
            {isUnlocked ? (
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <p className="text-xs text-emerald-400 font-medium">
                  Unlocked {achievement.unlockedAt ? new Date(achievement.unlockedAt).toLocaleDateString() : ""}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className={`font-semibold ${meta.iconColor}`}>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" />
                  Reward: <span className="font-semibold text-foreground">+{achievement.xpReward} XP</span>
                </p>
              </>
            )}
          </div>
          {/* Arrow */}
          <div className={`w-2.5 h-2.5 rotate-45 mx-auto -mt-1.5 ${isUnlocked ? meta.bg : "bg-zinc-900/95"} border-r border-b ${isUnlocked ? meta.border : "border-zinc-700"}`} />
        </div>
      )}
    </div>
  );
}

function CategorySash({ category, achievements }: { category: string; achievements: Achievement[] }) {
  const meta = categoryMeta[category] || categoryMeta.milestone;
  const unlocked = achievements.filter(a => a.unlocked).length;
  const total = achievements.length;
  const pct = total > 0 ? Math.round((unlocked / total) * 100) : 0;

  return (
    <div className="mb-10">
      {/* Category header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-1 h-8 rounded-full bg-gradient-to-b ${meta.color}`} />
          <div>
            <h2 className="text-base font-bold text-foreground">{meta.label}</h2>
            <p className="text-xs text-muted-foreground">{unlocked} of {total} unlocked</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 hidden sm:block">
            <Progress value={pct} className="h-2" />
          </div>
          <span className={`text-sm font-bold bg-gradient-to-r ${meta.color} bg-clip-text text-transparent`}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Achievement grid sash */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5">
        {achievements.map(achievement => (
          <AchievementBadge key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  const { user } = useAuth();

  const { data: achievements, isLoading } = useQuery<Achievement[]>({
    queryKey: user ? ["/api/user/achievements"] : ["/api/achievements"],
  });

  const categoryOrder = ["trading", "learning", "balance", "social", "milestone"];

  const groupedAchievements = achievements?.reduce((acc, achievement) => {
    const category = achievement.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>) ?? {};

  const totalAchievements = achievements?.length ?? 0;
  const unlockedCount = achievements?.filter(a => a.unlocked).length ?? 0;
  const totalXP = achievements?.filter(a => a.unlocked).reduce((sum, a) => sum + a.xpReward, 0) ?? 0;
  const completionPct = totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-24 w-full mb-8" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="mb-10">
            <Skeleton className="h-8 w-40 mb-4" />
            <div className="grid grid-cols-6 md:grid-cols-10 gap-2.5">
              {[...Array(10)].map((_, j) => (
                <Skeleton key={j} className="aspect-square rounded-2xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Trophy className="h-7 w-7 text-amber-400" />
          <h1 className="text-3xl font-bold" data-testid="text-achievements-title">
            Achievements
          </h1>
        </div>
        <p className="text-muted-foreground ml-10">
          Collect badges by trading, learning, and growing your portfolio
        </p>
      </div>

      {/* Overall progress banner */}
      {user && (
        <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 mb-10 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-amber-600/5 pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Stats row */}
            <div className="flex gap-6 flex-1">
              <div className="text-center" data-testid="stat-unlocked">
                <p className="text-2xl font-black text-foreground">{unlockedCount}</p>
                <p className="text-xs text-muted-foreground">Unlocked</p>
              </div>
              <div className="w-px bg-zinc-800" />
              <div className="text-center">
                <p className="text-2xl font-black text-foreground">{totalAchievements}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="w-px bg-zinc-800" />
              <div className="text-center">
                <p className="text-2xl font-black text-amber-400">{totalXP.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">XP Earned</p>
              </div>
            </div>

            {/* Overall progress bar */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Overall Completion</span>
                <span className="text-sm font-black text-foreground" data-testid="text-completion-pct">{completionPct}%</span>
              </div>
              <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500 transition-all duration-700"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{totalAchievements - unlockedCount} remaining</p>
            </div>
          </div>
        </div>
      )}

      {/* Category sashes */}
      {categoryOrder.map(category => {
        const categoryAchievements = groupedAchievements[category];
        if (!categoryAchievements?.length) return null;
        return (
          <CategorySash
            key={category}
            category={category}
            achievements={categoryAchievements}
          />
        );
      })}

      {/* Other categories not in the order */}
      {Object.entries(groupedAchievements)
        .filter(([cat]) => !categoryOrder.includes(cat))
        .map(([category, catAchievements]) => (
          <CategorySash key={category} category={category} achievements={catAchievements} />
        ))}

      {!achievements?.length && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <Trophy className="h-10 w-10 text-zinc-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No achievements yet</h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            Start trading and learning to unlock your first achievements!
          </p>
        </div>
      )}
    </div>
  );
}
