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
  Zap 
} from "lucide-react";

const TOUR_STEPS = [
  {
    title: "Welcome to 12Digits!",
    description: "Your journey to professional trading starts here. Let's take a quick look at the key features.",
    icon: Zap,
  },
  {
    title: "The Simulator",
    description: "This is where you practice trading with real-time data. You start with $5,000 in simulated balance.",
    icon: LineChart,
  },
  {
    title: "Learning Path",
    description: "Visit the Lessons page to master trading concepts from basics to advanced strategies.",
    icon: BookOpen,
  },
  {
    title: "Performance Tracking",
    description: "Your Dashboard shows your progress, PnL, and trading consistency over time.",
    icon: LayoutDashboard,
  },
  {
    title: "Leaderboard",
    description: "Compete with other traders and see where you stand in the 12Digits community.",
    icon: Trophy,
  },
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

  if (!user || user.onboardingCompleted) return null;

  const StepIcon = TOUR_STEPS[currentStep].icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <StepIcon className="w-10 h-10 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            {TOUR_STEPS[currentStep].title}
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {TOUR_STEPS[currentStep].description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-1 mt-4">
          {TOUR_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 w-6 rounded-full transition-colors ${
                idx === currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <DialogFooter className="mt-6">
          <Button 
            variant="ghost" 
            onClick={handleComplete}
            className="mr-auto"
          >
            Skip
          </Button>
          <Button onClick={handleNext}>
            {currentStep === TOUR_STEPS.length - 1 ? "Get Started" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
