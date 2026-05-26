import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  FRAMES, TITLES, BADGES, PACKS, ROULETTE_SLOTS, RARITY_COLORS, RARITY_GLOW,
  getFrameStyle, type Rarity, type RouletteSlot,
} from "@/lib/shop-catalog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Crown, Sparkles, Star, Package, Shuffle, TrendingUp, Tag, RefreshCw,
  Gift, Check, Zap, ChevronUp, ChevronDown, Minus, Plus, TrendingDown,
  Coins, DollarSign, Spade, Diamond, Heart, Club,
} from "lucide-react";
import { fireConfetti } from "@/lib/confetti";

// ── Types ──────────────────────────────────────────────────────────────────
type MainTab = "cosmetics" | "casino" | "packs" | "market";
type CasinoGame = "blackjack" | "roulette" | "coinflip" | "crash" | "hilo";
type CosmeticFilter = "all" | "frames" | "titles" | "badges";
type RarityFilter = "all" | Rarity;
type Suit = "♠" | "♥" | "♦" | "♣";
type CardValue = "2"|"3"|"4"|"5"|"6"|"7"|"8"|"9"|"10"|"J"|"Q"|"K"|"A";
interface PlayingCard { suit: Suit; value: CardValue; hidden?: boolean }

// ── Helpers ─────────────────────────────────────────────────────────────────
function rarityLabel(r: Rarity) { return r.charAt(0).toUpperCase() + r.slice(1); }

function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${RARITY_COLORS[rarity]}`}>
      {rarityLabel(rarity)}
    </span>
  );
}

function FramePreview({ frameId, size = 44 }: { frameId: string; size?: number }) {
  const style = getFrameStyle(frameId);
  return (
    <div className="flex items-center justify-center" style={{ width: size + 12, height: size + 12 }}>
      <div style={{ ...style, width: size, height: size, borderRadius: "9999px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsl(var(--muted))" }}>
        <span style={{ fontSize: size * 0.45 }}>👤</span>
      </div>
    </div>
  );
}

// ── Card UI ──────────────────────────────────────────────────────────────────
const SUITS: Suit[] = ["♠","♥","♦","♣"];
const VALUES: CardValue[] = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

function buildDeck(): PlayingCard[] {
  const deck: PlayingCard[] = [];
  for (const suit of SUITS) for (const value of VALUES) deck.push({ suit, value });
  return deck.sort(() => Math.random() - 0.5);
}
function cardNum(card: PlayingCard): number {
  if (["J","Q","K"].includes(card.value)) return 10;
  if (card.value === "A") return 11;
  return parseInt(card.value);
}
function handValue(hand: PlayingCard[]): number {
  let total = hand.filter(c => !c.hidden).reduce((s, c) => s + cardNum(c), 0);
  let aces = hand.filter(c => !c.hidden && c.value === "A").length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}
function cardRank(value: CardValue): number {
  if (value === "A") return 14;
  if (["J","Q","K"].includes(value)) return 10;
  return parseInt(value);
}

function CardFace({ card, animate = false }: { card: PlayingCard; animate?: boolean }) {
  const isRed = card.suit === "♥" || card.suit === "♦";
  if (card.hidden) {
    return (
      <div className={`w-16 h-24 rounded-xl bg-indigo-950 border border-indigo-800/60 flex items-center justify-center ${animate ? "animate-[card-deal_0.3s_ease-out]" : ""}`}>
        <div className="text-indigo-300 text-3xl opacity-60">🂠</div>
      </div>
    );
  }
  return (
    <div className={`w-16 h-24 rounded-xl bg-white border border-slate-200 flex flex-col items-start justify-between p-1.5 shadow-lg select-none ${animate ? "animate-[card-deal_0.3s_ease-out]" : ""}`}
      style={{ minWidth: 64 }}>
      <div className={`text-sm font-black leading-none ${isRed ? "text-red-600" : "text-slate-900"}`}>{card.value}{card.suit}</div>
      <div className={`text-2xl text-center w-full ${isRed ? "text-red-600" : "text-slate-900"}`}>{card.suit}</div>
      <div className={`text-sm font-black leading-none self-end rotate-180 ${isRed ? "text-red-600" : "text-slate-900"}`}>{card.value}{card.suit}</div>
    </div>
  );
}

// ── Casino Panel Wrapper ─────────────────────────────────────────────────────
function CasinoPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="relative">{children}</div>
    </div>
  );
}

// ── Blackjack ────────────────────────────────────────────────────────────────
function BlackjackGame({ balance, onRefreshUser }: { balance: number; onRefreshUser: () => void }) {
  const { toast } = useToast();
  type Phase = "bet" | "playing" | "dealer" | "result";
  const [phase, setPhase] = useState<Phase>("bet");
  const [bet, setBet] = useState(100);
  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [dealerHand, setDealerHand] = useState<PlayingCard[]>([]);
  const [result, setResult] = useState<"win"|"blackjack"|"push"|"lose"|null>(null);
  const [netChange, setNetChange] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [dealAnim, setDealAnim] = useState(false);

  const maxBet = balance;
  const quickBets = [50, 100, 250, 500, 1000].filter(b => b <= maxBet);
  const pVal = handValue(playerHand);

  async function startGame() {
    const d = buildDeck();
    const p = [d[0], d[2]];
    const dealer = [d[1], { ...d[3], hidden: true }];
    setDeck(d.slice(4));
    setPlayerHand(p);
    setDealerHand(dealer);
    setResult(null);
    setPhase("playing");
    setDealAnim(true);
    setTimeout(() => setDealAnim(false), 500);
    if (handValue(p) === 21) {
      const revDealer = dealer.map(c => ({ ...c, hidden: false }));
      setDealerHand(revDealer);
      await finishGame(p, revDealer, "blackjack");
    }
  }

  async function runDealer(d: PlayingCard[], ph: PlayingCard[], dh: PlayingCard[]): Promise<PlayingCard[]> {
    let hand = [...dh];
    let remaining = [...d];
    while (handValue(hand) < 17) {
      hand = [...hand, remaining[0]];
      remaining = remaining.slice(1);
    }
    setDealerHand(hand);
    setDeck(remaining);
    return hand;
  }

  async function finishGame(ph: PlayingCard[], dh: PlayingCard[], forcedResult?: "win"|"blackjack"|"push"|"lose") {
    const pFinal = handValue(ph);
    const dFinal = handValue(dh.map(c => ({ ...c, hidden: false })));
    let res: "win"|"blackjack"|"push"|"lose";
    if (forcedResult) res = forcedResult;
    else if (pFinal > 21) res = "lose";
    else if (dFinal > 21 || pFinal > dFinal) res = "win";
    else if (pFinal === dFinal) res = "push";
    else res = "lose";
    const net = res === "blackjack" ? Math.floor(bet * 1.5) : res === "win" ? bet : res === "push" ? 0 : -bet;
    setResult(res);
    setNetChange(net);
    setPhase("result");
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/global-shop/blackjack-result", { bet, netChange: net });
      onRefreshUser();
      if (res === "win" || res === "blackjack") fireConfetti();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSubmitting(false);
  }

  async function hit() {
    const [card, ...rest] = deck;
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    setDeck(rest);
    if (handValue(newHand) >= 21) {
      const revealed = dealerHand.map(c => ({ ...c, hidden: false }));
      setDealerHand(revealed);
      const finalDealer = await runDealer(rest, newHand, revealed);
      await finishGame(newHand, finalDealer);
    }
  }

  async function stand() {
    const revealed = dealerHand.map(c => ({ ...c, hidden: false }));
    const finalDealer = await runDealer(deck, playerHand, revealed);
    await finishGame(playerHand, finalDealer);
  }

  async function doubleDown() {
    if (balance < bet * 2) { toast({ title: "Not enough balance to double" }); return; }
    setBet(b => b * 2);
    const [card, ...rest] = deck;
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    setDeck(rest);
    const revealed = dealerHand.map(c => ({ ...c, hidden: false }));
    const finalDealer = await runDealer(rest, newHand, revealed);
    await finishGame(newHand, finalDealer);
  }

  const resultColors = { win: "text-green-400", blackjack: "text-yellow-400", push: "text-blue-400", lose: "text-red-400" };
  const resultLabel = { win: "You Win! 🎉", blackjack: "Blackjack! 🃏✨", push: "Push — Tie", lose: "Dealer Wins 💀" };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-amber-400 tracking-tight">🃏 Blackjack</h2>
        <p className="text-sm text-slate-400 mt-0.5">Beat the dealer to 21. Blackjack pays 3:2.</p>
      </div>

      {/* Dealer */}
      {phase !== "bet" && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Dealer {phase === "result" ? `(${handValue(dealerHand.map(c => ({ ...c, hidden: false })))})` : ""}</p>
          <div className="flex gap-2 flex-wrap">
            {dealerHand.map((card, i) => <CardFace key={i} card={card} animate={dealAnim && i < 2} />)}
          </div>
        </div>
      )}

      {/* Player */}
      {phase !== "bet" && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">You ({pVal})</p>
          <div className="flex gap-2 flex-wrap">
            {playerHand.map((card, i) => <CardFace key={i} card={card} animate={dealAnim && i < 2} />)}
          </div>
        </div>
      )}

      {/* Result Banner */}
      {phase === "result" && result && (
        <div className={`rounded-xl p-4 text-center border animate-in fade-in slide-in-from-bottom-2 duration-300 ${result === "win" || result === "blackjack" ? "bg-green-500/10 border-green-500/30" : result === "lose" ? "bg-red-500/10 border-red-500/30" : "bg-blue-500/10 border-blue-500/30"}`}>
          <p className={`text-2xl font-bold ${resultColors[result]}`}>{resultLabel[result]}</p>
          <p className={`text-lg font-semibold mt-1 ${netChange >= 0 ? "text-green-400" : "text-red-400"}`}>
            {netChange > 0 ? `+$${netChange.toLocaleString()}` : netChange < 0 ? `-$${Math.abs(netChange).toLocaleString()}` : "No change"}
          </p>
        </div>
      )}

      {/* Bet Phase */}
      {phase === "bet" && (
        <div className="space-y-4">
          <div>
            <p className="text-xs text-slate-400 mb-2 font-medium">Quick Bet</p>
            <div className="flex gap-2 flex-wrap">
              {quickBets.map(q => (
                <button key={q} onClick={() => setBet(q)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${bet === q ? "bg-amber-500 border-amber-500 text-black" : "border-slate-700 text-slate-300 hover:border-amber-500/50 hover:text-amber-400"}`}>
                  ${q.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setBet(b => Math.max(1, b - 50))} className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center hover:border-amber-500/50 transition-colors">
              <Minus className="w-4 h-4 text-slate-300" />
            </button>
            <div className="flex-1 text-center">
              <p className="text-3xl font-bold text-amber-400">${bet.toLocaleString()}</p>
              <p className="text-xs text-slate-500">bet amount</p>
            </div>
            <button onClick={() => setBet(b => Math.min(maxBet, b + 50))} className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center hover:border-amber-500/50 transition-colors">
              <Plus className="w-4 h-4 text-slate-300" />
            </button>
          </div>
          <Button className="w-full h-12 text-base font-bold bg-amber-500 hover:bg-amber-400 text-black border-0" onClick={startGame} disabled={bet < 1 || balance < bet}>
            Deal Cards
          </Button>
        </div>
      )}

      {/* Playing Phase */}
      {phase === "playing" && (
        <div className="grid grid-cols-3 gap-2">
          <Button onClick={hit} className="h-11 font-bold bg-green-600 hover:bg-green-500 border-0">Hit</Button>
          <Button onClick={stand} className="h-11 font-bold bg-red-600 hover:bg-red-500 border-0">Stand</Button>
          <Button onClick={doubleDown} disabled={playerHand.length !== 2 || balance < bet * 2}
            className="h-11 font-bold bg-blue-600 hover:bg-blue-500 border-0">2×</Button>
        </div>
      )}

      {/* Result Phase */}
      {phase === "result" && (
        <Button className="w-full h-11 font-bold bg-amber-500 hover:bg-amber-400 text-black border-0" onClick={() => { setPhase("bet"); setPlayerHand([]); setDealerHand([]); }}
          disabled={submitting}>
          {submitting ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Play Again"}
        </Button>
      )}
    </div>
  );
}

// ── Roulette Wheel ────────────────────────────────────────────────────────────
function RouletteGame({ balance, onRefreshUser }: { balance: number; onRefreshUser: () => void }) {
  const { toast } = useToast();
  const [spinCost, setSpinCost] = useState(100);
  const [spinning, setSpinning] = useState(false);
  const [finalRotation, setFinalRotation] = useState(0);
  const [spinResult, setSpinResult] = useState<{ slot: RouletteSlot; rewardDesc: string; newBalance: number } | null>(null);

  const SPIN_COSTS = [{ label: "$100", cost: 100 }, { label: "$500", cost: 500 }, { label: "$2,000", cost: 2000 }];

  const spinMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/global-shop/spin", { cost: spinCost }),
    onSuccess: async (data) => {
      onRefreshUser();
      const slotIndex = ROULETTE_SLOTS.findIndex(s => s.id === data.slot.id);
      const idx = slotIndex >= 0 ? slotIndex : 0;
      const segAngle = 360 / ROULETTE_SLOTS.length;
      setFinalRotation(prev => prev + 360 * 6 + (360 - idx * segAngle));
      setSpinning(true);
      setTimeout(() => {
        setSpinning(false);
        setSpinResult(data);
        if (data.slot.id === "slot-jackpot") fireConfetti();
      }, 3200);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const slotCount = ROULETTE_SLOTS.length;
  const segAngle = 360 / slotCount;
  const r = 110; const cx = 130; const cy = 130;

  return (
    <div className="p-6 space-y-5">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-amber-400">🎰 Spin the Wheel</h2>
        <p className="text-sm text-slate-400 mt-0.5">Spin for a chance to win balance or rare items!</p>
      </div>

      <div className="relative flex justify-center">
        <div className="relative">
          <svg width={260} height={260}
            style={{ transition: spinning ? "transform 3.2s cubic-bezier(0.17,0.67,0.12,0.99)" : "none", transform: `rotate(${finalRotation}deg)` }}>
            {ROULETTE_SLOTS.map((slot, i) => {
              const startA = (i * segAngle - 90) * (Math.PI / 180);
              const endA = ((i + 1) * segAngle - 90) * (Math.PI / 180);
              const x1 = cx + r * Math.cos(startA); const y1 = cy + r * Math.sin(startA);
              const x2 = cx + r * Math.cos(endA); const y2 = cy + r * Math.sin(endA);
              const midA = ((i + 0.5) * segAngle - 90) * (Math.PI / 180);
              const tx = cx + (r * 0.65) * Math.cos(midA);
              const ty = cy + (r * 0.65) * Math.sin(midA);
              return (
                <g key={slot.id}>
                  <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`} fill={slot.color} stroke="#1f2937" strokeWidth={1.5} />
                  <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize={12} fill="white" style={{ pointerEvents: "none" }}>{slot.emoji}</text>
                </g>
              );
            })}
            <circle cx={cx} cy={cy} r={18} fill="#111827" stroke="#374151" strokeWidth={2} />
          </svg>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
            <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[16px] border-l-transparent border-r-transparent border-t-amber-400 filter drop-shadow-lg" />
          </div>
        </div>
      </div>

      {spinResult && !spinning && (
        <div className="rounded-xl p-4 text-center border border-amber-500/30 bg-amber-500/10 animate-in fade-in slide-in-from-bottom-2">
          <p className="text-2xl font-bold text-amber-300">{spinResult.slot.emoji} {spinResult.slot.label}</p>
          {spinResult.slot.reward.amount ? (
            <p className="text-green-400 font-semibold mt-1">+${spinResult.slot.reward.amount.toLocaleString()}</p>
          ) : (
            <p className="text-purple-400 font-semibold mt-1">Item added to collection!</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {SPIN_COSTS.map(opt => (
          <button key={opt.cost} onClick={() => setSpinCost(opt.cost)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${spinCost === opt.cost ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20" : "border-slate-700 text-slate-400 hover:border-amber-500/50 hover:text-amber-400 bg-slate-900/50"}`}>
            {opt.label}
          </button>
        ))}
      </div>
      <Button className="w-full h-12 text-base font-bold bg-amber-500 hover:bg-amber-400 text-black border-0 shadow-lg shadow-amber-500/20"
        onClick={() => spinMutation.mutate()} disabled={spinning || balance < spinCost || spinMutation.isPending}>
        {spinning ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Spinning...</> : <><Shuffle className="w-4 h-4 mr-2" />Spin for ${spinCost.toLocaleString()}</>}
      </Button>

      <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
        {ROULETTE_SLOTS.map(slot => (
          <div key={slot.id} className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span>{slot.emoji}</span>
            <span className="text-slate-400 truncate flex-1">{slot.label}</span>
            <RarityBadge rarity={slot.rarity} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Coin Flip ─────────────────────────────────────────────────────────────────
function CoinFlipGame({ balance, onRefreshUser }: { balance: number; onRefreshUser: () => void }) {
  const { toast } = useToast();
  const [bet, setBet] = useState(100);
  const [choice, setChoice] = useState<"heads" | "tails">("heads");
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<{ won: boolean; result: "heads" | "tails"; netChange: number } | null>(null);

  const quickBets = [50, 100, 250, 500, 1000].filter(b => b <= balance);

  const flipMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/global-shop/coinflip", { bet, choice }),
    onSuccess: (data) => {
      setFlipping(true);
      setTimeout(() => {
        setFlipping(false);
        setResult(data);
        onRefreshUser();
        if (data.won) fireConfetti();
      }, 1200);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-amber-400">🪙 Coin Flip</h2>
        <p className="text-sm text-slate-400 mt-0.5">50/50 — pick your side and double or nothing!</p>
      </div>

      {/* Coin */}
      <div className="flex justify-center items-center py-4">
        <div className={`relative w-28 h-28 ${flipping ? "animate-[coin-flip_1.2s_ease-in-out]" : ""}`}
          style={{ transformStyle: "preserve-3d", perspective: "800px" }}>
          {result && !flipping ? (
            <div className={`w-28 h-28 rounded-full flex items-center justify-center text-6xl font-black border-4
              ${result.result === "heads"
                ? "bg-amber-400 border-amber-600"
                : "bg-slate-500 border-slate-700"}`}>
              {result.result === "heads" ? "👑" : "🔴"}
            </div>
          ) : (
            <div className={`w-28 h-28 rounded-full flex items-center justify-center text-6xl font-black border-4
              ${flipping || choice === "heads"
                ? "bg-amber-400 border-amber-600"
                : "bg-slate-500 border-slate-700"}`}>
              {flipping ? "🌀" : choice === "heads" ? "👑" : "🔴"}
            </div>
          )}
        </div>
      </div>

      {/* Result */}
      {result && !flipping && (
        <div className={`rounded-xl p-4 text-center border animate-in fade-in duration-300 ${result.won ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
          <p className={`text-2xl font-bold ${result.won ? "text-green-400" : "text-red-400"}`}>
            {result.won ? "You Win! 🎉" : "You Lose 😔"} — {result.result}
          </p>
          <p className={`text-lg font-semibold mt-1 ${result.netChange > 0 ? "text-green-400" : "text-red-400"}`}>
            {result.netChange > 0 ? `+$${result.netChange.toLocaleString()}` : `-$${Math.abs(result.netChange).toLocaleString()}`}
          </p>
        </div>
      )}

      {/* Side picker */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setChoice("heads")}
          className={`py-3 rounded-xl font-bold text-sm border transition-all ${choice === "heads" ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20" : "border-slate-700 text-slate-400 hover:border-amber-500/50 bg-slate-900/50"}`}>
          👑 Heads
        </button>
        <button onClick={() => setChoice("tails")}
          className={`py-3 rounded-xl font-bold text-sm border transition-all ${choice === "tails" ? "bg-slate-400 border-slate-400 text-black shadow-lg" : "border-slate-700 text-slate-400 hover:border-slate-500/70 bg-slate-900/50"}`}>
          🔴 Tails
        </button>
      </div>

      {/* Bet */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {quickBets.map(q => (
            <button key={q} onClick={() => setBet(q)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${bet === q ? "bg-amber-500 border-amber-500 text-black" : "border-slate-700 text-slate-300 hover:border-amber-500/50"}`}>
              ${q.toLocaleString()}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setBet(b => Math.max(1, b - 50))} className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center hover:border-amber-500/50">
            <Minus className="w-4 h-4 text-slate-300" />
          </button>
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-amber-400">${bet.toLocaleString()}</p>
          </div>
          <button onClick={() => setBet(b => Math.min(balance, b + 50))} className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center hover:border-amber-500/50">
            <Plus className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      <Button className="w-full h-12 text-base font-bold bg-amber-500 hover:bg-amber-400 text-black border-0 shadow-lg shadow-amber-500/20"
        onClick={() => { setResult(null); flipMutation.mutate(); }}
        disabled={flipping || flipMutation.isPending || balance < bet}>
        {flipping ? "Flipping..." : "Flip Coin 🪙"}
      </Button>
    </div>
  );
}

// ── Crash Game ────────────────────────────────────────────────────────────────
function CrashGame({ balance, onRefreshUser }: { balance: number; onRefreshUser: () => void }) {
  const { toast } = useToast();
  const [bet, setBet] = useState(100);
  const [phase, setPhase] = useState<"idle" | "running" | "cashedout" | "crashed">("idle");
  const [multiplier, setMultiplier] = useState(1.0);
  const [cashoutAt, setCashoutAt] = useState(2.0);
  const [cashedMult, setCashedMult] = useState(0);
  const [crashPoint, setCrashPoint] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const multRef = useRef(1.0);

  const quickBets = [50, 100, 250, 500, 1000].filter(b => b <= balance);

  function generateCrashPoint(): number {
    const r = Math.random();
    return Math.max(1.0, 1 / (1 - r * 0.96));
  }

  async function startGame() {
    const cp = generateCrashPoint();
    setCrashPoint(cp);
    multRef.current = 1.0;
    setMultiplier(1.0);
    setPhase("running");

    intervalRef.current = setInterval(() => {
      multRef.current = multRef.current * 1.018;
      setMultiplier(Math.round(multRef.current * 100) / 100);

      if (multRef.current >= cp) {
        clearInterval(intervalRef.current!);
        setPhase("crashed");
        const netChange = -bet;
        apiRequest("POST", "/api/global-shop/crash-result", { bet, netChange })
          .then(() => onRefreshUser())
          .catch(() => {});
      }
    }, 80);
  }

  async function cashOut() {
    if (phase !== "running") return;
    clearInterval(intervalRef.current!);
    const mult = multRef.current;
    setCashedMult(Math.round(mult * 100) / 100);
    setPhase("cashedout");
    const winAmount = Math.floor(bet * mult) - bet;
    const netChange = winAmount;
    try {
      await apiRequest("POST", "/api/global-shop/crash-result", { bet, netChange });
      onRefreshUser();
      fireConfetti();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const multColor = multiplier < 1.5 ? "text-green-400" : multiplier < 3 ? "text-yellow-400" : multiplier < 6 ? "text-orange-400" : "text-red-400";
  const profit = Math.floor(bet * multiplier) - bet;

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-amber-400">🚀 Crash</h2>
        <p className="text-sm text-slate-400 mt-0.5">Cash out before it crashes or lose your bet!</p>
      </div>

      {/* Multiplier display */}
      <div className={`rounded-2xl p-8 text-center border transition-all duration-200
        ${phase === "crashed" ? "bg-red-500/10 border-red-500/40" : phase === "cashedout" ? "bg-green-500/10 border-green-500/40" : "bg-slate-900/60 border-slate-800"}`}>
        {phase === "crashed" ? (
          <>
            <p className="text-5xl font-black text-red-400">💥 CRASH</p>
            <p className="text-slate-400 mt-2">Crashed at {crashPoint.toFixed(2)}×</p>
            <p className="text-red-400 font-semibold mt-1">-${bet.toLocaleString()}</p>
          </>
        ) : phase === "cashedout" ? (
          <>
            <p className="text-5xl font-black text-green-400">{cashedMult.toFixed(2)}×</p>
            <p className="text-green-400 font-semibold mt-2">Cashed out! +${(Math.floor(bet * cashedMult) - bet).toLocaleString()}</p>
          </>
        ) : (
          <>
            <p className={`text-6xl font-black ${phase === "running" ? multColor : "text-slate-500"} transition-colors`}>
              {phase === "running" ? `${multiplier.toFixed(2)}×` : "1.00×"}
            </p>
            {phase === "running" && <p className="text-slate-400 mt-2 text-sm">Profit if cashed now: <span className="text-green-400 font-semibold">+${profit.toLocaleString()}</span></p>}
            {phase === "idle" && <p className="text-slate-600 mt-2 text-sm">Ready to launch 🚀</p>}
          </>
        )}
      </div>

      {/* Bet */}
      {phase === "idle" && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {quickBets.map(q => (
              <button key={q} onClick={() => setBet(q)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${bet === q ? "bg-amber-500 border-amber-500 text-black" : "border-slate-700 text-slate-300 hover:border-amber-500/50"}`}>
                ${q.toLocaleString()}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setBet(b => Math.max(1, b - 50))} className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Minus className="w-4 h-4 text-slate-300" />
            </button>
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-amber-400">${bet.toLocaleString()}</p>
            </div>
            <button onClick={() => setBet(b => Math.min(balance, b + 50))} className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Plus className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      )}

      {/* Action button */}
      {phase === "idle" && (
        <Button className="w-full h-12 text-base font-bold bg-amber-500 hover:bg-amber-400 text-black border-0 shadow-lg shadow-amber-500/20"
          onClick={startGame} disabled={balance < bet}>
          Launch 🚀
        </Button>
      )}
      {phase === "running" && (
        <Button className="w-full h-14 text-xl font-black bg-green-500 hover:bg-green-400 text-black border-0 shadow-lg shadow-green-500/30 animate-pulse"
          onClick={cashOut}>
          💰 CASH OUT ${Math.floor(bet * multiplier).toLocaleString()}
        </Button>
      )}
      {(phase === "crashed" || phase === "cashedout") && (
        <Button className="w-full h-12 font-bold bg-amber-500 hover:bg-amber-400 text-black border-0"
          onClick={() => { setPhase("idle"); setMultiplier(1.0); }}>
          Play Again
        </Button>
      )}
    </div>
  );
}

// ── Hi-Lo ─────────────────────────────────────────────────────────────────────
function HiLoGame({ balance, onRefreshUser }: { balance: number; onRefreshUser: () => void }) {
  const { toast } = useToast();
  type HiLoPhase = "bet" | "playing" | "result";
  const [phase, setPhase] = useState<HiLoPhase>("bet");
  const [bet, setBet] = useState(100);
  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [currentCard, setCurrentCard] = useState<PlayingCard | null>(null);
  const [nextCard, setNextCard] = useState<PlayingCard | null>(null);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1.0);
  const [result, setResult] = useState<"win" | "lose" | null>(null);
  const [netChange, setNetChange] = useState(0);

  const quickBets = [50, 100, 250, 500].filter(b => b <= balance);
  const streakMultipliers = [1.0, 1.5, 2.0, 3.0, 5.0, 8.0, 12.0, 20.0];

  function startGame() {
    const d = buildDeck();
    setDeck(d.slice(1));
    setCurrentCard(d[0]);
    setNextCard(null);
    setStreak(0);
    setMultiplier(1.0);
    setResult(null);
    setPhase("playing");
  }

  function guess(direction: "higher" | "lower") {
    if (!currentCard || deck.length === 0) return;
    const next = deck[0];
    const remaining = deck.slice(1);
    setNextCard(next);
    setDeck(remaining);

    const currentRank = cardRank(currentCard.value);
    const nextRank = cardRank(next.value);
    const correct = direction === "higher" ? nextRank > currentRank : nextRank < currentRank;

    if (nextRank === currentRank) {
      // Tie - treated as wrong
      const nc = -bet;
      setNetChange(nc);
      setResult("lose");
      setPhase("result");
      apiRequest("POST", "/api/global-shop/hilo-result", { bet, netChange: nc })
        .then(() => onRefreshUser())
        .catch(() => {});
      return;
    }

    if (correct) {
      const newStreak = streak + 1;
      const newMult = streakMultipliers[Math.min(newStreak, streakMultipliers.length - 1)];
      setStreak(newStreak);
      setMultiplier(newMult);
      setTimeout(() => {
        setCurrentCard(next);
        setNextCard(null);
      }, 800);
    } else {
      const nc = -bet;
      setNetChange(nc);
      setResult("lose");
      setPhase("result");
      apiRequest("POST", "/api/global-shop/hilo-result", { bet, netChange: nc })
        .then(() => onRefreshUser())
        .catch(() => {});
    }
  }

  async function cashOut() {
    const nc = Math.floor(bet * multiplier) - bet;
    setNetChange(nc);
    setResult("win");
    setPhase("result");
    try {
      await apiRequest("POST", "/api/global-shop/hilo-result", { bet, netChange: nc });
      onRefreshUser();
      if (nc > 0) fireConfetti();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-amber-400">🎯 Hi-Lo</h2>
        <p className="text-sm text-slate-400 mt-0.5">Guess higher or lower. Build a streak for big multipliers!</p>
      </div>

      {phase !== "bet" && currentCard && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-2">Current Card</p>
              <CardFace card={currentCard} />
              <p className="text-xs text-slate-400 mt-1">Rank: {cardRank(currentCard.value)}</p>
            </div>
            <div className="text-center">
              <div className="text-slate-600 text-2xl">→</div>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-2">Next Card</p>
              {nextCard
                ? <CardFace card={nextCard} animate />
                : <div className="w-16 h-24 rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center"><p className="text-slate-600 text-xs">?</p></div>}
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            <div className="text-center">
              <p className="text-xs text-slate-500">Streak</p>
              <p className="text-2xl font-bold text-amber-400">🔥 {streak}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Multiplier</p>
              <p className="text-2xl font-bold text-yellow-400">{multiplier.toFixed(1)}×</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">To Win</p>
              <p className="text-2xl font-bold text-green-400">${Math.floor(bet * multiplier).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {phase === "result" && result && (
        <div className={`rounded-xl p-4 text-center border animate-in fade-in ${result === "win" ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
          <p className={`text-2xl font-bold ${result === "win" ? "text-green-400" : "text-red-400"}`}>
            {result === "win" ? "Cashed Out! 🎉" : "Wrong Guess 💔"}
          </p>
          <p className={`text-lg font-semibold mt-1 ${netChange >= 0 ? "text-green-400" : "text-red-400"}`}>
            {netChange > 0 ? `+$${netChange.toLocaleString()}` : `-$${Math.abs(netChange).toLocaleString()}`}
          </p>
        </div>
      )}

      {phase === "bet" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {quickBets.map(q => (
              <button key={q} onClick={() => setBet(q)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${bet === q ? "bg-amber-500 border-amber-500 text-black" : "border-slate-700 text-slate-300 hover:border-amber-500/50"}`}>
                ${q.toLocaleString()}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setBet(b => Math.max(1, b - 50))} className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Minus className="w-4 h-4 text-slate-300" />
            </button>
            <div className="flex-1 text-center"><p className="text-2xl font-bold text-amber-400">${bet.toLocaleString()}</p></div>
            <button onClick={() => setBet(b => Math.min(balance, b + 50))} className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Plus className="w-4 h-4 text-slate-300" />
            </button>
          </div>
          <p className="text-xs text-slate-500 text-center">Streak multipliers: 1× → 1.5× → 2× → 3× → 5× → 8× → 12× → 20×</p>
          <Button className="w-full h-12 font-bold bg-amber-500 hover:bg-amber-400 text-black border-0 shadow-lg shadow-amber-500/20" onClick={startGame} disabled={balance < bet}>
            Start Game
          </Button>
        </div>
      )}

      {phase === "playing" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => guess("higher")} className="h-14 text-lg font-black bg-green-600 hover:bg-green-500 border-0">
              <ChevronUp className="w-6 h-6 mr-1" /> Higher
            </Button>
            <Button onClick={() => guess("lower")} className="h-14 text-lg font-black bg-red-600 hover:bg-red-500 border-0">
              <ChevronDown className="w-6 h-6 mr-1" /> Lower
            </Button>
          </div>
          {streak > 0 && (
            <Button onClick={cashOut} variant="outline" className="w-full h-11 font-bold border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
              💰 Cash Out ${Math.floor(bet * multiplier).toLocaleString()} ({multiplier.toFixed(1)}×)
            </Button>
          )}
        </div>
      )}

      {phase === "result" && (
        <Button className="w-full h-11 font-bold bg-amber-500 hover:bg-amber-400 text-black border-0"
          onClick={() => { setPhase("bet"); setCurrentCard(null); }}>
          Play Again
        </Button>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ShopPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [mainTab, setMainTab] = useState<MainTab>("cosmetics");
  const [casinoGame, setCasinoGame] = useState<CasinoGame>("blackjack");
  const [cosmeticFilter, setCosmeticFilter] = useState<CosmeticFilter>("all");
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>("all");
  const [packResult, setPackResult] = useState<{ itemId: string; type: "frame" | "title" | "badge" } | null>(null);
  const [opening, setOpening] = useState(false);
  const [listItemId, setListItemId] = useState("");
  const [listItemType, setListItemType] = useState("frame");
  const [listPrice, setListPrice] = useState("");

  const owned: string[] = (() => { try { return JSON.parse(user?.purchasedCosmetics ?? "[]"); } catch { return []; } })();
  const balance = user?.simulatorBalance ?? 0;
  const equippedFrame = user?.equippedFrame ?? null;
  const equippedTitle = user?.equippedTitle ?? null;

  const { data: marketListings = [], refetch: refetchMarket } = useQuery<any[]>({
    queryKey: ["/api/cosmetic-market"],
    enabled: mainTab === "market",
  });

  const purchaseMutation = useMutation({
    mutationFn: (body: { itemId: string; price: number }) => apiRequest("POST", "/api/global-shop/purchase", body),
    onSuccess: async () => { await refreshUser(); },
    onError: (e: any) => toast({ title: "Insufficient balance", description: e.message, variant: "destructive" }),
  });

  const packOpenMutation = useMutation({
    mutationFn: ({ packId, price }: { packId: string; price: number }) =>
      apiRequest("POST", "/api/global-shop/pack-open", { packId, price }),
    onSuccess: async (data) => {
      await refreshUser();
      const itemType = data.rewardId?.startsWith("frame-") ? "frame" : data.rewardId?.startsWith("title-") ? "title" : "badge";
      setPackResult({ itemId: data.rewardId, type: itemType });
      fireConfetti();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const equipMutation = useMutation({
    mutationFn: (body: { type: string; value: string | null }) => apiRequest("POST", "/api/global-shop/equip", body),
    onSuccess: async () => { await refreshUser(); },
  });

  const listMutation = useMutation({
    mutationFn: (body: { itemId: string; itemType: string; price: number }) => apiRequest("POST", "/api/cosmetic-market", body),
    onSuccess: async () => {
      await refreshUser(); refetchMarket();
      setListItemId(""); setListPrice("");
      toast({ title: "Listed!", description: "Your item is now for sale." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const buyListingMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/cosmetic-market/${id}/buy`, {}),
    onSuccess: async () => { await refreshUser(); refetchMarket(); fireConfetti(); toast({ title: "Purchased!" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const cancelListingMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/cosmetic-market/${id}`, {}),
    onSuccess: async () => { await refreshUser(); refetchMarket(); },
  });

  // Unified cosmetics list
  const allCosmetics = [
    ...FRAMES.map(f => ({ ...f, kind: "frame" as const })),
    ...TITLES.map(t => ({ ...t, kind: "title" as const })),
    ...BADGES.map(b => ({ ...b, kind: "badge" as const, color: undefined, glowColor: undefined, emoji: (b as any).emoji })),
  ];
  const filteredCosmetics = allCosmetics
    .filter(c => cosmeticFilter === "all" || c.kind + "s" === cosmeticFilter)
    .filter(c => rarityFilter === "all" || c.rarity === rarityFilter);

  const CASINO_GAMES: { id: CasinoGame; emoji: string; label: string }[] = [
    { id: "blackjack", emoji: "🃏", label: "Blackjack" },
    { id: "roulette", emoji: "🎰", label: "Roulette" },
    { id: "coinflip", emoji: "🪙", label: "Coin Flip" },
    { id: "crash", emoji: "🚀", label: "Crash" },
    { id: "hilo", emoji: "🎯", label: "Hi-Lo" },
  ];

  const MAIN_TABS: { id: MainTab; label: string; emoji: string }[] = [
    { id: "cosmetics", label: "Cosmetics", emoji: "✨" },
    { id: "casino", label: "Casino", emoji: "🎲" },
    { id: "packs", label: "Packs", emoji: "📦" },
    { id: "market", label: "Market", emoji: "🏪" },
  ];

  const RARITY_OPTIONS: { id: RarityFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "common", label: "Common" },
    { id: "uncommon", label: "Uncommon" },
    { id: "rare", label: "Rare" },
    { id: "epic", label: "Epic" },
    { id: "legendary", label: "Legendary" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950">

      <div className="relative max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-amber-400">
              12Digits Shop
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Cosmetics, casino games, and player market</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Balance</p>
            <p className="text-2xl font-black text-green-400">${balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </div>
        </div>

        {/* ── Main Tabs ── */}
        <div className="flex gap-1 p-1 rounded-2xl border border-slate-800/80" style={{ background: "rgba(15,15,25,0.8)", backdropFilter: "blur(12px)" }}>
          {MAIN_TABS.map(t => (
            <button key={t.id} data-testid={`tab-${t.id}`} onClick={() => setMainTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all
                ${mainTab === t.id ? "text-black shadow-lg shadow-amber-500/20" : "text-slate-500 hover:text-slate-300"}`}
              style={mainTab === t.id ? { background: "#f59e0b" } : {}}>
              <span>{t.emoji}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Cosmetics ── */}
        {mainTab === "cosmetics" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-1 p-1 rounded-xl bg-slate-900/60 border border-slate-800">
                {(["all","frames","titles","badges"] as CosmeticFilter[]).map(f => (
                  <button key={f} onClick={() => setCosmeticFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${cosmeticFilter === f ? "bg-amber-500 text-black" : "text-slate-400 hover:text-slate-200"}`}>
                    {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 p-1 rounded-xl bg-slate-900/60 border border-slate-800">
                {RARITY_OPTIONS.map(r => (
                  <button key={r.id} onClick={() => setRarityFilter(r.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${rarityFilter === r.id ? "bg-amber-500 text-black" : "text-slate-400 hover:text-slate-200"}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredCosmetics.map(item => {
                const isOwned = owned.includes(item.id);
                const isEquipped = item.kind === "frame" ? equippedFrame === item.id : equippedTitle === item.id;
                return (
                  <div key={item.id}
                    className={`relative rounded-xl p-3 flex flex-col items-center gap-2 transition-all hover:scale-[1.02] hover:-translate-y-0.5 border cursor-default
                      ${isOwned ? "border-amber-500/30 bg-amber-500/5" : "border-slate-800 hover:border-slate-700"}
                      ${RARITY_GLOW[item.rarity] ? "shadow-lg " + RARITY_GLOW[item.rarity] : ""}`}
                    style={{ background: isOwned ? undefined : "rgba(15,15,25,0.8)" }}>
                    <div className="flex items-center justify-between w-full">
                      <RarityBadge rarity={item.rarity} />
                      <span className="text-[9px] text-slate-600 uppercase font-bold">{item.kind}</span>
                    </div>
                    {item.kind === "frame"
                      ? <FramePreview frameId={item.id} size={48} />
                      : <span className="text-4xl my-1">{(item as any).emoji}</span>}
                    <p className="text-xs font-bold text-center leading-tight text-slate-200">{item.name}</p>
                    <p className="text-[10px] text-slate-500 text-center leading-tight">{(item as any).desc}</p>
                    {isOwned ? (
                      item.kind === "badge" ? (
                        <div className="flex items-center gap-1 text-green-400 text-xs mt-auto"><Check className="w-3 h-3" />Owned</div>
                      ) : (
                        <Button size="sm" variant={isEquipped ? "default" : "outline"} className={`w-full text-xs h-7 mt-auto ${isEquipped ? "bg-amber-500 hover:bg-amber-400 text-black border-0" : "border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-500/50"}`}
                          onClick={() => equipMutation.mutate({ type: item.kind, value: isEquipped ? null : item.id })} disabled={equipMutation.isPending}>
                          {isEquipped ? <><Check className="w-3 h-3 mr-1" />Equipped</> : "Equip"}
                        </Button>
                      )
                    ) : (
                      <Button size="sm" className="w-full text-xs h-7 mt-auto bg-amber-500 hover:bg-amber-400 text-black border-0"
                        onClick={() => {
                          if (balance < item.price) { toast({ title: "Not enough balance", variant: "destructive" }); return; }
                          purchaseMutation.mutate({ itemId: item.id, price: item.price });
                        }}
                        disabled={purchaseMutation.isPending || balance < item.price}>
                        <Zap className="w-3 h-3 mr-1" />${item.price.toLocaleString()}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            {filteredCosmetics.length === 0 && (
              <div className="text-center py-16 text-slate-600">No items match these filters.</div>
            )}
          </div>
        )}

        {/* ── Casino ── */}
        {mainTab === "casino" && (
          <div className="space-y-4">
            {/* Casino game selector */}
            <div className="grid grid-cols-5 gap-2">
              {CASINO_GAMES.map(g => (
                <button key={g.id} onClick={() => setCasinoGame(g.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all ${casinoGame === g.id ? "border-amber-500/50 bg-zinc-800" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"}`}>
                  <span className="text-2xl">{g.emoji}</span>
                  <span className={`text-xs font-semibold ${casinoGame === g.id ? "text-amber-400" : "text-slate-500"}`}>{g.label}</span>
                </button>
              ))}
            </div>

            {/* Game panel */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              <div>
                {casinoGame === "blackjack" && <BlackjackGame balance={balance} onRefreshUser={refreshUser} />}
                {casinoGame === "roulette" && <RouletteGame balance={balance} onRefreshUser={refreshUser} />}
                {casinoGame === "coinflip" && <CoinFlipGame balance={balance} onRefreshUser={refreshUser} />}
                {casinoGame === "crash" && <CrashGame balance={balance} onRefreshUser={refreshUser} />}
                {casinoGame === "hilo" && <HiLoGame balance={balance} onRefreshUser={refreshUser} />}
              </div>
            </div>

            <p className="text-center text-xs text-slate-700">All games use your simulator balance. Play responsibly.</p>
          </div>
        )}

        {/* ── Packs ── */}
        {mainTab === "packs" && (
          <div className="space-y-4">
            {packResult && (
              <div className="rounded-2xl p-6 text-center border border-amber-500/30 bg-zinc-900 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-amber-400 font-bold text-lg mb-3">🎁 You got:</p>
                {packResult.type === "frame"
                  ? <div className="flex justify-center"><FramePreview frameId={packResult.itemId} size={72} /></div>
                  : <p className="text-5xl my-2">{packResult.itemId}</p>}
                <p className="text-slate-400 text-sm mt-2">{packResult.itemId}</p>
                <Button variant="outline" size="sm" className="mt-4 border-slate-700 text-slate-300" onClick={() => setPackResult(null)}>Close</Button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PACKS.map(pack => (
                <div key={pack.id}
                  className={`rounded-2xl p-5 flex flex-col gap-3 border transition-all hover:scale-[1.01] hover:-translate-y-0.5
                    ${RARITY_GLOW[pack.rarity] ? "shadow-xl " + RARITY_GLOW[pack.rarity] : ""}
                    border-slate-800 hover:border-slate-700`}
                  style={{ background: "rgba(15,15,25,0.9)" }}>
                  <div className="flex items-start gap-3">
                    <span className="text-4xl">{pack.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-slate-200">{pack.name}</span>
                        <RarityBadge rarity={pack.rarity} />
                      </div>
                      <p className="text-[11px] text-slate-500">{pack.desc}</p>
                    </div>
                  </div>
                  <div className="rounded-xl px-3 py-2 text-xs text-slate-500 border border-slate-800 bg-slate-900/50">
                    🎁 <span className="font-medium text-slate-300">{pack.guarantee}</span>
                  </div>
                  <Button className="w-full mt-auto bg-amber-500 hover:bg-amber-400 text-black border-0 font-bold shadow-lg shadow-amber-500/15"
                    disabled={packOpenMutation.isPending || balance < pack.price}
                    onClick={async () => { setOpening(true); await packOpenMutation.mutateAsync({ packId: pack.id, price: pack.price }); setOpening(false); }}>
                    {opening && packOpenMutation.isPending
                      ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Opening...</>
                      : <><Gift className="w-4 h-4 mr-2" />Open for ${pack.price.toLocaleString()}</>}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Market ── */}
        {mainTab === "market" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List Item */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl p-5 border border-slate-800 sticky top-4" style={{ background: "rgba(15,15,25,0.9)" }}>
                <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-200"><Tag className="w-4 h-4 text-amber-400" />List an Item</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Item Type</label>
                    <select value={listItemType} onChange={e => setListItemType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 focus:border-amber-500/50 outline-none">
                      <option value="frame">Frame</option>
                      <option value="title">Title</option>
                      <option value="badge">Badge</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Item</label>
                    <select value={listItemId} onChange={e => setListItemId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 focus:border-amber-500/50 outline-none">
                      <option value="">-- Select --</option>
                      {(listItemType === "frame" ? FRAMES : listItemType === "title" ? TITLES : BADGES)
                        .filter(item => owned.includes(item.id))
                        .map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Price ($)</label>
                    <Input type="number" min="1" value={listPrice} onChange={e => setListPrice(e.target.value)} placeholder="e.g. 5000"
                      className="bg-slate-900 border-slate-700 text-slate-300 focus:border-amber-500/50" />
                  </div>
                  <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black border-0 font-bold"
                    disabled={!listItemId || !listPrice || listMutation.isPending}
                    onClick={() => listMutation.mutate({ itemId: listItemId, itemType: listItemType, price: Number(listPrice) })}>
                    <Tag className="w-4 h-4 mr-2" />List for Sale
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Listings */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-200">Active Listings</h3>
                <Button variant="ghost" size="sm" onClick={() => refetchMarket()} className="text-slate-400 hover:text-slate-200">
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />Refresh
                </Button>
              </div>
              {marketListings.length === 0 ? (
                <div className="rounded-2xl p-12 text-center text-slate-600 border border-slate-800" style={{ background: "rgba(15,15,25,0.6)" }}>
                  <p className="text-4xl mb-3">🏪</p>
                  <p className="font-medium text-slate-500">No listings yet</p>
                  <p className="text-sm text-slate-600 mt-1">Be the first to list an item!</p>
                </div>
              ) : (
                marketListings.map((listing: any) => (
                  <div key={listing.id} className="rounded-xl p-4 flex items-center gap-3 border border-slate-800 hover:border-slate-700 transition-all"
                    style={{ background: "rgba(15,15,25,0.8)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-200">{listing.itemId}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500 capitalize">{listing.itemType}</span>
                        <span className="text-xs text-slate-600">by</span>
                        <span className="text-xs text-slate-400">{listing.sellerName || "Unknown"}</span>
                      </div>
                    </div>
                    <p className="text-green-400 font-bold text-sm">${listing.price?.toLocaleString()}</p>
                    {listing.sellerId === user?.id ? (
                      <Button size="sm" variant="outline" className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => cancelListingMutation.mutate(listing.id)} disabled={cancelListingMutation.isPending}>
                        Cancel
                      </Button>
                    ) : (
                      <Button size="sm" className="text-xs bg-amber-500 hover:bg-amber-400 text-black border-0 font-bold"
                        onClick={() => buyListingMutation.mutate(listing.id)} disabled={buyListingMutation.isPending || balance < listing.price}>
                        Buy
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes card-deal {
          0% { opacity: 0; transform: translateY(-20px) scale(0.8) rotate(-5deg); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
        }
        @keyframes coin-flip {
          0% { transform: rotateY(0deg); }
          50% { transform: rotateY(900deg) scaleX(0.1); }
          100% { transform: rotateY(1800deg); }
        }
      `}</style>
    </div>
  );
}
