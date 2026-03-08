import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  LineChart, 
  BookOpen, 
  LayoutDashboard, 
  Trophy, 
  Zap,
  Star,
  Bell,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TOUR_STEPS = [
  {
    title: "Welcome to 12Digits!",
    description: "Your journey to professional trading starts here. Let's take a quick look at the key features.",
    icon: Zap,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10"
  },
  {
    title: "The Simulator",
    description: "This is where you practice trading with real-time data. You start with $10,000 in simulated balance to test your strategies.",
    icon: LineChart,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    title: "Learning Path",
    description: "Visit the Lessons page to master trading concepts from basics to advanced strategies through interactive courses.",
    icon: BookOpen,
    color: "text-green-500",
    bg: "bg-green-500/10"
  },
  {
    title: "Performance Tracking",
    description: "Your Dashboard shows your progress, PnL, and trading consistency with detailed analytics over time.",
    icon: LayoutDashboard,
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  },
  {
    title: "Global Leaderboard",
    description: "Compete with traders worldwide! Climb the ranks, earn reputation, and see how you stack up against the best.",
    icon: Trophy,
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  {
    title: "Watchlist & Alerts",
    description: "Track your favorite assets and set price notifications so you never miss a critical market move.",
    icon: Bell,
    color: "text-red-500",
    bg: "bg-red-500/10"
  },
  {
    title: "Ready to Trade?",
    description: "You're all set! Start exploring the markets and build your path to financial mastery.",
    icon: CheckCircle2,
    color: "text-primary",
    bg: "bg-primary/10"
  }
];

export function OnboardingTour() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      setOpen(true);
    }
  }, [user]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      await apiRequest("PATCH", "/api/user/onboarding", { onboardingCompleted: true });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setOpen(false);
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      setOpen(false);
    }
  };

  if (!user) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) handleComplete();
      setOpen(val);
    }}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <DialogHeader>
              <div className="flex justify-center mb-6">
                <motion.div 
                  initial={{ scale: 0.5, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className={`p-5 rounded-3xl ${step.bg}`}
                >
                  <StepIcon className={`w-12 h-12 ${step.color}`} />
                </motion.div>
              </div>
              <DialogTitle className="text-center text-2xl font-bold">
                {step.title}
              </DialogTitle>
              <DialogDescription className="text-center text-base pt-3 px-2 leading-relaxed">
                {step.description}
              </DialogDescription>
            </DialogHeader>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center gap-2 mt-6">
          {TOUR_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep ? "w-8 bg-primary" : "w-2 bg-muted hover:bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="mt-8 flex flex-row items-center justify-between sm:justify-between w-full">
          <Button 
            variant="ghost" 
            onClick={handleComplete}
            className="text-muted-foreground hover:text-foreground no-default-hover-elevate"
            data-testid="button-skip-tour"
          >
            Skip Tour
          </Button>
          <Button 
            onClick={handleNext} 
            className="min-w-[100px]"
            data-testid="button-next-step"
          >
            {currentStep === TOUR_STEPS.length - 1 ? "Get Started" : "Next Step"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
