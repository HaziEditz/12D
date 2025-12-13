import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { 
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Clock,
  BookOpen,
  Target,
  Shield,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Sparkles
} from "lucide-react";

interface TradingTip {
  id: number;
  title: string;
  content: string;
  category: "strategy" | "psychology" | "risk" | "market";
  difficulty: "beginner" | "intermediate" | "advanced";
  icon: typeof Lightbulb;
}

interface MarketInsight {
  id: number;
  title: string;
  summary: string;
  sentiment: "bullish" | "bearish" | "neutral";
  timestamp: string;
  sector: string;
}

const TRADING_TIPS: TradingTip[] = [
  {
    id: 1,
    title: "Always Use Stop Losses",
    content: "Never enter a trade without a predetermined exit point. Stop losses protect your capital and remove emotional decision-making from your trading. Set your stop loss at a level that invalidates your trade thesis.",
    category: "risk",
    difficulty: "beginner",
    icon: Shield
  },
  {
    id: 2,
    title: "The 1% Rule",
    content: "Never risk more than 1% of your total trading capital on a single trade. This means if you have $10,000, your maximum loss on any trade should be $100. This ensures you can survive a string of losses.",
    category: "risk",
    difficulty: "beginner",
    icon: Target
  },
  {
    id: 3,
    title: "Trade With the Trend",
    content: "The trend is your friend. Trading in the direction of the primary trend increases your probability of success. Use higher timeframes to identify the trend and lower timeframes for entry points.",
    category: "strategy",
    difficulty: "intermediate",
    icon: TrendingUp
  },
  {
    id: 4,
    title: "Control Your Emotions",
    content: "Fear and greed are the two biggest enemies of traders. Stick to your trading plan regardless of how you feel. If you're feeling emotional, step away from the screen.",
    category: "psychology",
    difficulty: "beginner",
    icon: AlertTriangle
  },
  {
    id: 5,
    title: "Keep a Trading Journal",
    content: "Document every trade you make including your reasoning, entry/exit points, and outcome. Review your journal regularly to identify patterns in your trading behavior and areas for improvement.",
    category: "psychology",
    difficulty: "beginner",
    icon: BookOpen
  },
  {
    id: 6,
    title: "Wait for Confirmation",
    content: "Don't jump into trades based on a single signal. Wait for multiple confirmations before entering. This could include price action patterns, volume confirmation, and indicator alignment.",
    category: "strategy",
    difficulty: "intermediate",
    icon: Clock
  },
  {
    id: 7,
    title: "Understand Market Sessions",
    content: "Different trading sessions have different characteristics. The London-New York overlap is typically the most volatile period for forex. Stock markets are most active during the first and last hours of trading.",
    category: "market",
    difficulty: "intermediate",
    icon: TrendingUp
  },
  {
    id: 8,
    title: "Position Sizing Matters",
    content: "Adjust your position size based on the volatility of the asset you're trading. More volatile assets require smaller positions to maintain consistent risk levels across your trades.",
    category: "risk",
    difficulty: "advanced",
    icon: Target
  }
];

const MARKET_INSIGHTS: MarketInsight[] = [
  {
    id: 1,
    title: "Tech Sector Shows Strength",
    summary: "Technology stocks continue to lead market gains as AI adoption accelerates across industries. Major tech companies report strong earnings guidance.",
    sentiment: "bullish",
    timestamp: "2 hours ago",
    sector: "Technology"
  },
  {
    id: 2,
    title: "Fed Rate Decision Impact",
    summary: "Markets await the Federal Reserve's next interest rate decision. Current expectations suggest rates will remain unchanged, providing stability.",
    sentiment: "neutral",
    timestamp: "4 hours ago",
    sector: "Macro"
  },
  {
    id: 3,
    title: "Energy Prices Volatile",
    summary: "Oil prices fluctuate amid geopolitical tensions and supply concerns. Traders should exercise caution with energy sector positions.",
    sentiment: "bearish",
    timestamp: "6 hours ago",
    sector: "Energy"
  },
  {
    id: 4,
    title: "Consumer Spending Strong",
    summary: "Retail sales data exceeds expectations, indicating strong consumer confidence. This bodes well for discretionary spending stocks.",
    sentiment: "bullish",
    timestamp: "8 hours ago",
    sector: "Consumer"
  }
];

export default function TipsPage() {
  const { isAuthenticated } = useAuth();
  const [dailyTip, setDailyTip] = useState<TradingTip>(
    TRADING_TIPS[Math.floor(Math.random() * TRADING_TIPS.length)]
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const refreshDailyTip = () => {
    const newTip = TRADING_TIPS[Math.floor(Math.random() * TRADING_TIPS.length)];
    setDailyTip(newTip);
  };

  const filteredTips = selectedCategory === "all" 
    ? TRADING_TIPS 
    : TRADING_TIPS.filter(tip => tip.category === selectedCategory);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "bullish": return "text-success";
      case "bearish": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-success/10 text-success border-success/20";
      case "intermediate": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "advanced": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "strategy": return "bg-primary/10 text-primary border-primary/20";
      case "psychology": return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "risk": return "bg-destructive/10 text-destructive border-destructive/20";
      case "market": return "bg-success/10 text-success border-success/20";
      default: return "";
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Lightbulb className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Trading Tips & Insights</h1>
        <p className="text-muted-foreground mb-4">Sign in to access trading tips and market insights</p>
        <Link href="/login">
          <Button data-testid="button-login-tips">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-tips-title">
          <Lightbulb className="h-8 w-8 text-amber-500" />
          Trading Tips & Insights
        </h1>
        <p className="text-muted-foreground mt-1">Learn essential trading concepts and stay informed</p>
      </div>

      <Card className="mb-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Daily Trading Tip</CardTitle>
              <p className="text-sm text-muted-foreground">Wisdom for today's trading session</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={refreshDailyTip} data-testid="button-refresh-tip">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <h3 className="text-xl font-semibold mb-2" data-testid="text-daily-tip-title">{dailyTip.title}</h3>
          <p className="text-muted-foreground mb-4" data-testid="text-daily-tip-content">{dailyTip.content}</p>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className={getDifficultyColor(dailyTip.difficulty)}>
              {dailyTip.difficulty}
            </Badge>
            <Badge variant="outline" className={getCategoryColor(dailyTip.category)}>
              {dailyTip.category}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tips" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tips" data-testid="tab-tips">Trading Tips</TabsTrigger>
          <TabsTrigger value="insights" data-testid="tab-insights">Market Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="tips">
          <div className="flex flex-wrap gap-2 mb-6">
            {["all", "strategy", "psychology", "risk", "market"].map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
                data-testid={`button-category-${category}`}
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredTips.map((tip) => {
              const Icon = tip.icon;
              return (
                <Card key={tip.id} className="hover-elevate" data-testid={`card-tip-${tip.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-2">{tip.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{tip.content}</p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline" className={getDifficultyColor(tip.difficulty)}>
                            {tip.difficulty}
                          </Badge>
                          <Badge variant="outline" className={getCategoryColor(tip.category)}>
                            {tip.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid gap-4">
            {MARKET_INSIGHTS.map((insight) => (
              <Card key={insight.id} className="hover-elevate" data-testid={`card-insight-${insight.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="secondary">{insight.sector}</Badge>
                        <span className="text-sm text-muted-foreground">{insight.timestamp}</span>
                      </div>
                      <h3 className="font-semibold mb-2" data-testid={`text-insight-title-${insight.id}`}>{insight.title}</h3>
                      <p className="text-sm text-muted-foreground">{insight.summary}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {insight.sentiment === "bullish" ? (
                        <TrendingUp className={`h-5 w-5 ${getSentimentColor(insight.sentiment)}`} />
                      ) : insight.sentiment === "bearish" ? (
                        <TrendingDown className={`h-5 w-5 ${getSentimentColor(insight.sentiment)}`} />
                      ) : (
                        <ChevronRight className={`h-5 w-5 ${getSentimentColor(insight.sentiment)}`} />
                      )}
                      <Badge 
                        variant="outline" 
                        className={`capitalize ${
                          insight.sentiment === "bullish" 
                            ? "text-success border-success" 
                            : insight.sentiment === "bearish"
                            ? "text-destructive border-destructive"
                            : ""
                        }`}
                      >
                        {insight.sentiment}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <CardContent className="py-8 text-center">
              <TrendingUp className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-semibold mb-1">Want More Insights?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upgrade to Premium for real-time news feed and market analysis
              </p>
              <Link href="/pricing">
                <Button data-testid="button-view-premium">View Premium</Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
