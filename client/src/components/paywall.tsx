import { useAuth } from "@/lib/auth-context";
import { canAccessPremiumFeatures, getSubscriptionStatus } from "@/lib/subscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, Clock, Check } from "lucide-react";
import { Link } from "wouter";

interface PaywallProps {
  children: React.ReactNode;
  featureName?: string;
}

export function Paywall({ children, featureName = "this feature" }: PaywallProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (canAccessPremiumFeatures(user)) {
    return <>{children}</>;
  }

  const status = getSubscriptionStatus(user);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Your Trial Has Ended</CardTitle>
          <CardDescription className="text-base">
            Your 14-day free trial has expired. Subscribe to continue using {featureName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-center">Choose Your Plan</h4>
            
            <div className="grid gap-3">
              <PricingOption
                name="School"
                price="$8.49"
                period="/student/month"
                description="For teachers and classrooms"
                features={["Manage up to 30 students", "Assignment creation", "Progress tracking"]}
              />
              <PricingOption
                name="Casual"
                price="$9.49"
                period="/month"
                description="For individual learners"
                features={["Full simulator access", "All lessons", "Leaderboard access"]}
                highlighted
              />
              <PricingOption
                name="12Digits+"
                price="$14.49"
                period="/month"
                description="Premium features"
                features={["Advanced analytics", "Strategy library", "Priority support"]}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Link href="/pricing">
              <Button className="w-full" size="lg" data-testid="button-subscribe">
                <Crown className="w-4 h-4 mr-2" />
                Choose a Plan
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full" data-testid="button-back-home">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PricingOption({
  name,
  price,
  period,
  description,
  features,
  highlighted = false,
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        highlighted
          ? "border-primary bg-primary/5"
          : "border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="font-semibold">{name}</span>
          {highlighted && (
            <Badge variant="secondary" className="ml-2">
              Popular
            </Badge>
          )}
        </div>
        <div className="text-right">
          <span className="font-bold text-lg">{price}</span>
          <span className="text-muted-foreground text-sm">{period}</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-2">{description}</p>
      <ul className="text-sm space-y-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2">
            <Check className="w-3 h-3 text-primary" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TrialBanner() {
  const { user } = useAuth();
  const status = getSubscriptionStatus(user);

  if (status.status !== "trial") return null;

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
      <div className="container mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-primary" />
          <span>
            <strong>{status.daysRemaining} days</strong> left in your free trial
          </span>
        </div>
        <Link href="/pricing">
          <Button size="sm" variant="default" data-testid="button-upgrade-trial">
            Upgrade Now
          </Button>
        </Link>
      </div>
    </div>
  );
}
