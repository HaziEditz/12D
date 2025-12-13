import { PremiumPaywall } from "@/components/paywall";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Crown, 
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  BookOpen,
  Target,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Filter,
  Search
} from "lucide-react";
import { useState } from "react";

interface JournalEntry {
  id: number;
  date: string;
  symbol: string;
  type: "buy" | "sell";
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  notes: string;
  strategy: string;
  emotions: string;
  lessons: string;
}

const mockEntries: JournalEntry[] = [
  {
    id: 1,
    date: "2024-12-13",
    symbol: "AAPL",
    type: "buy",
    entryPrice: 185.50,
    exitPrice: 189.43,
    quantity: 50,
    pnl: 196.50,
    notes: "Entered on support bounce. Volume confirmed the move.",
    strategy: "Support/Resistance",
    emotions: "Confident, followed the plan",
    lessons: "Patience paid off - waited for confirmation before entry"
  },
  {
    id: 2,
    date: "2024-12-12",
    symbol: "NVDA",
    type: "sell",
    entryPrice: 505.00,
    exitPrice: 495.22,
    quantity: 20,
    pnl: -195.60,
    notes: "Took profit too early. Should have held longer.",
    strategy: "Momentum",
    emotions: "Anxious about pullback",
    lessons: "Need to trust the trend more and set proper trailing stops"
  },
  {
    id: 3,
    date: "2024-12-11",
    symbol: "TSLA",
    type: "buy",
    entryPrice: 242.30,
    exitPrice: 248.50,
    quantity: 30,
    pnl: 186.00,
    notes: "Breakout trade above resistance. Strong momentum.",
    strategy: "Breakout",
    emotions: "Excited but managed risk well",
    lessons: "Breakout patterns continue to work well in current market"
  },
  {
    id: 4,
    date: "2024-12-10",
    symbol: "MSFT",
    type: "buy",
    entryPrice: 370.15,
    exitPrice: 378.91,
    quantity: 25,
    pnl: 219.00,
    notes: "Earnings play. Entered before announcement.",
    strategy: "Earnings",
    emotions: "Nervous about volatility",
    lessons: "Size down on earnings plays due to unpredictability"
  },
];

function JournalEntry({ entry, expanded, onToggle }: { entry: JournalEntry; expanded: boolean; onToggle: () => void }) {
  const isProfit = entry.pnl >= 0;
  
  return (
    <Card className="overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover-elevate"
        onClick={onToggle}
        data-testid={`journal-entry-${entry.id}`}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${entry.type === "buy" ? "bg-green-500/10" : "bg-red-500/10"}`}>
              {entry.type === "buy" ? (
                <TrendingUp className={`w-5 h-5 text-green-500`} />
              ) : (
                <TrendingDown className={`w-5 h-5 text-red-500`} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{entry.symbol}</span>
                <Badge variant="outline" className="text-xs">{entry.strategy}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{entry.date}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Entry/Exit</p>
              <p className="font-mono text-sm">${entry.entryPrice.toFixed(2)} / ${entry.exitPrice.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Quantity</p>
              <p className="font-mono text-sm">{entry.quantity}</p>
            </div>
            <div className="text-right min-w-[80px]">
              <p className="text-sm text-muted-foreground">P&L</p>
              <p className={`font-mono font-semibold ${isProfit ? "text-green-500" : "text-red-500"}`}>
                {isProfit ? "+" : ""}{entry.pnl.toFixed(2)}
              </p>
            </div>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>
      
      {expanded && (
        <CardContent className="pt-0 pb-4 border-t">
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                <MessageSquare className="w-4 h-4" />
                Trade Notes
              </div>
              <p className="text-sm text-muted-foreground">{entry.notes}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                <Target className="w-4 h-4" />
                Emotions
              </div>
              <p className="text-sm text-muted-foreground">{entry.emotions}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                <BookOpen className="w-4 h-4" />
                Lessons Learned
              </div>
              <p className="text-sm text-muted-foreground">{entry.lessons}</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function TradeJournalContent() {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredEntries = mockEntries.filter(entry => 
    entry.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.strategy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalTrades: mockEntries.length,
    winRate: Math.round((mockEntries.filter(e => e.pnl > 0).length / mockEntries.length) * 100),
    totalPnl: mockEntries.reduce((sum, e) => sum + e.pnl, 0),
    avgWin: mockEntries.filter(e => e.pnl > 0).reduce((sum, e) => sum + e.pnl, 0) / mockEntries.filter(e => e.pnl > 0).length,
    avgLoss: mockEntries.filter(e => e.pnl < 0).reduce((sum, e) => sum + e.pnl, 0) / mockEntries.filter(e => e.pnl < 0).length || 0,
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-journal-title">Trade Journal</h1>
            <p className="text-muted-foreground">Track, analyze, and improve your trading</p>
          </div>
          <Badge className="ml-auto bg-gradient-to-r from-amber-500 to-amber-600">Premium</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{stats.totalTrades}</p>
              <p className="text-sm text-muted-foreground">Total Trades</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-green-500">{stats.winRate}%</p>
              <p className="text-sm text-muted-foreground">Win Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className={`text-2xl font-bold ${stats.totalPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                ${stats.totalPnl.toFixed(0)}
              </p>
              <p className="text-sm text-muted-foreground">Total P&L</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-green-500">${stats.avgWin.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground">Avg Win</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-red-500">${stats.avgLoss.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground">Avg Loss</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search trades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-journal"
            />
          </div>
          <Button variant="outline" className="gap-2" data-testid="button-filter-journal">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button className="gap-2" onClick={() => setShowAddForm(!showAddForm)} data-testid="button-add-entry">
            <Plus className="w-4 h-4" />
            Add Entry
          </Button>
        </div>

        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">New Journal Entry</CardTitle>
              <CardDescription>Record your trade with notes and reflections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Symbol</label>
                  <Input placeholder="AAPL" data-testid="input-new-symbol" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Strategy</label>
                  <Input placeholder="Breakout, Momentum, etc." data-testid="input-new-strategy" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Entry Price</label>
                  <Input type="number" placeholder="0.00" data-testid="input-new-entry" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Exit Price</label>
                  <Input type="number" placeholder="0.00" data-testid="input-new-exit" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Trade Notes</label>
                  <Textarea placeholder="What was your reasoning for this trade?" data-testid="input-new-notes" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Emotions & Mindset</label>
                  <Textarea placeholder="How did you feel during this trade?" data-testid="input-new-emotions" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Lessons Learned</label>
                  <Textarea placeholder="What can you learn from this trade?" data-testid="input-new-lessons" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button data-testid="button-save-entry">Save Entry</Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <JournalEntry
              key={entry.id}
              entry={entry}
              expanded={expandedId === entry.id}
              onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TradeJournalPage() {
  return (
    <PremiumPaywall featureName="Trade Journal">
      <TradeJournalContent />
    </PremiumPaywall>
  );
}
