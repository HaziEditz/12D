import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSubscriptionStatus } from "@/lib/subscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, Crown, GraduationCap, User, Sparkles, Tag, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import SubscriptionPayPalButton from "@/components/SubscriptionPayPalButton";

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
    hasPromoCode: true,
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
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const status = getSubscriptionStatus(user);
  const [promoCode, setPromoCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showPromoInput, setShowPromoInput] = useState(false);

  const handleRedeemPromo = async () => {
    if (!promoCode.trim()) {
      toast({
        title: "Enter a code",
        description: "Please enter a promo code",
        variant: "destructive",
      });
      return;
    }

    setIsRedeeming(true);
    try {
      const response = await apiRequest("POST", "/api/payments/redeem-promo", {
        promoCode: promoCode.trim(),
      });
      
      if (response.ok) {
        await refreshUser();
        // Invalidate all queries that depend on user subscription status
        queryClient.invalidateQueries({ queryKey: ["/api/trades/limits"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        toast({
          title: "Success!",
          description: "Promo code redeemed! You now have free Casual access.",
        });
        navigate("/dashboard");
      } else {
        const data = await response.json();
        toast({
          title: "Invalid Code",
          description: data.error || "This promo code is not valid",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to redeem promo code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRedeeming(false);
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
                
                <CardFooter className="flex flex-col gap-3">
                  {isCurrentPlan ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      size="lg"
                      disabled
                      data-testid={`button-subscribe-${plan.id}`}
                    >
                      Current Plan
                    </Button>
                  ) : !user ? (
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                      onClick={() => navigate("/register")}
                      data-testid={`button-subscribe-${plan.id}`}
                    >
                      Get Started
                    </Button>
                  ) : (
                    <SubscriptionPayPalButton
                      planId={plan.id}
                      amount={plan.price.toString()}
                      planName={plan.name}
                    />
                  )}
                  
                  {plan.hasPromoCode && user && !isCurrentPlan && (
                    <>
                      {!showPromoInput ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-muted-foreground"
                          onClick={() => setShowPromoInput(true)}
                          data-testid="button-show-promo"
                        >
                          <Tag className="w-4 h-4 mr-2" />
                          Have a promo code?
                        </Button>
                      ) : (
                        <div className="w-full space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter promo code"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value)}
                              className="flex-1"
                              data-testid="input-promo-code"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleRedeemPromo();
                              }}
                            />
                            <Button
                              onClick={handleRedeemPromo}
                              disabled={isRedeeming}
                              data-testid="button-redeem-promo"
                            >
                              {isRedeeming ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Apply"
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
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
