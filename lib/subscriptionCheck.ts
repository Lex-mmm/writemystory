import { supabaseAdmin } from './supabaseAdmin';

export type SubscriptionPlan = 'free' | 'starter' | 'comfort' | 'deluxe' | 'admin_comp';

export interface PlanLimits {
  maxProjects: number;
  maxQuestionsPerProject: number;
  hasImageSupport: boolean;
  hasAIChapters: boolean;
  hasHumanReview: boolean;
  hasPrintUpgrade: boolean;
  hasWhatsAppSupport: boolean;
  hasSmartQuestions: boolean;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    maxProjects: 1,
    maxQuestionsPerProject: 10,
    hasImageSupport: false,
    hasAIChapters: false,
    hasHumanReview: false,
    hasPrintUpgrade: false,
    hasWhatsAppSupport: false,
    hasSmartQuestions: true, // Basic smart questions
  },
  starter: {
    maxProjects: 1,
    maxQuestionsPerProject: 50,
    hasImageSupport: false,
    hasAIChapters: false,
    hasHumanReview: false,
    hasPrintUpgrade: true,
    hasWhatsAppSupport: true,
    hasSmartQuestions: true,
  },
  comfort: {
    maxProjects: 3,
    maxQuestionsPerProject: 100,
    hasImageSupport: true,
    hasAIChapters: true,
    hasHumanReview: false,
    hasPrintUpgrade: true,
    hasWhatsAppSupport: true,
    hasSmartQuestions: true,
  },
  deluxe: {
    maxProjects: -1, // Unlimited
    maxQuestionsPerProject: -1, // Unlimited
    hasImageSupport: true,
    hasAIChapters: true,
    hasHumanReview: true,
    hasPrintUpgrade: true,
    hasWhatsAppSupport: true,
    hasSmartQuestions: true,
  },
  admin_comp: {
    maxProjects: -1, // Unlimited
    maxQuestionsPerProject: -1, // Unlimited  
    hasImageSupport: true,
    hasAIChapters: true,
    hasHumanReview: true,
    hasPrintUpgrade: true,
    hasWhatsAppSupport: true,
    hasSmartQuestions: true,
  },
};

export async function getUserSubscription(userId: string): Promise<{
  plan: SubscriptionPlan;
  stripeCustomerId?: string;
  subscriptionId?: string;
  status?: string;
}> {
  try {
    // First check if user has an active subscription
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subscription) {
      // First check if it's an admin comp plan (stored directly in plan field)
      if (subscription.plan === 'admin_comp') {
        return {
          plan: 'admin_comp',
          stripeCustomerId: subscription.customer_id,
          subscriptionId: subscription.id,
          status: subscription.status
        };
      }

      // Map price IDs to plan names for Stripe subscriptions
      const priceToplan: Record<string, SubscriptionPlan> = {
        'price_1Rfg11RASG7nuZM5TBetZKt8': 'starter',
        'price_1Rfg1TRASG7nuZM5D8Wk41Uo': 'comfort', 
        'price_1Rfg22RASG7nuZM5gsYaWWho': 'deluxe',
      };

      const plan = subscription.plan || priceToplan[subscription.price_id] || 'free';
      
      return {
        plan,
        stripeCustomerId: subscription.customer_id,
        subscriptionId: subscription.id,
        status: subscription.status
      };
    }

    // No active subscription, return free plan
    return { plan: 'free' };
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return { plan: 'free' };
  }
}

export function canAccessFeature(userPlan: SubscriptionPlan, feature: keyof PlanLimits): boolean {
  const limits = PLAN_LIMITS[userPlan];
  return limits[feature] as boolean;
}

export function getProjectLimit(userPlan: SubscriptionPlan): number {
  return PLAN_LIMITS[userPlan].maxProjects;
}

export function getQuestionLimit(userPlan: SubscriptionPlan): number {
  return PLAN_LIMITS[userPlan].maxQuestionsPerProject;
}

export async function checkProjectLimit(userId: string, userPlan: SubscriptionPlan): Promise<{
  canCreate: boolean;
  currentCount: number;
  limit: number;
}> {
  const limit = getProjectLimit(userPlan);
  
  if (limit === -1) {
    return { canCreate: true, currentCount: 0, limit: -1 };
  }

  const { data: projects, error } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error checking project limit:', error);
    return { canCreate: false, currentCount: 0, limit };
  }

  const currentCount = projects?.length || 0;
  return {
    canCreate: currentCount < limit,
    currentCount,
    limit
  };
}

export async function checkQuestionLimit(projectId: string, userPlan: SubscriptionPlan): Promise<{
  canCreate: boolean;
  currentCount: number;
  limit: number;
}> {
  const limit = getQuestionLimit(userPlan);
  
  if (limit === -1) {
    return { canCreate: true, currentCount: 0, limit: -1 };
  }

  const { data: answers, error } = await supabaseAdmin
    .from('answers')
    .select('id')
    .eq('project_id', projectId);

  if (error) {
    console.error('Error checking question limit:', error);
    return { canCreate: false, currentCount: 0, limit };
  }

  const currentCount = answers?.length || 0;
  return {
    canCreate: currentCount < limit,
    currentCount,
    limit
  };
}
