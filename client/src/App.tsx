import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ProfilePage from "@/pages/profile";
import LessonsPage from "@/pages/lessons";
import DashboardPage from "@/pages/dashboard";
import SimulatorPage from "@/pages/simulator";
import LeaderboardPage from "@/pages/leaderboard";
import AdminPage from "@/pages/admin";
import TeacherPage from "@/pages/teacher";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/lessons" component={LessonsPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/simulator" component={SimulatorPage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/teacher" component={TeacherPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Router />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
