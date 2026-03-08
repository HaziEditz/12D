import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  GraduationCap, Check, Users, BookOpen, Trophy, BarChart2,
  Zap, Shield, ChevronRight, Loader2, Sparkles, Star,
  TrendingUp, Award, Target, ArrowRight, X
} from "lucide-react";

const FEATURES = [
  { icon: Users, title: "Up to 30 Students", desc: "Manage a full class from one dashboard", color: "from-cyan-500 to-teal-500" },
  { icon: BookOpen, title: "All Lessons Included", desc: "Every lesson and tutorial unlocked", color: "from-purple-500 to-indigo-500" },
  { icon: BarChart2, title: "Progress Analytics", desc: "Track each student's growth over time", color: "from-orange-500 to-yellow-500" },
  { icon: Trophy, title: "Class Leaderboards", desc: "Keep students motivated and competing", color: "from-pink-500 to-rose-500" },
  { icon: Target, title: "Custom Assignments", desc: "Set profit targets and lesson goals", color: "from-green-500 to-emerald-500" },
  { icon: Shield, title: "Safe Simulator", desc: "$10,000 virtual funds — no real money", color: "from-blue-500 to-cyan-500" },
];

function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: 6,
        height: 6,
        background: "hsl(174 72% 60%)",
        animation: `particle-drift ${3 + Math.random() * 4}s ease-out infinite`,
        ...style,
      }}
    />
  );
}

function ConfettiPiece({ style }: { style: React.CSSProperties }) {
  const colors = ["#14b8a6", "#f59e0b", "#8b5cf6", "#ec4899", "#22c55e", "#3b82f6"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: 8,
        height: 8,
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        background: color,
        animation: `confetti-fall ${2 + Math.random() * 2}s ease-out forwards`,
        ...style,
      }}
    />
  );
}

export default function SchoolPlanPortal() {
  const [, navigate] = useLocation();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [phase, setPhase] = useState<"portal" | "world">("portal");
  const [portalSplitting, setPortalSplitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [quoteGenerated, setQuoteGenerated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  const [formData, setFormData] = useState({
    schoolName: "",
    adminName: "",
    adminEmail: user?.email ?? "",
    studentCount: 20,
    planType: "monthly",
  });

  const particles = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 90 + 5}%`,
      top: `${Math.random() * 70 + 10}%`,
      delay: `${Math.random() * 5}s`,
    }))
  );

  const confettiPieces = useRef(
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${-10 - Math.random() * 20}%`,
      delay: `${Math.random() * 1.5}s`,
    }))
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setPortalSplitting(true);
      setTimeout(() => setPhase("world"), 700);
    }, 900);
    return () => clearTimeout(t);
  }, []);

  const pricePerStudent = formData.planType === "annual" ? 7.07 : 8.49;
  const totalMonthly = pricePerStudent * formData.studentCount;
  const totalAnnual = totalMonthly * 10;

  const handleGenerateQuote = () => {
    if (!formData.schoolName || !formData.adminEmail) {
      toast({ title: "Fill in required fields", variant: "destructive" });
      return;
    }
    setShowConfetti(true);
    setQuoteGenerated(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleRedeem = async () => {
    if (!promoCode.trim()) return;
    setIsRedeeming(true);
    try {
      const res = await apiRequest("POST", "/api/payments/redeem-promo", { promoCode: promoCode.trim() });
      if (res.ok) {
        const data = await res.json();
        await refreshUser();
        queryClient.invalidateQueries({ queryKey: ["/api/trades/limits"] });
        toast({ title: "Success!", description: data.message || "School plan activated!" });
        navigate("/school");
      } else {
        const data = await res.json();
        toast({ title: "Invalid Code", description: data.error || "Not a valid promo code", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to redeem code", variant: "destructive" });
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#060d1a]">
      {/* ===== PORTAL INTRO OVERLAY ===== */}
      {phase === "portal" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <div
            className={`absolute inset-y-0 left-0 w-1/2 bg-[#060d1a] flex items-center justify-end pr-8 transition-transform duration-700 ease-in-out ${portalSplitting ? "-translate-x-full" : "translate-x-0"}`}
            style={{ zIndex: 60 }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-400 flex items-center justify-center shadow-2xl portal-logo-enter">
                <GraduationCap className="w-12 h-12 text-white" />
              </div>
              <span className="text-white text-2xl font-bold opacity-80">12Digits</span>
            </div>
          </div>
          <div
            className={`absolute inset-y-0 right-0 w-1/2 bg-[#060d1a] flex items-center justify-start pl-8 transition-transform duration-700 ease-in-out ${portalSplitting ? "translate-x-full" : "translate-x-0"}`}
            style={{ zIndex: 60 }}
          >
            <div className="flex flex-col gap-2">
              <span className="text-slate-400 text-lg font-medium slide-in-right">Schools</span>
              <span className="text-slate-600 text-sm slide-in-right stagger-2">Finance made easy</span>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 55 }}>
            <div className={`w-0.5 bg-gradient-to-b from-transparent via-teal-400 to-transparent transition-all duration-500 ${portalSplitting ? "h-full opacity-100" : "h-0 opacity-0"}`} />
          </div>
        </div>
      )}

      {/* ===== SCHOOL WORLD ===== */}
      {phase === "world" && (
        <div className="absolute inset-0 overflow-y-auto portal-world-reveal">
          {/* Ambient orbs */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
            <div className="orb-1 absolute w-96 h-96 rounded-full bg-teal-500 top-[-10%] left-[-5%]" style={{ filter: "blur(100px)" }} />
            <div className="orb-2 absolute w-80 h-80 rounded-full bg-purple-600 bottom-[-5%] right-[-5%]" style={{ filter: "blur(100px)" }} />
            <div className="orb-3 absolute w-64 h-64 rounded-full bg-cyan-400 top-[40%] left-[60%]" style={{ filter: "blur(80px)" }} />
            {particles.current.map(p => (
              <Particle key={p.id} style={{ left: p.left, top: p.top, animationDelay: p.delay }} />
            ))}
          </div>

          {/* Confetti */}
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 100 }}>
              {confettiPieces.current.map(c => (
                <ConfettiPiece key={c.id} style={{ left: c.left, top: c.top, animationDelay: c.delay }} />
              ))}
            </div>
          )}

          <div className="relative z-10 min-h-screen">
            {/* Nav bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-sm sticky top-0 z-20 bg-[#060d1a]/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-400 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold text-lg">12Digits</span>
                <span className="text-teal-400 text-sm font-medium">Schools</span>
              </div>
              <button onClick={() => navigate("/pricing")} className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm">
                <X className="w-4 h-4" /> Back to Plans
              </button>
            </div>

            {/* ===== HERO ===== */}
            <section className="text-center px-6 pt-20 pb-16">
              <div className="slide-up-fade stagger-1 inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-1.5 mb-6">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span className="text-teal-300 text-sm font-medium">School Plan — Finance Education Platform</span>
              </div>
              <h1 className="slide-up-fade stagger-2 text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">12Digits</span>
              </h1>
              <p className="slide-up-fade stagger-3 text-xl text-slate-300 max-w-2xl mx-auto mb-10">
                Finance made easy for your students. A gamified, safe simulator that turns complex trading concepts into engaging, age-adapted lessons.
              </p>
              <div className="slide-up-fade stagger-4 flex flex-wrap items-center justify-center gap-4">
                <a href="#quote-form" className="group bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold px-8 py-3 rounded-xl flex items-center gap-2 hover:shadow-lg hover:shadow-teal-500/30 transition-all hover:-translate-y-0.5">
                  Build Your Quote <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <div className="flex -space-x-2">
                    {["T", "S", "J"].map((l, i) => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-[#060d1a] bg-gradient-to-br from-teal-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white">{l}</div>
                    ))}
                  </div>
                  <span>Trusted by teachers worldwide</span>
                </div>
              </div>
            </section>

            {/* ===== FEATURES GRID ===== */}
            <section className="px-6 pb-20">
              <div className="max-w-5xl mx-auto">
                <h2 className="slide-up-fade text-center text-2xl font-bold text-white mb-3">Everything your classroom needs</h2>
                <p className="slide-up-fade text-center text-slate-400 mb-10">One plan. Complete access. No surprises.</p>
                <div className="grid md:grid-cols-3 gap-4">
                  {FEATURES.map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <div
                        key={i}
                        className={`card-hover-lift slide-up-fade bg-white/5 border border-white/10 rounded-2xl p-6 cursor-default stagger-${i + 1}`}
                      >
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-1">{f.title}</h3>
                        <p className="text-slate-400 text-sm">{f.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ===== QUOTE FORM ===== */}
            <section id="quote-form" className="px-6 pb-20">
              <div className="max-w-2xl mx-auto">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-xl">Build Your Quote</h2>
                      <p className="text-slate-400 text-sm">Customise your school plan</p>
                    </div>
                  </div>

                  <div className="space-y-5 mt-6">
                    <div className="slide-in-left stagger-1">
                      <Label className="text-slate-300 mb-1.5 block">School Name *</Label>
                      <input
                        className="portal-input-glow w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm transition-all focus:bg-white/8 focus:border-teal-500/60"
                        placeholder="e.g. Springfield High School"
                        value={formData.schoolName}
                        onChange={e => setFormData(f => ({ ...f, schoolName: e.target.value }))}
                        data-testid="input-school-name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="slide-in-left stagger-2">
                        <Label className="text-slate-300 mb-1.5 block">Admin Name</Label>
                        <input
                          className="portal-input-glow w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm transition-all focus:bg-white/8 focus:border-teal-500/60"
                          placeholder="Your full name"
                          value={formData.adminName}
                          onChange={e => setFormData(f => ({ ...f, adminName: e.target.value }))}
                          data-testid="input-admin-name"
                        />
                      </div>
                      <div className="slide-in-right stagger-2">
                        <Label className="text-slate-300 mb-1.5 block">Admin Email *</Label>
                        <input
                          className="portal-input-glow w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm transition-all focus:bg-white/8 focus:border-teal-500/60"
                          placeholder="teacher@school.edu"
                          type="email"
                          value={formData.adminEmail}
                          onChange={e => setFormData(f => ({ ...f, adminEmail: e.target.value }))}
                          data-testid="input-admin-email"
                        />
                      </div>
                    </div>

                    <div className="slide-up-fade stagger-3">
                      <Label className="text-slate-300 mb-1.5 block">
                        Number of Students: <span className="text-teal-400 font-semibold">{formData.studentCount}</span>
                      </Label>
                      <input
                        type="range"
                        min={5}
                        max={200}
                        step={5}
                        value={formData.studentCount}
                        onChange={e => setFormData(f => ({ ...f, studentCount: parseInt(e.target.value) }))}
                        className="w-full accent-teal-500"
                        data-testid="slider-student-count"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>5 students</span>
                        <span>200 students</span>
                      </div>
                    </div>

                    <div className="slide-up-fade stagger-4">
                      <Label className="text-slate-300 mb-2 block">Billing Cycle</Label>
                      <div className="flex gap-3">
                        {["monthly", "annual"].map(type => (
                          <button
                            key={type}
                            onClick={() => setFormData(f => ({ ...f, planType: type }))}
                            className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                              formData.planType === type
                                ? "border-teal-500 bg-teal-500/15 text-teal-300"
                                : "border-white/15 bg-white/5 text-slate-400 hover:border-white/30"
                            }`}
                            data-testid={`button-billing-${type}`}
                          >
                            {type === "monthly" ? "Monthly" : "Annual (Save 17%)"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleGenerateQuote}
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold py-3 rounded-xl hover:shadow-lg hover:shadow-teal-500/30 transition-all hover:-translate-y-0.5 border-0"
                      data-testid="button-generate-quote"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate My Quote
                    </Button>
                  </div>

                  {/* ===== QUOTE REVEAL ===== */}
                  {quoteGenerated && (
                    <div className="mt-8 quote-reveal">
                      <div className="bg-gradient-to-br from-teal-500/15 via-cyan-500/10 to-purple-500/10 border border-teal-500/30 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Award className="w-5 h-5 text-teal-400" />
                          <span className="text-teal-300 font-semibold">Your Custom Quote</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-white/5 rounded-xl p-4 text-center price-count-up">
                            <p className="text-slate-400 text-xs mb-1">School</p>
                            <p className="text-white font-semibold text-sm truncate">{formData.schoolName}</p>
                          </div>
                          <div className="bg-white/5 rounded-xl p-4 text-center price-count-up stagger-2">
                            <p className="text-slate-400 text-xs mb-1">Students</p>
                            <p className="text-white font-semibold text-sm">{formData.studentCount}</p>
                          </div>
                          <div className="bg-white/5 rounded-xl p-4 text-center price-count-up stagger-3">
                            <p className="text-slate-400 text-xs mb-1">Per Student / Month</p>
                            <p className="text-teal-400 font-bold text-lg">${pricePerStudent.toFixed(2)}</p>
                          </div>
                          <div className="bg-white/5 rounded-xl p-4 text-center price-count-up stagger-4">
                            <p className="text-slate-400 text-xs mb-1">{formData.planType === "annual" ? "Annual Total" : "Monthly Total"}</p>
                            <p className="text-white font-bold text-lg">${(formData.planType === "annual" ? totalAnnual : totalMonthly).toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="border-t border-white/10 pt-4">
                          <p className="text-slate-400 text-sm mb-3 text-center">Have a promo code? Enter it below to activate instantly.</p>
                          <div className="flex gap-2">
                            <input
                              className="portal-input-glow flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm transition-all focus:border-teal-500/60"
                              placeholder="Enter promo code (e.g. SCHOOL2024)"
                              value={promoCode}
                              onChange={e => setPromoCode(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && handleRedeem()}
                              data-testid="input-promo-code"
                            />
                            <Button
                              onClick={handleRedeem}
                              disabled={isRedeeming || !promoCode}
                              className="bg-teal-500 hover:bg-teal-400 text-white rounded-xl px-5 border-0"
                              data-testid="button-apply-promo"
                            >
                              {isRedeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                            </Button>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2 justify-center">
                            {["SCHOOL2024"].map(code => (
                              <button
                                key={code}
                                onClick={() => setPromoCode(code)}
                                className="text-xs px-3 py-1 rounded-full border border-teal-500/30 text-teal-400 hover:bg-teal-500/10 transition-colors"
                              >
                                Try: {code}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-3 text-slate-500 text-xs justify-center">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Secure payment. Cancel any time. No student data sold.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ===== FOOTER STRIP ===== */}
            <div className="border-t border-white/10 py-6 text-center text-slate-500 text-sm">
              <p>© 2025 12Digits · Finance Education Platform · <button onClick={() => navigate("/pricing")} className="text-teal-400 hover:underline">Back to Plans</button></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
