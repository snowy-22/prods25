/**
 * Subscription Tiers and Types
 */

export type SubscriptionTier = 'guest' | 'free' | 'basic' | 'pro' | 'enterprise';

export interface SubscriptionFeatureGroup {
  name: string;
  features: {
    name: string;
    included: boolean;
    limit?: string | number;
    description?: string;
  }[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  tier: SubscriptionTier;
  price: number; // in cents
  currency: string;
  interval: 'month' | 'year';
  popular?: boolean;
  features: string[];
  featureGroups: SubscriptionFeatureGroup[];
  limits: {
    maxProjects?: number;
    maxStorage?: number; // in MB
    maxCollaborators?: number;
    maxAPIRequests?: number;
    maxCanvasItems?: number;
    maxAIRequests?: number;
    maxWidgets?: number;
  };
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

// Import plans from separate data file
export { SUBSCRIPTION_PLANS } from './subscription-plans-data';
