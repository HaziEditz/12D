import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { 
  Star, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  Search,
  RefreshCw
} from "lucide-react";

interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const MOCK_STOCKS: Record<string, { name: string; basePrice: number }> = {
  AAPL: { name: "Apple Inc.", basePrice: 178.50 },
  GOOGL: { name: "Alphabet Inc.", basePrice: 141.80 },
  MSFT: { name: "Microsoft Corp.", basePrice: 378.90 },
  AMZN: { name: "Amazon.com Inc.", basePrice: 178.25 },
  TSLA: { name: "Tesla Inc.", basePrice: 248.50 },
  NVDA: { name: "NVIDIA Corp.", basePrice: 495.20 },
  META: { name: "Meta Platforms", basePrice: 505.75 },
  JPM: { name: "JPMorgan Chase", basePrice: 195.30 },
  V: { name: "Visa Inc.", basePrice: 278.45 },
  JNJ: { name: "Johnson & Johnson", basePrice: 156.80 },
  WMT: { name: "Walmart Inc.", basePrice: 165.20 },
  PG: { name: "Procter & Gamble", basePrice: 152.40 },
  DIS: { name: "Walt Disney Co.", basePrice: 112.35 },
  NFLX: { name: "Netflix Inc.", basePrice: 485.60 },
  AMD: { name: "AMD Inc.", basePrice: 142.80 },
};

function generatePrice(basePrice: number): { price: number; change: number; changePercent: number } {
  const changePercent = (Math.random() - 0.5) * 6;
  const change = basePrice * (changePercent / 100);
  const price = basePrice + change;
  return { price, change, changePercent };
}

export default function WatchlistPage() {
  const { isAuthenticated } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
    { symbol: "AAPL", name: "Apple Inc.", ...generatePrice(178.50) },
    { symbol: "GOOGL", name: "Alphabet Inc.", ...generatePrice(141.80) },
    { symbol: "MSFT", name: "Microsoft Corp.", ...generatePrice(378.90) },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const filteredStocks = Object.entries(MOCK_STOCKS)
    .filter(([symbol, data]) => 
      !watchlist.some(w => w.symbol === symbol) &&
      (symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
       data.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const addToWatchlist = (symbol: string) => {
    const stock = MOCK_STOCKS[symbol];
    if (stock) {
      const priceData = generatePrice(stock.basePrice);
      setWatchlist([...watchlist, { symbol, name: stock.name, ...priceData }]);
      setSearchTerm("");
      setShowSearch(false);
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(watchlist.filter(w => w.symbol !== symbol));
  };

  const refreshPrices = () => {
    setWatchlist(watchlist.map(item => {
      const stock = MOCK_STOCKS[item.symbol];
      if (stock) {
        return { ...item, ...generatePrice(stock.basePrice) };
      }
      return item;
    }));
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Watchlist</h1>
        <p className="text-muted-foreground mb-4">Sign in to track your favorite stocks</p>
        <Link href="/login">
          <Button data-testid="button-login-watchlist">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-watchlist-title">
            <Star className="h-8 w-8 text-amber-500" />
            My Watchlist
          </h1>
          <p className="text-muted-foreground mt-1">Track your favorite stocks and monitor price movements</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshPrices} data-testid="button-refresh-prices">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowSearch(!showSearch)} data-testid="button-add-stock">
            <Plus className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
        </div>
      </div>

      {showSearch && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Add Stock to Watchlist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by symbol or company name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-stock"
                />
              </div>
            </div>
            {searchTerm && (
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {filteredStocks.length > 0 ? (
                  filteredStocks.slice(0, 5).map(([symbol, data]) => (
                    <Button
                      key={symbol}
                      variant="ghost"
                      className="flex items-center justify-between w-full h-auto p-2 bg-muted/50"
                      onClick={() => addToWatchlist(symbol)}
                      data-testid={`button-add-${symbol.toLowerCase()}`}
                    >
                      <div className="text-left">
                        <span className="font-semibold">{symbol}</span>
                        <span className="text-muted-foreground ml-2 text-sm">{data.name}</span>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">No stocks found</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {watchlist.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Your watchlist is empty</h3>
            <p className="text-muted-foreground mb-4">Add stocks to start tracking their prices</p>
            <Button onClick={() => setShowSearch(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Stock
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {watchlist.map((item) => (
            <Card key={item.symbol} className="hover-elevate" data-testid={`card-stock-${item.symbol.toLowerCase()}`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">{item.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold" data-testid={`text-symbol-${item.symbol.toLowerCase()}`}>{item.symbol}</h3>
                      <p className="text-sm text-muted-foreground">{item.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xl font-bold" data-testid={`text-price-${item.symbol.toLowerCase()}`}>
                        ${item.price.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-1 justify-end">
                        {item.change >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        <Badge 
                          variant="outline" 
                          className={item.change >= 0 ? "text-success border-success" : "text-destructive border-destructive"}
                        >
                          {item.change >= 0 ? "+" : ""}{item.changePercent.toFixed(2)}%
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromWatchlist(item.symbol)}
                      className="text-muted-foreground"
                      data-testid={`button-remove-${item.symbol.toLowerCase()}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Popular Stocks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(MOCK_STOCKS)
              .filter(([symbol]) => !watchlist.some(w => w.symbol === symbol))
              .slice(0, 8)
              .map(([symbol]) => (
                <Badge
                  key={symbol}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => addToWatchlist(symbol)}
                  data-testid={`badge-add-${symbol.toLowerCase()}`}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {symbol}
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
