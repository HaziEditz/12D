import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { TrialBanner } from "@/components/paywall";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ProfilePage from "@/pages/profile";
import LessonsPage from "@/pages/lessons";
import LessonDetailPage from "@/pages/lesson-detail";
import DashboardPage from "@/pages/dashboard";
import SimulatorPage from "@/pages/simulator";
import LeaderboardPage from "@/pages/leaderboard";
import AdminPage from "@/pages/admin";
import TeacherPage from "@/pages/teacher";
import TeacherDashboard from "@/pages/teacher-dashboard";
import PricingPage from "@/pages/pricing";
import StrategiesPage from "@/pages/strategies";
import AnalyticsPage from "@/pages/analytics";
import CommandCenterPage from "@/pages/command-center";
import TradeJournalPage from "@/pages/trade-journal";
import NewsPage from "@/pages/news";
import EconomicCalendarPage from "@/pages/economic-calendar";
import RiskCalculatorPage from "@/pages/risk-calculator";
import SettingsPage from "@/pages/settings";
import PublicProfilePage from "@/pages/public-profile";
import UsersPage from "@/pages/users";
import AchievementsPage from "@/pages/achievements";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/lessons" component={LessonsPage} />
      <Route path="/lessons/:id" component={LessonDetailPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/simulator" component={SimulatorPage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/strategies" component={StrategiesPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/command-center" component={CommandCenterPage} />
      <Route path="/journal" component={TradeJournalPage} />
      <Route path="/news" component={NewsPage} />
      <Route path="/calendar" component={EconomicCalendarPage} />
      <Route path="/risk-calculator" component={RiskCalculatorPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/achievements" component={AchievementsPage} />
      <Route path="/users" component={UsersPage} />
      <Route path="/users/:id" component={PublicProfilePage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/teacher" component={TeacherPage} />
      <Route path="/classroom" component={TeacherDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-background">
      <TrialBanner />
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
