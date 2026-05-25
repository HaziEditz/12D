import { useState, useRef, useEffect } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ShoppingBag, Package, Sparkles, Check, Crown, Zap, Shuffle, TrendingUp, Tag, RefreshCw, Star, Gift } from "lucide-react";
import { fireConfetti } from "@/lib/confetti";

type Tab = "frames" | "titles" | "badges" | "packs" | "roulette" | "market";

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

// ── Roulette Wheel ────────────────────────────────────────────────────────────
const SPIN_COSTS = [{ label: "$100", cost: 100 }, { label: "$500", cost: 500 }, { label: "$2,000", cost: 2000 }];

function RouletteWheel({ slots, spinning, winIndex }: { slots: RouletteSlot[]; spinning: boolean; winIndex: number }) {
  const slotCount = slots.length;
  const segAngle = 360 / slotCount;
  const r = 110;
  const cx = 130; const cy = 130;

  return (
    <svg width={260} height={260} className="mx-auto" style={{ transition: "transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)", transform: spinning ? `rotate(${360 * 5 + (360 - winIndex * segAngle)}deg)` : "rotate(0deg)" }}>
      {slots.map((slot, i) => {
        const startA = (i * segAngle - 90) * (Math.PI / 180);
        const endA = ((i + 1) * segAngle - 90) * (Math.PI / 180);
        const x1 = cx + r * Math.cos(startA); const y1 = cy + r * Math.sin(startA);
        const x2 = cx + r * Math.cos(endA); const y2 = cy + r * Math.sin(endA);
        const midA = ((i + 0.5) * segAngle - 90) * (Math.PI / 180);
        const tx = cx + (r * 0.65) * Math.cos(midA);
        const ty = cy + (r * 0.65) * Math.sin(midA);
        return (
          <g key={slot.id}>
            <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`} fill={slot.color} stroke="#1f2937" strokeWidth={1} />
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize={13} fill="white" style={{ pointerEvents: "none" }}>{slot.emoji}</text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={20} fill="#111827" stroke="#374151" strokeWidth={2} />
      <polygon points={`${cx},${cy - r - 10} ${cx - 8},${cy - r + 8} ${cx + 8},${cy - r + 8}`} fill="#f59e0b" />
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ShopPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("frames");
  const [packResult, setPackResult] = useState<{ itemId: string; type: "frame" | "title" | "badge" } | null>(null);
  const [opening, setOpening] = useState(false);
  const [spinCost, setSpinCost] = useState(100);
  const [spinning, setSpinning] = useState(false);
  const [winIndex, setWinIndex] = useState(0);
  const [spinResult, setSpinResult] = useState<{ slot: RouletteSlot; rewardDesc: string; newBalance: number } | null>(null);
  const [listItemId, setListItemId] = useState("");
  const [listItemType, setListItemType] = useState("frame");
  const [listPrice, setListPrice] = useState("");

  const owned: string[] = (() => { try { return JSON.parse(user?.purchasedCosmetics ?? "[]"); } catch { return []; } })();
  const balance = user?.simulatorBalance ?? 0;
  const equippedFrame = user?.equippedFrame ?? null;
  const equippedTitle = user?.equippedTitle ?? null;

  const { data: marketListings = [], refetch: refetchMarket } = useQuery<any[]>({
    queryKey: ["/api/cosmetic-market"],
    enabled: tab === "market",
  });

  const purchaseMutation = useMutation({
    mutationFn: (body: { itemId: string; price: number }) =>
      apiRequest("POST", "/api/global-shop/purchase", body),
    onSuccess: async () => { await refreshUser(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const packOpenMutation = useMutation({
    mutationFn: (packId: string) => apiRequest("POST", "/api/global-shop/pack-open", { packId }),
    onSuccess: async (data) => {
      await refreshUser();
      setPackResult({ itemId: data.item.id, type: data.item.type });
      fireConfetti();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const equipMutation = useMutation({
    mutationFn: (body: { type: string; value: string | null }) =>
      apiRequest("POST", "/api/global-shop/equip", body),
    onSuccess: async () => { await refreshUser(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const spinMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/global-shop/spin", { cost: spinCost }),
    onSuccess: async (data) => {
      await refreshUser();
      const slotIndex = ROULETTE_SLOTS.findIndex(s => s.id === data.slot.id);
      setWinIndex(slotIndex >= 0 ? slotIndex : 0);
      setTimeout(() => {
        setSpinning(false);
        setSpinResult(data);
        if (data.slot.id === "slot-jackpot") fireConfetti();
        toast({ title: `🎰 ${data.slot.label}`, description: data.slot.reward.amount ? `+$${data.slot.reward.amount?.toLocaleString()}` : "Check your cosmetics!" });
      }, 3200);
    },
    onError: (e: any) => { setSpinning(false); toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const listMutation = useMutation({
    mutationFn: (body: { itemId: string; itemType: string; price: number }) =>
      apiRequest("POST", "/api/cosmetic-market", body),
    onSuccess: async () => {
      await refreshUser();
      refetchMarket();
      setListItemId(""); setListPrice("");
      toast({ title: "Listed!", description: "Your item is now for sale." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const buyListingMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/cosmetic-market/${id}/buy`, {}),
    onSuccess: async () => {
      await refreshUser();
      refetchMarket();
      fireConfetti();
      toast({ title: "Purchased!", description: "Item added to your collection." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const cancelListingMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/cosmetic-market/${id}`, {}),
    onSuccess: async () => { await refreshUser(); refetchMarket(); toast({ title: "Cancelled" }); },
  });

  function handleBuy(itemId: string, price: number) {
    if (balance < price) { toast({ title: "Insufficient balance", description: `You need $${(price - balance).toLocaleString()} more.`, variant: "destructive" }); return; }
    purchaseMutation.mutate({ itemId, price });
  }

  function handleEquip(type: "frame" | "title", value: string | null) {
    equipMutation.mutate({ type, value });
  }

  function handleSpin() {
    if (spinning) return;
    if (balance < spinCost) { toast({ title: "Not enough balance", variant: "destructive" }); return; }
    setSpinning(true);
    setSpinResult(null);
    spinMutation.mutate();
  }

  const TABS: { id: Tab; icon: any; label: string }[] = [
    { id: "frames", icon: Crown, label: "Frames" },
    { id: "titles", icon: Sparkles, label: "Titles" },
    { id: "badges", icon: Star, label: "Badges" },
    { id: "packs", icon: Package, label: "Packs" },
    { id: "roulette", icon: Shuffle, label: "Roulette" },
    { id: "market", icon: TrendingUp, label: "Market" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShoppingBag className="w-8 h-8 text-primary" />
              Cosmetic Shop
            </h1>
            <p className="text-muted-foreground mt-1">Customize your profile with frames, titles, and more</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Your Balance</p>
            <p className="text-2xl font-bold text-green-400">${balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1.5 mb-6 bg-muted/40 p-1.5 rounded-xl overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              data-testid={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === t.id ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Frames Tab ── */}
        {tab === "frames" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {FRAMES.map(frame => {
              const isOwned = owned.includes(frame.id);
              const isEquipped = equippedFrame === frame.id;
              return (
                <div key={frame.id} className={`relative bg-card border rounded-xl p-3 flex flex-col items-center gap-2 transition-all hover:border-primary/40 ${RARITY_GLOW[frame.rarity] ? "shadow-lg " + RARITY_GLOW[frame.rarity] : ""}`}>
                  <RarityBadge rarity={frame.rarity} />
                  <FramePreview frameId={frame.id} size={52} />
                  <p className="text-xs font-semibold text-center leading-tight">{frame.name}</p>
                  <p className="text-[10px] text-muted-foreground text-center">{frame.desc}</p>
                  {isOwned ? (
                    <Button size="sm" variant={isEquipped ? "default" : "outline"} className="w-full text-xs h-7 mt-auto"
                      onClick={() => handleEquip("frame", isEquipped ? null : frame.id)} disabled={equipMutation.isPending}>
                      {isEquipped ? <><Check className="w-3 h-3 mr-1" />Equipped</> : "Equip"}
                    </Button>
                  ) : (
                    <Button size="sm" className="w-full text-xs h-7 mt-auto"
                      onClick={() => handleBuy(frame.id, frame.price)} disabled={purchaseMutation.isPending || balance < frame.price}>
                      <Zap className="w-3 h-3 mr-1" />${frame.price.toLocaleString()}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Titles Tab ── */}
        {tab === "titles" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TITLES.map(title => {
              const isOwned = owned.includes(title.id);
              const isEquipped = equippedTitle === title.id;
              return (
                <div key={title.id} className={`bg-card border rounded-xl p-4 flex items-center gap-3 transition-all hover:border-primary/40 ${RARITY_GLOW[title.rarity] ? "shadow-lg " + RARITY_GLOW[title.rarity] : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{title.name}</span>
                      <RarityBadge rarity={title.rarity} />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{title.desc}</p>
                  </div>
                  {isOwned ? (
                    <Button size="sm" variant={isEquipped ? "default" : "outline"} className="text-xs h-7 shrink-0"
                      onClick={() => handleEquip("title", isEquipped ? null : title.id)} disabled={equipMutation.isPending}>
                      {isEquipped ? "On" : "Equip"}
                    </Button>
                  ) : (
                    <Button size="sm" className="text-xs h-7 shrink-0"
                      onClick={() => handleBuy(title.id, title.price)} disabled={purchaseMutation.isPending || balance < title.price}>
                      ${title.price.toLocaleString()}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Badges Tab ── */}
        {tab === "badges" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {BADGES.map(badge => {
              const isOwned = owned.includes(badge.id);
              return (
                <div key={badge.id} className={`bg-card border rounded-xl p-3 flex flex-col items-center gap-2 transition-all hover:border-primary/40 ${RARITY_GLOW[badge.rarity] ? "shadow-lg " + RARITY_GLOW[badge.rarity] : ""}`}>
                  <RarityBadge rarity={badge.rarity} />
                  <span className="text-4xl">{badge.emoji}</span>
                  <p className="text-xs font-semibold text-center">{badge.name}</p>
                  <p className="text-[10px] text-muted-foreground text-center">{badge.desc}</p>
                  {isOwned ? (
                    <div className="flex items-center gap-1 text-green-400 text-xs mt-auto"><Check className="w-3 h-3" />Owned</div>
                  ) : (
                    <Button size="sm" className="w-full text-xs h-7 mt-auto"
                      onClick={() => handleBuy(badge.id, badge.price)} disabled={purchaseMutation.isPending || balance < badge.price}>
                      <Zap className="w-3 h-3 mr-1" />${badge.price.toLocaleString()}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Packs Tab ── */}
        {tab === "packs" && (
          <>
            {packResult && (
              <div className="mb-6 bg-card border border-primary/30 rounded-xl p-5 text-center animate-in fade-in">
                <p className="text-sm text-muted-foreground mb-1">You got:</p>
                <p className="text-2xl font-bold">
                  {packResult.type === "frame" ? <FramePreview frameId={packResult.itemId} size={64} /> : packResult.itemId}
                </p>
                <p className="text-muted-foreground text-xs mt-1">{packResult.itemId}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setPackResult(null)}>Close</Button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PACKS.map(pack => {
                const isOwned = owned.includes(pack.id);
                return (
                  <div key={pack.id} className={`bg-card border rounded-xl p-4 flex flex-col gap-3 hover:border-primary/40 transition-all ${RARITY_GLOW[pack.rarity] ? "shadow-xl " + RARITY_GLOW[pack.rarity] : ""}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-4xl">{pack.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold">{pack.name}</span>
                          <RarityBadge rarity={pack.rarity} />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">{pack.desc}</p>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">
                      🎁 <span className="font-medium text-foreground">{pack.guarantee}</span>
                    </div>
                    <Button className="w-full mt-auto" disabled={packOpenMutation.isPending || balance < pack.price}
                      onClick={async () => { setOpening(true); await packOpenMutation.mutateAsync(pack.id); setOpening(false); }}>
                      {opening && packOpenMutation.isPending ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Opening...</> : <><Gift className="w-4 h-4 mr-2" />Open for ${pack.price.toLocaleString()}</>}
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Roulette Tab ── */}
        {tab === "roulette" && (
          <div className="max-w-md mx-auto">
            <div className="bg-card border rounded-2xl p-6 flex flex-col items-center gap-5">
              <div>
                <h2 className="text-xl font-bold text-center">🎰 Spin the Wheel</h2>
                <p className="text-sm text-muted-foreground text-center mt-1">Pay to spin. Win balance or rare items!</p>
              </div>
              <RouletteWheel slots={ROULETTE_SLOTS} spinning={spinning} winIndex={winIndex} />
              {spinResult && !spinning && (
                <div className="w-full bg-muted/50 rounded-xl p-4 text-center animate-in fade-in">
                  <p className="text-2xl font-bold">{spinResult.slot.emoji} {spinResult.slot.label}</p>
                  {spinResult.slot.reward.amount ? (
                    <p className="text-green-400 font-semibold mt-1">+${spinResult.slot.reward.amount.toLocaleString()}</p>
                  ) : (
                    <p className="text-purple-400 font-semibold mt-1">Item added to collection!</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Balance: ${spinResult.newBalance.toLocaleString()}</p>
                </div>
              )}
              <div className="flex gap-2 w-full">
                {SPIN_COSTS.map(opt => (
                  <button key={opt.cost} onClick={() => setSpinCost(opt.cost)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${spinCost === opt.cost ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <Button className="w-full" size="lg" onClick={handleSpin} disabled={spinning || balance < spinCost || spinMutation.isPending}>
                {spinning ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Spinning...</> : <><Shuffle className="w-4 h-4 mr-2" />Spin for ${spinCost.toLocaleString()}</>}
              </Button>
              <div className="w-full">
                <p className="text-xs text-muted-foreground mb-2 font-semibold">Possible rewards:</p>
                <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto">
                  {ROULETTE_SLOTS.map(slot => (
                    <div key={slot.id} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg bg-muted/40">
                      <span>{slot.emoji}</span>
                      <span className="text-muted-foreground truncate">{slot.label}</span>
                      <RarityBadge rarity={slot.rarity} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Market Tab ── */}
        {tab === "market" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List Item */}
            <div className="lg:col-span-1">
              <div className="bg-card border rounded-xl p-4 sticky top-4">
                <h3 className="font-bold mb-3 flex items-center gap-2"><Tag className="w-4 h-4" />List an Item</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Item Type</label>
                    <select value={listItemType} onChange={e => setListItemType(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm">
                      <option value="frame">Frame</option>
                      <option value="title">Title</option>
                      <option value="badge">Badge</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Item</label>
                    <select value={listItemId} onChange={e => setListItemId(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm">
                      <option value="">-- Select --</option>
                      {(listItemType === "frame" ? FRAMES : listItemType === "title" ? TITLES : BADGES)
                        .filter(item => owned.includes(item.id))
                        .map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Price ($)</label>
                    <Input type="number" min="1" value={listPrice} onChange={e => setListPrice(e.target.value)} placeholder="e.g. 5000" className="text-sm" />
                  </div>
                  <Button className="w-full" disabled={!listItemId || !listPrice || listMutation.isPending}
                    onClick={() => listMutation.mutate({ itemId: listItemId, itemType: listItemType, price: Number(listPrice) })}>
                    <Tag className="w-4 h-4 mr-2" />List for Sale
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Listings */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Active Listings</h3>
                <Button variant="ghost" size="sm" onClick={() => refetchMarket()}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />Refresh
                </Button>
              </div>
              {marketListings.length === 0 ? (
                <div className="bg-card border rounded-xl p-12 text-center text-muted-foreground">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No items listed yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {marketListings.map((listing: any) => {
                    const isMine = listing.sellerId === user?.id;
                    return (
                      <div key={listing.id} className="bg-card border rounded-xl p-3 flex items-center gap-3">
                        {listing.itemType === "frame" && <FramePreview frameId={listing.itemId} size={36} />}
                        {listing.itemType !== "frame" && (
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-lg">
                            {BADGES.find(b => b.id === listing.itemId)?.emoji ?? "✨"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{listing.itemId}</p>
                          <p className="text-xs text-muted-foreground">{listing.itemType} · by {listing.seller?.displayName ?? "?"}</p>
                        </div>
                        <p className="text-green-400 font-bold text-sm whitespace-nowrap">${listing.price.toLocaleString()}</p>
                        {isMine ? (
                          <Button size="sm" variant="destructive" className="text-xs h-7"
                            onClick={() => cancelListingMutation.mutate(listing.id)} disabled={cancelListingMutation.isPending}>
                            Cancel
                          </Button>
                        ) : (
                          <Button size="sm" className="text-xs h-7"
                            onClick={() => buyListingMutation.mutate(listing.id)} disabled={buyListingMutation.isPending || balance < listing.price}>
                            Buy
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
