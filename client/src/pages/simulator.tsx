import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { Paywall } from "@/components/paywall";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Activity,
  Clock,
  X,
  Plus,
  Minus
} from "lucide-react";
import { createChart, ColorType, CandlestickData, Time, CandlestickSeries } from "lightweight-charts";
import type { Trade } from "@shared/schema";

const SYMBOLS = [
  // Popular Stocks
  "AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "META", "NVDA", "NFLX",
  // Crypto
  "BTC/USD", "ETH/USD", "SOL/USD", "DOGE/USD",
  // ETFs & Indices  
  "SPY", "QQQ", "DIA",
  // Other Popular Stocks
  "AMD", "DIS", "PYPL", "UBER", "COIN", "BA", "JPM", "V"
];

function generateCandlestickData(count: number): CandlestickData[] {
  const data: CandlestickData[] = [];
  let basePrice = 100 + Math.random() * 50;
  const now = Math.floor(Date.now() / 1000);
  
  for (let i = count; i >= 0; i--) {
    const time = (now - i * 60) as Time;
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * 2 * volatility * basePrice;
    const open = basePrice;
    const close = basePrice + change;
    const high = Math.max(open, close) + Math.random() * volatility * basePrice;
    const low = Math.min(open, close) - Math.random() * volatility * basePrice;
    
    data.push({ time, open, high, low, close });
    basePrice = close;
  }
  
  return data;
}

export default function SimulatorPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<any>(null);
  
  const [selectedSymbol, setSelectedSymbol] = useState("BTC/USD");
  const [quantity, setQuantity] = useState("1");
  const [currentPrice, setCurrentPrice] = useState(0);
  const [timeframe, setTimeframe] = useState("1m");
  const [candleData, setCandleData] = useState<CandlestickData[]>([]);

  const { data: openTrades, refetch: refetchTrades } = useQuery<Trade[]>({
    queryKey: ["/api/trades?open=true"],
  });

  const openTradeMutation = useMutation({
    mutationFn: (data: { symbol: string; type: string; quantity: number; entryPrice: number }) =>
      apiRequest("POST", "/api/trades", data),
    onSuccess: () => {
      refetchTrades();
      refreshUser();
      toast({ title: "Trade opened successfully" });
    },
    onError: () => {
      toast({ title: "Failed to open trade", variant: "destructive" });
    },
  });

  const closeTradeMutation = useMutation({
    mutationFn: ({ id, exitPrice }: { id: string; exitPrice: number }) =>
      apiRequest("PATCH", `/api/trades/${id}/close`, { exitPrice }),
    onSuccess: () => {
      refetchTrades();
      refreshUser();
      toast({ title: "Trade closed" });
    },
    onError: () => {
      toast({ title: "Failed to close trade", variant: "destructive" });
    },
  });

  useEffect(() => {
    const data = generateCandlestickData(100);
    setCandleData(data);
    if (data.length > 0) {
      setCurrentPrice(data[data.length - 1].close);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCandleData(prev => {
        if (prev.length === 0) return prev;
        const lastCandle = prev[prev.length - 1];
        const volatility = 0.005;
        const change = (Math.random() - 0.5) * 2 * volatility * lastCandle.close;
        const newClose = lastCandle.close + change;
        const newHigh = Math.max(lastCandle.high, newClose);
        const newLow = Math.min(lastCandle.low, newClose);
        
        const updatedCandle = {
          ...lastCandle,
          close: newClose,
          high: newHigh,
          low: newLow,
        };
        
        setCurrentPrice(newClose);
        
        const newData = [...prev.slice(0, -1), updatedCandle];
        
        if (seriesRef.current) {
          seriesRef.current.update(updatedCandle);
        }
        
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current || candleData.length === 0) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'hsl(var(--foreground))',
      },
      grid: {
        vertLines: { color: 'hsl(var(--border))' },
        horzLines: { color: 'hsl(var(--border))' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: 'hsl(142, 71%, 45%)',
      downColor: 'hsl(0, 72%, 51%)',
      borderUpColor: 'hsl(142, 71%, 45%)',
      borderDownColor: 'hsl(0, 72%, 51%)',
      wickUpColor: 'hsl(142, 71%, 45%)',
      wickDownColor: 'hsl(0, 72%, 51%)',
    });

    series.setData(candleData);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [candleData.length > 0]);

  const handleBuy = () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast({ title: "Invalid quantity", variant: "destructive" });
      return;
    }
    openTradeMutation.mutate({
      symbol: selectedSymbol,
      type: "buy",
      quantity: qty,
      entryPrice: currentPrice,
    });
  };

  const handleSell = () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast({ title: "Invalid quantity", variant: "destructive" });
      return;
    }
    openTradeMutation.mutate({
      symbol: selectedSymbol,
      type: "sell",
      quantity: qty,
      entryPrice: currentPrice,
    });
  };

  const totalProfit = openTrades?.reduce((sum, trade) => {
    const pnl = trade.type === "buy" 
      ? (currentPrice - trade.entryPrice) * trade.quantity
      : (trade.entryPrice - currentPrice) * trade.quantity;
    return sum + pnl;
  }, 0) ?? 0;

  return (
    <Paywall featureName="the Trading Simulator">
      <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-4 p-4">
      <div className="flex-1 flex flex-col gap-4">
        <Card className="flex-shrink-0">
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                  <SelectTrigger className="w-[180px]" data-testid="select-symbol">
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Popular Stocks</SelectLabel>
                      <SelectItem value="AAPL">AAPL - Apple</SelectItem>
                      <SelectItem value="GOOGL">GOOGL - Google</SelectItem>
                      <SelectItem value="MSFT">MSFT - Microsoft</SelectItem>
                      <SelectItem value="AMZN">AMZN - Amazon</SelectItem>
                      <SelectItem value="TSLA">TSLA - Tesla</SelectItem>
                      <SelectItem value="META">META - Meta</SelectItem>
                      <SelectItem value="NVDA">NVDA - Nvidia</SelectItem>
                      <SelectItem value="NFLX">NFLX - Netflix</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Crypto</SelectLabel>
                      <SelectItem value="BTC/USD">BTC - Bitcoin</SelectItem>
                      <SelectItem value="ETH/USD">ETH - Ethereum</SelectItem>
                      <SelectItem value="SOL/USD">SOL - Solana</SelectItem>
                      <SelectItem value="DOGE/USD">DOGE - Dogecoin</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>ETFs & Indices</SelectLabel>
                      <SelectItem value="SPY">SPY - S&P 500</SelectItem>
                      <SelectItem value="QQQ">QQQ - Nasdaq 100</SelectItem>
                      <SelectItem value="DIA">DIA - Dow Jones</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>More Stocks</SelectLabel>
                      <SelectItem value="AMD">AMD - AMD</SelectItem>
                      <SelectItem value="DIS">DIS - Disney</SelectItem>
                      <SelectItem value="PYPL">PYPL - PayPal</SelectItem>
                      <SelectItem value="UBER">UBER - Uber</SelectItem>
                      <SelectItem value="COIN">COIN - Coinbase</SelectItem>
                      <SelectItem value="BA">BA - Boeing</SelectItem>
                      <SelectItem value="JPM">JPM - JPMorgan</SelectItem>
                      <SelectItem value="V">V - Visa</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <Tabs value={timeframe} onValueChange={setTimeframe}>
                <TabsList>
                  <TabsTrigger value="1m">1m</TabsTrigger>
                  <TabsTrigger value="5m">5m</TabsTrigger>
                  <TabsTrigger value="1h">1h</TabsTrigger>
                  <TabsTrigger value="1d">1d</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 min-h-0">
          <CardContent className="p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedSymbol}</h2>
                <div className="flex items-center gap-2">
                  <span className={`text-3xl font-bold ${candleData.length > 0 && candleData[candleData.length - 1].close >= candleData[candleData.length - 1].open ? 'text-success' : 'text-destructive'}`}>
                    ${currentPrice.toFixed(2)}
                  </span>
                  {candleData.length > 1 && (
                    <Badge variant={candleData[candleData.length - 1].close >= candleData[candleData.length - 2].close ? "default" : "destructive"}>
                      {candleData[candleData.length - 1].close >= candleData[candleData.length - 2].close ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {(((candleData[candleData.length - 1].close - candleData[candleData.length - 2].close) / candleData[candleData.length - 2].close) * 100).toFixed(2)}%
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4 text-success animate-pulse" />
                Live
              </div>
            </div>
            <div ref={chartContainerRef} className="w-full h-[400px]" data-testid="chart-container" />
          </CardContent>
        </Card>
      </div>

      <div className="w-full lg:w-80 flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Your Virtual Money
            </CardTitle>
            <CardDescription>Practice with fake money - no real risk!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available Balance</span>
              <span className="font-bold text-lg" data-testid="text-balance">
                ${(user?.simulatorBalance ?? 10000).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-muted-foreground">Open Trade Value</span>
                <p className="text-xs text-muted-foreground">(profit/loss if closed now)</p>
              </div>
              <span className={`font-semibold ${totalProfit >= 0 ? 'text-success' : 'text-destructive'}`} data-testid="text-pnl">
                {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Place a Trade</CardTitle>
            <CardDescription>
              Buy if you think price will go up. Sell if you think it will go down.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">How many units?</label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setQuantity(prev => String(Math.max(0.1, parseFloat(prev) - 0.1).toFixed(1)))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="text-center"
                  step="0.1"
                  min="0.1"
                  data-testid="input-quantity"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setQuantity(prev => String((parseFloat(prev) + 0.1).toFixed(1)))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground text-center">
              Total: ${(parseFloat(quantity || "0") * currentPrice).toFixed(2)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                className="bg-success hover:bg-success/90 text-success-foreground"
                onClick={handleBuy}
                disabled={openTradeMutation.isPending}
                data-testid="button-buy"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Buy (Long)
              </Button>
              <Button 
                variant="destructive"
                onClick={handleSell}
                disabled={openTradeMutation.isPending}
                data-testid="button-sell"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Sell (Short)
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Tip: After placing a trade, close it from "Your Active Trades" below to lock in profits or cut losses.
            </p>
          </CardContent>
        </Card>

        <Card className="flex-1 min-h-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Your Active Trades</CardTitle>
            <CardDescription>
              {openTrades?.length ?? 0} open - Click "Close Trade" to finish and collect your profit/loss
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-60 overflow-y-auto">
            {(!openTrades || openTrades.length === 0) ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-2">No trades yet</p>
                <p className="text-xs text-muted-foreground">Place your first trade above to get started!</p>
              </div>
            ) : (
              openTrades.map((trade) => {
                const pnl = trade.type === "buy"
                  ? (currentPrice - trade.entryPrice) * trade.quantity
                  : (trade.entryPrice - currentPrice) * trade.quantity;
                return (
                  <div 
                    key={trade.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    data-testid={`position-${trade.id}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={trade.type === "buy" ? "default" : "destructive"} className="text-xs">
                          {trade.type.toUpperCase()}
                        </Badge>
                        <span className="font-medium text-sm">{trade.symbol}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {trade.quantity} @ ${trade.entryPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mb-1">
                        {pnl >= 0 ? 'Profit' : 'Loss'}
                      </p>
                      <Button
                        variant={pnl >= 0 ? "default" : "destructive"}
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={() => closeTradeMutation.mutate({ id: trade.id, exitPrice: currentPrice })}
                        data-testid={`button-close-${trade.id}`}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Close Trade
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </Paywall>
  );
}
