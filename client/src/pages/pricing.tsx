import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSubscriptionStatus } from "@/lib/subscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, GraduationCap, User, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const plans = [
  {
    id: "school",
    name: "School",
    price: 8.49,
    period: "/student/month",
    description: "Perfect for teachers and educational institutions",
    icon: GraduationCap,
    features: [
      "Manage up to 30 students",
      "Create custom assignments",
      "Track student progress",
      "Classroom leaderboards",
      "All lessons included",
      "Email support",
    ],
  },
  {
    id: "casual",
    name: "Casual",
    price: 9.49,
    period: "/month",
    description: "For individual learners ready to master trading",
    icon: User,
    popular: true,
    features: [
      "Full simulator access",
      "$10,000 virtual balance",
      "All lessons and tutorials",
      "Global leaderboard access",
      "Portfolio tracking",
      "Performance analytics",
    ],
  },
  {
    id: "premium",
    name: "12Digits+",
    price: 14.49,
    period: "/month",
    description: "Advanced features for serious traders",
    icon: Crown,
    features: [
      "Everything in Casual",
      "Advanced analytics dashboard",
      "Strategy library access",
      "Priority customer support",
      "Early access to new features",
      "Custom trading challenges",
    ],
  },
];

export default function Pricing() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState<string | null>(null);
  const status = getSubscriptionStatus(user);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      navigate("/register");
      return;
    }

    setLoading(planId);
    try {
      const response = await fetch("/api/payments/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tier: planId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create subscription");
      }

      const data = await response.json();
      
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        toast({
          title: "Subscription Created",
          description: "Your subscription has been activated!",
        });
        await refreshUser();
        navigate("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-pricing-title">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Start your 14-day free trial today. No credit card required. Cancel anytime.
          </p>
          {status.status === "trial" && (
            <Badge variant="secondary" className="mt-4">
              {status.daysRemaining} days left in your trial
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = status.status === "active" && status.tier === plan.id;
            
            return (
              <Card
                key={plan.id}
                className={`relative ${plan.popular ? "border-primary" : ""}`}
                data-testid={`card-plan-${plan.id}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pt-8">
                  <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                    disabled={isCurrentPlan || loading === plan.id}
                    onClick={() => handleSubscribe(plan.id)}
                    data-testid={`button-subscribe-${plan.id}`}
                  >
                    {loading === plan.id ? (
                      <span className="animate-spin mr-2">...</span>
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : (
                      "Get Started"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center text-muted-foreground">
          <p className="text-sm">
            All plans include a 14-day free trial. Secure payments powered by PayPal.
          </p>
        </div>
      </div>
    </div>
  );
}
