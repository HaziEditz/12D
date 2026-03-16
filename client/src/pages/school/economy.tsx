import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/queryClient";
import SchoolLayout from "@/layouts/school-layout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Coins, TrendingUp, TrendingDown, Briefcase, ShoppingBag, Gavel,
  Clock, CheckCircle2, ArrowUpRight, ArrowDownRight, Loader2, Star, Receipt
} from "lucide-react";
import { format } from "date-fns";

const TX_ICONS: Record<string, { icon: any; color: string; label: string }> = {
  lesson: { icon: TrendingUp, color: "text-emerald-400", label: "Lesson" },
  quiz: { icon: Star, color: "text-amber-400", label: "Quiz" },
  assignment: { icon: CheckCircle2, color: "text-teal-400", label: "Assignment" },
  job: { icon: Briefcase, color: "text-blue-400", label: "Job Pay" },
  teacher_award: { icon: Star, color: "text-yellow-400", label: "Teacher Award" },
  simulator: { icon: TrendingUp, color: "text-cyan-400", label: "Simulator" },
  auction: { icon: Gavel, color: "text-rose-400", label: "Auction" },
  expense: { icon: Receipt, color: "text-red-400", label: "Expense" },
  purchase: { icon: ShoppingBag, color: "text-purple-400", label: "Purchase" },
  interest: { icon: TrendingUp, color: "text-green-400", label: "Interest" },
};

export default function SchoolEconomy() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({});
  const [selectedAuction, setSelectedAuction] = useState<any>(null);

  const { data: classData } = useQuery<any>({ queryKey: ["/api/classroom"] });
  const classId = classData?.class?.id;
  const ageGroup = classData?.class?.ageGroup ?? "high_school";
  const isPrimary = ageGroup === "primary";

  const { data: economyData, isLoading: balanceLoading } = useQuery<any>({
    queryKey: ["/api/economy/balance", classId],
    queryFn: () => fetch(`/api/economy/balance?classId=${classId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!classId,
  });

  const { data: settings } = useQuery<any>({
    queryKey: ["/api/economy/settings", classId],
    queryFn: () => fetch(`/api/economy/settings?classId=${classId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!classId,
  });

  const { data: expenses = [] } = useQuery<any[]>({
    queryKey: ["/api/economy/expenses", classId],
    queryFn: () => fetch(`/api/economy/expenses?classId=${classId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!classId,
  });

  const { data: auctions = [] } = useQuery<any[]>({
    queryKey: ["/api/economy/auctions", classId],
    queryFn: () => fetch(`/api/economy/auctions?classId=${classId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!classId,
  });

  const { data: storeItems = [] } = useQuery<any[]>({
    queryKey: ["/api/economy/store", classId],
    queryFn: () => fetch(`/api/economy/store?classId=${classId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!classId,
  });

  const bidMutation = useMutation({
    mutationFn: ({ auctionId, amount }: { auctionId: string; amount: number }) =>
      apiRequest("POST", `/api/economy/auctions/${auctionId}/bid`, { amount, classId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/economy/auctions", classId] });
      qc.invalidateQueries({ queryKey: ["/api/economy/balance", classId] });
      toast({ title: "Bid placed!", description: "Your bid has been recorded." });
      setSelectedAuction(null);
    },
    onError: (e: any) => toast({ title: "Bid failed", description: e.message, variant: "destructive" }),
  });

  const buyMutation = useMutation({
    mutationFn: (itemId: string) => apiRequest("POST", `/api/economy/store/${itemId}/buy`, { classId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/economy/store", classId] });
      qc.invalidateQueries({ queryKey: ["/api/economy/balance", classId] });
      toast({ title: "Purchase successful!", description: "Item added to your purchases." });
    },
    onError: (e: any) => toast({ title: "Purchase failed", description: e.message, variant: "destructive" }),
  });

  const currencyName = settings?.currencyName ?? "Coins";
  const currencySymbol = settings?.currencySymbol ?? "🪙";
  const balance = economyData?.balance ?? 0;
  const transactions: any[] = economyData?.transactions ?? [];
  const myJobs: any[] = economyData?.myJobs ?? [];
  const purchases: any[] = economyData?.purchases ?? [];

  const activeAuctions = auctions.filter((a: any) => a.isActive && new Date(a.endDate) > new Date());
  const closedAuctions = auctions.filter((a: any) => !a.isActive || new Date(a.endDate) <= new Date());

  const accentColor = isPrimary ? "from-pink-400 to-rose-500" : "from-teal-500 to-cyan-600";
  const accentText = isPrimary ? "text-pink-400" : "text-teal-400";

  if (!classId) {
    return (
      <SchoolLayout>
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <Coins className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-semibold">Join a class to access the Economy</p>
        </div>
      </SchoolLayout>
    );
  }

  return (
    <SchoolLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        {/* Balance Banner */}
        <div className={`relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r ${accentColor}`}>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,white,transparent)]" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-white/70 mb-1">Your Balance</p>
              <div className="flex items-center gap-3">
                <span className="text-5xl">{currencySymbol}</span>
                <span className="text-5xl font-black text-white">{balance.toLocaleString()}</span>
              </div>
              <p className="text-white/70 mt-1 text-sm">{currencyName}</p>
            </div>
            <div className="flex flex-col gap-2">
              {settings && (
                <div className="bg-white/15 rounded-2xl p-4 text-white text-sm space-y-1 min-w-[160px]">
                  <p className="font-bold text-xs text-white/70 mb-2">Earn Rates</p>
                  <div className="flex justify-between"><span>📚 Lesson</span><span className="font-bold">+{settings.lessonReward}</span></div>
                  <div className="flex justify-between"><span>✅ Quiz</span><span className="font-bold">+{settings.quizReward}</span></div>
                  <div className="flex justify-between"><span>🎯 Assignment</span><span className="font-bold">+{settings.assignmentReward}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Transactions + Jobs */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Jobs */}
            {myJobs.length > 0 && (
              <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
                <h2 className="text-base font-black text-white mb-4 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-400" /> My Classroom Jobs
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {myJobs.map((job: any) => (
                    <div key={job.id} className="rounded-xl p-4 bg-blue-500/10 border border-blue-500/20">
                      <p className="font-bold text-white text-sm">{job.jobTitle}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Pay: <span className="text-blue-300 font-semibold">{currencySymbol}{job.payAmount}</span> per {job.payFrequency}</p>
                      {job.lastPaidAt && <p className="text-xs text-slate-500 mt-1">Last paid: {format(new Date(job.lastPaidAt), "MMM d")}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction History */}
            <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
              <h2 className="text-base font-black text-white mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" /> Transaction History
              </h2>
              {balanceLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-500" /></div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Coins className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No transactions yet. Complete lessons to start earning!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx: any) => {
                    const info = TX_ICONS[tx.type] ?? TX_ICONS.lesson;
                    const Icon = info.icon;
                    const isPositive = tx.amount > 0;
                    return (
                      <div key={tx.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0" data-testid={`tx-row-${tx.id}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 shrink-0`}>
                          <Icon className={`h-4 w-4 ${info.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{tx.description}</p>
                          <p className="text-xs text-slate-500">{format(new Date(tx.createdAt), "MMM d, h:mm a")}</p>
                        </div>
                        <div className={`flex items-center gap-1 font-bold text-sm shrink-0 ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                          {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          {isPositive ? "+" : ""}{tx.amount} {currencySymbol}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Expenses */}
          <div className="space-y-6">
            {expenses.length > 0 && (
              <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
                <h2 className="text-base font-black text-white mb-4 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-red-400" /> Expenses
                </h2>
                <div className="space-y-2">
                  {expenses.map((exp: any) => (
                    <div key={exp.id} className="rounded-xl p-3 bg-red-500/10 border border-red-500/20">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-white text-sm">{exp.name}</p>
                        <span className="text-red-400 font-bold text-sm">{currencySymbol}{exp.amount}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 capitalize">{exp.frequency}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My Purchases */}
            {purchases.length > 0 && (
              <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
                <h2 className="text-base font-black text-white mb-4 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-purple-400" /> My Purchases
                </h2>
                <div className="space-y-2">
                  {purchases.slice(0, 5).map((p: any) => (
                    <div key={p.id} className="flex items-center gap-2 text-sm">
                      <span className="text-lg">{p.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-xs truncate">{p.itemName}</p>
                        <p className="text-slate-500 text-xs">{format(new Date(p.purchasedAt), "MMM d")}</p>
                      </div>
                      <span className="text-purple-400 font-bold text-xs">{currencySymbol}{p.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Auctions */}
        {activeAuctions.length > 0 && (
          <div>
            <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Gavel className="h-5 w-5 text-amber-400" />
              Live Auctions
              <Badge className="bg-amber-500/20 text-amber-300 border-0">{activeAuctions.length} active</Badge>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeAuctions.map((auction: any) => {
                const endDate = new Date(auction.endDate);
                const timeLeft = endDate.getTime() - Date.now();
                const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                const myBid = bidAmounts[auction.id] ?? "";
                const minBid = Math.max(auction.startingBid, (auction.currentHighBid ?? 0) + 1);
                const isHighBidder = auction.currentHighBidderId === user?.id;
                return (
                  <div key={auction.id} className="rounded-2xl p-5 bg-amber-500/5 border border-amber-500/20 flex flex-col gap-3" data-testid={`auction-card-${auction.id}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-2xl">{auction.emoji ?? "🎁"}</span>
                        <p className="font-black text-white text-base mt-1">{auction.title}</p>
                        {auction.description && <p className="text-xs text-slate-400 mt-0.5">{auction.description}</p>}
                      </div>
                      {isHighBidder && <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-xs">Winning!</Badge>}
                    </div>
                    <div className="flex justify-between text-sm">
                      <div>
                        <p className="text-slate-500 text-xs">Current Bid</p>
                        <p className="font-bold text-amber-300">{currencySymbol}{auction.currentHighBid ?? 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500 text-xs">Ends in</p>
                        <p className="font-bold text-white text-xs">{hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={minBid}
                        placeholder={`Min: ${minBid}`}
                        value={myBid}
                        onChange={e => setBidAmounts(prev => ({ ...prev, [auction.id]: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white text-sm h-8"
                        data-testid={`input-bid-${auction.id}`}
                      />
                      <Button
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
                        disabled={!myBid || Number(myBid) < minBid || bidMutation.isPending}
                        onClick={() => bidMutation.mutate({ auctionId: auction.id, amount: Number(myBid) })}
                        data-testid={`button-bid-${auction.id}`}
                      >
                        {bidMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Bid"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Store */}
        {storeItems.length > 0 && (
          <div>
            <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-purple-400" />
              Classroom Store
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {storeItems.map((item: any) => {
                const canAfford = balance >= item.price;
                const outOfStock = item.stock !== null && item.stock <= 0;
                return (
                  <div key={item.id} className={`rounded-2xl p-4 border flex flex-col gap-2 ${outOfStock ? "opacity-50 bg-white/3 border-white/5" : canAfford ? "bg-purple-500/5 border-purple-500/20" : "bg-white/3 border-white/10"}`} data-testid={`store-item-${item.id}`}>
                    <span className="text-3xl">{item.emoji}</span>
                    <p className="font-black text-white text-sm leading-tight">{item.name}</p>
                    {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-bold text-sm text-purple-300">{currencySymbol}{item.price}</span>
                      {item.stock !== null && <span className="text-xs text-slate-500">{item.stock} left</span>}
                    </div>
                    <Button
                      size="sm"
                      className={`w-full text-xs font-bold ${canAfford && !outOfStock ? "bg-purple-600 hover:bg-purple-500 text-white" : "bg-white/5 text-slate-500 cursor-not-allowed"}`}
                      disabled={!canAfford || outOfStock || buyMutation.isPending}
                      onClick={() => buyMutation.mutate(item.id)}
                      data-testid={`button-buy-${item.id}`}
                    >
                      {outOfStock ? "Out of stock" : !canAfford ? "Can't afford" : buyMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Buy"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Closed Auctions */}
        {closedAuctions.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-slate-400 mb-3">Past Auctions</h2>
            <div className="space-y-2">
              {closedAuctions.slice(0, 5).map((auction: any) => (
                <div key={auction.id} className="flex items-center gap-3 rounded-xl p-3 bg-white/3 border border-white/5">
                  <span className="text-lg">{auction.emoji ?? "🎁"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{auction.title}</p>
                    <p className="text-xs text-slate-500">Ended {format(new Date(auction.endDate), "MMM d")}</p>
                  </div>
                  {auction.winnerId === user?.id ? (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-xs">You won!</Badge>
                  ) : auction.winnerId ? (
                    <Badge className="bg-slate-500/20 text-slate-400 border-0 text-xs">Sold: {currencySymbol}{auction.currentHighBid}</Badge>
                  ) : (
                    <Badge className="bg-slate-500/20 text-slate-400 border-0 text-xs">No bids</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SchoolLayout>
  );
}
