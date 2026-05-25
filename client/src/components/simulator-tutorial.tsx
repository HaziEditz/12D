import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Sparkles, GraduationCap, TrendingUp, TrendingDown, BookOpen } from "lucide-react";

interface TutorialStep {
  targetId: string;       // empty string = centered floating card (no spotlight)
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right" | "center";
  icon: string;
  tag?: "ui" | "learn";  // "ui" = showing a feature, "learn" = trading knowledge
  extra?: React.ReactNode;
}

const STEPS: TutorialStep[] = [
  // ── UI Tour ───────────────────────────────────────────────────────────────
  {
    targetId: "sim-welcome",
    title: "Welcome to the Trading Simulator!",
    description:
      "This is your risk-free practice arena. You get $5,000 of virtual money to trade real markets — no real cash, no real risk. Learn the ropes before you ever touch real money.",
    position: "bottom",
    icon: "🚀",
    tag: "ui",
  },
  {
    targetId: "sim-symbol-selector",
    title: "Pick Your Asset",
    description:
      "Choose what you want to trade — stocks like Apple or Tesla, crypto like Bitcoin or Ethereum, or ETFs like SPY. Each asset has its own live price and chart.",
    position: "bottom",
    icon: "📊",
    tag: "ui",
  },
  {
    targetId: "sim-chart",
    title: "Live Price Chart",
    description:
      "This candlestick chart shows price movement over time. Green candles = price went up during that period. Red candles = price went down. Each candle = one minute of activity.",
    position: "left",
    icon: "🕯️",
    tag: "ui",
  },

  // ── How to Trade: Reading the Chart ───────────────────────────────────────
  {
    targetId: "sim-chart",
    title: "Reading the Chart: Trends",
    description:
      "Look at the overall direction of candles over time. A series of higher highs = uptrend (price is rising). A series of lower lows = downtrend (price is falling). Trading with the trend is usually safer than against it.",
    position: "left",
    icon: "📈",
    tag: "learn",
  },

  // ── When to BUY ────────────────────────────────────────────────────────────
  {
    targetId: "sim-trade-buttons",
    title: "When to BUY (Go Long)",
    description:
      "Buy when you believe the price will go UP. Look for: an uptrend, a bounce off a low point, or positive news. Your profit = how much the price rises × how many units you hold.",
    position: "left",
    icon: "🟢",
    tag: "learn",
  },

  // ── When to SELL ───────────────────────────────────────────────────────────
  {
    targetId: "sim-trade-buttons",
    title: "When to SELL (Go Short)",
    description:
      "Sell when you believe the price will go DOWN. You borrow the asset, sell it, then buy it back cheaper later — pocketing the difference. Look for: downtrends, bad news, or a drop below a key price level.",
    position: "left",
    icon: "🔴",
    tag: "learn",
  },

  // ── Why Prices Move ─────────────────────────────────────────────────────
  {
    targetId: "",
    title: "Why Do Prices Move?",
    description:
      "Prices change because of supply and demand. More buyers than sellers = price rises. More sellers than buyers = price falls. Key drivers: company earnings, economic data, news events, and market sentiment. Understanding why moves happen helps you predict what's next.",
    position: "center",
    icon: "💡",
    tag: "learn",
  },

  // ── UI: Balance ────────────────────────────────────────────────────────────
  {
    targetId: "sim-balance",
    title: "Track Your Performance",
    description:
      "Your balance shows how your virtual portfolio is doing. Watch your open trade P&L in real time. A positive number = your trades are currently profitable. Negative = you're down. You decide when to close.",
    position: "left",
    icon: "💰",
    tag: "ui",
  },

  // ── UI: Order Types ────────────────────────────────────────────────────────
  {
    targetId: "sim-order-type",
    title: "Order Types",
    description:
      "Market = execute right now at the current price. Limit = wait until price hits your target before entering. Stop Loss = automatically close your trade if it falls too far. Take Profit = automatically close when you hit your profit goal.",
    position: "left",
    icon: "⚙️",
    tag: "ui",
  },

  // ── Risk Management ─────────────────────────────────────────────────────
  {
    targetId: "",
    title: "Risk Management 101",
    description:
      "The golden rule: never risk more than 1–2% of your total balance on a single trade. Use Stop Loss orders to cap your downside. Don't chase losses by going bigger — that's how small losses become big ones. Consistent small wins beat one lucky gamble.",
    position: "center",
    icon: "🛡️",
    tag: "learn",
  },

  // ── UI: Quantity + Leverage ────────────────────────────────────────────────
  {
    targetId: "sim-quantity",
    title: "Set Your Quantity",
    description:
      "How many units you want to trade. Start small — 0.1 units is fine. The larger your position, the bigger your profit or loss on every price tick. Beginners: keep it small until you build confidence.",
    position: "left",
    icon: "🔢",
    tag: "ui",
  },
  {
    targetId: "sim-leverage",
    title: "Leverage — Amplify Carefully",
    description:
      "Leverage multiplies your exposure. 5x means a 1% price move = 5% gain or loss. It amplifies BOTH directions. Only use leverage once you understand the basics, and always pair it with a Stop Loss.",
    position: "left",
    icon: "⚡",
    tag: "ui",
  },

  // ── UI: Placing a Trade ────────────────────────────────────────────────────
  {
    targetId: "sim-trade-buttons",
    title: "Place Your Trade",
    description:
      "Hit BUY if you think the price goes up, SELL if you think it goes down. Once open, your trade appears in Active Trades below with a live P&L. Close it whenever you're ready to lock in your result.",
    position: "left",
    icon: "💹",
    tag: "ui",
  },

  // ── UI: Active Trades ──────────────────────────────────────────────────────
  {
    targetId: "sim-active-trades",
    title: "Manage Your Positions",
    description:
      "Every open trade shows its current profit or loss live. You control when to exit — either to lock in profit, or to cut a loss before it grows. Good traders know when to hold and when to walk away.",
    position: "left",
    icon: "📋",
    tag: "ui",
  },

  // ── Closing step ──────────────────────────────────────────────────────────
  {
    targetId: "",
    title: "You're Ready to Trade! 🎯",
    description:
      "Start simple: pick one asset, watch the chart for a trend, place a small Market order with a Stop Loss, then close it when you're in profit. Repeat, learn, improve. The simulator is 100% safe — experiment freely!",
    position: "center",
    icon: "🏆",
    tag: "learn",
  },
];

const STORAGE_KEY = "simulator-tutorial-done-v3";

interface Rect { top: number; left: number; width: number; height: number; }

function computeTooltipStyle(rect: Rect, position: TutorialStep["position"]): React.CSSProperties {
  const W = 340, margin = 18, pad = 10;
  const vw = window.innerWidth, vh = window.innerHeight;
  let top = 0, left = 0;

  if (position === "center" || position === "bottom" && !rect.width) {
    return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: W, zIndex: 10002 };
  }
  if (position === "bottom") { top = rect.top + rect.height + pad + margin; left = rect.left + rect.width / 2 - W / 2; }
  else if (position === "top")  { top = rect.top - pad - margin - 260;      left = rect.left + rect.width / 2 - W / 2; }
  else if (position === "left") { top = rect.top + rect.height / 2 - 140;   left = rect.left - W - margin; }
  else                          { top = rect.top + rect.height / 2 - 140;   left = rect.left + rect.width + margin; }

  top  = Math.max(margin, Math.min(top,  vh - 300));
  left = Math.max(margin, Math.min(left, vw - W - margin));
  return { position: "fixed", top, left, width: W, zIndex: 10002 };
}

interface SimulatorTutorialProps {
  onStartTour?: () => void;
  autoStart?: boolean;
}

export function SimulatorTutorial({ onStartTour, autoStart }: SimulatorTutorialProps) {
  const [active, setActive]           = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [step, setStep]               = useState(0);
  const [direction, setDirection]     = useState<"forward"|"back">("forward");
  const [tooltipKey, setTooltipKey]   = useState(0);
  const [spotlight, setSpotlight]     = useState<Rect>({ top:0, left:0, width:0, height:0 });
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const rafRef = useRef<number|null>(null);
  const PAD = 10;

  const measureStep = useCallback((s: number) => {
    const cur = STEPS[s];
    if (!cur) return;

    if (!cur.targetId) {
      // centered card — no spotlight
      setSpotlight({ top: 0, left: 0, width: 0, height: 0 });
      setTooltipStyle(computeTooltipStyle({ top:0, left:0, width:0, height:0 }, "center"));
      return;
    }

    const el = document.getElementById(cur.targetId);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setSpotlight({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD*2, height: r.height + PAD*2 });
    setTooltipStyle(computeTooltipStyle({ top: r.top, left: r.left, width: r.width, height: r.height }, cur.position));
  }, []);

  useEffect(() => {
    if (autoStart && !active) { setStep(0); setActive(true); }
  }, [autoStart]);

  useEffect(() => {
    if (!active) return;
    const el = document.getElementById(STEPS[step]?.targetId ?? "");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        measureStep(step);
        setTooltipKey(k => k + 1);
        setTimeout(() => setOverlayVisible(true), 30);
      });
    });
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, step, measureStep]);

  useEffect(() => {
    if (!active) return;
    const fn = () => measureStep(step);
    window.addEventListener("resize", fn);
    window.addEventListener("scroll", fn, true);
    return () => { window.removeEventListener("resize", fn); window.removeEventListener("scroll", fn, true); };
  }, [active, step, measureStep]);

  const startTour = () => { setStep(0); setDirection("forward"); setOverlayVisible(false); setActive(true); onStartTour?.(); };

  const close = (save = true) => {
    setOverlayVisible(false);
    setTimeout(() => setActive(false), 300);
    if (save) localStorage.setItem(STORAGE_KEY, "true");
  };

  const go = (next: boolean) => {
    setDirection(next ? "forward" : "back");
    setOverlayVisible(false);
    setTimeout(() => setStep(s => next ? Math.min(s + 1, STEPS.length - 1) : Math.max(s - 1, 0)), 70);
  };

  const cur = STEPS[step];
  const isLearnStep = cur?.tag === "learn";
  const isCentered = !cur?.targetId;
  const hasSpotlight = !!cur?.targetId && !!spotlight.width;

  const spotlightBase: React.CSSProperties = {
    position: "fixed",
    top: spotlight.top, left: spotlight.left,
    width: spotlight.width, height: spotlight.height,
    borderRadius: 10, pointerEvents: "none",
    transition: "top .45s cubic-bezier(.4,0,.2,1), left .45s cubic-bezier(.4,0,.2,1), width .45s cubic-bezier(.4,0,.2,1), height .45s cubic-bezier(.4,0,.2,1)",
  };

  const tooltipAnim: React.CSSProperties = {
    ...tooltipStyle,
    opacity: overlayVisible ? 1 : 0,
    transform: overlayVisible
      ? (isCentered ? "translate(-50%,-50%) scale(1)" : "translateY(0) scale(1)")
      : direction === "forward"
        ? (isCentered ? "translate(-50%,-46%) scale(0.96)" : "translateY(10px) scale(0.97)")
        : (isCentered ? "translate(-50%,-54%) scale(0.96)" : "translateY(-10px) scale(0.97)"),
    transition: "opacity .28s ease, transform .3s cubic-bezier(.34,1.2,.64,1)",
  };

  return (
    <>
      <style>{`
        @keyframes sim-ring-pulse {
          0%,100%{ box-shadow:0 0 0 2px hsl(var(--primary)),0 0 18px 4px hsl(var(--primary)/.4); }
          50%    { box-shadow:0 0 0 3px hsl(var(--primary)),0 0 30px 8px hsl(var(--primary)/.55); }
        }
        @keyframes sim-learn-pulse {
          0%,100%{ box-shadow:0 0 0 2px hsl(142 71% 45%),0 0 18px 4px hsl(142 71% 45%/.35); }
          50%    { box-shadow:0 0 0 3px hsl(142 71% 45%),0 0 30px 8px hsl(142 71% 45%/.5); }
        }
        @keyframes sim-overlay-in{ from{opacity:0} to{opacity:1} }
        .sim-ring-ui   { animation: sim-ring-pulse   2s ease-in-out infinite; }
        .sim-ring-learn{ animation: sim-learn-pulse  2s ease-in-out infinite; }
        .sim-overlay-in{ animation: sim-overlay-in .25s ease forwards; }
      `}</style>

      {/* Trigger button */}
      <Button
        variant="outline" size="sm" onClick={startTour}
        className="flex items-center gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:scale-105 transition-transform duration-150"
        data-testid="button-start-tour"
      >
        <GraduationCap className="h-4 w-4" />
        How it works
      </Button>

      {active && (
        <>
          {/* Dark overlay */}
          {hasSpotlight ? (
            <>
              {/* Mask with hole */}
              <div className="sim-overlay-in" style={{ position:"fixed", inset:0, zIndex:9999, pointerEvents:"none" }}>
                <svg width="100%" height="100%" style={{ position:"absolute", inset:0 }}>
                  <defs>
                    <mask id="tut-mask">
                      <rect width="100%" height="100%" fill="white" />
                      <rect x={spotlight.left} y={spotlight.top} width={spotlight.width} height={spotlight.height} rx={10} fill="black"
                        style={{ transition:"all .45s cubic-bezier(.4,0,.2,1)" }} />
                    </mask>
                  </defs>
                  <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#tut-mask)" />
                </svg>
              </div>
              {/* Glow ring */}
              <div className={isLearnStep ? "sim-ring-learn" : "sim-ring-ui"} style={{ ...spotlightBase, zIndex:10001 }} />
            </>
          ) : (
            /* Full dark overlay for centered steps */
            <div className="sim-overlay-in"
              style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.72)", backdropFilter:"blur(2px)" }} />
          )}

          {/* Click-away */}
          <div style={{ position:"fixed", inset:0, zIndex:10000 }} onClick={() => close(true)} />

          {/* Tooltip card */}
          <div
            key={tooltipKey}
            className="bg-card border rounded-2xl shadow-2xl pointer-events-auto select-none overflow-hidden"
            style={{
              ...tooltipAnim,
              borderColor: isLearnStep ? "hsl(142 71% 45% / 0.5)" : "hsl(var(--border) / 0.8)",
            }}
          >
            {/* Coloured top bar */}
            <div className={`h-1 w-full ${isLearnStep ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-gradient-to-r from-primary to-blue-400"}`} />

            <div className="p-5">
              {/* Tag pill */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  isLearnStep
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-primary/10 text-primary border border-primary/20"
                }`}>
                  {isLearnStep ? <BookOpen className="h-2.5 w-2.5" /> : <Sparkles className="h-2.5 w-2.5" />}
                  {isLearnStep ? "Trading Lesson" : "Feature Tour"}
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {step + 1} / {STEPS.length}
                </span>
              </div>

              {/* Icon + Title */}
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl leading-none flex-shrink-0">{cur.icon}</span>
                <h3 className="font-bold text-[15px] text-foreground leading-snug pt-0.5">{cur.title}</h3>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{cur.description}</p>

              {/* Progress bar */}
              <div className="flex gap-1 mb-4">
                {STEPS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setDirection(i > step ? "forward" : "back"); setOverlayVisible(false); setTimeout(() => setStep(i), 70); }}
                    className="h-1.5 rounded-full flex-1 focus:outline-none"
                    style={{
                      background: i === step
                        ? (s.tag === "learn" ? "hsl(142 71% 45%)" : "hsl(var(--primary))")
                        : i < step
                        ? (s.tag === "learn" ? "hsl(142 71% 45% / 0.4)" : "hsl(var(--primary) / 0.4)")
                        : "hsl(var(--muted-foreground) / 0.2)",
                      transform: i === step ? "scaleY(1.5)" : "scaleY(1)",
                      transition: "background .3s, transform .3s",
                    }}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => close(true)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1 py-1 rounded"
                  data-testid="button-skip-tutorial"
                >
                  Skip tour
                </button>
                <div className="flex items-center gap-2">
                  {step > 0 && (
                    <Button variant="outline" size="sm" onClick={() => go(false)}
                      className="h-8 px-3 gap-1 hover:scale-105 transition-transform duration-150"
                      data-testid="button-tutorial-prev">
                      <ChevronLeft className="h-3.5 w-3.5" /> Back
                    </Button>
                  )}
                  <Button size="sm" onClick={() => step < STEPS.length - 1 ? go(true) : close(true)}
                    className={`h-8 px-4 gap-1 hover:scale-105 active:scale-95 transition-transform duration-150 ${
                      isLearnStep ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                    }`}
                    data-testid="button-tutorial-next">
                    {step === STEPS.length - 1 ? "Start Trading! 🚀" : <>Next <ChevronRight className="h-3.5 w-3.5" /></>}
                  </Button>
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
      const t = setTimeout(() => setShouldShow(true), 900);
      return () => clearTimeout(t);
    }
  }, []);
  return { shouldShow, setShouldShow };
}
