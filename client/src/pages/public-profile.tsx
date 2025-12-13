import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  BookOpen, 
  Crown,
  GraduationCap,
  Zap,
  Target,
  User,
  Award,
  Star,
  DollarSign,
  Users,
  Calendar
} from "lucide-react";

interface PublicUser {
  id: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  membershipTier: string | null;
  lessonsCompleted: number | null;
  totalProfit: number | null;
}

interface UserAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  unlockedAt: string;
}

const categoryIcons: Record<string, any> = {
  trading: TrendingUp,
  learning: BookOpen,
  balance: DollarSign,
  social: Users,
  milestone: Calendar,
};

const getCategoryIcon = (category: string) => {
  return categoryIcons[category] || Award;
};

export default function PublicProfilePage() {
  const [, params] = useRoute("/users/:id");
  const userId = params?.id;

  const { data: profile, isLoading, error } = useQuery<PublicUser>({
    queryKey: ["/api/users", userId],
    enabled: !!userId,
  });

  const { data: achievements } = useQuery<UserAchievement[]>({
    queryKey: ["/api/users", userId, "achievements"],
    enabled: !!userId,
  });

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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <User className="h-16 w-16 text-muted-foreground" />
              <h2 className="text-xl font-semibold">User Not Found</h2>
              <p className="text-muted-foreground">
                This user profile doesn't exist or is not available.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const MembershipIcon = getMembershipIcon(profile.membershipTier);

  const stats = [
    {
      label: "Total Profit/Loss",
      value: `${(profile.totalProfit ?? 0) >= 0 ? '+' : ''}$${(profile.totalProfit ?? 0).toLocaleString()}`,
      icon: TrendingUp,
      color: (profile.totalProfit ?? 0) >= 0 ? "text-success" : "text-destructive"
    },
    {
      label: "Lessons Completed",
      value: profile.lessonsCompleted ?? 0,
      icon: BookOpen,
      color: "text-primary"
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {getInitials(profile.displayName)}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-2xl font-bold mb-2" data-testid="text-public-profile-name">
                {profile.displayName}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Badge variant="secondary" className="gap-1" data-testid="badge-public-membership">
                  <MembershipIcon className="h-3 w-3" />
                  {getMembershipLabel(profile.membershipTier)}
                </Badge>
                <Badge variant="outline" className="capitalize" data-testid="badge-public-role">
                  {profile.role}
                </Badge>
              </div>
            </div>

            {profile.bio && (
              <p className="text-muted-foreground max-w-md" data-testid="text-public-bio">
                {profile.bio}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
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

      {achievements && achievements.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Achievements ({achievements.length})
            </CardTitle>
            <CardDescription>Unlocked achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements.slice(0, 6).map((achievement) => {
                const CategoryIcon = getCategoryIcon(achievement.category);
                return (
                  <div
                    key={achievement.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    data-testid={`achievement-${achievement.id}`}
                  >
                    <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <CategoryIcon className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{achievement.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{achievement.description}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 text-amber-500" />
                        <span className="text-xs text-amber-600">+{achievement.xpReward} XP</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {achievements.length > 6 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                +{achievements.length - 6} more achievements
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
