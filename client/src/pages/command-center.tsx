import { PremiumPaywall } from "@/components/paywall";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Crown, 
  TrendingUp, 
  TrendingDown, 
  Star,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Eye,
  RefreshCw
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, CandlestickSeries } from "lightweight-charts";

const watchlistStocks = [
  { symbol: "AAPL", name: "Apple Inc.", price: 189.43, change: 2.34, changePercent: 1.25, volume: "52.3M" },
  { symbol: "MSFT", name: "Microsoft", price: 378.91, change: 4.12, changePercent: 1.10, volume: "28.1M" },
  { symbol: "GOOGL", name: "Alphabet", price: 141.80, change: -1.23, changePercent: -0.86, volume: "21.7M" },
  { symbol: "AMZN", name: "Amazon", price: 178.25, change: 3.45, changePercent: 1.97, volume: "45.2M" },
  { symbol: "NVDA", name: "NVIDIA", price: 495.22, change: 12.45, changePercent: 2.58, volume: "41.8M" },
  { symbol: "TSLA", name: "Tesla", price: 248.50, change: -5.30, changePercent: -2.09, volume: "98.4M" },
  { symbol: "META", name: "Meta", price: 505.95, change: 8.20, changePercent: 1.65, volume: "15.3M" },
  { symbol: "JPM", name: "JPMorgan", price: 195.40, change: 1.85, changePercent: 0.96, volume: "8.7M" },
];

const marketOverview = [
  { name: "S&P 500", value: "4,783.45", change: "+0.82%", up: true },
  { name: "NASDAQ", value: "15,095.14", change: "+1.12%", up: true },
  { name: "DOW", value: "37,545.33", change: "+0.45%", up: true },
  { name: "VIX", value: "12.45", change: "-3.21%", up: false },
];

function generateCandlestickData(basePrice: number, days: number) {
  const data = [];
  let currentPrice = basePrice;
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const volatility = 0.02;
    const trend = Math.random() > 0.45 ? 1 : -1;
    const change = currentPrice * volatility * Math.random() * trend;
    
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.abs(change) * Math.random();
    const low = Math.min(open, close) - Math.abs(change) * Math.random();
    
    data.push({
      time: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
    });
    
    currentPrice = close;
  }
  
  return data;
}

function MiniChart({ symbol, basePrice }: { symbol: string; basePrice: number }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(156, 163, 175, 0.9)',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.3)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.3)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 180,
      timeScale: {
        borderColor: 'rgba(42, 46, 57, 0.5)',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: 'rgba(42, 46, 57, 0.5)',
      },
      crosshair: {
        mode: 0,
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    });

    const data = generateCandlestickData(basePrice, 60);
    candlestickSeries.setData(data);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [basePrice]);

  return <div ref={chartContainerRef} className="w-full" />;
}

function CommandCenterContent() {
  const { user } = useAuth();
  const [selectedSymbols, setSelectedSymbols] = useState(["AAPL", "MSFT", "NVDA", "TSLA"]);
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("100");
  const [quickTradeSymbol, setQuickTradeSymbol] = useState("AAPL");

  const selectedStocks = watchlistStocks.filter(s => selectedSymbols.includes(s.symbol));

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" data-testid="text-command-center-title">Command Center</h1>
              <p className="text-xs text-muted-foreground">Professional Trading Terminal</p>
            </div>
            <Badge className="bg-gradient-to-r from-amber-500 to-amber-600">Premium</Badge>
          </div>
          
          <div className="flex items-center gap-6">
            {marketOverview.map((market) => (
              <div key={market.name} className="text-center">
                <p className="text-xs text-muted-foreground">{market.name}</p>
                <p className="font-mono font-semibold">{market.value}</p>
                <p className={`text-xs font-medium ${market.up ? "text-green-500" : "text-red-500"}`}>
                  {market.change}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-3">
            <Card className="h-full">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Watchlist
                  </CardTitle>
                  <Button size="icon" variant="ghost" className="h-6 w-6" data-testid="button-add-watchlist">
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {watchlistStocks.map((stock) => {
                    const isSelected = selectedSymbols.includes(stock.symbol);
                    const isUp = stock.change >= 0;
                    return (
                      <div
                        key={stock.symbol}
                        className={`px-4 py-2 hover-elevate cursor-pointer ${isSelected ? "bg-muted/50" : ""}`}
                        onClick={() => {
                          if (selectedSymbols.length < 4 || isSelected) {
                            setSelectedSymbols(
                              isSelected
                                ? selectedSymbols.filter(s => s !== stock.symbol)
                                : [...selectedSymbols.slice(-3), stock.symbol]
                            );
                          }
                        }}
                        data-testid={`watchlist-item-${stock.symbol}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {isSelected && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                            <div>
                              <p className="font-semibold text-sm">{stock.symbol}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[100px]">{stock.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm">${stock.price.toFixed(2)}</p>
                            <div className={`flex items-center gap-1 text-xs ${isUp ? "text-green-500" : "text-red-500"}`}>
                              {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              <span>{isUp ? "+" : ""}{stock.changePercent.toFixed(2)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <div className="grid grid-cols-2 gap-4">
              {selectedStocks.slice(0, 4).map((stock) => (
                <Card key={stock.symbol} className="overflow-hidden">
                  <CardHeader className="py-2 px-3 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{stock.symbol}</span>
                        <Badge variant="outline" className="text-xs">
                          {stock.volume}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">${stock.price.toFixed(2)}</span>
                        <span className={`text-xs font-medium ${stock.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {stock.change >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <MiniChart symbol={stock.symbol} basePrice={stock.price} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-3">
            <div className="space-y-4">
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Quick Trade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Symbol</label>
                    <select
                      value={quickTradeSymbol}
                      onChange={(e) => setQuickTradeSymbol(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                      data-testid="select-trade-symbol"
                    >
                      {watchlistStocks.map((stock) => (
                        <option key={stock.symbol} value={stock.symbol}>
                          {stock.symbol} - ${stock.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={orderType === "buy" ? "default" : "outline"}
                      className={orderType === "buy" ? "bg-green-600 hover:bg-green-700" : ""}
                      onClick={() => setOrderType("buy")}
                      data-testid="button-buy"
                    >
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Buy
                    </Button>
                    <Button
                      variant={orderType === "sell" ? "default" : "outline"}
                      className={orderType === "sell" ? "bg-red-600 hover:bg-red-700" : ""}
                      onClick={() => setOrderType("sell")}
                      data-testid="button-sell"
                    >
                      <TrendingDown className="w-4 h-4 mr-1" />
                      Sell
                    </Button>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Quantity</label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="font-mono"
                      data-testid="input-quantity"
                    />
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Estimated Cost</span>
                      <span className="font-mono font-semibold">
                        ${(parseFloat(quantity || "0") * (watchlistStocks.find(s => s.symbol === quickTradeSymbol)?.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Commission</span>
                      <span className="font-mono text-green-500">$0.00</span>
                    </div>
                  </div>

                  <Button 
                    className={`w-full ${orderType === "buy" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                    data-testid="button-execute-trade"
                  >
                    {orderType === "buy" ? "Buy" : "Sell"} {quickTradeSymbol}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs space-y-2">
                    <div className="flex items-center justify-between p-2 bg-green-500/10 rounded">
                      <span>BUY AAPL x50</span>
                      <span className="text-green-500">+$9,471.50</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-red-500/10 rounded">
                      <span>SELL TSLA x25</span>
                      <span className="text-red-500">-$6,212.50</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-500/10 rounded">
                      <span>BUY NVDA x10</span>
                      <span className="text-green-500">+$4,952.20</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center justify-between gap-4 text-sm overflow-x-auto">
                <div className="flex items-center gap-6 min-w-0">
                  <span className="text-muted-foreground whitespace-nowrap">Market Status:</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                    Open
                  </Badge>
                  <span className="text-muted-foreground whitespace-nowrap">|</span>
                  <span className="whitespace-nowrap">Available Balance: <span className="font-semibold text-green-500">${user?.simulatorBalance?.toLocaleString() ?? "10,000"}</span></span>
                  <span className="text-muted-foreground whitespace-nowrap">|</span>
                  <span className="whitespace-nowrap">Buying Power: <span className="font-semibold">${((user?.simulatorBalance ?? 10000) * 2).toLocaleString()}</span></span>
                  <span className="text-muted-foreground whitespace-nowrap">|</span>
                  <span className="whitespace-nowrap">Day's P&L: <span className="font-semibold text-green-500">+$1,245.50</span></span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CommandCenterPage() {
  return (
    <PremiumPaywall featureName="Command Center">
      <CommandCenterContent />
    </PremiumPaywall>
  );
}
