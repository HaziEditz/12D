import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Sparkles, GraduationCap } from "lucide-react";

interface TutorialStep {
  targetId: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
  icon: string;
}

const STEPS: TutorialStep[] = [
  {
    targetId: "sim-welcome",
    title: "Welcome to the Trading Simulator! 🎉",
    description:
      "This is your risk-free practice arena. You get virtual money to trade real markets — no real cash, no real risk. Learn the ropes before you ever touch real money.",
    position: "bottom",
    icon: "🚀",
  },
  {
    targetId: "sim-symbol-selector",
    title: "Pick Your Asset",
    description:
      "Choose what you want to trade — stocks like Apple or Tesla, crypto like Bitcoin or Ethereum, or ETFs like SPY. Each asset has its own live price and chart.",
    position: "bottom",
    icon: "📈",
  },
  {
    targetId: "sim-chart",
    title: "Live Price Chart",
    description:
      "This candlestick chart shows price movement over time. Each candle represents a time period — green means the price went up, red means it went down. Scroll left to explore price history, or use the Past/Present buttons.",
    position: "left",
    icon: "🕯️",
  },
  {
    targetId: "sim-balance",
    title: "Your Virtual Balance",
    description:
      "You start with $5,000 of virtual money. Your available balance and current profit or loss on open trades are shown here. Don't worry — it all resets and there's no real money involved!",
    position: "left",
    icon: "💰",
  },
  {
    targetId: "sim-order-type",
    title: "Order Types",
    description:
      "Choose HOW you enter a trade. Market orders execute instantly at the current price. Limit orders wait until the price hits your target. Stop Loss and Take Profit orders close your trade automatically to protect profits or limit losses.",
    position: "left",
    icon: "⚙️",
  },
  {
    targetId: "sim-quantity",
    title: "Set Your Quantity",
    description:
      "This is how many units you want to buy or sell. Start small while you're learning — even 0.1 units is fine. The total cost is shown below.",
    position: "left",
    icon: "🔢",
  },
  {
    targetId: "sim-leverage",
    title: "Leverage (Advanced)",
    description:
      "Leverage multiplies your position size. 2x leverage means a 1% price move gives you 2% profit — but also 2% loss. Start with 1x (no leverage) until you're comfortable with the basics.",
    position: "left",
    icon: "⚡",
  },
  {
    targetId: "sim-trade-buttons",
    title: "Place Your Trade",
    description:
      "BUY (Long) if you think the price will go UP. SELL (Short) if you think it will go DOWN. You can always close the trade early from the Active Trades section below.",
    position: "left",
    icon: "💹",
  },
  {
    targetId: "sim-active-trades",
    title: "Your Active Trades",
    description:
      "All your open positions appear here with live profit/loss. Hit Close when you're ready to lock in your result. That's it — you're ready to start trading! Good luck! 🎯",
    position: "left",
    icon: "📋",
  },
];

const STORAGE_KEY = "simulator-tutorial-done";

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface SimulatorTutorialProps {
  onStartTour?: () => void;
  autoStart?: boolean;
}

export function SimulatorTutorial({ onStartTour, autoStart }: SimulatorTutorialProps) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (autoStart) {
      setStep(0);
      setActive(true);
    }
  }, [autoStart]);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const rafRef = useRef<number | null>(null);

  const updatePositions = useCallback(() => {
    const currentStep = STEPS[step];
    if (!currentStep) return;

    const el = document.getElementById(currentStep.targetId);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const padding = 8;

    setSpotlight({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    const tooltipWidth = 320;
    const tooltipMaxHeight = 220;
    const margin = 16;
    const pos = currentStep.position;
    let style: React.CSSProperties = { position: "fixed", zIndex: 10001, width: tooltipWidth };

    if (pos === "bottom") {
      style.top = rect.bottom + padding + margin;
      style.left = Math.min(
        Math.max(margin, rect.left + rect.width / 2 - tooltipWidth / 2),
        window.innerWidth - tooltipWidth - margin
      );
    } else if (pos === "top") {
      style.top = rect.top - padding - margin - tooltipMaxHeight;
      style.left = Math.min(
        Math.max(margin, rect.left + rect.width / 2 - tooltipWidth / 2),
        window.innerWidth - tooltipWidth - margin
      );
    } else if (pos === "left") {
      style.top = Math.min(
        Math.max(margin, rect.top + rect.height / 2 - tooltipMaxHeight / 2),
        window.innerHeight - tooltipMaxHeight - margin
      );
      style.left = Math.max(margin, rect.left - tooltipWidth - margin);
    } else if (pos === "right") {
      style.top = Math.min(
        Math.max(margin, rect.top + rect.height / 2 - tooltipMaxHeight / 2),
        window.innerHeight - tooltipMaxHeight - margin
      );
      style.left = rect.right + margin;
    }

    setTooltipStyle(style);
  }, [step]);

  useEffect(() => {
    if (!active) return;
    updatePositions();

    const handleResize = () => updatePositions();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", updatePositions, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", updatePositions, true);
    };
  }, [active, step, updatePositions]);

  useEffect(() => {
    if (!active) return;
    const targetId = STEPS[step]?.targetId;
    if (!targetId) return;

    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(updatePositions);
      });
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, step, updatePositions]);

  const startTour = () => {
    setStep(0);
    setActive(true);
    onStartTour?.();
  };

  const finish = () => {
    setActive(false);
    setSpotlight(null);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const currentStep = STEPS[step];

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={startTour}
        className="flex items-center gap-2 border-primary/40 text-primary hover:bg-primary/10"
        data-testid="button-start-tour"
      >
        <GraduationCap className="h-4 w-4" />
        How it works
      </Button>

      {active && (
        <>
          <div
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: 9999 }}
          >
            <svg width="100%" height="100%" className="absolute inset-0">
              <defs>
                <mask id="tutorial-mask">
                  <rect width="100%" height="100%" fill="white" />
                  {spotlight && (
                    <rect
                      x={spotlight.left}
                      y={spotlight.top}
                      width={spotlight.width}
                      height={spotlight.height}
                      rx={8}
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.65)"
                mask="url(#tutorial-mask)"
              />
            </svg>
            {spotlight && (
              <div
                className="absolute rounded-lg ring-2 ring-primary ring-offset-0 animate-pulse"
                style={{
                  top: spotlight.top,
                  left: spotlight.left,
                  width: spotlight.width,
                  height: spotlight.height,
                  boxShadow: "0 0 0 4px hsl(var(--primary) / 0.3)",
                }}
              />
            )}
          </div>

          <div
            className="fixed pointer-events-none"
            style={{ inset: 0, zIndex: 10000 }}
            onClick={finish}
          />

          <div
            className="bg-card border border-border rounded-xl shadow-2xl p-5 pointer-events-auto"
            style={tooltipStyle}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentStep.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary uppercase tracking-wide">
                      Step {step + 1} of {STEPS.length}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-foreground leading-tight mt-0.5">
                    {currentStep.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={finish}
                className="text-muted-foreground hover:text-foreground transition-colors ml-2 flex-shrink-0"
                data-testid="button-close-tutorial"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {currentStep.description}
            </p>

            <div className="flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                      i === step
                        ? "bg-primary"
                        : i < step
                        ? "bg-primary/40"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <button
                onClick={finish}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-skip-tutorial"
              >
                Skip tour
              </button>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prev}
                    className="h-8 px-3"
                    data-testid="button-tutorial-prev"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={next}
                  className="h-8 px-4"
                  data-testid="button-tutorial-next"
                >
                  {step === STEPS.length - 1 ? "Let's go! 🎯" : "Next"}
                  {step < STEPS.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export function useSimulatorTutorialAutoStart() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const timer = setTimeout(() => setShouldShow(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  return { shouldShow, setShouldShow };
}
