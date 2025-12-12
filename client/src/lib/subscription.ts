import type { User } from "@shared/schema";

const TRIAL_DAYS = 14;

export function getTrialDaysRemaining(user: User | null): number {
  if (!user) return 0;
  if (!user.trialStartDate) return TRIAL_DAYS;
  
  const trialStart = new Date(user.trialStartDate);
  const now = new Date();
  const daysSinceStart = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
  
  return Math.max(0, TRIAL_DAYS - daysSinceStart);
}

export function isTrialExpired(user: User | null): boolean {
  return getTrialDaysRemaining(user) === 0;
}

export function hasActiveSubscription(user: User | null): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.membershipStatus === "active" && !!user.subscriptionId;
}

export function canAccessPremiumFeatures(user: User | null): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (hasActiveSubscription(user)) return true;
  if (!isTrialExpired(user)) return true;
  return false;
}

export function getSubscriptionStatus(user: User | null): {
  status: "trial" | "active" | "expired" | "none";
  daysRemaining: number;
  tier: string | null;
} {
  if (!user) {
    return { status: "none", daysRemaining: 0, tier: null };
  }
  
  if (hasActiveSubscription(user)) {
    return { status: "active", daysRemaining: 0, tier: user.membershipTier };
  }
  
  const daysRemaining = getTrialDaysRemaining(user);
  if (daysRemaining > 0) {
    return { status: "trial", daysRemaining, tier: null };
  }
  
  return { status: "expired", daysRemaining: 0, tier: null };
}
