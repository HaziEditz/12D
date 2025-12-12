import { PremiumPaywall } from "@/components/paywall";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart,
  Activity,
  Target,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Crown,
  Calendar,
  Percent
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell
} from "recharts";

const performanceData = [
  { month: "Jul", profit: 2400, trades: 45 },
  { month: "Aug", profit: 3200, trades: 52 },
  { month: "Sep", profit: 2800, trades: 38 },
  { month: "Oct", profit: 4100, trades: 61 },
  { month: "Nov", profit: 3600, trades: 48 },
  { month: "Dec", profit: 4800, trades: 55 },
];

const sectorAllocation = [
  { name: "Technology", value: 35, color: "#3b82f6" },
  { name: "Healthcare", value: 20, color: "#10b981" },
  { name: "Finance", value: 18, color: "#f59e0b" },
  { name: "Consumer", value: 15, color: "#8b5cf6" },
  { name: "Energy", value: 12, color: "#ef4444" },
];

const weeklyActivity = [
  { day: "Mon", trades: 12, winRate: 75 },
  { day: "Tue", trades: 8, winRate: 62 },
  { day: "Wed", trades: 15, winRate: 80 },
  { day: "Thu", trades: 10, winRate: 70 },
  { day: "Fri", trades: 6, winRate: 83 },
];

const tradingPatterns = [
  { hour: "9am", success: 72 },
  { hour: "10am", success: 78 },
  { hour: "11am", success: 65 },
  { hour: "12pm", success: 58 },
  { hour: "1pm", success: 62 },
  { hour: "2pm", success: 70 },
  { hour: "3pm", success: 85 },
  { hour: "4pm", success: 68 },
];

function AnalyticsContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-analytics-title">Advanced Analytics</h1>
            <p className="text-muted-foreground">Deep insights into your trading performance</p>
          </div>
          <Badge className="ml-auto bg-gradient-to-r from-amber-500 to-amber-600">
            Premium
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold text-green-500">73.2%</p>
                </div>
                <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-500" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-green-500">
                <ArrowUpRight className="w-3 h-3" />
                <span>+5.2% vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Profit/Trade</p>
                  <p className="text-2xl font-bold">$127.50</p>
                </div>
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-green-500">
                <ArrowUpRight className="w-3 h-3" />
                <span>+$12.30 vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Risk/Reward</p>
                  <p className="text-2xl font-bold">1:2.4</p>
                </div>
                <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-500" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <span>Above target (1:2)</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Trades</p>
                  <p className="text-2xl font-bold">299</p>
                </div>
                <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-amber-500" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-green-500">
                <ArrowUpRight className="w-3 h-3" />
                <span>55 this month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profit Over Time</CardTitle>
              <CardDescription>Monthly profit performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#10b981" 
                      fill="url(#profitGradient)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sector Allocation</CardTitle>
              <CardDescription>Portfolio distribution by sector</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] flex items-center">
                <ResponsiveContainer width="50%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={sectorAllocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {sectorAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {sectorAllocation.map((sector) => (
                    <div key={sector.name} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: sector.color }}
                      />
                      <span>{sector.name}</span>
                      <span className="text-muted-foreground ml-auto">{sector.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weekly Trading Activity</CardTitle>
              <CardDescription>Trades and win rate by day of week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="trades" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Best Trading Hours</CardTitle>
              <CardDescription>Success rate by time of day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tradingPatterns}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" className="text-xs" />
                    <YAxis className="text-xs" domain={[50, 90]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="success" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Trading Insights</CardTitle>
            <CardDescription>Personalized recommendations based on your trading patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-green-700 dark:text-green-400">Strength</span>
                </div>
                <p className="text-sm">Your win rate peaks at 3pm. Consider focusing your trading during market close hours.</p>
              </div>
              <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-amber-700 dark:text-amber-400">Opportunity</span>
                </div>
                <p className="text-sm">Wednesday shows your highest trade volume. Consider scaling positions on high-confidence days.</p>
              </div>
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-blue-700 dark:text-blue-400">Goal</span>
                </div>
                <p className="text-sm">You're on track to hit $5,000 monthly profit. Keep up the consistent execution!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <PremiumPaywall featureName="Advanced Analytics">
      <AnalyticsContent />
    </PremiumPaywall>
  );
}
