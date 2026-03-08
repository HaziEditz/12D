import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { isPremiumTier } from "@/lib/subscription";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  BookOpen, 
  LayoutDashboard, 
  LineChart, 
  Trophy, 
  User, 
  LogOut,
  Menu,
  X,
  GraduationCap,
  Settings,
  Library,
  BarChart3,
  Lock,
  Crown,
  Award,
  Zap,
  BookOpenText,
  Newspaper,
  Calendar,
  Calculator,
  Star,
  Lightbulb,
  Users,
  ShieldCheck,
  HelpCircle,
  Gamepad2,
  Coins
} from "lucide-react";
import { useState } from "react";
import { NotificationBell } from "@/components/notification-bell";
import { getLevelInfo } from "@/lib/levels";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hasPremium = isPremiumTier(user);

  const resetOnboarding = async () => {
    try {
      await apiRequest("PATCH", "/api/user/onboarding", { onboardingCompleted: false });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    } catch (error) {
      console.error("Failed to reset onboarding:", error);
    }
  };

  const navItems = [
    { href: "/lessons", label: "Lessons", icon: BookOpen, premium: false },
    { href: "/simulator", label: "Simulator", icon: LineChart, premium: false },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, premium: false },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy, premium: false },
    { href: "/achievements", label: "Achievements", icon: Award, premium: false },
    { href: "/watchlist", label: "Watchlist", icon: Star, premium: false },
    { href: "/tips", label: "Tips", icon: Lightbulb, premium: false },
    { href: "/command-center", label: "Terminal", icon: Zap, premium: true },
    { href: "/strategies", label: "Strategies", icon: Library, premium: true },
    { href: "/analytics", label: "Analytics", icon: BarChart3, premium: true },
  ];

  const premiumMenuItems = [
    { href: "/friends", label: "Friends", icon: Users },
    { href: "/journal", label: "Trade Journal", icon: BookOpenText },
    { href: "/news", label: "News Feed", icon: Newspaper },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/risk-calculator", label: "Risk Calc", icon: Calculator },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2" data-testid="link-home">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">12Digits</span>
        </Link>

        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              const showLock = item.premium && !hasPremium;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`gap-2 ${item.premium ? "relative" : ""}`}
                    data-testid={`link-${item.label.toLowerCase()}`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {showLock && (
                      <Lock className="h-3 w-3 text-amber-500" />
                    )}
                    {item.premium && hasPremium && (
                      <Crown className="h-3 w-3 text-amber-500" />
                    )}
                  </Button>
                </Link>
              );
            })}
            {(user?.role === "student" || user?.role === "teacher") && user?.membershipTier === "school" && (
              <Link href="/school">
                <Button
                  variant={location.startsWith("/school") ? "secondary" : "ghost"}
                  className="gap-2 font-semibold border border-teal-500/30 text-teal-500 hover:text-teal-400 hover:bg-teal-500/10 hover:border-teal-500/50"
                  data-testid="link-school-world"
                >
                  <GraduationCap className="h-4 w-4" />
                  School World
                </Button>
              </Link>
            )}
            {user?.membershipTier === "casual" && (
              <>
                <Link href="/friends">
                  <Button
                    variant={location === "/friends" ? "secondary" : "ghost"}
                    className="gap-2 font-semibold border border-purple-500/30 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/50"
                    data-testid="link-friends"
                  >
                    <Users className="h-4 w-4" />
                    Friends
                  </Button>
                </Link>
                <Link href="/casual/portfolio">
                  <Button
                    variant={location.startsWith("/casual") ? "secondary" : "ghost"}
                    className="gap-2 font-semibold border border-purple-500/30 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/50"
                    data-testid="link-casual-portfolio"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Portfolio
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              onClick={resetOnboarding}
              title="Reset Tutorial"
              className="hover-elevate"
              data-testid="button-reset-tutorial"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          )}
          <ThemeToggle />
          
          {isAuthenticated ? (
            <>
              <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Balance:</span>
                <span className="text-sm font-semibold text-success">
                  ${user?.simulatorBalance?.toLocaleString() ?? "10,000"}
                </span>
              </div>

              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 relative" data-testid="button-user-menu">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(user?.displayName ?? "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground border-2 border-background">
                        {getLevelInfo(user?.xp).level}
                      </div>
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">
                      {user?.displayName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{user?.displayName}</p>
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px] gap-1">
                        <ShieldCheck className="h-3 w-3 text-primary" />
                        Lvl {getLevelInfo(user?.xp).level}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">{getLevelInfo(user?.xp).title}</span>
                        <span>{getLevelInfo(user?.xp).progress}%</span>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300" 
                          style={{ width: `${getLevelInfo(user?.xp).progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer" data-testid="link-profile">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2 cursor-pointer" data-testid="link-settings">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1 text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    Your Features
                  </div>
                  {navItems.filter(item => !item.premium).map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className="flex items-center gap-2 cursor-pointer" data-testid={`link-menu-${item.label.toLowerCase()}`}>
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                  {hasPremium && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1 text-xs text-muted-foreground flex items-center gap-1">
                        <Crown className="h-3 w-3 text-amber-500" />
                        Premium Tools
                      </div>
                      {premiumMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <DropdownMenuItem key={item.href} asChild>
                            <Link href={item.href} className="flex items-center gap-2 cursor-pointer" data-testid={`link-premium-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                              <Icon className="h-4 w-4" />
                              {item.label}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </>
                  )}
                  {(user?.role === "student" || user?.role === "teacher") && user?.membershipTier === "school" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/school" className="flex items-center gap-2 cursor-pointer font-semibold" data-testid="link-school-world-dropdown">
                          <GraduationCap className="h-4 w-4 text-teal-500" />
                          <span className="text-teal-500">School World</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {user?.membershipTier === "casual" && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1 text-xs text-muted-foreground flex items-center gap-1">
                        <Star className="h-3 w-3 text-purple-400" />
                        Casual Plan
                      </div>
                      <DropdownMenuItem asChild>
                        <Link href="/friends" className="flex items-center gap-2 cursor-pointer" data-testid="link-dropdown-friends">
                          <Users className="h-4 w-4 text-purple-400" />
                          Friends
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/casual/portfolio" className="flex items-center gap-2 cursor-pointer" data-testid="link-dropdown-casual-portfolio">
                          <BarChart3 className="h-4 w-4 text-purple-400" />
                          Portfolio Analysis
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {user?.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/classroom" className="flex items-center gap-2 cursor-pointer" data-testid="link-classroom">
                          <GraduationCap className="h-4 w-4" />
                          My Classroom
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {user?.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 cursor-pointer" data-testid="link-admin">
                        <Settings className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={logout} 
                    className="text-destructive cursor-pointer"
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" data-testid="button-login">Log in</Button>
              </Link>
              <Link href="/register">
                <Button data-testid="button-signup">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {mobileMenuOpen && isAuthenticated && (
        <div className="md:hidden border-t bg-background px-4 py-4">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              const showLock = item.premium && !hasPremium;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {showLock && (
                      <Lock className="h-3 w-3 text-amber-500 ml-auto" />
                    )}
                    {item.premium && hasPremium && (
                      <Crown className="h-3 w-3 text-amber-500 ml-auto" />
                    )}
                  </Button>
                </Link>
              );
            })}
            {user?.membershipTier === "casual" && (
              <>
                <div className="border-t border-border pt-2 mt-1">
                  <p className="text-xs text-muted-foreground px-2 py-1 flex items-center gap-1">
                    <Star className="h-3 w-3 text-purple-400" /> Casual Plan
                  </p>
                  <Link href="/friends" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant={location === "/friends" ? "secondary" : "ghost"} className="w-full justify-start gap-2 text-purple-400">
                      <Users className="h-4 w-4" /> Friends
                    </Button>
                  </Link>
                  <Link href="/casual/portfolio" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant={location.startsWith("/casual") ? "secondary" : "ghost"} className="w-full justify-start gap-2 text-purple-400">
                      <BarChart3 className="h-4 w-4" /> Portfolio Analysis
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
