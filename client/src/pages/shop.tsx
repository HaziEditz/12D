import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { FRAMES, TITLES, PACKS, RARITY_COLORS, RARITY_GLOW, getFrameStyle, type Rarity } from "@/lib/shop-catalog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShoppingBag, Package, Sparkles, Check, Crown, Zap, ChevronRight } from "lucide-react";
import { fireConfetti } from "@/lib/confetti";

type Tab = "frames" | "titles" | "packs";

function rarityLabel(r: Rarity) {
  return r.charAt(0).toUpperCase() + r.slice(1);
}

function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${RARITY_COLORS[rarity]}`}>
      {rarityLabel(rarity)}
    </span>
  );
}

function FramePreview({ frameId, size = 44 }: { frameId: string; size?: number }) {
  const style = getFrameStyle(frameId);
  const frame = FRAMES.find(f => f.id === frameId);
  return (
    <div className="flex items-center justify-center" style={{ width: size + 12, height: size + 12 }}>
      <div
        style={{ ...style, width: size, height: size, borderRadius: "9999px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsl(var(--muted))" }}
      >
        <span style={{ fontSize: size * 0.45 }}>👤</span>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("frames");
  const [packResult, setPackResult] = useState<{ itemId: string; type: "frame" | "title" } | null>(null);
  const [opening, setOpening] = useState(false);

  const owned: string[] = (() => {
    try { return JSON.parse(user?.purchasedCosmetics ?? "[]"); } catch { return []; }
  })();

  const balance = user?.simulatorBalance ?? 0;
  const equippedFrame = user?.equippedFrame ?? null;
  const equippedTitle = user?.equippedTitle ?? null;

  // ── Purchase mutation ──────────────────────────────────────────────────
  const purchaseMutation = useMutation({
    mutationFn: (body: { itemId: string; price: number }) =>
      apiRequest("POST", "/api/global-shop/purchase", body),
    onSuccess: () => {
      refreshUser();
      fireConfetti();
    },
    onError: (e: any) => toast({ title: "Purchase failed", description: e.message, variant: "destructive" }),
  });

  // ── Pack open mutation ─────────────────────────────────────────────────
  const packOpenMutation = useMutation({
    mutationFn: (body: { packId: string; price: number }) =>
      apiRequest("POST", "/api/global-shop/pack-open", body),
    onSuccess: async (data: any) => {
      setOpening(false);
      const rewardId: string = data.rewardId;
      const type: "frame" | "title" = rewardId.startsWith("frame-") ? "frame" : "title";
      setPackResult({ itemId: rewardId, type });
      refreshUser();
      fireConfetti();
    },
    onError: (e: any) => {
      setOpening(false);
      toast({ title: "Failed to open pack", description: e.message, variant: "destructive" });
    },
  });

  // ── Equip mutation ─────────────────────────────────────────────────────
  const equipMutation = useMutation({
    mutationFn: (body: { type: "frame" | "title"; value: string | null }) =>
      apiRequest("POST", "/api/global-shop/equip", body),
    onSuccess: () => {
      refreshUser();
      toast({ title: "Equipped!", description: "Your new look is active." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleBuyFrame = (id: string, price: number) => {
    if (balance < price) return toast({ title: "Not enough funds", description: `You need $${price.toLocaleString()}. Keep trading!`, variant: "destructive" });
    purchaseMutation.mutate({ itemId: id, price });
    toast({ title: "Purchased! 🎉", description: "Item added to your collection." });
  };

  const handleOpenPack = (packId: string, price: number) => {
    if (balance < price) return toast({ title: "Not enough funds", description: `You need $${price.toLocaleString()}. Keep trading!`, variant: "destructive" });
    setOpening(true);
    setTimeout(() => packOpenMutation.mutate({ packId, price }), 1200);
  };

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2">
            <ShoppingBag className="h-8 w-8 text-primary" />
            12Digits Shop
          </h1>
          <p className="text-muted-foreground mt-1">Spend your trading profits on cosmetics and collectibles.</p>
        </div>
        <div className="flex items-center gap-3 bg-muted/60 border border-border rounded-xl px-5 py-3">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Trading Balance</p>
            <p className="text-xl font-black text-green-400">${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* ── Your look preview ──────────────────────────────────────── */}
      <div className="mb-8 p-5 rounded-2xl border border-border bg-card flex flex-col sm:flex-row items-center gap-5">
        <div className="relative">
          <Avatar className="h-16 w-16" style={getFrameStyle(equippedFrame)}>
            <AvatarImage src={user?.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
              {getInitials(user?.displayName ?? "U")}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="text-center sm:text-left">
          <p className="font-bold text-lg">{user?.displayName}</p>
          {equippedTitle
            ? <p className="text-sm text-primary font-semibold">{TITLES.find(t => t.id === equippedTitle)?.name ?? equippedTitle}</p>
            : <p className="text-sm text-muted-foreground">No title equipped</p>}
          <p className="text-xs text-muted-foreground mt-1">
            Frame: {equippedFrame ? FRAMES.find(f => f.id === equippedFrame)?.name : "None"}
          </p>
        </div>
        <div className="sm:ml-auto flex gap-2 flex-wrap justify-center sm:justify-end">
          {equippedFrame && (
            <Button size="sm" variant="outline" onClick={() => equipMutation.mutate({ type: "frame", value: null })}>
              Remove Frame
            </Button>
          )}
          {equippedTitle && (
            <Button size="sm" variant="outline" onClick={() => equipMutation.mutate({ type: "title", value: null })}>
              Remove Title
            </Button>
          )}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6 border-b border-border pb-3">
        {(["frames", "titles", "packs"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm capitalize transition-all ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            data-testid={`tab-shop-${t}`}
          >
            {t === "frames" && "🖼️ "}
            {t === "titles" && "🏷️ "}
            {t === "packs" && "📦 "}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Frames ──────────────────────────────────────────────────── */}
      {tab === "frames" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {FRAMES.map(frame => {
            const isOwned = owned.includes(frame.id);
            const isEquipped = equippedFrame === frame.id;
            const canAfford = balance >= frame.price;
            return (
              <div
                key={frame.id}
                className={`relative rounded-2xl border p-4 flex flex-col items-center gap-3 transition-all ${
                  isEquipped ? "border-primary bg-primary/10" : "border-border bg-card hover:border-border/80"
                } ${RARITY_GLOW[frame.rarity]} shadow-sm`}
                data-testid={`shop-frame-${frame.id}`}
              >
                {isEquipped && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <FramePreview frameId={frame.id} size={48} />
                <div className="text-center">
                  <p className="font-bold text-xs leading-tight">{frame.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{frame.desc}</p>
                  <div className="mt-1.5">
                    <RarityBadge rarity={frame.rarity} />
                  </div>
                </div>
                <div className="w-full">
                  {isEquipped ? (
                    <Button size="sm" variant="secondary" className="w-full text-xs h-7" disabled>Equipped ✓</Button>
                  ) : isOwned ? (
                    <Button size="sm" className="w-full text-xs h-7" onClick={() => equipMutation.mutate({ type: "frame", value: frame.id })}>
                      Equip
                    </Button>
                  ) : (
                    <Button
                      size="sm" variant="outline"
                      className={`w-full text-xs h-7 ${!canAfford ? "opacity-50" : ""}`}
                      onClick={() => handleBuyFrame(frame.id, frame.price)}
                      disabled={purchaseMutation.isPending || !canAfford}
                      data-testid={`button-buy-${frame.id}`}
                    >
                      ${frame.price.toLocaleString()}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Titles ──────────────────────────────────────────────────── */}
      {tab === "titles" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {TITLES.map(title => {
            const isOwned = owned.includes(title.id);
            const isEquipped = equippedTitle === title.id;
            const canAfford = balance >= title.price;
            return (
              <div
                key={title.id}
                className={`relative rounded-xl border p-4 flex items-center gap-4 transition-all ${
                  isEquipped ? "border-primary bg-primary/10" : "border-border bg-card hover:border-border/80"
                }`}
                data-testid={`shop-title-${title.id}`}
              >
                {isEquipped && <Check className="absolute top-3 right-3 h-3.5 w-3.5 text-primary" />}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{title.name}</p>
                  <p className="text-[11px] text-muted-foreground">{title.desc}</p>
                  <div className="mt-1.5">
                    <RarityBadge rarity={title.rarity} />
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {isEquipped ? (
                    <Button size="sm" variant="secondary" className="text-xs h-7 px-3" disabled>On ✓</Button>
                  ) : isOwned ? (
                    <Button size="sm" className="text-xs h-7 px-3" onClick={() => equipMutation.mutate({ type: "title", value: title.id })}>
                      Equip
                    </Button>
                  ) : (
                    <Button
                      size="sm" variant="outline"
                      className={`text-xs h-7 px-3 ${!canAfford ? "opacity-50" : ""}`}
                      onClick={() => handleBuyFrame(title.id, title.price)}
                      disabled={purchaseMutation.isPending || !canAfford}
                      data-testid={`button-buy-${title.id}`}
                    >
                      ${title.price.toLocaleString()}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Packs ───────────────────────────────────────────────────── */}
      {tab === "packs" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {PACKS.map(pack => {
            const canAfford = balance >= pack.price;
            const isOpening = opening && packOpenMutation.isPending;
            return (
              <div
                key={pack.id}
                className={`rounded-2xl border p-6 flex flex-col gap-4 ${RARITY_GLOW[pack.rarity]} shadow-md ${
                  pack.rarity === "legendary"
                    ? "border-yellow-500/40 bg-gradient-to-b from-yellow-500/5 to-card"
                    : pack.rarity === "rare"
                    ? "border-blue-500/40 bg-gradient-to-b from-blue-500/5 to-card"
                    : "border-border bg-card"
                }`}
                data-testid={`shop-pack-${pack.id}`}
              >
                <div className="text-center">
                  <span className="text-5xl">{pack.emoji}</span>
                  <h3 className="font-black text-lg mt-2">{pack.name}</h3>
                  <RarityBadge rarity={pack.rarity} />
                </div>
                <p className="text-sm text-muted-foreground text-center">{pack.desc}</p>
                <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-center">
                  <span className="font-semibold text-foreground">Guarantee:</span>{" "}
                  <span className="text-muted-foreground">{pack.guarantee}</span>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 text-center">Possible items</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {pack.possibleItems.map(id => {
                      const frame = FRAMES.find(f => f.id === id);
                      const title = TITLES.find(t => t.id === id);
                      return (
                        <span key={id} className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                          {frame?.name ?? title?.name ?? id}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <Button
                  className={`w-full font-bold ${pack.rarity === "legendary" ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-black border-0" : pack.rarity === "rare" ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0" : ""} ${!canAfford ? "opacity-50" : ""}`}
                  onClick={() => handleOpenPack(pack.id, pack.price)}
                  disabled={packOpenMutation.isPending || opening || !canAfford}
                  data-testid={`button-open-${pack.id}`}
                >
                  {isOpening ? (
                    <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 animate-spin" /> Opening…</span>
                  ) : (
                    <span>${pack.price.toLocaleString()} — Open Pack</span>
                  )}
                </Button>
                {!canAfford && (
                  <p className="text-[10px] text-muted-foreground text-center -mt-2">
                    Need ${(pack.price - balance).toLocaleString()} more — keep trading!
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pack result modal ─────────────────────────────────────── */}
      {packResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setPackResult(null)}>
          <div
            className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl"
            style={{ animation: "scale-in .4s cubic-bezier(.34,1.2,.64,1)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-xl font-black mb-1">You got:</h2>
            {packResult.type === "frame" ? (
              <>
                <FramePreview frameId={packResult.itemId} size={72} />
                <p className="font-bold text-lg mt-2">{FRAMES.find(f => f.id === packResult.itemId)?.name}</p>
                <RarityBadge rarity={FRAMES.find(f => f.id === packResult.itemId)?.rarity ?? "common"} />
              </>
            ) : (
              <>
                <p className="text-4xl mt-2">{TITLES.find(t => t.id === packResult.itemId)?.name}</p>
                <div className="mt-2"><RarityBadge rarity={TITLES.find(t => t.id === packResult.itemId)?.rarity ?? "common"} /></div>
              </>
            )}
            <div className="flex gap-2 mt-6">
              <Button className="flex-1" variant="outline" onClick={() => setPackResult(null)}>Close</Button>
              <Button className="flex-1" onClick={() => {
                equipMutation.mutate({ type: packResult.type, value: packResult.itemId });
                setPackResult(null);
              }}>
                Equip Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Opening animation overlay */}
      {opening && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl animate-bounce mb-4">📦</div>
            <p className="text-xl font-bold text-white animate-pulse">Opening…</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale-in { from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); } }
      `}</style>
    </div>
  );
}
