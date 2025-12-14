import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { Paywall } from "@/components/paywall";
import { Link } from "wouter";
import { playTradeSound } from "@/lib/sounds";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Activity,
  Clock,
  X,
  Plus,
  Minus,
  AlertCircle,
  Sparkles,
  Target,
  Shield,
  Percent,
  Layers
} from "lucide-react";
import { createChart, ColorType, CandlestickData, Time, CandlestickSeries } from "lightweight-charts";
import type { Trade } from "@shared/schema";

type OrderType = "market" | "limit" | "stop" | "stop_loss" | "take_profit" | "trailing_stop" | "oco";

const ORDER_TYPE_INFO: Record<OrderType, { label: string; description: string; icon: typeof Target }> = {
  market: { label: "Market", description: "Execute immediately at current price", icon: Activity },
  limit: { label: "Limit", description: "Buy below or sell above a target price", icon: Target },
  stop: { label: "Stop", description: "Buy above or sell below a trigger price", icon: AlertCircle },
  stop_loss: { label: "Stop Loss", description: "Auto-close if price drops to limit losses", icon: Shield },
  take_profit: { label: "Take Profit", description: "Auto-close when price reaches profit target", icon: TrendingUp },
  trailing_stop: { label: "Trailing Stop", description: "Dynamic stop that follows price movement", icon: Percent },
  oco: { label: "OCO", description: "One-Cancels-Other: combines stop loss and take profit", icon: Layers },
};

interface TradeLimits {
  isLimited: boolean;
  remaining: number;
  limit: number;
  used: number;
}

interface TriggerResponse {
  executed: number;
  closed: number;
  closedTrades?: Trade[];
}

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

const SYMBOL_BASE_PRICES: Record<string, number> = {
  AAPL: 195.00,
  GOOGL: 175.00,
  MSFT: 430.00,
  AMZN: 220.00,
  TSLA: 420.00,
  META: 590.00,
  NVDA: 140.00,
  NFLX: 900.00,
  "BTC/USD": 102000.00,
  "ETH/USD": 3900.00,
  "SOL/USD": 225.00,
  "DOGE/USD": 0.42,
  SPY: 605.00,
  QQQ: 525.00,
  DIA: 440.00,
  AMD: 125.00,
  DIS: 115.00,
  PYPL: 90.00,
  UBER: 65.00,
  COIN: 320.00,
  BA: 175.00,
  JPM: 245.00,
  V: 315.00,
};

function generateCandlestickData(count: number, symbol: string): CandlestickData[] {
  const data: CandlestickData[] = [];
  const symbolBasePrice = SYMBOL_BASE_PRICES[symbol] ?? 100;
  let basePrice = symbolBasePrice * (0.98 + Math.random() * 0.04);
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
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [triggerPrice, setTriggerPrice] = useState("");
  const [stopLossPrice, setStopLossPrice] = useState("");
  const [takeProfitPrice, setTakeProfitPrice] = useState("");
  const [trailingPercent, setTrailingPercent] = useState("5");

  const { data: openTrades, refetch: refetchTrades } = useQuery<Trade[]>({
    queryKey: ["/api/trades?open=true"],
  });

  const { data: tradeLimits, refetch: refetchLimits } = useQuery<TradeLimits>({
    queryKey: ["/api/trades/limits"],
  });

  const openTradeMutation = useMutation({
    mutationFn: (data: { 
      symbol: string; 
      type: string; 
      quantity: number; 
      entryPrice: number;
      orderType?: string;
      triggerPrice?: number;
      stopLossPrice?: number;
      takeProfitPrice?: number;
      trailingPercent?: number;
    }) => apiRequest("POST", "/api/trades", data),
    onSuccess: (_, variables) => {
      refetchTrades();
      refetchLimits();
      refreshUser();
      playTradeSound();
      const isPending = variables.orderType && variables.orderType !== "market";
      toast({ 
        title: isPending ? "Order placed successfully" : "Trade opened successfully",
        description: isPending ? "Your order will execute when the price target is reached" : undefined
      });
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to open trade";
      toast({ title: message, variant: "destructive" });
    },
  });

  const closeTradeMutation = useMutation({
    mutationFn: ({ id, exitPrice }: { id: string; exitPrice: number }) =>
      apiRequest("PATCH", `/api/trades/${id}/close`, { exitPrice }),
    onSuccess: () => {
      refetchTrades();
      refreshUser();
      playTradeSound();
      toast({ title: "Trade closed" });
    },
    onError: () => {
      toast({ title: "Failed to close trade", variant: "destructive" });
    },
  });

  const cancelTradeMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/trades/${id}/cancel`),
    onSuccess: () => {
      refetchTrades();
      toast({ title: "Order cancelled" });
    },
    onError: () => {
      toast({ title: "Failed to cancel order", variant: "destructive" });
    },
  });

  // Store prices for all symbols for trigger checking
  const pricesRef = useRef<Record<string, number>>({});
  
  // Update price ref whenever currentPrice changes
  useEffect(() => {
    if (currentPrice > 0) {
      pricesRef.current[selectedSymbol] = currentPrice;
    }
  }, [currentPrice, selectedSymbol]);

  // Check pending order triggers periodically
  useEffect(() => {
    const checkTriggers = async () => {
      if (Object.keys(pricesRef.current).length === 0) return;
      
      try {
        const response = await apiRequest("POST", "/api/trades/check-triggers", {
          prices: pricesRef.current
        }) as TriggerResponse;
        
        if (response.executed > 0) {
          refetchTrades();
          refreshUser();
          playTradeSound();
          toast({ 
            title: `${response.executed} order${response.executed > 1 ? 's' : ''} executed`,
            description: "Your pending order(s) have been triggered"
          });
        }
        
        if (response.closed > 0) {
          refetchTrades();
          refreshUser();
          playTradeSound();
          const exitReasons = response.closedTrades?.map((t) => {
            if (t.orderType === "trailing_stop") return "Trailing Stop";
            if (t.takeProfitPrice && t.exitPrice && t.exitPrice >= t.takeProfitPrice) return "Take Profit";
            if (t.stopLossPrice) return "Stop Loss";
            return "Auto-close";
          });
          toast({ 
            title: `${response.closed} trade${response.closed > 1 ? 's' : ''} closed`,
            description: exitReasons?.join(", ") || "Exit conditions met"
          });
        }
      } catch (error) {
        // Silently fail - this runs in background
      }
    };

    // Check triggers every 2 seconds
    const interval = setInterval(checkTriggers, 2000);
    return () => clearInterval(interval);
  }, [refetchTrades, refreshUser, toast]);

  // Generate fresh chart data and create chart when symbol changes
  useEffect(() => {
    // Generate fresh data for this symbol with realistic base price
    const data = generateCandlestickData(100, selectedSymbol);
    setCandleData(data);
    if (data.length > 0) {
      setCurrentPrice(data[data.length - 1].close);
    }

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    // Use requestAnimationFrame to ensure DOM is ready
    const createChartInstance = () => {
      if (!chartContainerRef.current) return;

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

      series.setData(data);
      chart.timeScale().fitContent();

      chartRef.current = chart;
      seriesRef.current = series;
    };

    const animationId = requestAnimationFrame(createChartInstance);

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [selectedSymbol]);

  // Live price updates - only updates existing candles, doesn't recreate chart
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
  }, [selectedSymbol]);

  const buildTradePayload = (type: "buy" | "sell") => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast({ title: "Invalid quantity", variant: "destructive" });
      return null;
    }

    const payload: {
      symbol: string;
      type: string;
      quantity: number;
      entryPrice: number;
      orderType?: string;
      triggerPrice?: number;
      stopLossPrice?: number;
      takeProfitPrice?: number;
      trailingPercent?: number;
    } = {
      symbol: selectedSymbol,
      type,
      quantity: qty,
      entryPrice: currentPrice,
      orderType,
    };

    if (orderType === "limit" || orderType === "stop") {
      const trigger = parseFloat(triggerPrice);
      if (isNaN(trigger) || trigger <= 0) {
        toast({ title: "Please enter a valid trigger price", variant: "destructive" });
        return null;
      }
      payload.triggerPrice = trigger;
    }

    if (orderType === "stop_loss") {
      const sl = parseFloat(stopLossPrice);
      if (isNaN(sl) || sl <= 0) {
        toast({ title: "Please enter a valid stop loss price", variant: "destructive" });
        return null;
      }
      payload.stopLossPrice = sl;
    }

    if (orderType === "take_profit") {
      const tp = parseFloat(takeProfitPrice);
      if (isNaN(tp) || tp <= 0) {
        toast({ title: "Please enter a valid take profit price", variant: "destructive" });
        return null;
      }
      payload.takeProfitPrice = tp;
    }

    if (orderType === "trailing_stop") {
      const trail = parseFloat(trailingPercent);
      if (isNaN(trail) || trail <= 0 || trail > 50) {
        toast({ title: "Please enter a valid trailing percentage (1-50%)", variant: "destructive" });
        return null;
      }
      payload.trailingPercent = trail;
    }

    if (orderType === "oco") {
      const sl = parseFloat(stopLossPrice);
      const tp = parseFloat(takeProfitPrice);
      if (isNaN(sl) || sl <= 0) {
        toast({ title: "Please enter a valid stop loss price", variant: "destructive" });
        return null;
      }
      if (isNaN(tp) || tp <= 0) {
        toast({ title: "Please enter a valid take profit price", variant: "destructive" });
        return null;
      }
      payload.stopLossPrice = sl;
      payload.takeProfitPrice = tp;
    }

    return payload;
  };

  const handleBuy = () => {
    const payload = buildTradePayload("buy");
    if (payload) {
      openTradeMutation.mutate(payload);
    }
  };

  const handleSell = () => {
    const payload = buildTradePayload("sell");
    if (payload) {
      openTradeMutation.mutate(payload);
    }
  };

  const resetOrderForm = () => {
    setOrderType("market");
    setTriggerPrice("");
    setStopLossPrice("");
    setTakeProfitPrice("");
    setTrailingPercent("5");
  };

  // Only calculate profit for trades of the currently selected symbol
  // to avoid incorrect calculations when viewing different symbols
  const totalProfit = openTrades?.reduce((sum, trade) => {
    if (trade.status === "pending") return sum;
    // Only include trades for the currently selected symbol
    if (trade.symbol !== selectedSymbol) return sum;
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
            {tradeLimits?.isLimited && (
              <div className="mt-2">
                {tradeLimits.remaining > 0 ? (
                  <Badge variant="secondary" className="text-xs">
                    Demo: {tradeLimits.remaining}/{tradeLimits.limit} trades left today
                  </Badge>
                ) : (
                  <Alert className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Daily limit reached. 
                      <Link href="/pricing" className="text-primary font-medium ml-1">
                        Upgrade for unlimited trades
                      </Link>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Order Type</Label>
              <Select value={orderType} onValueChange={(value) => setOrderType(value as OrderType)}>
                <SelectTrigger data-testid="select-order-type">
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(ORDER_TYPE_INFO) as [OrderType, typeof ORDER_TYPE_INFO["market"]][]).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <info.icon className="h-4 w-4" />
                        <span>{info.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {ORDER_TYPE_INFO[orderType].description}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">How many units?</Label>
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

            {(orderType === "limit" || orderType === "stop") && (
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  {orderType === "limit" ? "Limit Price" : "Stop Price"} ($)
                </Label>
                <Input
                  type="number"
                  value={triggerPrice}
                  onChange={(e) => setTriggerPrice(e.target.value)}
                  placeholder={`Enter ${orderType} price`}
                  step="0.01"
                  min="0"
                  data-testid="input-trigger-price"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {orderType === "limit" 
                    ? "Order executes when price reaches this level" 
                    : "Order triggers when price breaks this level"}
                </p>
              </div>
            )}

            {orderType === "stop_loss" && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Stop Loss Price ($)</Label>
                <Input
                  type="number"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(e.target.value)}
                  placeholder="Enter stop loss price"
                  step="0.01"
                  min="0"
                  data-testid="input-stop-loss"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Position closes automatically if price drops to this level
                </p>
              </div>
            )}

            {orderType === "take_profit" && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Take Profit Price ($)</Label>
                <Input
                  type="number"
                  value={takeProfitPrice}
                  onChange={(e) => setTakeProfitPrice(e.target.value)}
                  placeholder="Enter take profit price"
                  step="0.01"
                  min="0"
                  data-testid="input-take-profit"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Position closes automatically when price reaches this target
                </p>
              </div>
            )}

            {orderType === "trailing_stop" && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Trailing Percentage (%)</Label>
                <Input
                  type="number"
                  value={trailingPercent}
                  onChange={(e) => setTrailingPercent(e.target.value)}
                  placeholder="Enter trailing %"
                  step="0.5"
                  min="0.5"
                  max="50"
                  data-testid="input-trailing-percent"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Stop follows price up, triggers if price drops by this percentage
                </p>
              </div>
            )}

            {orderType === "oco" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Stop Loss Price ($)</Label>
                  <Input
                    type="number"
                    value={stopLossPrice}
                    onChange={(e) => setStopLossPrice(e.target.value)}
                    placeholder="Enter stop loss price"
                    step="0.01"
                    min="0"
                    data-testid="input-oco-stop-loss"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Take Profit Price ($)</Label>
                  <Input
                    type="number"
                    value={takeProfitPrice}
                    onChange={(e) => setTakeProfitPrice(e.target.value)}
                    placeholder="Enter take profit price"
                    step="0.01"
                    min="0"
                    data-testid="input-oco-take-profit"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  First target hit closes position and cancels the other order
                </p>
              </div>
            )}

            <div className="text-sm text-muted-foreground text-center">
              Total: ${(parseFloat(quantity || "0") * currentPrice).toFixed(2)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                className="bg-success hover:bg-success/90 text-success-foreground"
                onClick={handleBuy}
                disabled={openTradeMutation.isPending || (tradeLimits?.isLimited && tradeLimits.remaining <= 0)}
                data-testid="button-buy"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {orderType === "market" ? "Buy (Long)" : "Place Buy"}
              </Button>
              <Button 
                variant="destructive"
                onClick={handleSell}
                disabled={openTradeMutation.isPending || (tradeLimits?.isLimited && tradeLimits.remaining <= 0)}
                data-testid="button-sell"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                {orderType === "market" ? "Sell (Short)" : "Place Sell"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {orderType === "market" 
                ? "Tip: After placing a trade, close it from \"Your Active Trades\" below to lock in profits or cut losses."
                : "Pending orders will execute automatically when your price target is reached."}
            </p>
          </CardContent>
        </Card>

        <Card className="flex-1 min-h-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Your Active Trades</CardTitle>
            <CardDescription>
              {openTrades?.length ?? 0} position{(openTrades?.length ?? 0) !== 1 ? 's' : ''} - Manage your open and pending orders
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
                const isPending = trade.status === "pending";
                const pnl = trade.type === "buy"
                  ? (currentPrice - trade.entryPrice) * trade.quantity
                  : (trade.entryPrice - currentPrice) * trade.quantity;
                const orderTypeLabel = trade.orderType ? ORDER_TYPE_INFO[trade.orderType as OrderType]?.label || trade.orderType : "Market";
                
                return (
                  <div 
                    key={trade.id} 
                    className={`flex items-center justify-between p-3 rounded-lg ${isPending ? 'bg-muted/30 border border-dashed' : 'bg-muted/50'}`}
                    data-testid={`position-${trade.id}`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant={trade.type === "buy" ? "default" : "destructive"} className="text-xs">
                          {trade.type.toUpperCase()}
                        </Badge>
                        {trade.orderType && trade.orderType !== "market" && (
                          <Badge variant="outline" className="text-xs">
                            {orderTypeLabel}
                          </Badge>
                        )}
                        {isPending && (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                      <span className="font-medium text-sm block mt-1">{trade.symbol}</span>
                      <p className="text-xs text-muted-foreground">
                        {trade.quantity} @ ${trade.entryPrice.toFixed(2)}
                      </p>
                      {isPending && (
                        <p className="text-xs text-muted-foreground">
                          {trade.triggerPrice && `Trigger: $${trade.triggerPrice.toFixed(2)}`}
                          {trade.stopLossPrice && `SL: $${trade.stopLossPrice.toFixed(2)}`}
                          {trade.takeProfitPrice && ` TP: $${trade.takeProfitPrice.toFixed(2)}`}
                          {trade.trailingPercent && `Trail: ${trade.trailingPercent}%`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {!isPending && (
                        <>
                          <p className={`font-semibold text-sm ${pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground mb-1">
                            {pnl >= 0 ? 'Profit' : 'Loss'}
                          </p>
                        </>
                      )}
                      {isPending ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-3 text-xs"
                          onClick={() => cancelTradeMutation.mutate(trade.id)}
                          disabled={cancelTradeMutation.isPending}
                          data-testid={`button-cancel-${trade.id}`}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      ) : (
                        <Button
                          variant={pnl >= 0 ? "default" : "destructive"}
                          size="sm"
                          className="h-7 px-3 text-xs"
                          onClick={() => closeTradeMutation.mutate({ id: trade.id, exitPrice: currentPrice })}
                          data-testid={`button-close-${trade.id}`}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Close
                        </Button>
                      )}
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
