import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import SchoolLayout from "@/layouts/school-layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Coins, RotateCcw, Trophy, Star, CheckCircle2, XCircle, ChevronRight, Zap } from "lucide-react";

type Game = "coin-rain" | "piggy-bank" | "smart-shopper" | "stock-guesser" | "budget-boss" | "finance-quiz" | "market-prediction" | "investment-quiz" | "strategy-challenge";

export default function SchoolFunZone() {
  const { user } = useAuth();
  const { data: classData } = useQuery<any>({ queryKey: ["/api/classroom"], enabled: user?.role === "student" });
  const ageGroup = classData?.class?.ageGroup ?? "high_school";
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [tokensEarned, setTokensEarned] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const awardTokensMutation = useMutation({
    mutationFn: (amount: number) => apiRequest("POST", "/api/fun-zone/score", { tokensEarned: amount }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/user"] }),
  });

  const handleEarnTokens = (amount: number) => {
    setTokensEarned(prev => prev + amount);
    setShowConfetti(true);
    awardTokensMutation.mutate(amount);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const isPrimary = ageGroup === "primary";
  const isIntermediate = ageGroup === "intermediate";

  const primaryGames = [
    { id: "coin-rain" as Game, emoji: "🌧️", title: "Coin Rain", desc: "Catch coins before they hit the ground!", color: "from-amber-400 to-orange-500", tokens: "5–15" },
    { id: "piggy-bank" as Game, emoji: "🐷", title: "Piggy Bank Builder", desc: "Sort money into the right jars", color: "from-pink-400 to-rose-500", tokens: "5–10" },
    { id: "smart-shopper" as Game, emoji: "🛒", title: "Smart Shopper", desc: "Buy what you need without going over budget!", color: "from-green-400 to-emerald-500", tokens: "5–12" },
  ];

  const intermediateGames = [
    { id: "stock-guesser" as Game, emoji: "📊", title: "Stock Guesser", desc: "Predict if the stock goes up or down", color: "from-teal-500 to-cyan-600", tokens: "10–25" },
    { id: "budget-boss" as Game, emoji: "💰", title: "Budget Boss", desc: "Allocate your monthly income wisely", color: "from-purple-500 to-violet-600", tokens: "10–20" },
    { id: "finance-quiz" as Game, emoji: "🧠", title: "Finance Quiz", desc: "Test your financial knowledge!", color: "from-blue-500 to-indigo-600", tokens: "10–30" },
  ];

  const hsGames = [
    { id: "market-prediction" as Game, emoji: "📈", title: "Market Prediction", desc: "Advanced market analysis challenge", color: "from-teal-600 to-cyan-700", tokens: "15–40" },
    { id: "investment-quiz" as Game, emoji: "🎓", title: "Investment Quiz", desc: "Advanced investment concepts", color: "from-purple-600 to-violet-700", tokens: "15–35" },
    { id: "strategy-challenge" as Game, emoji: "🎯", title: "Strategy Challenge", desc: "Build a winning portfolio strategy", color: "from-blue-600 to-indigo-700", tokens: "20–50" },
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

  return (
    <SchoolLayout>
      <div className="p-5 max-w-4xl mx-auto space-y-6">
        {showConfetti && <Confetti />}

        {/* Header */}
        <div className={`relative overflow-hidden rounded-2xl p-6 ${isPrimary ? "bg-gradient-to-r from-purple-400 to-pink-500" : "bg-gradient-to-r from-purple-700 to-violet-800"}`}>
          <div className="absolute inset-0 sw-shimmer-bg opacity-20" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-white">
                {isPrimary ? "🎮 Fun Zone!" : isIntermediate ? "🎮 Game Zone" : "🎮 Challenge Arena"}
              </h1>
              <p className={`text-sm mt-1 ${isPrimary ? "text-purple-100" : "text-purple-200"}`}>
                {isPrimary ? "Play games and earn tokens! 🪙" : isIntermediate ? "Put your skills to the test" : "Advanced finance challenges"}
              </p>
            </div>
            {tokensEarned > 0 && (
              <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-xl px-4 py-2.5 sw-token-glow sw-bounce-in">
                <Coins className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="text-xl font-black text-amber-300">+{tokensEarned}</p>
                  <p className="text-amber-400 text-xs">Today</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {games.map(game => (
            <div
              key={game.id}
              onClick={() => setActiveGame(game.id)}
              className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${game.color} cursor-pointer hover:scale-105 hover:-translate-y-1 transition-all duration-200 shadow-lg`}
              data-testid={`game-card-${game.id}`}
            >
              <div className="text-5xl mb-3 sw-bounce-in">{game.emoji}</div>
              <h3 className="font-black text-white text-lg leading-tight">{game.title}</h3>
              <p className="text-white/75 text-xs mt-1 mb-3">{game.desc}</p>
              <div className="flex items-center gap-1.5 bg-black/20 rounded-full px-3 py-1 w-fit">
                <Coins className="h-3.5 w-3.5 text-amber-300" />
                <span className="text-white text-xs font-bold">{game.tokens} tokens</span>
              </div>
              <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-white/40" />
            </div>
          ))}
        </div>

        <div className="rounded-xl p-4 bg-white/5 border border-white/10 text-center">
          <p className={`text-sm font-semibold ${isPrimary ? "text-amber-700" : "text-slate-400"}`}>
            {isPrimary ? "🌟 Play games to fill your Token Jar!" : "Play games to earn tokens and climb the leaderboard!"}
          </p>
        </div>
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
const intermediateQuestions = [
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
];

const hsQuestions = [
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
];

function QuizGame({ level, onEarn, onBack }: { level: "intermediate" | "high_school"; onEarn: (n: number) => void; onBack: () => void }) {
  const questions = level === "high_school" ? hsQuestions : intermediateQuestions;
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

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
        <GameResult score={score} tokens={tokens} onEarn={() => onEarn(tokens)} onPlay={() => { setQIdx(0); setScore(0); setSelected(null); setFinished(false); }} onBack={onBack}
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

/* ===== STRATEGY CHALLENGE (HS) ===== */
function StrategyChallenge({ onEarn, onBack }: { onEarn: (n: number) => void; onBack: () => void }) {
  const scenario = {
    budget: 10000,
    goal: "Maximise returns while managing risk",
    assets: [
      { id: "tech", name: "Tech ETF", risk: "High", expectedReturn: "15-25%", desc: "High volatility, high reward" },
      { id: "bonds", name: "Gov. Bonds", risk: "Low", expectedReturn: "3-5%", desc: "Stable, low return" },
      { id: "realestate", name: "Real Estate", risk: "Medium", expectedReturn: "8-12%", desc: "Steady growth, inflation hedge" },
      { id: "gold", name: "Gold", risk: "Low-Medium", expectedReturn: "5-8%", desc: "Safe haven asset" },
      { id: "crypto", name: "Crypto", risk: "Very High", expectedReturn: "−50% to +100%", desc: "Extremely volatile" },
    ],
  };

  const [allocations, setAllocations] = useState<Record<string, number>>({ tech: 20, bonds: 20, realestate: 20, gold: 20, crypto: 20 });
  const [submitted, setSubmitted] = useState(false);

  const total = Object.values(allocations).reduce((s, v) => s + v, 0);
  const diversified = Object.values(allocations).filter(v => v >= 5).length;
  const riskScore = (allocations.tech ?? 0) + (allocations.crypto ?? 0);
  const safetyScore = (allocations.bonds ?? 0) + (allocations.gold ?? 0);
  const score = Math.min(100, diversified * 15 + (riskScore < 50 ? 20 : 0) + (safetyScore >= 20 ? 15 : 0));
  const tokens = Math.round(score / 2) + 20;

  return (
    <SchoolLayout>
      <div className="p-5 max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-slate-400 hover:text-white font-semibold text-sm">← Back</button>
          <h2 className="font-black text-white text-lg">🎯 Strategy Challenge</h2>
          <span className={`font-bold text-sm ${total > 100 ? "text-rose-400" : "text-teal-400"}`}>{total}%</span>
        </div>

        <div className="rounded-xl p-4 bg-blue-500/10 border border-blue-500/20">
          <p className="text-blue-300 font-bold text-sm">Budget: $10,000 — Build your portfolio!</p>
          <p className="text-blue-400/70 text-xs mt-0.5">Allocate 100% across assets. Diversify for higher score!</p>
        </div>

        {!submitted ? (
          <>
            <div className="space-y-4">
              {scenario.assets.map(asset => (
                <div key={asset.id} className="rounded-xl p-4 bg-white/5 border border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-white text-sm">{asset.name}</p>
                      <p className="text-slate-500 text-xs">{asset.desc}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={`text-xs ${asset.risk === "Low" ? "bg-emerald-500/20 text-emerald-400" : asset.risk === "High" ? "bg-rose-500/20 text-rose-400" : asset.risk === "Very High" ? "bg-red-600/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>{asset.risk} Risk</Badge>
                      <p className="text-xs text-slate-400 mt-0.5">{asset.expectedReturn}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="range" min={0} max={80} value={allocations[asset.id]} onChange={e => setAllocations(prev => ({ ...prev, [asset.id]: Number(e.target.value) }))} className="flex-1 accent-teal-500" data-testid={`slider-${asset.id}`} />
                    <span className="text-teal-400 font-bold text-sm w-10 text-right">{allocations[asset.id]}%</span>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={() => setSubmitted(true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl" disabled={total > 100} data-testid="button-submit-strategy">
              Submit Strategy ({total}%)
            </Button>
          </>
        ) : (
          <GameResult score={score} tokens={tokens} onEarn={() => onEarn(tokens)} onPlay={() => setSubmitted(false)} onBack={onBack}
            title="Strategy Submitted!"
            message={score >= 80 ? "Portfolio master! 🎯" : score >= 50 ? "Solid strategy! 🎉" : "Try diversifying more! 💪"}
          />
        )}
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
