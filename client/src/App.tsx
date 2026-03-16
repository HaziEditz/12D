import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { TrialBanner } from "@/components/paywall";
import { OnboardingTour } from "@/components/onboarding-tour";
import { AchievementNotificationProvider } from "@/components/achievement-notification";
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
import WatchlistPage from "@/pages/watchlist";
import TipsPage from "@/pages/tips";
import FriendsPage from "@/pages/friends";
import ClassroomPage from "@/pages/classroom";
import FunZonePage from "@/pages/fun-zone";
import SchoolHub from "@/pages/school/hub";
import SchoolStudentDashboard from "@/pages/school/student-dashboard";
import SchoolTeacherDashboard from "@/pages/school/teacher-dashboard";
import SchoolFunZone from "@/pages/school/fun-zone";
import SchoolSimulator from "@/pages/school/simulator";
import SchoolLeaderboard from "@/pages/school/leaderboard";
import SchoolLessons from "@/pages/school/lessons";
import SchoolChat from "@/pages/school/chat";
import SchoolEconomy from "@/pages/school/economy";
import SchoolPlanPortal from "@/pages/school-plan-portal";
import CasualPortfolioAnalysis from "@/pages/casual-portfolio-analysis";

function Router() {
  const { user } = useAuth();
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
      <Route path="/watchlist" component={WatchlistPage} />
      <Route path="/tips" component={TipsPage} />
      <Route path="/friends" component={FriendsPage} />
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
      <Route path="/classroom" component={user?.role === "teacher" ? TeacherDashboard : ClassroomPage} />
      <Route path="/fun-zone" component={FunZonePage} />
      <Route path="/school-plan" component={SchoolPlanPortal} />
      <Route path="/school/simulator" component={SchoolSimulator} />
      <Route path="/school/leaderboard" component={SchoolLeaderboard} />
      <Route path="/school/lessons" component={SchoolLessons} />
      <Route path="/school/chat" component={SchoolChat} />
      <Route path="/school/student" component={SchoolStudentDashboard} />
      <Route path="/school/teacher" component={SchoolTeacherDashboard} />
      <Route path="/school/fun-zone" component={SchoolFunZone} />
      <Route path="/school/economy" component={SchoolEconomy} />
      <Route path="/school" component={SchoolHub} />
      <Route path="/casual/portfolio" component={CasualPortfolioAnalysis} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isAdminPage = location.startsWith("/admin");
  const isSchoolPage = location.startsWith("/school");
  const isSchoolPlanPage = location === "/school-plan";
  const isCasualPage = location.startsWith("/casual");
  const isCasualUser = user?.membershipTier === "casual";

  if (isAdminPage) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-background">
        <Router />
        <Toaster />
      </div>
    );
  }

  if (isSchoolPage || isSchoolPlanPage) {
    return (
      <>
        <Router />
        <Toaster />
      </>
    );
  }

  return (
    <div className={`min-h-screen bg-background${(isCasualPage || isCasualUser) ? " casual-world" : ""}`}>
      <TrialBanner />
      <Navbar />
      <Router />
      <OnboardingTour />
      <AchievementNotificationProvider />
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
