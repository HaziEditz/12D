import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import SchoolLayout from "@/layouts/school-layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Coins, RotateCcw, Trophy, Star, CheckCircle2, XCircle, ChevronRight, Zap, ShoppingBag, Sparkles, Lock, Check, Package, ArrowLeftRight, Flame, Calendar, Gift, RefreshCw, AlertCircle, Timer, Shuffle } from "lucide-react";

type Game = "coin-rain" | "piggy-bank" | "smart-shopper" | "stock-guesser" | "budget-boss" | "finance-quiz" | "market-prediction" | "investment-quiz" | "strategy-challenge" | "word-scramble" | "market-memory";
type View = "games" | "shop" | "inventory" | "trade";

const RARITY_CONFIG = {
  common:    { label: "Common",    color: "text-slate-300",  bg: "bg-slate-500/20 border-slate-500/30",   glow: "" },
  rare:      { label: "Rare",      color: "text-blue-300",   bg: "bg-blue-500/20 border-blue-500/30",     glow: "shadow-blue-500/20" },
  epic:      { label: "Epic",      color: "text-purple-300", bg: "bg-purple-500/20 border-purple-500/30", glow: "shadow-purple-500/30" },
  legendary: { label: "Legendary", color: "text-amber-300",  bg: "bg-amber-500/20 border-amber-500/30",  glow: "shadow-amber-500/30 shadow-lg" },
};

const COLLECTIBLE_CATALOG: Record<string, { emoji: string; name: string; rarity: keyof typeof RARITY_CONFIG }> = {
  "col-coin":         { emoji: "🪙", name: "Gold Coin",      rarity: "common" },
  "col-chart-up":     { emoji: "📈", name: "Bull Chart",     rarity: "common" },
  "col-piggy":        { emoji: "🐷", name: "Piggy Bank",     rarity: "common" },
  "col-notepad":      { emoji: "📔", name: "Trade Journal",  rarity: "common" },
  "col-lock":         { emoji: "🔒", name: "Safety Lock",    rarity: "common" },
  "col-receipt":      { emoji: "🧾", name: "Trade Receipt",  rarity: "common" },
  "col-rocket":       { emoji: "🚀", name: "Moon Rocket",    rarity: "rare" },
  "col-crown":        { emoji: "👑", name: "Gold Crown",     rarity: "rare" },
  "col-gem":          { emoji: "💚", name: "Emerald Gem",    rarity: "rare" },
  "col-trophy":       { emoji: "🏆", name: "Bronze Trophy",  rarity: "rare" },
  "col-lightning":    { emoji: "⚡", name: "Lightning Bolt", rarity: "rare" },
  "col-diamond":      { emoji: "💎", name: "Diamond",        rarity: "epic" },
  "col-fire":         { emoji: "🔥", name: "Fire Badge",     rarity: "epic" },
  "col-dragon":       { emoji: "🐉", name: "Dragon",         rarity: "epic" },
  "col-crystal-ball": { emoji: "🔮", name: "Crystal Ball",   rarity: "epic" },
  "col-unicorn":      { emoji: "🦄", name: "Unicorn",        rarity: "legendary" },
  "col-rainbow-star": { emoji: "🌟", name: "Rainbow Star",   rarity: "legendary" },
  "col-golden-bull":  { emoji: "🐂", name: "Golden Bull",   rarity: "legendary" },
};

const POWER_UP_CATALOG: Record<string, { emoji: string; name: string; desc: string; cost: number }> = {
  "pu-double-tokens": { emoji: "🎯", name: "2× Token Boost", desc: "Next game awards double tokens", cost: 20 },
  "pu-shield":        { emoji: "🛡️", name: "Loss Shield",    desc: "Protect tokens from one bad game", cost: 15 },
  "pu-xp-boost":      { emoji: "⚡", name: "XP Boost",       desc: "+50 XP bonus on next game finish", cost: 25 },
};

const BLIND_BAGS = [
  { id: "bag-starter", emoji: "🎒", name: "Starter Pack", desc: "70% Common · 25% Rare · 4% Epic · 1% Legendary", cost: 15, color: "from-slate-600 to-slate-700" },
  { id: "bag-crypto",  emoji: "💎", name: "Crypto Pack",  desc: "50% Common · 35% Rare · 12% Epic · 3% Legendary", cost: 30, color: "from-blue-700 to-cyan-700" },
  { id: "bag-legend",  emoji: "🔮", name: "Legend Pack",  desc: "40% Common · 35% Rare · 20% Epic · 5% Legendary", cost: 50, color: "from-purple-700 to-violet-800" },
];

const COSMETICS = {
  titles: [
    { id: "title-bull", label: "Bull 🐂", cost: 8, preview: "Bull 🐂" },
    { id: "title-bear", label: "Bear 🐻", cost: 8, preview: "Bear 🐻" },
    { id: "title-hodler", label: "HODLer 💪", cost: 10, preview: "HODLer 💪" },
    { id: "title-day-trader", label: "Day Trader", cost: 12, preview: "Day Trader" },
    { id: "title-diamond", label: "Diamond Hands 💎", cost: 15, preview: "Diamond Hands 💎" },
    { id: "title-risk", label: "Risk Taker", cost: 15, preview: "Risk Taker" },
    { id: "title-analyst", label: "Chart Analyst 📊", cost: 18, preview: "Chart Analyst 📊" },
    { id: "title-scholar", label: "The Scholar 📚", cost: 20, preview: "The Scholar 📚" },
    { id: "title-whale", label: "Crypto Whale 🐋", cost: 25, preview: "Crypto Whale 🐋" },
    { id: "title-maker", label: "Market Maker", cost: 25, preview: "Market Maker" },
    { id: "title-degen", label: "Finance Degen 🎲", cost: 30, preview: "Finance Degen 🎲" },
    { id: "title-investor", label: "Top Investor ⭐", cost: 35, preview: "Top Investor ⭐" },
    { id: "title-professor", label: "The Professor 🎓", cost: 45, preview: "The Professor 🎓" },
    { id: "title-legend", label: "Living Legend 👑", cost: 60, preview: "Living Legend 👑" },
  ],
  frames: [
    { id: "frame-silver", label: "Silver Frame", cost: 15, color: "ring-2 ring-slate-400" },
    { id: "frame-blue", label: "Neon Blue Frame", cost: 20, color: "ring-2 ring-blue-400 ring-offset-1" },
    { id: "frame-green", label: "Emerald Frame", cost: 20, color: "ring-2 ring-emerald-400 ring-offset-1" },
    { id: "frame-fire", label: "Fire Frame 🔥", cost: 28, color: "ring-2 ring-orange-500 ring-offset-1" },
    { id: "frame-gold", label: "Gold Frame ✨", cost: 40, color: "ring-2 ring-amber-400 ring-offset-1" },
    { id: "frame-diamond", label: "Diamond Frame 💎", cost: 60, color: "ring-[3px] ring-cyan-400 ring-offset-2" },
    { id: "frame-rainbow", label: "Rainbow Frame 🌈", cost: 80, color: "ring-2 ring-purple-500 ring-offset-1" },
    { id: "frame-neon", label: "Neon Glow ⚡", cost: 50, color: "ring-[3px] ring-lime-400 ring-offset-2" },
  ],
  stickers: [
    { id: "sticker-rocket", label: "Rocket Sticker 🚀", cost: 5, emoji: "🚀", desc: "Show in your profile" },
    { id: "sticker-chart", label: "Moon Chart 📈", cost: 5, emoji: "📈", desc: "Show in your profile" },
    { id: "sticker-gem", label: "Gem Sticker 💎", cost: 8, emoji: "💎", desc: "Show in your profile" },
    { id: "sticker-fire", label: "On Fire 🔥", cost: 8, emoji: "🔥", desc: "Show in your profile" },
    { id: "sticker-crown", label: "Crown Sticker 👑", cost: 10, emoji: "👑", desc: "Show in your profile" },
    { id: "sticker-brain", label: "Big Brain 🧠", cost: 10, emoji: "🧠", desc: "Show in your profile" },
    { id: "sticker-money", label: "Money Bag 💰", cost: 12, emoji: "💰", desc: "Show in your profile" },
    { id: "sticker-star", label: "Star Power ⭐", cost: 15, emoji: "⭐", desc: "Show in your profile" },
    { id: "sticker-dragon", label: "Dragon Sticker 🐉", cost: 20, emoji: "🐉", desc: "Rare sticker!" },
    { id: "sticker-unicorn", label: "Unicorn 🦄", cost: 25, emoji: "🦄", desc: "Ultra rare sticker!" },
  ],
  badges: [
    { id: "badge-early", label: "Early Adopter 🌱", cost: 0, emoji: "🌱", desc: "Free for all students!" },
    { id: "badge-active", label: "Active Trader 📊", cost: 15, emoji: "📊", desc: "For dedicated traders" },
    { id: "badge-streak-7", label: "7-Day Streak 🔥", cost: 20, emoji: "🔥", desc: "Show your dedication" },
    { id: "badge-top-gamer", label: "Game Champion 🎮", cost: 25, emoji: "🎮", desc: "For top Fun Zone players" },
    { id: "badge-scholar", label: "Finance Scholar 🎓", cost: 30, emoji: "🎓", desc: "For lesson completers" },
    { id: "badge-whale", label: "Portfolio Whale 🐋", cost: 50, emoji: "🐋", desc: "For big portfolio holders" },
  ],
};

export default function SchoolFunZone() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { data: classData } = useQuery<any>({ queryKey: ["/api/classroom"], enabled: user?.role === "student" });
  const ageGroup = classData?.class?.ageGroup ?? "high_school";
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [tokensEarned, setTokensEarned] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [view, setView] = useState<View>("games");
  const [bagReveal, setBagReveal] = useState<{ item: any; rarity: string } | null>(null);

  const { data: inventory = [], refetch: refetchInventory } = useQuery<any[]>({ queryKey: ["/api/inventory"] });
  const { data: tradeOffersList = [], refetch: refetchTrades } = useQuery<any[]>({ queryKey: ["/api/trades"] });

  const awardTokensMutation = useMutation({
    mutationFn: (amount: number) => apiRequest("POST", "/api/fun-zone/score", { tokensEarned: amount }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      await refreshUser();
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({ cosmeticId, cost }: { cosmeticId: string; cost: number }) => {
      const res = await apiRequest("POST", "/api/school/shop/purchase", { cosmeticId, cost });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        toast({ title: "Purchased!", description: data.message });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        refreshUser();
      } else {
        toast({ title: "Could not purchase", description: data.message, variant: "destructive" });
      }
    },
    onError: (err: any) => {
      toast({ title: "Purchase failed", description: err.message, variant: "destructive" });
    },
  });

  const equipMutation = useMutation({
    mutationFn: ({ type, value }: { type: "title" | "frame"; value: string | null }) =>
      apiRequest("POST", "/api/school/shop/equip", { type, value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      refreshUser();
    },
  });

  const dailyClaimMutation = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", "/api/fun-zone/daily-claim", {}); return r.json(); },
    onSuccess: (data: any) => {
      if (data.success) {
        toast({ title: `🎁 Day ${data.streak} Streak!`, description: `+${data.tokens} tokens earned!` });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        refreshUser();
      } else {
        toast({ title: "Already claimed", description: "Come back tomorrow for your next reward!", variant: "default" });
      }
    },
  });

  const buyItemMutation = useMutation({
    mutationFn: async ({ itemId, itemType, cost }: { itemId: string; itemType: string; cost: number }) => {
      const r = await apiRequest("POST", "/api/shop/buy-item", { itemId, itemType, cost }); return r.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        toast({ title: "Purchased!", description: data.message });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
        refreshUser(); refetchInventory();
      } else {
        toast({ title: "Cannot buy", description: data.message, variant: "destructive" });
      }
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const openBagMutation = useMutation({
    mutationFn: async ({ bagId, cost }: { bagId: string; cost: number }) => {
      const r = await apiRequest("POST", "/api/shop/open-bag", { bagId, cost }); return r.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        setBagReveal({ item: data.item, rarity: data.rarity });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
        refreshUser(); refetchInventory();
      } else {
        toast({ title: "Cannot open", description: data.message, variant: "destructive" });
      }
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const respondTradeMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const r = await apiRequest("POST", `/api/trades/${id}/respond`, { action }); return r.json();
    },
    onSuccess: (data: any) => {
      toast({ title: data.success ? "Done!" : "Error", description: data.message, variant: data.success ? "default" : "destructive" });
      refetchTrades();
      if (data.success) { queryClient.invalidateQueries({ queryKey: ["/api/user"] }); queryClient.invalidateQueries({ queryKey: ["/api/inventory"] }); refetchInventory(); }
    },
  });

  const handleEarnTokens = (amount: number) => {
    setTokensEarned(prev => prev + amount);
    setShowConfetti(true);
    awardTokensMutation.mutate(amount);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const isPrimary = ageGroup === "primary";
  const isIntermediate = ageGroup === "intermediate";

  const owned: string[] = JSON.parse((user as any)?.purchasedCosmetics ?? "[]");
  const equippedTitle = (user as any)?.equippedTitle ?? null;
  const equippedFrame = (user as any)?.equippedFrame ?? null;
  const tokenBalance = user?.classroomTokens ?? 0;

  const primaryGames = [
    { id: "coin-rain" as Game, emoji: "🌧️", title: "Coin Rain", desc: "Catch coins before they hit the ground!", color: "from-amber-400 to-orange-500", tokens: "2–8" },
    { id: "piggy-bank" as Game, emoji: "🐷", title: "Piggy Bank Builder", desc: "Sort money into the right jars", color: "from-pink-400 to-rose-500", tokens: "2–6" },
    { id: "smart-shopper" as Game, emoji: "🛒", title: "Smart Shopper", desc: "Buy what you need without going over budget!", color: "from-green-400 to-emerald-500", tokens: "2–7" },
    { id: "word-scramble" as Game, emoji: "🔤", title: "Word Scramble", desc: "Unscramble financial terms to earn tokens!", color: "from-violet-400 to-purple-500", tokens: "2–10" },
  ];

  const intermediateGames = [
    { id: "stock-guesser" as Game, emoji: "📊", title: "Stock Guesser", desc: "Predict if the stock goes up or down", color: "from-teal-500 to-cyan-600", tokens: "3–12" },
    { id: "budget-boss" as Game, emoji: "💰", title: "Budget Boss", desc: "Allocate your monthly income wisely", color: "from-purple-500 to-violet-600", tokens: "3–10" },
    { id: "finance-quiz" as Game, emoji: "🧠", title: "Finance Quiz", desc: "Test your financial knowledge!", color: "from-blue-500 to-indigo-600", tokens: "3–14" },
    { id: "market-memory" as Game, emoji: "🃏", title: "Market Memory", desc: "Match finance terms to their definitions!", color: "from-rose-500 to-pink-600", tokens: "3–12" },
  ];

  const hsGames = [
    { id: "market-prediction" as Game, emoji: "📈", title: "Market Prediction", desc: "Advanced market analysis challenge", color: "from-teal-600 to-cyan-700", tokens: "5–18" },
    { id: "investment-quiz" as Game, emoji: "🎓", title: "Investment Quiz", desc: "Advanced investment concepts", color: "from-purple-600 to-violet-700", tokens: "5–16" },
    { id: "strategy-challenge" as Game, emoji: "🎯", title: "Strategy Challenge", desc: "Make real-world trading decisions", color: "from-blue-600 to-indigo-700", tokens: "6–20" },
    { id: "word-scramble" as Game, emoji: "🔤", title: "Word Scramble", desc: "Unscramble advanced finance terms!", color: "from-amber-600 to-orange-700", tokens: "4–14" },
    { id: "market-memory" as Game, emoji: "🃏", title: "Market Memory", desc: "Match terms to definitions — beat the clock!", color: "from-rose-600 to-pink-700", tokens: "4–12" },
  ];

  const games = isPrimary ? primaryGames : isIntermediate ? intermediateGames : hsGames;

  if (activeGame === "coin-rain") return <CoinRainGame onEarn={handleEarnTokens} onBack={() => setActiveGame(null)} />;
  if (activeGame === "piggy-bank") return <PiggyBankGame onEarn={handleEarnTokens} onBack={() => setActiveGame(null)} />;
  if (activeGame === "smart-shopper") return <SmartShopperGame onEarn={handleEarnTokens} onBack={() => setActiveGame(null)} />;
  if (activeGame === "stock-guesser") return <StockGuesserGame onEarn={handleEarnTokens} onBack={() => setActiveGame(null)} />;
  if (activeGame === "budget-boss") return <BudgetBossGame onEarn={handleEarnTokens} onBack={() => setActiveGame(null)} />;
  if (activeGame === "finance-quiz" || activeGame === "investment-quiz") return <QuizGame level={isIntermediate ? "intermediate" : "high_school"} onEarn={handleEarnTokens} onBack={() => setActiveGame(null)} />;
  if (activeGame === "market-prediction") return <MarketPredictionGame onEarn={handleEarnTokens} onBack={() => setActiveGame(null)} />;
  if (activeGame === "strategy-challenge") return <StrategyChallenge onEarn={handleEarnTokens} onBack={() => setActiveGame(null)} />;
  if (activeGame === "word-scramble") return <WordScrambleGame onEarn={handleEarnTokens} onBack={() => setActiveGame(null)} />;
  if (activeGame === "market-memory") return <MarketMemoryGame onEarn={handleEarnTokens} onBack={() => setActiveGame(null)} />;

  const loginStreak = (user as any)?.loginStreak ?? 0;
  const claimedToday = (user as any)?.dailyRewardClaimedAt === new Date().toISOString().split("T")[0];
  const pendingIncoming = tradeOffersList.filter((t: any) => t.toUserId === user?.id && t.status === "pending").length;

  const viewLabels: Record<View, string> = {
    games: isPrimary ? "🎮 Fun Zone!" : isIntermediate ? "🎮 Game Zone" : "🎮 Challenge Arena",
    shop: "🛍️ Token Shop",
    inventory: "🎒 My Collection",
    trade: "🔄 Trade Market",
  };

  return (
    <SchoolLayout>
      <div className="p-5 max-w-4xl mx-auto space-y-5">
        {showConfetti && <Confetti />}

        {/* Bag reveal modal */}
        {bagReveal && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setBagReveal(null)}>
            <div className={`rounded-3xl p-8 text-center max-w-xs w-full border-2 ${RARITY_CONFIG[bagReveal.rarity as keyof typeof RARITY_CONFIG]?.bg ?? "bg-white/10 border-white/20"} ${RARITY_CONFIG[bagReveal.rarity as keyof typeof RARITY_CONFIG]?.glow ?? ""}`} onClick={e => e.stopPropagation()}>
              <div className="text-7xl mb-4 animate-bounce">{COLLECTIBLE_CATALOG[bagReveal.item?.itemId]?.emoji ?? "🎁"}</div>
              <Badge className={`text-sm font-black mb-3 ${RARITY_CONFIG[bagReveal.rarity as keyof typeof RARITY_CONFIG]?.bg ?? ""} ${RARITY_CONFIG[bagReveal.rarity as keyof typeof RARITY_CONFIG]?.color ?? ""}`}>
                ✨ {RARITY_CONFIG[bagReveal.rarity as keyof typeof RARITY_CONFIG]?.label ?? bagReveal.rarity}
              </Badge>
              <h2 className="text-white font-black text-2xl mt-2">{COLLECTIBLE_CATALOG[bagReveal.item?.itemId]?.name ?? "Mystery Item"}</h2>
              <p className="text-slate-400 text-sm mt-2 mb-5">Added to your collection!</p>
              <Button onClick={() => setBagReveal(null)} className="w-full rounded-xl font-black" data-testid="btn-close-reveal">Awesome!</Button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className={`relative overflow-hidden rounded-2xl p-5 ${isPrimary ? "bg-gradient-to-r from-purple-400 to-pink-500" : "bg-gradient-to-r from-purple-700 to-violet-800"}`}>
          <div className="absolute inset-0 sw-shimmer-bg opacity-20" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-black text-white">{viewLabels[view]}</h1>
              <p className="text-sm mt-0.5 text-white/70">
                {view === "games" ? (isPrimary ? "Play games and earn tokens! 🪙" : "Earn tokens, unlock collectibles!") : view === "shop" ? "Spend tokens on cosmetics, bags & power-ups" : view === "inventory" ? "Your collected items and power-ups" : "Trade items with classmates"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 rounded-xl px-3 py-2">
                <Coins className="h-4 w-4 text-amber-400" />
                <p className="text-lg font-black text-amber-300">{tokenBalance}</p>
                {loginStreak > 0 && <span className="text-xs text-orange-400 font-bold flex items-center gap-0.5"><Flame className="h-3 w-3" />{loginStreak}</span>}
              </div>
              {!claimedToday && (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs gap-1"
                  onClick={() => dailyClaimMutation.mutate()} disabled={dailyClaimMutation.isPending} data-testid="btn-daily-claim">
                  <Gift className="h-3.5 w-3.5" />Daily
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["games", "shop", "inventory", "trade"] as View[]).map(v => (
            <button key={v} onClick={() => setView(v)} data-testid={`tab-${v}`}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all relative ${view === v ? "bg-primary text-primary-foreground" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"}`}>
              {v === "games" ? <><Zap className="h-3.5 w-3.5" />Games</> : v === "shop" ? <><ShoppingBag className="h-3.5 w-3.5" />Shop</> : v === "inventory" ? <><Package className="h-3.5 w-3.5" />Collection</> : <><ArrowLeftRight className="h-3.5 w-3.5" />Trade</>}
              {v === "trade" && pendingIncoming > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-black">{pendingIncoming}</span>}
            </button>
          ))}
        </div>

        {/* GAMES VIEW */}
        {view === "games" && (
          <>
            {claimedToday ? (
              <div className="rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div><p className="text-emerald-300 font-bold text-sm">Daily reward claimed!</p><p className="text-emerald-400/70 text-xs">Streak: {loginStreak} day{loginStreak !== 1 ? "s" : ""} 🔥 Come back tomorrow for more tokens!</p></div>
              </div>
            ) : (
              <div className="rounded-xl p-3 bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Gift className="h-5 w-5 text-amber-400 shrink-0" />
                  <div><p className="text-amber-300 font-bold text-sm">Daily reward available!</p><p className="text-amber-400/70 text-xs">Day {loginStreak + 1} — Claim {5 + Math.min(loginStreak, 6) * 2} tokens + streak bonus</p></div>
                </div>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-500 shrink-0 rounded-xl font-bold text-xs"
                  onClick={() => dailyClaimMutation.mutate()} disabled={dailyClaimMutation.isPending} data-testid="btn-daily-claim-games">
                  {dailyClaimMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Claim!"}
                </Button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sw-stagger">
              {games.map(game => (
                <div key={game.id} onClick={() => setActiveGame(game.id)}
                  className={`sw-game-card relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${game.color} cursor-pointer shadow-lg`}
                  data-testid={`game-card-${game.id}`}>
                  <div className="text-5xl mb-3 sw-float">{game.emoji}</div>
                  <h3 className="font-black text-white text-lg leading-tight">{game.title}</h3>
                  <p className="text-white/75 text-xs mt-1 mb-3">{game.desc}</p>
                  <div className="flex items-center gap-1.5 bg-black/20 rounded-full px-3 py-1 w-fit">
                    <Coins className="h-3.5 w-3.5 text-amber-300" />
                    <span className="text-white text-xs font-bold">up to {game.tokens} tokens</span>
                  </div>
                  <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-white/40" />
                  <div className="absolute inset-0 sw-shimmer-bg opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
                </div>
              ))}
            </div>
          </>
        )}

        {/* SHOP VIEW */}
        {view === "shop" && (
          <div className="space-y-6">
            {/* Blind Bags */}
            <div>
              <div className="flex items-center gap-2 mb-3"><Package className="h-5 w-5 text-purple-400" /><h2 className="font-black text-lg text-white">Mystery Bags</h2><span className="text-sm text-slate-400">Open to get a random collectible!</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {BLIND_BAGS.map(bag => (
                  <div key={bag.id} className={`rounded-2xl p-5 bg-gradient-to-br ${bag.color} border border-white/10`} data-testid={`bag-${bag.id}`}>
                    <div className="text-4xl mb-2">{bag.emoji}</div>
                    <h3 className="text-white font-black text-base">{bag.name}</h3>
                    <p className="text-white/60 text-xs mt-1 mb-3">{bag.desc}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5"><Coins className="h-4 w-4 text-amber-300" /><span className="text-white font-black">{bag.cost}</span></div>
                      <Button size="sm" className="rounded-xl text-xs font-black bg-white/20 hover:bg-white/30 text-white border-0"
                        onClick={() => openBagMutation.mutate({ bagId: bag.id, cost: bag.cost })}
                        disabled={openBagMutation.isPending || tokenBalance < bag.cost}
                        data-testid={`btn-open-${bag.id}`}>
                        {tokenBalance < bag.cost ? <Lock className="h-3 w-3" /> : openBagMutation.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Open!"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Power-Ups */}
            <div>
              <div className="flex items-center gap-2 mb-3"><Zap className="h-5 w-5 text-yellow-400" /><h2 className="font-black text-lg text-white">Power-Ups</h2><span className="text-sm text-slate-400">One-time use boosts</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(POWER_UP_CATALOG).map(([id, pu]) => (
                  <div key={id} className="rounded-xl p-4 bg-white/5 border border-white/10 flex flex-col gap-2" data-testid={`powerup-${id}`}>
                    <div className="text-3xl">{pu.emoji}</div>
                    <p className="font-bold text-white text-sm">{pu.name}</p>
                    <p className="text-slate-400 text-xs flex-1">{pu.desc}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1"><Coins className="h-3.5 w-3.5 text-amber-400" /><span className="font-black text-amber-400 text-sm">{pu.cost}</span></div>
                      <Button size="sm" className="h-7 text-xs rounded-lg" onClick={() => buyItemMutation.mutate({ itemId: id, itemType: "power_up", cost: pu.cost })}
                        disabled={buyItemMutation.isPending || tokenBalance < pu.cost} data-testid={`btn-buy-${id}`}>
                        {tokenBalance < pu.cost ? <Lock className="h-3 w-3" /> : "Buy"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Titles */}
            <div>
              <div className="flex items-center gap-2 mb-3"><Sparkles className="h-5 w-5 text-primary" /><h2 className="font-black text-lg text-white">Titles</h2><span className="text-sm text-slate-400">Show off next to your name</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sw-stagger">
                {COSMETICS.titles.map(item => {
                  const isOwned = owned.includes(item.id);
                  const isEquipped = equippedTitle === item.id;
                  return (
                    <div key={item.id} className={`sw-shop-item rounded-xl border p-4 flex flex-col gap-2 ${isEquipped ? "border-primary bg-primary/10 sw-glow-pulse" : "border-white/10 bg-white/5"}`} data-testid={`cosmetic-title-${item.id}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{item.label}</span>
                        {isEquipped && <Badge className="bg-primary text-primary-foreground text-xs">Equipped</Badge>}
                        {isOwned && !isEquipped && <Badge className="bg-emerald-500/20 text-emerald-400 text-xs border-0">Owned</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-auto pt-1">
                        <Coins className="h-3.5 w-3.5 text-amber-400" /><span className="text-sm font-bold text-amber-400">{item.cost}</span>
                        {isOwned ? (
                          <Button size="sm" variant={isEquipped ? "outline" : "default"} className="ml-auto h-7 text-xs rounded-lg"
                            onClick={() => equipMutation.mutate({ type: "title", value: isEquipped ? null : item.id })}
                            disabled={equipMutation.isPending} data-testid={`btn-equip-title-${item.id}`}>
                            {isEquipped ? "Unequip" : "Equip"}
                          </Button>
                        ) : (
                          <Button size="sm" className="ml-auto h-7 text-xs rounded-lg"
                            onClick={() => purchaseMutation.mutate({ cosmeticId: item.id, cost: item.cost })}
                            disabled={purchaseMutation.isPending || tokenBalance < item.cost} data-testid={`btn-buy-title-${item.id}`}>
                            {tokenBalance < item.cost ? <Lock className="h-3 w-3" /> : "Buy"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Frames */}
            <div>
              <div className="flex items-center gap-2 mb-3"><Star className="h-5 w-5 text-amber-500" /><h2 className="font-black text-lg text-white">Profile Frames</h2><span className="text-sm text-slate-400">Style your avatar</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sw-stagger">
                {COSMETICS.frames.map(item => {
                  const isOwned = owned.includes(item.id);
                  const isEquipped = equippedFrame === item.id;
                  return (
                    <div key={item.id} className={`sw-shop-item rounded-xl border p-4 flex flex-col gap-2 ${isEquipped ? "border-primary bg-primary/10" : "border-white/10 bg-white/5"}`} data-testid={`cosmetic-frame-${item.id}`}>
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 ${item.color} flex items-center justify-center text-lg shrink-0`}>{user?.displayName?.[0]?.toUpperCase() ?? "?"}</div>
                        <div className="flex-1"><p className="font-bold text-sm text-white">{item.label}</p>{isEquipped && <Badge className="bg-primary text-primary-foreground text-xs mt-0.5">Equipped</Badge>}</div>
                      </div>
                      <div className="flex items-center gap-2 mt-auto pt-1">
                        <Coins className="h-3.5 w-3.5 text-amber-400" /><span className="text-sm font-bold text-amber-400">{item.cost}</span>
                        {isOwned ? (
                          <Button size="sm" variant={isEquipped ? "outline" : "default"} className="ml-auto h-7 text-xs rounded-lg"
                            onClick={() => equipMutation.mutate({ type: "frame", value: isEquipped ? null : item.id })}
                            disabled={equipMutation.isPending} data-testid={`btn-equip-frame-${item.id}`}>
                            {isEquipped ? "Unequip" : "Equip"}
                          </Button>
                        ) : (
                          <Button size="sm" className="ml-auto h-7 text-xs rounded-lg"
                            onClick={() => purchaseMutation.mutate({ cosmeticId: item.id, cost: item.cost })}
                            disabled={purchaseMutation.isPending || tokenBalance < item.cost} data-testid={`btn-buy-frame-${item.id}`}>
                            {tokenBalance < item.cost ? <Lock className="h-3 w-3" /> : "Buy"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stickers */}
            <div>
              <div className="flex items-center gap-2 mb-3"><span className="text-xl">🎨</span><h2 className="font-black text-lg text-white">Stickers</h2><span className="text-sm text-slate-400">Express yourself on your profile</span></div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sw-stagger">
                {COSMETICS.stickers.map(item => {
                  const isOwned = owned.includes(item.id);
                  return (
                    <div key={item.id} className={`sw-shop-item rounded-xl border p-3 flex flex-col items-center gap-1.5 text-center ${isOwned ? "border-emerald-500/30 bg-emerald-500/10" : "border-white/10 bg-white/5"}`} data-testid={`cosmetic-sticker-${item.id}`}>
                      <div className="text-3xl sw-float">{item.emoji}</div>
                      <p className="font-bold text-xs text-white leading-tight">{item.label}</p>
                      <p className="text-slate-500 text-xs">{item.desc}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Coins className="h-3 w-3 text-amber-400" /><span className="text-xs font-black text-amber-400">{item.cost}</span>
                      </div>
                      {isOwned ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 text-xs border-0 mt-0.5">Owned ✓</Badge>
                      ) : (
                        <Button size="sm" className="w-full h-6 text-xs rounded-lg mt-0.5"
                          onClick={() => purchaseMutation.mutate({ cosmeticId: item.id, cost: item.cost })}
                          disabled={purchaseMutation.isPending || tokenBalance < item.cost} data-testid={`btn-buy-sticker-${item.id}`}>
                          {tokenBalance < item.cost ? <Lock className="h-3 w-3" /> : "Buy"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Badges */}
            <div>
              <div className="flex items-center gap-2 mb-3"><span className="text-xl">🏅</span><h2 className="font-black text-lg text-white">Badges</h2><span className="text-sm text-slate-400">Show your achievements</span></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sw-stagger">
                {COSMETICS.badges.map(item => {
                  const isOwned = owned.includes(item.id);
                  return (
                    <div key={item.id} className={`sw-shop-item rounded-xl border p-4 flex items-center gap-3 ${isOwned ? "border-amber-500/30 bg-amber-500/10" : "border-white/10 bg-white/5"}`} data-testid={`cosmetic-badge-${item.id}`}>
                      <div className="text-3xl sw-badge-spin">{item.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white">{item.label}</p>
                        <p className="text-slate-400 text-xs">{item.desc}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Coins className="h-3 w-3 text-amber-400" />
                          <span className="text-xs font-black text-amber-400">{item.cost === 0 ? "FREE" : item.cost}</span>
                        </div>
                      </div>
                      {isOwned ? (
                        <Badge className="bg-amber-500/20 text-amber-400 text-xs border-0 shrink-0">Owned</Badge>
                      ) : (
                        <Button size="sm" className="h-7 text-xs rounded-lg shrink-0"
                          onClick={() => purchaseMutation.mutate({ cosmeticId: item.id, cost: item.cost })}
                          disabled={purchaseMutation.isPending || tokenBalance < item.cost} data-testid={`btn-buy-badge-${item.id}`}>
                          {item.cost === 0 ? "Claim" : tokenBalance < item.cost ? <Lock className="h-3 w-3" /> : "Buy"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* INVENTORY VIEW */}
        {view === "inventory" && (
          <div className="space-y-4">
            {inventory.length === 0 ? (
              <div className="rounded-2xl p-12 bg-white/5 border border-white/10 text-center">
                <Package className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-white font-bold text-lg">No items yet!</p>
                <p className="text-slate-400 text-sm mt-1">Open mystery bags in the Shop to start your collection.</p>
                <Button className="mt-4 rounded-xl" onClick={() => setView("shop")}>Go to Shop</Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-white font-bold">{inventory.length} item{inventory.length !== 1 ? "s" : ""} in collection</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {inventory.map((item: any) => {
                    const col = item.itemType === "collectible" ? COLLECTIBLE_CATALOG[item.itemId] : null;
                    const pu = item.itemType === "power_up" ? POWER_UP_CATALOG[item.itemId] : null;
                    const rarityConf = item.rarity ? RARITY_CONFIG[item.rarity as keyof typeof RARITY_CONFIG] : null;
                    return (
                      <div key={item.id} className={`rounded-xl p-4 border text-center ${rarityConf?.bg ?? "bg-white/5 border-white/10"} ${rarityConf?.glow ?? ""}`} data-testid={`inventory-item-${item.id}`}>
                        <div className="text-4xl mb-2">{col?.emoji ?? pu?.emoji ?? "📦"}</div>
                        <p className="text-white font-bold text-xs">{col?.name ?? pu?.name ?? item.itemId}</p>
                        {rarityConf && <Badge className={`text-xs mt-1 ${rarityConf.bg} ${rarityConf.color} border-0`}>{rarityConf.label}</Badge>}
                        {item.quantity > 1 && <p className="text-slate-400 text-xs mt-1">×{item.quantity}</p>}
                        {item.tradable && item.itemType === "collectible" && (
                          <Button size="sm" variant="outline" className="w-full mt-2 h-6 text-xs rounded-lg border-white/20 text-slate-300"
                            onClick={() => setView("trade")} data-testid={`btn-trade-item-${item.id}`}>Trade</Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* TRADE VIEW */}
        {view === "trade" && (
          <div className="space-y-5">
            {/* Incoming trades */}
            <div>
              <h2 className="font-black text-white text-base mb-3 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-rose-400" />Incoming Offers {pendingIncoming > 0 && <Badge className="bg-rose-500 text-white text-xs">{pendingIncoming}</Badge>}</h2>
              {tradeOffersList.filter((t: any) => t.toUserId === user?.id && t.status === "pending").length === 0 ? (
                <div className="rounded-xl p-6 bg-white/5 border border-white/10 text-center text-slate-400 text-sm">No incoming trade offers</div>
              ) : (
                <div className="space-y-3">
                  {tradeOffersList.filter((t: any) => t.toUserId === user?.id && t.status === "pending").map((trade: any) => (
                    <div key={trade.id} className="rounded-xl p-4 bg-white/5 border border-white/10 space-y-2" data-testid={`trade-incoming-${trade.id}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-white font-bold text-sm">Trade Offer</p>
                        <Badge className="bg-amber-500/20 text-amber-300 text-xs">Pending</Badge>
                      </div>
                      {trade.message && <p className="text-slate-400 text-xs italic">"{trade.message}"</p>}
                      {trade.tokenBonus > 0 && <p className="text-amber-300 text-xs font-bold">+ {trade.tokenBonus} tokens bonus</p>}
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs"
                          onClick={() => respondTradeMutation.mutate({ id: trade.id, action: "accept" })}
                          disabled={respondTradeMutation.isPending} data-testid={`btn-accept-trade-${trade.id}`}>Accept</Button>
                        <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                          onClick={() => respondTradeMutation.mutate({ id: trade.id, action: "reject" })}
                          disabled={respondTradeMutation.isPending} data-testid={`btn-reject-trade-${trade.id}`}>Decline</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My offers */}
            <div>
              <h2 className="font-black text-white text-base mb-3">My Sent Offers</h2>
              {tradeOffersList.filter((t: any) => t.fromUserId === user?.id).length === 0 ? (
                <div className="rounded-xl p-6 bg-white/5 border border-white/10 text-center text-slate-400 text-sm">No sent offers yet. Go to your Collection to trade items!</div>
              ) : (
                <div className="space-y-3">
                  {tradeOffersList.filter((t: any) => t.fromUserId === user?.id).slice(0, 10).map((trade: any) => (
                    <div key={trade.id} className="rounded-xl p-4 bg-white/5 border border-white/10 flex items-center justify-between gap-3" data-testid={`trade-sent-${trade.id}`}>
                      <div>
                        <p className="text-white font-bold text-sm">Offer to classmate</p>
                        {trade.message && <p className="text-slate-500 text-xs">"{trade.message}"</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${trade.status === "pending" ? "bg-amber-500/20 text-amber-300" : trade.status === "accepted" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                          {trade.status}
                        </Badge>
                        {trade.status === "pending" && (
                          <Button size="sm" variant="outline" className="h-6 text-xs rounded-lg border-rose-500/30 text-rose-400"
                            onClick={() => respondTradeMutation.mutate({ id: trade.id, action: "cancel" })}
                            disabled={respondTradeMutation.isPending}>Cancel</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl p-4 bg-blue-500/10 border border-blue-500/20">
              <p className="text-blue-300 text-sm font-bold">How to trade</p>
              <p className="text-blue-400/70 text-xs mt-1">Go to your Collection tab, tap an item, and select "Trade" to send an offer to a classmate.</p>
            </div>
          </div>
        )}
      </div>
    </SchoolLayout>
  );
}

/* ===== COIN RAIN GAME (Primary) ===== */
function CoinRainGame({ onEarn, onBack }: { onEarn: (n: number) => void; onBack: () => void }) {
  const [coins, setCoins] = useState<{ id: number; x: number; caught: boolean; missed: boolean }[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const nextId = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnRef = useRef<NodeJS.Timeout | null>(null);

  const start = () => {
    setStarted(true);
    setScore(0);
    setTimeLeft(20);
    setCoins([]);
    setFinished(false);

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          clearInterval(spawnRef.current!);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    spawnRef.current = setInterval(() => {
      const id = nextId.current++;
      setCoins(prev => [...prev.filter(c => !c.missed), { id, x: Math.random() * 80 + 5, caught: false, missed: false }]);
      setTimeout(() => {
        setCoins(prev => prev.map(c => c.id === id && !c.caught ? { ...c, missed: true } : c));
      }, 2500);
    }, 700);
  };

  const catchCoin = (id: number) => {
    setCoins(prev => prev.map(c => c.id === id ? { ...c, caught: true } : c));
    setScore(s => s + 1);
  };

  const tokens = Math.max(0, Math.round(score * 1.5));

  return (
    <SchoolLayout>
      <div className="p-5 max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-slate-400 hover:text-white font-semibold text-sm flex items-center gap-1">← Back</button>
          <h2 className="font-black text-white text-lg">🌧️ Coin Rain</h2>
          {started && !finished && (
            <div className="flex gap-4 text-sm font-bold">
              <span className="text-amber-400">Score: {score}</span>
              <span className="text-rose-400">{timeLeft}s</span>
            </div>
          )}
        </div>

        {!started && !finished && (
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl sw-float">🌧️</div>
            <h3 className="text-xl font-black text-white">Coin Rain!</h3>
            <p className="text-slate-400">Tap the coins before they fall! You have 20 seconds.</p>
            <Button onClick={start} className="bg-amber-500 hover:bg-amber-400 text-white font-black px-8 py-3 text-lg rounded-2xl" data-testid="button-start-coin-rain">
              Start! 🎮
            </Button>
          </div>
        )}

        {started && !finished && (
          <div className="relative h-80 bg-gradient-to-b from-sky-900 to-sky-950 rounded-2xl overflow-hidden border border-sky-700/30 cursor-pointer select-none" data-testid="coin-rain-arena">
            <Progress value={(timeLeft / 20) * 100} className="absolute top-2 left-2 right-2 h-2 z-10" />
            {coins.filter(c => !c.caught && !c.missed).map(coin => (
              <div
                key={coin.id}
                className="absolute text-3xl cursor-pointer hover:scale-125 transition-transform"
                style={{ left: `${coin.x}%`, animation: "sw-coin-fall 2.5s linear forwards" }}
                onClick={() => catchCoin(coin.id)}
                data-testid={`coin-${coin.id}`}
              >
                🪙
              </div>
            ))}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-4xl sw-float">🧺</div>
          </div>
        )}

        {finished && (
          <GameResult score={score} tokens={tokens} onEarn={() => onEarn(tokens)} onPlay={start} onBack={onBack}
            title="Round Complete!"
            message={score >= 15 ? "Amazing catching! 🌟" : score >= 8 ? "Great job! 🎉" : "Keep practising! 💪"}
          />
        )}
      </div>
    </SchoolLayout>
  );
}

/* ===== PIGGY BANK GAME (Primary) ===== */
function PiggyBankGame({ onEarn, onBack }: { onEarn: (n: number) => void; onBack: () => void }) {
  const items = [
    { id: 1, name: "Ice Cream 🍦", cost: 3, type: "spend" },
    { id: 2, name: "Savings 💰", cost: 10, type: "save" },
    { id: 3, name: "Toy Car 🚗", cost: 8, type: "spend" },
    { id: 4, name: "Investment 📈", cost: 15, type: "invest" },
    { id: 5, name: "Books 📚", cost: 6, type: "save" },
    { id: 6, name: "Game 🎮", cost: 12, type: "spend" },
  ];
  const [budget] = useState(25);
  const [basket, setBasket] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const spent = basket.reduce((s, id) => s + (items.find(i => i.id === id)?.cost ?? 0), 0);
  const remaining = budget - spent;
  const saved = basket.filter(id => items.find(i => i.id === id)?.type !== "spend").reduce((s, id) => s + (items.find(i => i.id === id)?.cost ?? 0), 0);

  const toggle = (id: number) => {
    const item = items.find(i => i.id === id)!;
    if (basket.includes(id)) setBasket(basket.filter(b => b !== id));
    else if (spent + item.cost <= budget) setBasket([...basket, id]);
  };

  const tokens = Math.min(10, Math.max(5, Math.round(saved / 3)));

  return (
    <SchoolLayout>
      <div className="p-5 max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-slate-400 hover:text-white font-semibold text-sm">← Back</button>
          <h2 className="font-black text-white text-lg">🐷 Piggy Bank Builder</h2>
          <span className={`font-bold text-sm ${remaining < 0 ? "text-rose-400" : "text-emerald-400"}`}>${remaining} left</span>
        </div>

        <div className="rounded-xl p-4 bg-amber-500/10 border border-amber-500/20">
          <p className="text-amber-300 font-bold text-sm">You have ${budget} to spend. Choose wisely! 🐷</p>
          <p className="text-amber-400/70 text-xs mt-0.5">Tip: Save and invest more to earn more tokens!</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {items.map(item => {
            const selected = basket.includes(item.id);
            const canAdd = !selected && spent + item.cost <= budget;
            return (
              <div
                key={item.id}
                onClick={() => toggle(item.id)}
                className={`rounded-xl p-4 border cursor-pointer transition-all ${selected ? "bg-emerald-500/20 border-emerald-500/40 scale-105" : canAdd ? "bg-white/5 border-white/10 hover:border-white/20" : "bg-white/3 border-white/5 opacity-40 cursor-not-allowed"}`}
                data-testid={`item-${item.id}`}
              >
                <p className="font-bold text-white text-sm">{item.name}</p>
                <p className="text-slate-400 text-xs">${item.cost}</p>
                <Badge className={`mt-1 text-xs ${item.type === "save" ? "bg-teal-500/20 text-teal-400" : item.type === "invest" ? "bg-purple-500/20 text-purple-400" : "bg-slate-500/20 text-slate-400"}`}>
                  {item.type}
                </Badge>
              </div>
            );
          })}
        </div>

        {!submitted ? (
          <Button onClick={() => setSubmitted(true)} className="w-full bg-amber-500 hover:bg-amber-400 text-white font-black rounded-xl py-3" disabled={basket.length === 0} data-testid="button-submit-piggy">
            Fill My Piggy Bank! 🐷
          </Button>
        ) : (
          <GameResult score={saved} tokens={tokens} onEarn={() => onEarn(tokens)} onPlay={() => { setBasket([]); setSubmitted(false); }} onBack={onBack}
            title="Great choices!"
            message={saved >= 15 ? "Super saver! 🌟" : saved >= 8 ? "Good saving! 🎉" : "Try to save more next time! 💪"}
          />
        )}
      </div>
    </SchoolLayout>
  );
}

/* ===== SMART SHOPPER GAME (Primary) ===== */
function SmartShopperGame({ onEarn, onBack }: { onEarn: (n: number) => void; onBack: () => void }) {
  const shopItems = [
    { id: 1, name: "Bread 🍞", price: 3, need: true },
    { id: 2, name: "Toy 🧸", price: 12, need: false },
    { id: 3, name: "Milk 🥛", price: 2, need: true },
    { id: 4, name: "Candy 🍭", price: 5, need: false },
    { id: 5, name: "Fruit 🍎", price: 4, need: true },
    { id: 6, name: "Stickers ⭐", price: 3, need: false },
    { id: 7, name: "Eggs 🥚", price: 3, need: true },
    { id: 8, name: "Game 🎮", price: 15, need: false },
  ];
  const budget = 15;
  const [cart, setCart] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const total = cart.reduce((s, id) => s + (shopItems.find(i => i.id === id)?.price ?? 0), 0);
  const needsBought = cart.filter(id => shopItems.find(i => i.id === id)?.need).length;
  const totalNeeds = shopItems.filter(i => i.need).length;

  const toggle = (id: number) => {
    const item = shopItems.find(i => i.id === id)!;
    if (cart.includes(id)) setCart(cart.filter(b => b !== id));
    else if (total + item.price <= budget) setCart([...cart, id]);
  };

  const tokens = Math.min(12, Math.max(5, needsBought * 2 + (total <= budget ? 3 : 0)));
  const smartScore = needsBought;

  return (
    <SchoolLayout>
      <div className="p-5 max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-slate-400 hover:text-white font-semibold text-sm">← Back</button>
          <h2 className="font-black text-white text-lg">🛒 Smart Shopper</h2>
          <span className={`font-bold text-sm ${total > budget ? "text-rose-400" : "text-emerald-400"}`}>${budget - total} left</span>
        </div>

        <div className="rounded-xl p-4 bg-green-500/10 border border-green-500/20">
          <p className="text-green-300 font-bold text-sm">Budget: ${budget} — Buy what you need! 🛒</p>
          <p className="text-green-400/70 text-xs mt-0.5">Needs are more important than wants!</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {shopItems.map(item => {
            const inCart = cart.includes(item.id);
            const canAdd = !inCart && total + item.price <= budget;
            return (
              <div
                key={item.id}
                onClick={() => toggle(item.id)}
                className={`rounded-xl p-3 border cursor-pointer transition-all text-center ${inCart ? "bg-green-500/20 border-green-500/40 scale-105" : canAdd ? "bg-white/5 border-white/10 hover:border-white/20" : "bg-white/3 border-white/5 opacity-40 cursor-not-allowed"}`}
                data-testid={`shop-item-${item.id}`}
              >
                <p className="text-2xl mb-1">{item.name.split(" ")[1]}</p>
                <p className="font-bold text-white text-xs">{item.name.split(" ")[0]}</p>
                <p className="text-slate-400 text-xs">${item.price}</p>
                {item.need && <p className="text-green-400 text-xs font-bold mt-0.5">✓ need</p>}
              </div>
            );
          })}
        </div>

        {!submitted ? (
          <Button onClick={() => setSubmitted(true)} className="w-full bg-green-500 hover:bg-green-400 text-white font-black rounded-xl py-3" disabled={cart.length === 0} data-testid="button-checkout">
            Checkout! 🛒 (${total})
          </Button>
        ) : (
          <GameResult score={smartScore} tokens={tokens} onEarn={() => onEarn(tokens)} onPlay={() => { setCart([]); setSubmitted(false); }} onBack={onBack}
            title="Shopping Done!"
            message={needsBought === totalNeeds ? "Perfect shopping! 🌟" : needsBought >= 2 ? "Good choices! 🎉" : "Remember to buy what you need first! 💪"}
          />
        )}
      </div>
    </SchoolLayout>
  );
}

/* ===== STOCK GUESSER (Intermediate) ===== */
function StockGuesserGame({ onEarn, onBack }: { onEarn: (n: number) => void; onBack: () => void }) {
  const stocks = [
    { symbol: "AAPL", name: "Apple", hint: "New iPhone just released 📱", move: "up" },
    { symbol: "NFLX", name: "Netflix", hint: "Lost 1 million subscribers 📺", move: "down" },
    { symbol: "TSLA", name: "Tesla", hint: "Record EV deliveries 🚗", move: "up" },
    { symbol: "META", name: "Meta", hint: "Regulatory fine announced 📰", move: "down" },
    { symbol: "NVDA", name: "Nvidia", hint: "New AI chip beats expectations 🤖", move: "up" },
    { symbol: "AMZN", name: "Amazon", hint: "Prime membership growth slows 📦", move: "down" },
  ];

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<"up" | "down" | null>(null);
  const [finished, setFinished] = useState(false);

  const current = stocks[round];
  const correct = answered === current.move;
  const tokens = Math.round(score * 4);

  const guess = (dir: "up" | "down") => {
    setAnswered(dir);
    if (dir === current.move) setScore(s => s + 1);
    setTimeout(() => {
      if (round + 1 >= stocks.length) setFinished(true);
      else { setRound(r => r + 1); setAnswered(null); }
    }, 1200);
  };

  if (finished) return (
    <SchoolLayout>
      <div className="p-5 max-w-xl mx-auto">
        <GameResult score={score} tokens={tokens} onEarn={() => onEarn(tokens)} onPlay={() => { setRound(0); setScore(0); setAnswered(null); setFinished(false); }} onBack={onBack}
          title="Round Complete!"
          message={score >= 5 ? "Stock market genius! 📊" : score >= 3 ? "Nice predictions! 🎉" : "Keep learning charts! 💪"}
        />
      </div>
    </SchoolLayout>
  );

  return (
    <SchoolLayout>
      <div className="p-5 max-w-xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-slate-400 hover:text-white font-semibold text-sm">← Back</button>
          <h2 className="font-black text-white text-lg">📊 Stock Guesser</h2>
          <span className="text-teal-400 font-bold text-sm">{score}/{stocks.length}</span>
        </div>
        <Progress value={((round) / stocks.length) * 100} className="h-2" />

        <div className="rounded-2xl p-6 bg-white/5 border border-white/10 text-center space-y-4">
          <p className="text-slate-400 text-sm">Round {round + 1} of {stocks.length}</p>
          <div>
            <p className="text-3xl font-black text-teal-400">{current.symbol}</p>
            <p className="text-slate-400 text-sm">{current.name}</p>
          </div>
          <div className="rounded-xl p-4 bg-blue-500/10 border border-blue-500/20">
            <p className="text-blue-300 font-semibold text-sm">📰 {current.hint}</p>
          </div>
          <p className="text-white font-bold">Will {current.name} go up or down?</p>
          <div className="flex gap-3 justify-center">
            {(["up", "down"] as const).map(dir => (
              <Button
                key={dir}
                onClick={() => guess(dir)}
                disabled={answered !== null}
                className={`flex-1 font-black text-base rounded-xl py-4 ${
                  answered === dir ? (dir === current.move ? "bg-emerald-500 text-white" : "bg-rose-500 text-white") : dir === "up" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-rose-600 hover:bg-rose-500 text-white"
                }`}
                data-testid={`button-guess-${dir}`}
              >
                {dir === "up" ? "📈 Up" : "📉 Down"}
              </Button>
            ))}
          </div>
          {answered && (
            <p className={`font-black text-lg sw-bounce-in ${correct ? "text-emerald-400" : "text-rose-400"}`}>
              {correct ? "✓ Correct! +1 point" : `✗ It went ${current.move}!`}
            </p>
          )}
        </div>
      </div>
    </SchoolLayout>
  );
}

/* ===== BUDGET BOSS (Intermediate) ===== */
function BudgetBossGame({ onEarn, onBack }: { onEarn: (n: number) => void; onBack: () => void }) {
  const income = 500;
  const categories = [
    { key: "housing", label: "Housing 🏠", ideal: [25, 35], min: 0, max: 100 },
    { key: "food", label: "Food 🍔", ideal: [10, 15], min: 0, max: 100 },
    { key: "transport", label: "Transport 🚗", ideal: [10, 15], min: 0, max: 100 },
    { key: "savings", label: "Savings 💰", ideal: [15, 25], min: 0, max: 100 },
    { key: "entertainment", label: "Fun 🎮", ideal: [5, 10], min: 0, max: 100 },
  ];
  const [allocations, setAllocations] = useState<Record<string, number>>({ housing: 30, food: 15, transport: 10, savings: 20, entertainment: 5 });
  const [submitted, setSubmitted] = useState(false);

  const total = Object.values(allocations).reduce((s, v) => s + v, 0);
  const score = categories.filter(c => {
    const pct = allocations[c.key];
    return pct >= c.ideal[0] && pct <= c.ideal[1];
  }).length;
  const tokens = Math.max(10, score * 4);

  return (
    <SchoolLayout>
      <div className="p-5 max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-slate-400 hover:text-white font-semibold text-sm">← Back</button>
          <h2 className="font-black text-white text-lg">💰 Budget Boss</h2>
          <span className={`font-bold text-sm ${total > 100 ? "text-rose-400" : "text-emerald-400"}`}>{total}% allocated</span>
        </div>

        <div className="rounded-xl p-4 bg-purple-500/10 border border-purple-500/20">
          <p className="text-purple-300 font-bold text-sm">Monthly income: ${income}</p>
          <p className="text-purple-400/70 text-xs">Allocate 100% across categories</p>
        </div>

        {!submitted ? (
          <>
            <div className="space-y-4">
              {categories.map(cat => (
                <div key={cat.key} className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-sm font-semibold text-white">{cat.label}</label>
                    <span className="text-teal-400 font-bold text-sm">{allocations[cat.key]}% (${Math.round(income * allocations[cat.key] / 100)})</span>
                  </div>
                  <input
                    type="range" min={0} max={60} value={allocations[cat.key]}
                    onChange={e => setAllocations(prev => ({ ...prev, [cat.key]: Number(e.target.value) }))}
                    className="w-full accent-teal-500"
                    data-testid={`slider-${cat.key}`}
                  />
                  <p className="text-xs text-slate-600">Ideal: {cat.ideal[0]}–{cat.ideal[1]}%</p>
                </div>
              ))}
            </div>
            <Button onClick={() => setSubmitted(true)} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl" disabled={total > 100} data-testid="button-submit-budget">
              Submit Budget ({total}%)
            </Button>
          </>
        ) : (
          <GameResult score={score} tokens={tokens} onEarn={() => onEarn(tokens)} onPlay={() => { setSubmitted(false); }} onBack={onBack}
            title="Budget Submitted!"
            message={score >= 4 ? "Budget Boss! 💰" : score >= 2 ? "Not bad! 🎉" : "Study the ideal ranges! 💪"}
          />
        )}
      </div>
    </SchoolLayout>
  );
}

/* ===== QUIZ GAME (Intermediate + HS) ===== */
const ALL_INTERMEDIATE_QUESTIONS = [
  { q: "What is a budget?", options: ["A plan for spending", "A type of bank", "A credit card", "A type of tax"], answer: 0 },
  { q: "What does 'saving' money mean?", options: ["Spending it all", "Keeping some for later", "Giving it away", "Losing it"], answer: 1 },
  { q: "What is interest?", options: ["Extra money paid on loans", "A hobby", "A type of investment", "A bank fee"], answer: 0 },
  { q: "What is a stock?", options: ["Food storage", "Ownership in a company", "A type of loan", "Cash in hand"], answer: 1 },
  { q: "What is inflation?", options: ["Prices rising over time", "Prices falling", "Making a profit", "Paying taxes"], answer: 0 },
  { q: "What is a dividend?", options: ["A company loss", "A share split", "Profit paid to shareholders", "A loan payment"], answer: 2 },
  { q: "What does 'diversify' mean?", options: ["Put money in one place", "Spread investments", "Sell everything", "Borrow more"], answer: 1 },
  { q: "What is a mutual fund?", options: ["A pooled investment", "A savings account", "A type of loan", "Government money"], answer: 0 },
  { q: "What is a bear market?", options: ["Prices rising", "Prices falling 20%+", "A bull market", "A stock split"], answer: 1 },
  { q: "What does 'compound interest' mean?", options: ["Simple interest", "Interest on interest", "A tax rate", "A loan type"], answer: 1 },
  { q: "What is a credit score?", options: ["Your bank balance", "A measure of creditworthiness", "A loan type", "Monthly income"], answer: 1 },
  { q: "What does 'net worth' mean?", options: ["Annual salary", "Assets minus liabilities", "Total savings", "Monthly budget"], answer: 1 },
  { q: "What is an asset?", options: ["Something you owe", "Something you own of value", "A monthly bill", "A type of tax"], answer: 1 },
  { q: "What is a liability?", options: ["Money you own", "A debt or obligation", "An investment", "A savings account"], answer: 1 },
  { q: "What is the stock market?", options: ["A grocery store", "A place to buy/sell company shares", "A bank", "A currency exchange"], answer: 1 },
  { q: "What does 'ROI' stand for?", options: ["Risk of Inflation", "Return on Investment", "Rate of Income", "Revenue over Interest"], answer: 1 },
  { q: "What is a share?", options: ["A piece of a company", "A bank loan", "A type of tax", "A budget item"], answer: 0 },
  { q: "What is a recession?", options: ["Economic growth", "Two quarters of declining GDP", "A stock rally", "Rising inflation"], answer: 1 },
  { q: "What is 'opportunity cost'?", options: ["The cost of a missed alternative", "A business expense", "A tax deduction", "A profit margin"], answer: 0 },
  { q: "What is an emergency fund?", options: ["Money for fun", "Savings for unexpected expenses", "A retirement account", "A business loan"], answer: 1 },
];

const ALL_HS_QUESTIONS = [
  { q: "What is the P/E ratio?", options: ["Price-to-Earnings", "Profit-to-Expense", "Performance-to-Equity", "Price-to-Equity"], answer: 0 },
  { q: "What is a short sale?", options: ["Quick trade", "Selling borrowed shares", "Penny stocks", "Day trading"], answer: 1 },
  { q: "What is liquidity?", options: ["Cash holdings", "Ease of converting to cash", "Debt ratio", "Revenue growth"], answer: 1 },
  { q: "What is a bond?", options: ["A loan to a government/company", "A type of stock", "A savings account", "An ETF"], answer: 0 },
  { q: "What does ROI stand for?", options: ["Rate of Income", "Return on Investment", "Risk of Inflation", "Revenue over Interest"], answer: 1 },
  { q: "What is hedging?", options: ["Planting gardens", "Reducing investment risk", "Leveraged trading", "Index investing"], answer: 1 },
  { q: "What is market capitalisation?", options: ["Total shares × price", "Company profit", "Debt level", "Annual revenue"], answer: 0 },
  { q: "What is an ETF?", options: ["Exchange Traded Fund", "Equity Transfer Fee", "Earnings Tax Form", "Early Trading Fee"], answer: 0 },
  { q: "What is a bull market?", options: ["Prices falling 20%+", "Prices rising", "A volatile period", "A sideways market"], answer: 1 },
  { q: "What is volatility?", options: ["Steady growth", "Price fluctuation", "High trading volume", "A chart pattern"], answer: 1 },
  { q: "What is a stop-loss order?", options: ["An order to buy more", "Sell at a set price to limit losses", "A dividend payment", "A limit buy"], answer: 1 },
  { q: "What is EPS?", options: ["Earnings Per Share", "Equity Price Score", "Exchange Premium Spread", "Expense Per Stock"], answer: 0 },
  { q: "What does 'going long' mean?", options: ["Selling a stock short", "Buying expecting price to rise", "Holding for decades", "Borrowing shares"], answer: 1 },
  { q: "What is a derivative?", options: ["A stock dividend", "A contract deriving value from an asset", "A type of ETF", "A bond coupon"], answer: 1 },
  { q: "What is the Dow Jones?", options: ["A stock exchange", "An index of 30 major US companies", "A bond market", "A currency index"], answer: 1 },
  { q: "What is diversification?", options: ["Buying one stock repeatedly", "Spreading investments across assets", "Selling all stocks", "Day trading only"], answer: 1 },
  { q: "What is a yield?", options: ["Annual income from investment ÷ cost", "A stock price", "A market index", "A credit rating"], answer: 0 },
  { q: "What is 'dollar-cost averaging'?", options: ["Buying more when prices rise", "Investing fixed amounts regularly", "Selling at peak price", "Currency speculation"], answer: 1 },
  { q: "What is a market order?", options: ["Order at a specific price", "Buy/sell immediately at current price", "A futures contract", "A stop order"], answer: 1 },
  { q: "What is beta in finance?", options: ["A company's profit margin", "Measure of a stock's volatility vs market", "Interest rate sensitivity", "A bond rating"], answer: 1 },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function QuizGame({ level, onEarn, onBack }: { level: "intermediate" | "high_school"; onEarn: (n: number) => void; onBack: () => void }) {
  const allQ = level === "high_school" ? ALL_HS_QUESTIONS : ALL_INTERMEDIATE_QUESTIONS;
  const [questions, setQuestions] = useState(() => shuffleArray(allQ).slice(0, 10));
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const resetGame = () => {
    setQuestions(shuffleArray(allQ).slice(0, 10));
    setQIdx(0);
    setScore(0);
    setSelected(null);
    setFinished(false);
  };

  const current = questions[qIdx];
  const tokens = Math.round(score * 3);

  const answer = (idx: number) => {
    setSelected(idx);
    if (idx === current.answer) setScore(s => s + 1);
    setTimeout(() => {
      if (qIdx + 1 >= questions.length) setFinished(true);
      else { setQIdx(i => i + 1); setSelected(null); }
    }, 1000);
  };

  if (finished) return (
    <SchoolLayout>
      <div className="p-5 max-w-xl mx-auto">
        <GameResult score={score} tokens={tokens} onEarn={() => onEarn(tokens)} onPlay={resetGame} onBack={onBack}
          title="Quiz Complete!"
          message={score >= 8 ? "Finance genius! 🧠" : score >= 5 ? "Well done! 🎉" : "Keep studying! 💪"}
        />
      </div>
    </SchoolLayout>
  );

  return (
    <SchoolLayout>
      <div className="p-5 max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-slate-400 hover:text-white font-semibold text-sm">← Back</button>
          <h2 className="font-black text-white text-lg">🧠 Finance Quiz</h2>
          <span className="text-teal-400 font-bold text-sm">{score}/{questions.length}</span>
        </div>
        <Progress value={((qIdx) / questions.length) * 100} className="h-2" />
        <div className="rounded-2xl p-6 bg-white/5 border border-white/10 space-y-5">
          <p className="text-slate-400 text-sm text-center">Question {qIdx + 1} of {questions.length}</p>
          <p className="text-white font-black text-lg text-center">{current.q}</p>
          <div className="space-y-2.5">
            {current.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => selected === null && answer(i)}
                disabled={selected !== null}
                className={`w-full text-left px-4 py-3 rounded-xl border font-semibold text-sm transition-all ${
                  selected === null ? "bg-white/5 border-white/10 hover:border-teal-500/40 hover:bg-teal-500/5 text-white" :
                  i === current.answer ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" :
                  selected === i ? "bg-rose-500/20 border-rose-500/40 text-rose-300" :
                  "bg-white/3 border-white/5 text-slate-600"
                }`}
                data-testid={`quiz-option-${i}`}
              >
                {selected !== null && i === current.answer && "✓ "}{opt}
                {selected === i && i !== current.answer && " ✗"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </SchoolLayout>
  );
}

/* ===== MARKET PREDICTION (HS) ===== */
function MarketPredictionGame({ onEarn, onBack }: { onEarn: (n: number) => void; onBack: () => void }) {
  const scenarios = [
    { title: "Fed raises rates by 0.5%", context: "Inflation is at 7%, the Fed just announced a rate hike.", q: "How will this affect tech stocks?", correct: "down", explain: "Higher rates increase borrowing costs, reducing tech valuations." },
    { title: "Strong jobs report", context: "US added 400K jobs, unemployment at 3.5%.", q: "How will the S&P 500 likely react?", correct: "up", explain: "Strong employment signals economic growth, boosting markets." },
    { title: "Oil supply cut 2 million barrels/day", context: "OPEC announces major production cut.", q: "How will oil prices move?", correct: "up", explain: "Less supply with same demand pushes prices higher." },
    { title: "Major bank reports $5B loss", context: "One of the largest US banks missed estimates badly.", q: "How will bank sector stocks react?", correct: "down", explain: "Poor earnings signal sector weakness, dragging all bank stocks." },
  ];

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const current = scenarios[round];
  const tokens = Math.round(score * 10);

  const guess = (dir: string) => {
    setAnswered(dir);
    if (dir === current.correct) setScore(s => s + 1);
    setTimeout(() => {
      if (round + 1 >= scenarios.length) setFinished(true);
      else { setRound(r => r + 1); setAnswered(null); }
    }, 2000);
  };

  if (finished) return (
    <SchoolLayout>
      <div className="p-5 max-w-xl mx-auto">
        <GameResult score={score} tokens={tokens} onEarn={() => onEarn(tokens)} onPlay={() => { setRound(0); setScore(0); setAnswered(null); setFinished(false); }} onBack={onBack}
          title="Prediction Round Done!"
          message={score >= 3 ? "Market analyst! 📈" : score >= 2 ? "Good instincts! 🎉" : "Study macroeconomics! 💪"}
        />
      </div>
    </SchoolLayout>
  );

  return (
    <SchoolLayout>
      <div className="p-5 max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-slate-400 hover:text-white font-semibold text-sm">← Back</button>
          <h2 className="font-black text-white text-lg">📈 Market Prediction</h2>
          <span className="text-teal-400 font-bold text-sm">{score}/{scenarios.length}</span>
        </div>
        <Progress value={(round / scenarios.length) * 100} className="h-2" />
        <div className="rounded-2xl p-6 bg-white/5 border border-white/10 space-y-4">
          <Badge className="bg-teal-500/20 text-teal-300">Scenario {round + 1}</Badge>
          <h3 className="text-white font-black text-lg">{current.title}</h3>
          <p className="text-slate-400 text-sm">{current.context}</p>
          <p className="text-white font-bold">{current.q}</p>
          <div className="flex gap-3">
            {["up", "down"].map(dir => (
              <Button key={dir} onClick={() => answered === null && guess(dir)} disabled={answered !== null}
                className={`flex-1 font-black py-4 rounded-xl ${answered === dir ? (dir === current.correct ? "bg-emerald-500" : "bg-rose-500") : dir === "up" ? "bg-emerald-700 hover:bg-emerald-600" : "bg-rose-700 hover:bg-rose-600"} text-white`}
                data-testid={`button-predict-${dir}`}>
                {dir === "up" ? "📈 Higher" : "📉 Lower"}
              </Button>
            ))}
          </div>
          {answered && (
            <div className={`rounded-lg p-3 ${answered === current.correct ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"}`}>
              <p className={`font-bold text-sm ${answered === current.correct ? "text-emerald-400" : "text-rose-400"}`}>
                {answered === current.correct ? "✓ Correct!" : "✗ Incorrect"} — {current.explain}
              </p>
            </div>
          )}
        </div>
      </div>
    </SchoolLayout>
  );
}

/* ===== STRATEGY CHALLENGE (HS) — Trading Decision Game ===== */
const TRADING_SCENARIOS = [
  {
    title: "Earnings Beat",
    setup: "A tech company you own just reported earnings 40% above analyst estimates. Revenue grew 28% year-over-year. The stock has already jumped 12% in after-hours trading.",
    question: "What is the best action?",
    options: ["Buy more — momentum will continue", "Hold — let the dust settle", "Sell — take profits at the spike"],
    correct: 1,
    explanation: "After a major gap-up, it is often wise to hold and wait. Chasing a 12% after-hours spike adds risk, and selling too early can cost you future gains. Patient holders benefit most.",
  },
  {
    title: "Interest Rate Hike",
    setup: "The central bank just announced a surprise 0.75% interest rate hike — the largest in 20 years. Growth stocks and crypto are already falling 5-10%.",
    question: "Which sector is likely to benefit?",
    options: ["Technology growth stocks", "Banks and financial stocks", "Speculative cryptocurrencies"],
    correct: 1,
    explanation: "Banks earn more profit on loans when rates rise. Tech and crypto tend to fall because higher rates reduce the present value of future earnings.",
  },
  {
    title: "Stop-Loss Decision",
    setup: "You bought a stock at $50. It has fallen to $38 (−24%) due to a company scandal. Analysts are divided — some say it will recover, others say it will keep falling.",
    question: "What should you do?",
    options: ["Buy more to average down", "Hold and hope for recovery", "Cut losses with a stop-loss order"],
    correct: 2,
    explanation: "A stop-loss limits further damage when fundamentals are unclear. 'Averaging down' into a falling knife is risky. Protecting capital is a key trading rule.",
  },
  {
    title: "Market Correction",
    setup: "The market has dropped 22% from its peak over 3 months. Fear is high, news headlines are negative, but economic data still shows job growth and consumer spending.",
    question: "What does this situation most likely represent?",
    options: ["A great time to panic sell", "A potential buying opportunity", "Guaranteed continued decline"],
    correct: 1,
    explanation: "Market corrections with strong underlying economic data are often buying opportunities. 'Buy when there is blood in the streets' — but always manage risk.",
  },
  {
    title: "Diversification Test",
    setup: "Your portfolio is 90% in one high-flying tech stock that has tripled in 2 years. A friend says you should stay concentrated because 'it keeps going up'.",
    question: "What is the main risk of this strategy?",
    options: ["Missing out on other stocks", "Catastrophic loss if the stock crashes", "Paying too many trading fees"],
    correct: 1,
    explanation: "Concentration risk is real — even great companies can fall 50-80%. Diversification protects your portfolio from any single company's failure.",
  },
  {
    title: "Insider Tip",
    setup: "A friend who works at a company tells you their earnings report (not yet public) will be terrible. They suggest selling your shares before the announcement.",
    question: "What should you do?",
    options: ["Sell immediately — great tip!", "Ignore it — acting on insider information is illegal", "Tell other friends so they can sell too"],
    correct: 1,
    explanation: "Trading on material non-public information is insider trading — a serious crime punishable by fines and prison. Always trade using publicly available information only.",
  },
  {
    title: "IPO Fever",
    setup: "A hot new AI company is going public tomorrow. Media hype is massive. The IPO is priced at $40/share, but pre-market trading suggests it will open at $85.",
    question: "What is the most cautious approach?",
    options: ["Buy as many shares as possible at open", "Wait and watch how it trades for a few weeks", "Short sell it immediately"],
    correct: 1,
    explanation: "IPOs are often volatile. Many drop significantly after the initial hype fades. Waiting for price to stabilize helps you make a more informed entry decision.",
  },
  {
    title: "Risk vs Reward",
    setup: "You have $5,000 to invest. Option A: Government bond paying 4.5% annually with near-zero risk. Option B: Small-cap biotech stock that could gain 200% or lose 80%.",
    question: "Which best describes a balanced approach?",
    options: ["Put all $5,000 in the biotech", "Split: $3,500 in bonds, $1,500 in biotech", "Put all $5,000 in bonds — no risk ever"],
    correct: 1,
    explanation: "A balanced approach allocates most capital to safer assets while keeping a smaller 'risk budget' for higher-reward opportunities. This manages downside while allowing upside.",
  },
];

function StrategyChallenge({ onEarn, onBack }: { onEarn: (n: number) => void; onBack: () => void }) {
  const [scenarios] = useState(() => shuffleArray(TRADING_SCENARIOS).slice(0, 5));
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = scenarios[idx];
  const tokens = 20 + score * 6;

  const choose = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === current.correct) setScore(s => s + 1);
    setTimeout(() => {
      if (idx + 1 >= scenarios.length) setFinished(true);
      else { setIdx(n => n + 1); setSelected(null); }
    }, 2200);
  };

  const reset = () => { setIdx(0); setScore(0); setSelected(null); setFinished(false); };

  if (finished) return (
    <SchoolLayout>
      <div className="p-5 max-w-xl mx-auto">
        <GameResult score={score} tokens={tokens} onEarn={() => onEarn(tokens)} onPlay={reset} onBack={onBack}
          title="Challenge Complete!"
          message={score >= 4 ? "Trading strategist! 🎯" : score >= 3 ? "Strong decisions! 🎉" : "Review trading fundamentals! 💪"}
        />
      </div>
    </SchoolLayout>
  );

  return (
    <SchoolLayout>
      <div className="p-5 max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-slate-400 hover:text-white font-semibold text-sm">← Back</button>
          <h2 className="font-black text-white text-lg">🎯 Strategy Challenge</h2>
          <span className="text-teal-400 font-bold text-sm">{score}/{scenarios.length}</span>
        </div>
        <Progress value={(idx / scenarios.length) * 100} className="h-2" />
        <div className="rounded-2xl p-5 bg-white/5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <Badge className="bg-blue-500/20 text-blue-300 text-xs">Scenario {idx + 1} of {scenarios.length}</Badge>
          </div>
          <h3 className="text-white font-black text-base">{current.title}</h3>
          <p className="text-slate-400 text-sm leading-relaxed">{current.setup}</p>
          <p className="text-white font-bold text-sm border-t border-white/10 pt-3">{current.question}</p>
          <div className="space-y-2.5">
            {current.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={selected !== null}
                data-testid={`strategy-option-${i}`}
                className={`w-full text-left px-4 py-3 rounded-xl border font-semibold text-sm transition-all ${
                  selected === null
                    ? "bg-white/5 border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 text-white"
                    : i === current.correct
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : selected === i
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                    : "bg-white/3 border-white/5 text-slate-600"
                }`}
              >
                {selected !== null && i === current.correct && "✓ "}{opt}{selected === i && i !== current.correct && " ✗"}
              </button>
            ))}
          </div>
          {selected !== null && (
            <div className={`rounded-xl p-3 ${selected === current.correct ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}>
              <p className={`font-bold text-xs mb-1 ${selected === current.correct ? "text-emerald-400" : "text-amber-400"}`}>
                {selected === current.correct ? "✓ Correct!" : "✗ Not quite —"}
              </p>
              <p className="text-slate-300 text-xs leading-relaxed">{current.explanation}</p>
            </div>
          )}
        </div>
      </div>
    </SchoolLayout>
  );
}

/* ===== WORD SCRAMBLE GAME ===== */
const SCRAMBLE_WORDS = [
  { word: "DIVIDEND", hint: "Profit paid to shareholders" },
  { word: "LIQUIDITY", hint: "Ease of converting assets to cash" },
  { word: "PORTFOLIO", hint: "Collection of investments" },
  { word: "INFLATION", hint: "General rise in prices over time" },
  { word: "COMPOUND", hint: "Interest earned on interest" },
  { word: "LEVERAGE", hint: "Using borrowed money to invest" },
  { word: "RECESSION", hint: "Two quarters of declining growth" },
  { word: "ARBITRAGE", hint: "Profiting from price differences" },
  { word: "HEDGING", hint: "Reducing risk with offsetting positions" },
  { word: "VOLATILITY", hint: "Degree of price fluctuation" },
  { word: "EQUITY", hint: "Ownership stake in a company" },
  { word: "FUTURES", hint: "Contract to buy/sell at a future date" },
  { word: "DEFICIT", hint: "When spending exceeds income" },
  { word: "SURPLUS", hint: "When income exceeds spending" },
  { word: "COLLATERAL", hint: "Asset pledged as loan security" },
];

function scramble(word: string): string {
  const arr = word.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("") === word ? scramble(word) : arr.join("");
}

function WordScrambleGame({ onEarn, onBack }: { onEarn: (n: number) => void; onBack: () => void }) {
  const [words] = useState(() => shuffleArray(SCRAMBLE_WORDS).slice(0, 8));
  const [idx, setIdx] = useState(0);
  const [scrambled] = useState(() => words.map(w => scramble(w.word)));
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const idxRef = useRef(idx);
  const wordsLenRef = useRef(words.length);
  useEffect(() => { idxRef.current = idx; }, [idx]);

  const handleNext = useCallback((correct: boolean) => {
    clearInterval(timerRef.current!);
    if (correct) setScore(s => s + 1);
    if (idxRef.current + 1 >= wordsLenRef.current) { setFinished(true); return; }
    setTimeout(() => { setIdx(i => i + 1); setFeedback(null); }, 800);
  }, []);

  useEffect(() => {
    setTimeLeft(20);
    setInput("");
    setFeedback(null);
    clearInterval(timerRef.current!);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); handleNext(false); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [idx, handleNext]);

  const submit = () => {
    const correct = input.trim().toUpperCase() === words[idx].word;
    setFeedback(correct ? "correct" : "wrong");
    handleNext(correct);
  };

  const tokens = 2 + score * Math.round(14 / words.length);

  const reset = () => { setIdx(0); setScore(0); setInput(""); setFeedback(null); setFinished(false); };

  if (finished) return (
    <SchoolLayout><div className="p-5 max-w-xl mx-auto">
      <GameResult score={score} tokens={tokens} onEarn={() => onEarn(tokens)} onPlay={reset} onBack={onBack}
        title="Scramble Complete!" message={score >= 6 ? "Finance vocabulary master! 🧠" : score >= 4 ? "Great effort! 🎉" : "Keep studying those terms! 💪"} />
    </div></SchoolLayout>
  );

  return (
    <SchoolLayout>
      <div className="p-5 max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-slate-400 hover:text-white font-semibold text-sm">← Back</button>
          <h2 className="font-black text-white text-lg">🔤 Word Scramble</h2>
          <span className="text-teal-400 font-bold text-sm">{score}/{words.length}</span>
        </div>
        <Progress value={(idx / words.length) * 100} className="h-2" />
        <div className="rounded-2xl p-6 bg-white/5 border border-white/10 space-y-5">
          <div className="flex items-center justify-between">
            <Badge className="bg-violet-500/20 text-violet-300">Word {idx + 1} of {words.length}</Badge>
            <div className={`flex items-center gap-1 font-bold text-sm ${timeLeft <= 5 ? "text-rose-400" : "text-slate-400"}`}>
              <Timer className="h-3.5 w-3.5" />{timeLeft}s
            </div>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-white tracking-widest bg-white/5 rounded-xl py-4 px-6">{scrambled[idx]}</p>
            <p className="text-slate-400 text-sm mt-2 italic">Hint: {words[idx].hint}</p>
          </div>
          {feedback && (
            <div className={`rounded-lg p-2.5 text-center ${feedback === "correct" ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-rose-500/20 border border-rose-500/30"}`}>
              <p className={`font-bold text-sm ${feedback === "correct" ? "text-emerald-400" : "text-rose-400"}`}>
                {feedback === "correct" ? "✓ Correct!" : `✗ It was: ${words[idx].word}`}
              </p>
            </div>
          )}
          {!feedback && (
            <div className="flex gap-2">
              <input className="flex-1 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-center text-lg px-4 py-3 uppercase outline-none focus:border-violet-500/50"
                value={input} onChange={e => setInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && input.trim() && submit()}
                placeholder="Type answer..." autoFocus data-testid="input-scramble" />
              <Button onClick={submit} disabled={!input.trim()} className="rounded-xl bg-violet-600 hover:bg-violet-500 font-black px-6" data-testid="btn-scramble-submit">
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </SchoolLayout>
  );
}

/* ===== MARKET MEMORY GAME ===== */
const MEMORY_PAIRS = [
  { term: "P/E Ratio", def: "Price ÷ Earnings per share" },
  { term: "Bull Market", def: "Prices rising 20%+ from lows" },
  { term: "Bear Market", def: "Prices falling 20%+ from highs" },
  { term: "Dividend", def: "Profit share paid to investors" },
  { term: "ETF", def: "Exchange Traded Fund" },
  { term: "Short Sell", def: "Selling borrowed shares" },
  { term: "Blue Chip", def: "Large, stable, reputable company" },
  { term: "Yield", def: "Annual income ÷ investment cost" },
];

function MarketMemoryGame({ onEarn, onBack }: { onEarn: (n: number) => void; onBack: () => void }) {
  const pairs = MEMORY_PAIRS.slice(0, 6);
  const [cards] = useState(() => {
    const all = [...pairs.map((p, i) => ({ id: `t${i}`, text: p.term, pairId: i })), ...pairs.map((p, i) => ({ id: `d${i}`, text: p.def, pairId: i }))];
    return shuffleArray(all);
  });
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [finished, setFinished] = useState(false);

  const flip = (id: string) => {
    if (flipped.length >= 2 || flipped.includes(id) || matched.includes(cards.find(c => c.id === id)!.pairId)) return;
    const next = [...flipped, id];
    setFlipped(next);
    if (next.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = next.map(fid => cards.find(c => c.id === fid)!);
      if (a.pairId === b.pairId) {
        const newMatched = [...matched, a.pairId];
        setMatched(newMatched);
        setFlipped([]);
        if (newMatched.length === pairs.length) setFinished(true);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  const score = Math.max(0, pairs.length * 2 - Math.max(0, moves - pairs.length));
  const tokens = 3 + Math.min(score, 9);

  const reset = () => { setFlipped([]); setMatched([]); setMoves(0); setFinished(false); };

  if (finished) return (
    <SchoolLayout><div className="p-5 max-w-xl mx-auto">
      <GameResult score={score} tokens={tokens} onEarn={() => onEarn(tokens)} onPlay={reset} onBack={onBack}
        title="Memory Complete!" message={moves <= pairs.length + 2 ? "Finance genius! 🧠" : moves <= pairs.length + 5 ? "Nice memory! 🎉" : "Keep practicing! 💪"} />
    </div></SchoolLayout>
  );

  return (
    <SchoolLayout>
      <div className="p-5 max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-slate-400 hover:text-white font-semibold text-sm">← Back</button>
          <h2 className="font-black text-white text-lg">🃏 Market Memory</h2>
          <span className="text-teal-400 font-bold text-sm">{matched.length}/{pairs.length} matched</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Moves: {moves}</span><span>Match terms with definitions!</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {cards.map(card => {
            const isFlipped = flipped.includes(card.id) || matched.includes(card.pairId);
            const isMatched = matched.includes(card.pairId);
            return (
              <button key={card.id} onClick={() => flip(card.id)}
                className={`rounded-xl p-3 min-h-[70px] text-xs font-bold transition-all text-center flex items-center justify-center leading-tight ${
                  isMatched ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 cursor-default" :
                  isFlipped ? "bg-blue-500/20 border border-blue-500/30 text-blue-200" :
                  "bg-white/5 border border-white/10 text-transparent hover:bg-white/10 cursor-pointer"
                }`} data-testid={`memory-card-${card.id}`}>
                {isFlipped ? card.text : "?"}
              </button>
            );
          })}
        </div>
      </div>
    </SchoolLayout>
  );
}

/* ===== SHARED: Game Result ===== */
function GameResult({ score, tokens, onEarn, onPlay, onBack, title, message }: any) {
  const [earned, setEarned] = useState(false);
  return (
    <div className="rounded-2xl p-8 bg-white/5 border border-white/10 text-center space-y-5 sw-bounce-in">
      <div className="text-5xl">{tokens >= 20 ? "🌟" : tokens >= 10 ? "🎉" : "⭐"}</div>
      <div>
        <h3 className="text-2xl font-black text-white">{title}</h3>
        <p className="text-slate-400 mt-1">{message}</p>
      </div>
      <div className="flex items-center justify-center gap-3">
        <div className="px-5 py-3 rounded-xl bg-teal-500/10 border border-teal-500/20">
          <p className="text-xs text-slate-400">Score</p>
          <p className="text-2xl font-black text-teal-400">{score}</p>
        </div>
        <div className="px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 sw-token-glow">
          <p className="text-xs text-slate-400">Tokens to earn</p>
          <p className="text-2xl font-black text-amber-400 flex items-center gap-1"><Coins className="h-5 w-5" />{tokens}</p>
        </div>
      </div>
      <div className="flex gap-3">
        {!earned && (
          <Button onClick={() => { setEarned(true); onEarn(); }} className="flex-1 bg-amber-500 hover:bg-amber-400 text-white font-black rounded-xl py-3" data-testid="button-claim-tokens">
            <Coins className="h-4 w-4 mr-1.5" /> Claim {tokens} Tokens!
          </Button>
        )}
        {earned && (
          <div className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl py-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="text-emerald-400 font-black">Tokens Claimed!</span>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <Button onClick={onPlay} variant="outline" className="flex-1 border-white/20 text-slate-300 hover:bg-white/5 rounded-xl" data-testid="button-play-again">
          <RotateCcw className="h-4 w-4 mr-1.5" /> Play Again
        </Button>
        <Button onClick={onBack} variant="ghost" className="flex-1 text-slate-500 hover:text-white rounded-xl" data-testid="button-back-to-games">
          All Games
        </Button>
      </div>
    </div>
  );
}

/* ===== CONFETTI ===== */
function Confetti() {
  const colors = ["#f59e0b", "#10b981", "#6366f1", "#ec4899", "#14b8a6", "#f97316"];
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: Math.random() * 100,
    delay: Math.random() * 2,
    size: Math.random() * 8 + 6,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div key={p.id} className="absolute rounded-sm" style={{ left: `${p.left}%`, top: "-10px", width: p.size, height: p.size, background: p.color, animation: `confetti-fall ${1.5 + p.delay}s linear ${p.delay * 0.5}s forwards` }} />
      ))}
    </div>
  );
}
