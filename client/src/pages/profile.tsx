import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  TrendingUp, 
  BookOpen, 
  Trophy, 
  Target,
  Calendar,
  Crown,
  GraduationCap,
  Zap
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getMembershipIcon = (tier: string | null | undefined) => {
    switch (tier) {
      case "premium": return Crown;
      case "school": return GraduationCap;
      case "casual": return Zap;
      default: return Target;
    }
  };

  const getMembershipLabel = (tier: string | null | undefined) => {
    switch (tier) {
      case "premium": return "12Digits+";
      case "school": return "School Plan";
      case "casual": return "Casual";
      default: return "Free Trial";
    }
  };

  const MembershipIcon = getMembershipIcon(user?.membershipTier);

  const stats = [
    {
      label: "Simulator Balance",
      value: `$${(user?.simulatorBalance ?? 10000).toLocaleString()}`,
      icon: TrendingUp,
      color: "text-primary"
    },
    {
      label: "Total Profit/Loss",
      value: `${(user?.totalProfit ?? 0) >= 0 ? '+' : ''}$${(user?.totalProfit ?? 0).toLocaleString()}`,
      icon: Target,
      color: (user?.totalProfit ?? 0) >= 0 ? "text-success" : "text-destructive"
    },
    {
      label: "Lessons Completed",
      value: user?.lessonsCompleted ?? 0,
      icon: BookOpen,
      color: "text-primary"
    },
    {
      label: "Member Since",
      value: "Dec 2024",
      icon: Calendar,
      color: "text-muted-foreground"
    }
  ];

  const completionPercentage = Math.min(((user?.lessonsCompleted ?? 0) / 50) * 100, 100);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {getInitials(user?.displayName ?? "U")}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold mb-1" data-testid="text-profile-name">
                {user?.displayName}
              </h1>
              <p className="text-muted-foreground mb-3" data-testid="text-profile-email">
                {user?.email}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge variant="secondary" className="gap-1" data-testid="badge-membership">
                  <MembershipIcon className="h-3 w-3" />
                  {getMembershipLabel(user?.membershipTier)}
                </Badge>
                <Badge variant="outline" className="capitalize" data-testid="badge-role">
                  {user?.role}
                </Badge>
              </div>
            </div>

            <div className="text-center md:text-right">
              <div className="flex items-center gap-2 justify-center md:justify-end mb-1">
                <Trophy className="h-5 w-5 text-chart-4" />
                <span className="text-2xl font-bold">#42</span>
              </div>
              <p className="text-sm text-muted-foreground">Leaderboard Rank</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Learning Progress
          </CardTitle>
          <CardDescription>
            Track your journey through the 12Digits curriculum
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Completion</span>
                <span className="text-sm text-muted-foreground">
                  {user?.lessonsCompleted ?? 0} / 50 lessons
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>

            <div className="grid md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Beginner</p>
                <p className="text-lg font-semibold">15/15</p>
                <Badge variant="secondary" className="mt-2 text-xs">Complete</Badge>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Intermediate</p>
                <p className="text-lg font-semibold">{Math.min(user?.lessonsCompleted ?? 0, 20) - 15 > 0 ? Math.min(user?.lessonsCompleted ?? 0, 20) - 15 : 0}/20</p>
                <Badge variant="outline" className="mt-2 text-xs">In Progress</Badge>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Advanced</p>
                <p className="text-lg font-semibold">0/15</p>
                <Badge variant="outline" className="mt-2 text-xs">Locked</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
