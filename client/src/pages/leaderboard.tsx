import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, TrendingUp, Crown } from "lucide-react";
import type { User } from "@shared/schema";

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading } = useQuery<User[]>({
    queryKey: ["/api/leaderboard"],
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/10 to-gray-400/5 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/10 to-amber-600/5 border-amber-600/30";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
          <Trophy className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">Top traders ranked by total profit</p>
        </div>
      </div>

      {leaderboard && leaderboard.length > 0 && (
        <Card className="mb-8 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16 border-4 border-yellow-500">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {getInitials(leaderboard[0]?.displayName ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <Badge className="mb-1">Top Trader</Badge>
                  <h2 className="text-2xl font-bold">{leaderboard[0]?.displayName}</h2>
                  <p className="text-muted-foreground">Leading the charts</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-success">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-3xl font-bold">
                    +${(leaderboard[0]?.totalProfit ?? 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Total Profit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Rankings</CardTitle>
          <CardDescription>
            {leaderboard?.length ?? 0} traders on the leaderboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(!leaderboard || leaderboard.length === 0) ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No rankings yet</h3>
              <p className="text-muted-foreground">
                Start trading in the simulator to appear on the leaderboard!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((user, index) => {
                const rank = index + 1;
                return (
                  <div
                    key={user.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${getRankStyle(rank)}`}
                    data-testid={`row-leaderboard-${rank}`}
                  >
                    <div className="w-12 flex items-center justify-center">
                      {getRankIcon(rank) || (
                        <span className="text-xl font-bold text-muted-foreground">
                          #{rank}
                        </span>
                      )}
                    </div>
                    
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <p className="font-semibold">{user.displayName}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{user.lessonsCompleted ?? 0} lessons</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                        <span className="capitalize">{user.membershipTier || "Free"}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-lg font-bold ${(user.totalProfit ?? 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {(user.totalProfit ?? 0) >= 0 ? '+' : ''}${(user.totalProfit ?? 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Balance: ${(user.simulatorBalance ?? 10000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
