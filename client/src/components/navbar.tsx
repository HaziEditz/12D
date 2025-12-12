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
  Crown
} from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hasPremium = isPremiumTier(user);

  const navItems = [
    { href: "/lessons", label: "Lessons", icon: BookOpen, premium: false },
    { href: "/simulator", label: "Simulator", icon: LineChart, premium: false },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, premium: false },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy, premium: false },
    { href: "/strategies", label: "Strategies", icon: Library, premium: true },
    { href: "/analytics", label: "Analytics", icon: BarChart3, premium: true },
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
          <div className="hidden md:flex items-center gap-1">
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
          </div>
        )}

        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {isAuthenticated ? (
            <>
              <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Balance:</span>
                <span className="text-sm font-semibold text-success">
                  ${user?.simulatorBalance?.toLocaleString() ?? "10,000"}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(user?.displayName ?? "U")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium">
                      {user?.displayName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.displayName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer" data-testid="link-profile">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {(user?.role === "teacher" || user?.role === "admin") && (
                    <DropdownMenuItem asChild>
                      <Link href="/classroom" className="flex items-center gap-2 cursor-pointer" data-testid="link-classroom">
                        <GraduationCap className="h-4 w-4" />
                        My Classroom
                      </Link>
                    </DropdownMenuItem>
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
          </div>
        </div>
      )}
    </nav>
  );
}
