import { PremiumPaywall } from "@/components/paywall";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Crown, 
  Calendar,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Bell,
  Globe
} from "lucide-react";
import { useState } from "react";

interface EconomicEvent {
  id: number;
  date: string;
  time: string;
  event: string;
  country: string;
  impact: "high" | "medium" | "low";
  previous: string;
  forecast: string;
  actual?: string;
}

const mockEvents: EconomicEvent[] = [
  {
    id: 1,
    date: "2024-12-13",
    time: "08:30",
    event: "Consumer Price Index (CPI) MoM",
    country: "US",
    impact: "high",
    previous: "0.2%",
    forecast: "0.3%",
    actual: "0.3%"
  },
  {
    id: 2,
    date: "2024-12-13",
    time: "08:30",
    event: "Core CPI MoM",
    country: "US",
    impact: "high",
    previous: "0.3%",
    forecast: "0.3%",
    actual: "0.2%"
  },
  {
    id: 3,
    date: "2024-12-13",
    time: "10:00",
    event: "Retail Sales MoM",
    country: "US",
    impact: "medium",
    previous: "0.4%",
    forecast: "0.3%"
  },
  {
    id: 4,
    date: "2024-12-14",
    time: "09:45",
    event: "Manufacturing PMI",
    country: "US",
    impact: "medium",
    previous: "49.4",
    forecast: "49.8"
  },
  {
    id: 5,
    date: "2024-12-14",
    time: "09:45",
    event: "Services PMI",
    country: "US",
    impact: "medium",
    previous: "50.8",
    forecast: "50.5"
  },
  {
    id: 6,
    date: "2024-12-15",
    time: "02:00",
    event: "GDP Growth Rate QoQ",
    country: "UK",
    impact: "high",
    previous: "0.0%",
    forecast: "0.1%"
  },
  {
    id: 7,
    date: "2024-12-16",
    time: "14:00",
    event: "Fed Interest Rate Decision",
    country: "US",
    impact: "high",
    previous: "5.50%",
    forecast: "5.50%"
  },
  {
    id: 8,
    date: "2024-12-16",
    time: "14:30",
    event: "FOMC Press Conference",
    country: "US",
    impact: "high",
    previous: "-",
    forecast: "-"
  },
  {
    id: 9,
    date: "2024-12-17",
    time: "08:30",
    event: "Building Permits",
    country: "US",
    impact: "low",
    previous: "1.49M",
    forecast: "1.52M"
  },
  {
    id: 10,
    date: "2024-12-18",
    time: "07:00",
    event: "Unemployment Rate",
    country: "UK",
    impact: "medium",
    previous: "4.2%",
    forecast: "4.3%"
  },
];

const getImpactColor = (impact: string) => {
  switch (impact) {
    case "high": return "bg-red-500";
    case "medium": return "bg-amber-500";
    case "low": return "bg-green-500";
    default: return "bg-muted";
  }
};

const getImpactBadge = (impact: string) => {
  switch (impact) {
    case "high": return "bg-red-500/10 text-red-500 border-red-500/20";
    case "medium": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "low": return "bg-green-500/10 text-green-500 border-green-500/20";
    default: return "";
  }
};

function EventRow({ event }: { event: EconomicEvent }) {
  const isActualBetter = event.actual && parseFloat(event.actual) > parseFloat(event.forecast);
  const isActualWorse = event.actual && parseFloat(event.actual) < parseFloat(event.forecast);

  return (
    <div className="flex items-center gap-4 p-4 border-b last:border-b-0 hover-elevate" data-testid={`event-${event.id}`}>
      <div className={`w-2 h-10 rounded-full ${getImpactColor(event.impact)}`} />
      <div className="w-16 text-center">
        <p className="font-mono text-sm font-semibold">{event.time}</p>
        <p className="text-xs text-muted-foreground">{event.country}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{event.event}</p>
        <Badge variant="outline" className={`text-xs ${getImpactBadge(event.impact)}`}>
          {event.impact.charAt(0).toUpperCase() + event.impact.slice(1)} Impact
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-6 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Previous</p>
          <p className="font-mono text-sm">{event.previous}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Forecast</p>
          <p className="font-mono text-sm">{event.forecast}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Actual</p>
          {event.actual ? (
            <p className={`font-mono text-sm font-semibold flex items-center justify-center gap-1 ${isActualBetter ? "text-green-500" : isActualWorse ? "text-red-500" : ""}`}>
              {event.actual}
              {isActualBetter && <TrendingUp className="w-3 h-3" />}
              {isActualWorse && <TrendingDown className="w-3 h-3" />}
            </p>
          ) : (
            <p className="font-mono text-sm text-muted-foreground">-</p>
          )}
        </div>
      </div>
      <Button variant="ghost" size="icon" className="flex-shrink-0" data-testid={`button-notify-${event.id}`}>
        <Bell className="w-4 h-4" />
      </Button>
    </div>
  );
}

function EconomicCalendarContent() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [impactFilter, setImpactFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const dates = [];
  for (let i = -2; i <= 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    dates.push(date);
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const eventsForDate = mockEvents.filter(e => e.date === formatDate(selectedDate));
  const filteredEvents = impactFilter === "all" 
    ? eventsForDate 
    : eventsForDate.filter(e => e.impact === impactFilter);

  const upcomingHighImpact = mockEvents.filter(e => e.impact === "high" && !e.actual);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-calendar-title">Economic Calendar</h1>
            <p className="text-muted-foreground">Track market-moving economic events</p>
          </div>
          <Badge className="ml-auto bg-gradient-to-r from-amber-500 to-amber-600">Premium</Badge>
        </div>

        <Card className="mb-6">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">Upcoming High-Impact Events</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {upcomingHighImpact.slice(0, 3).map((event) => (
                  <Badge key={event.id} variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                    {event.event.slice(0, 20)}... ({event.date})
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <Button variant="ghost" size="icon" data-testid="button-prev-week">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dates.map((date) => (
                  <Button
                    key={date.toISOString()}
                    variant={formatDate(date) === formatDate(selectedDate) ? "default" : "outline"}
                    className={`min-w-[80px] flex-col h-auto py-2 ${isToday(date) ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setSelectedDate(date)}
                    data-testid={`date-${formatDate(date)}`}
                  >
                    <span className="text-xs text-muted-foreground">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className="text-lg font-bold">{date.getDate()}</span>
                    <span className="text-xs">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                  </Button>
                ))}
              </div>
              <Button variant="ghost" size="icon" data-testid="button-next-week">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Impact:</span>
              {(["all", "high", "medium", "low"] as const).map((impact) => (
                <Button
                  key={impact}
                  variant={impactFilter === impact ? "default" : "outline"}
                  size="sm"
                  onClick={() => setImpactFilter(impact)}
                  data-testid={`button-impact-${impact}`}
                >
                  {impact.charAt(0).toUpperCase() + impact.slice(1)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 border-b">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-lg">
                Events for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </CardTitle>
              <Badge variant="secondary">{filteredEvents.length} events</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredEvents.length > 0 ? (
              <div className="divide-y">
                {filteredEvents.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No economic events scheduled for this date</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground justify-center flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>High Impact</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Medium Impact</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Low Impact</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EconomicCalendarPage() {
  return (
    <PremiumPaywall featureName="Economic Calendar">
      <EconomicCalendarContent />
    </PremiumPaywall>
  );
}
