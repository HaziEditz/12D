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
    title: "Welcome to the Trading Simulator!",
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
      "This candlestick chart shows price movement over time. Green candles = price went up, red = price went down. Scroll left to explore history or use the Past/Present buttons.",
    position: "left",
    icon: "🕯️",
  },
  {
    targetId: "sim-balance",
    title: "Your Virtual Balance",
    description:
      "You start with $5,000 of virtual money. Your available balance and current profit or loss on open trades are shown here. No real money involved — ever!",
    position: "left",
    icon: "💰",
  },
  {
    targetId: "sim-order-type",
    title: "Order Types",
    description:
      "Choose HOW you enter a trade. Market orders execute instantly. Limit orders wait for your target price. Stop Loss and Take Profit close your trade automatically.",
    position: "left",
    icon: "⚙️",
  },
  {
    targetId: "sim-quantity",
    title: "Set Your Quantity",
    description:
      "How many units you want to buy or sell. Start small while you're learning — even 0.1 units is fine. The total cost is shown below the input.",
    position: "left",
    icon: "🔢",
  },
  {
    targetId: "sim-leverage",
    title: "Leverage (Advanced)",
    description:
      "Leverage multiplies your position size. 2x means a 1% price move gives you 2% profit — but also 2% loss. Start with 1x (no leverage) until you're comfortable.",
    position: "left",
    icon: "⚡",
  },
  {
    targetId: "sim-trade-buttons",
    title: "Place Your Trade",
    description:
      "BUY (Long) if you think the price will go UP. SELL (Short) if you think it will go DOWN. You can always close the trade early from Active Trades below.",
    position: "left",
    icon: "💹",
  },
  {
    targetId: "sim-active-trades",
    title: "Your Active Trades",
    description:
      "All your open positions appear here with live profit/loss. Hit Close when you're ready to lock in your result. That's it — you're ready to trade! Good luck! 🎯",
    position: "left",
    icon: "📋",
  },
];

const STORAGE_KEY = "simulator-tutorial-done-v2";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function computeTooltipStyle(
  rect: Rect,
  position: TutorialStep["position"],
  padding: number
): React.CSSProperties {
  const tooltipWidth = 330;
  const margin = 18;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = 0;
  let left = 0;

  if (position === "bottom") {
    top = rect.top + rect.height + padding + margin;
    left = rect.left + rect.width / 2 - tooltipWidth / 2;
  } else if (position === "top") {
    top = rect.top - padding - margin - 220;
    left = rect.left + rect.width / 2 - tooltipWidth / 2;
  } else if (position === "left") {
    top = rect.top + rect.height / 2 - 120;
    left = rect.left - tooltipWidth - margin;
  } else {
    top = rect.top + rect.height / 2 - 120;
    left = rect.left + rect.width + margin;
  }

  top = Math.max(margin, Math.min(top, vh - 260));
  left = Math.max(margin, Math.min(left, vw - tooltipWidth - margin));

  return { position: "fixed", top, left, width: tooltipWidth, zIndex: 10002 };
}

interface SimulatorTutorialProps {
  onStartTour?: () => void;
  autoStart?: boolean;
}

export function SimulatorTutorial({ onStartTour, autoStart }: SimulatorTutorialProps) {
  const [active, setActive] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [tooltipKey, setTooltipKey] = useState(0);
  const [spotlight, setSpotlight] = useState<Rect>({ top: 0, left: 0, width: 0, height: 0 });
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const rafRef = useRef<number | null>(null);
  const PAD = 10;

  const measureStep = useCallback((s: number) => {
    const current = STEPS[s];
    if (!current) return;
    const el = document.getElementById(current.targetId);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setSpotlight({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
    setTooltipStyle(computeTooltipStyle({ top: r.top, left: r.left, width: r.width, height: r.height }, current.position, PAD));
  }, []);

  useEffect(() => {
    if (autoStart && !active) {
      setStep(0);
      setActive(true);
    }
  }, [autoStart]);

  useEffect(() => {
    if (!active) return;
    const el = document.getElementById(STEPS[step]?.targetId ?? "");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        measureStep(step);
        setTooltipKey((k) => k + 1);
        setTimeout(() => setOverlayVisible(true), 20);
      });
    });
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, step, measureStep]);

  useEffect(() => {
    if (!active) return;
    const onResize = () => measureStep(step);
    const onScroll = () => measureStep(step);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [active, step, measureStep]);

  const startTour = () => {
    setStep(0);
    setDirection("forward");
    setOverlayVisible(false);
    setActive(true);
    onStartTour?.();
  };

  const close = (save = true) => {
    setOverlayVisible(false);
    setTimeout(() => {
      setActive(false);
    }, 300);
    if (save) localStorage.setItem(STORAGE_KEY, "true");
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setDirection("forward");
      setOverlayVisible(false);
      setTimeout(() => setStep((s) => s + 1), 60);
    } else {
      close(true);
    }
  };

  const prev = () => {
    if (step > 0) {
      setDirection("back");
      setOverlayVisible(false);
      setTimeout(() => setStep((s) => s - 1), 60);
    }
  };

  const currentStep = STEPS[step];

  const spotlightStyle: React.CSSProperties = {
    position: "fixed",
    top: spotlight.top,
    left: spotlight.left,
    width: spotlight.width,
    height: spotlight.height,
    borderRadius: 10,
    zIndex: 10001,
    pointerEvents: "none",
    transition: "top 0.45s cubic-bezier(0.4,0,0.2,1), left 0.45s cubic-bezier(0.4,0,0.2,1), width 0.45s cubic-bezier(0.4,0,0.2,1), height 0.45s cubic-bezier(0.4,0,0.2,1)",
    boxShadow: "0 0 0 9999px rgba(0,0,0,0.72)",
  };

  const ringStyle: React.CSSProperties = {
    ...spotlightStyle,
    boxShadow: "0 0 0 2px hsl(var(--primary)), 0 0 20px 4px hsl(var(--primary) / 0.4), 0 0 40px 8px hsl(var(--primary) / 0.15)",
    zIndex: 10001,
  };

  const tooltipAnimStyle: React.CSSProperties = {
    ...tooltipStyle,
    opacity: overlayVisible ? 1 : 0,
    transform: overlayVisible
      ? "translateY(0) scale(1)"
      : direction === "forward"
      ? "translateY(10px) scale(0.97)"
      : "translateY(-10px) scale(0.97)",
    transition: "opacity 0.28s ease, transform 0.28s cubic-bezier(0.34,1.2,0.64,1)",
  };

  return (
    <>
      <style>{`
        @keyframes sim-ring-pulse {
          0%,100% { opacity:1; box-shadow: 0 0 0 2px hsl(var(--primary)), 0 0 20px 4px hsl(var(--primary)/0.4), 0 0 40px 8px hsl(var(--primary)/0.15); }
          50% { opacity:0.85; box-shadow: 0 0 0 3px hsl(var(--primary)), 0 0 28px 8px hsl(var(--primary)/0.5), 0 0 56px 14px hsl(var(--primary)/0.2); }
        }
        @keyframes sim-tour-btn-pop {
          0% { transform: scale(1); }
          40% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        .sim-ring-anim { animation: sim-ring-pulse 2s ease-in-out infinite; }
        .sim-tour-btn-pop { animation: sim-tour-btn-pop 0.5s ease-out; }
      `}</style>

      <Button
        variant="outline"
        size="sm"
        onClick={startTour}
        className="flex items-center gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:scale-105 transition-transform duration-150"
        data-testid="button-start-tour"
      >
        <GraduationCap className="h-4 w-4" />
        How it works
      </Button>

      {active && (
        <>
          <div style={spotlightStyle} />
          <div className="sim-ring-anim" style={ringStyle} />

          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              cursor: "default",
            }}
            onClick={() => close(true)}
          />

          <div
            key={tooltipKey}
            className="bg-card border border-border/80 rounded-2xl shadow-2xl pointer-events-auto select-none"
            style={tooltipAnimStyle}
          >
            <div className="relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none rounded-2xl" />

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl leading-none mt-0.5 select-none">{currentStep.icon}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                          Step {step + 1} / {STEPS.length}
                        </span>
                      </div>
                      <h3 className="font-bold text-[15px] text-foreground leading-snug">
                        {currentStep.title}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => close(true)}
                    className="ml-3 flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-1 transition-all duration-150"
                    data-testid="button-close-tutorial"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {currentStep.description}
                </p>

                <div className="flex gap-1 mb-4">
                  {STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setDirection(i > step ? "forward" : "back");
                        setOverlayVisible(false);
                        setTimeout(() => setStep(i), 60);
                      }}
                      className="h-1.5 rounded-full flex-1 transition-all duration-400 focus:outline-none"
                      style={{
                        background:
                          i === step
                            ? "hsl(var(--primary))"
                            : i < step
                            ? "hsl(var(--primary) / 0.45)"
                            : "hsl(var(--muted-foreground) / 0.25)",
                        transform: i === step ? "scaleY(1.4)" : "scaleY(1)",
                        transition: "background 0.3s, transform 0.3s",
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => close(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 px-1 py-1 rounded"
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
                        className="h-8 px-3 gap-1 hover:scale-105 transition-transform duration-150"
                        data-testid="button-tutorial-prev"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Back
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={next}
                      className="h-8 px-4 gap-1 hover:scale-105 active:scale-95 transition-transform duration-150"
                      data-testid="button-tutorial-next"
                    >
                      {step === STEPS.length - 1 ? (
                        "Let's go! 🎯"
                      ) : (
                        <>Next <ChevronRight className="h-3.5 w-3.5" /></>
                      )}
                    </Button>
                  </div>
                </div>
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
      const timer = setTimeout(() => setShouldShow(true), 900);
      return () => clearTimeout(timer);
    }
  }, []);

  return { shouldShow, setShouldShow };
}
