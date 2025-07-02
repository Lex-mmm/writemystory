import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../../../lib/supabaseAdmin';
import { validateAdminToken, createAdminErrorResponse, createAdminSuccessResponse } from '../../../../../../lib/adminAuth';
import { stripe } from '../../../../../../lib/stripe';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Skip during build time or when admin service is not available
  if (process.env.NEXT_PHASE === 'phase-production-build' || 
      process.env.NODE_ENV === 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: 'Admin service not available during build' }, { status: 503 });
  }

  // Validate admin authentication
  const { isValid, error } = validateAdminToken(request);
  
  if (!isValid) {
    return createAdminErrorResponse(error || 'Unauthorized');
  }

  try {
    const params = await context.params;
    const userId = params.id;

    // Get user's current subscription
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    console.log(`Subscription query for user ${userId}:`, { subscription, subscriptionError });
    console.log(`Raw subscription data:`, subscription);

    console.log(`Subscription data for user ${userId}:`, subscription);

    // Get user details
    const { data: user } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const currentPlan = subscription ? getPlanFromSubscription(subscription) : 'free';
    console.log(`Detected plan for user ${userId}:`, currentPlan);

    let stripeCustomer = null;
    // Only fetch Stripe customer for non-admin-comp plans
    if (subscription?.customer_id && currentPlan !== 'admin_comp') {
      try {
        stripeCustomer = await stripe?.customers.retrieve(subscription.customer_id);
      } catch (error) {
        console.error('Error fetching Stripe customer for plan', currentPlan, ':', error);
      }
    } else if (currentPlan === 'admin_comp') {
      console.log('Skipping Stripe customer fetch for admin comp plan');
    }

    return createAdminSuccessResponse({
      userId,
      user,
      subscription,
      stripeCustomer,
      currentPlan
    });

  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return createAdminErrorResponse('Failed to fetch user subscription');
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Skip during build time or when admin service is not available
  if (process.env.NEXT_PHASE === 'phase-production-build' || 
      process.env.NODE_ENV === 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: 'Admin service not available during build' }, { status: 503 });
  }

  // Validate admin authentication
  const { isValid, error } = validateAdminToken(request);
  
  if (!isValid) {
    return createAdminErrorResponse(error || 'Unauthorized');
  }

  try {
    const params = await context.params;
    const userId = params.id;
    
    console.log('Raw context.params:', context.params);
    console.log('Awaited params:', params);
    console.log('Extracted userId:', userId);
    
    const { action, plan, priceId, reason } = await request.json();

    console.log(`Admin updating subscription for user ${userId}:`, { action, plan, priceId, reason });

    switch (action) {
      case 'upgrade':
      case 'change_plan':
        return await changePlan(userId, plan, priceId, reason);
      
      case 'cancel':
        return await cancelSubscription(userId, reason);
      
      case 'activate_free':
        return await activateFreePlan(userId, reason);
      
      case 'activate_admin_comp':
        return await activateAdminComp(userId, reason);
      
      case 'reactivate':
        return await reactivateSubscription(userId, reason);
      
      default:
        return createAdminErrorResponse('Invalid action');
    }

  } catch (error) {
    console.error('Error updating user subscription:', error);
    return createAdminErrorResponse('Failed to update user subscription');
  }
}

async function changePlan(userId: string, plan: string, priceId: string, reason: string) {
  try {
    // Handle admin comp plan specially - no Stripe involved
    if (plan === 'admin_comp') {
      return await activateAdminComp(userId, reason);
    }

    // For regular plans, continue with Stripe logic
    // Get or create Stripe customer
    const { data: user } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user?.email) {
      return createAdminErrorResponse('User email not found');
    }

    // Check if user has existing subscription
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    let stripeCustomerId;
    
    if (existingSubscription?.customer_id) {
      stripeCustomerId = existingSubscription.customer_id;
    } else {
      // Create new Stripe customer
      const stripeCustomer = await stripe?.customers.create({
        email: user.email,
        metadata: { userId }
      });
      stripeCustomerId = stripeCustomer?.id;
    }

    if (!stripeCustomerId) {
      return createAdminErrorResponse('Failed to create Stripe customer');
    }

    let stripeSubscription;
    let shouldCreateAdminComp = false;
    
    try {
      // Try to create subscription with admin-friendly settings
      stripeSubscription = await stripe?.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete', // Allow incomplete subscriptions
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId,
          plan,
          adminChange: 'true',
          reason: reason || 'Admin manual change'
        }
      });

      // If subscription is incomplete, treat it as admin comp instead
      if (stripeSubscription?.status === 'incomplete') {
        console.log('Stripe subscription created but incomplete, converting to admin comp');
        
        // Cancel the incomplete Stripe subscription
        if (stripeSubscription.id) {
          try {
            await stripe?.subscriptions.cancel(stripeSubscription.id);
          } catch (cancelError) {
            console.error('Error canceling incomplete subscription:', cancelError);
          }
        }
        
        shouldCreateAdminComp = true;
      }
      
    } catch (stripeError: unknown) {
      console.log('Stripe subscription creation failed, trying admin comp approach:', stripeError instanceof Error ? stripeError.message : 'Unknown error');
      shouldCreateAdminComp = true;
    }

    // Create admin comp subscription if needed
    if (shouldCreateAdminComp) {
      console.log('Creating admin comp subscription (database only, no Stripe)');
      
      // Cancel existing subscription if any
      if (existingSubscription) {
        await supabaseAdmin
          .from('subscriptions')
          .update({ 
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            admin_notes: `Admin changed to ${plan}: ${reason}`
          })
          .eq('id', existingSubscription.id);
      }

      // Create comp subscription record (no Stripe subscription)
      const now = new Date();
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      const { data: newSubscription, error } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: userId,
          customer_id: stripeCustomerId,
          subscription_id: null, // No Stripe subscription for admin comp
          price_id: priceId,
          plan: plan,
          status: 'active', // Mark as active for admin comp
          current_period_start: now.toISOString(),
          current_period_end: oneYearFromNow.toISOString(), // 1 year comp
          admin_notes: `Admin comp subscription: ${reason}`,
          created_at: now.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating comp subscription record:', error);
        return createAdminErrorResponse('Failed to save comp subscription');
      }

      return createAdminSuccessResponse({
        message: `Successfully granted ${plan} plan as admin comp (no payment required)`,
        subscription: newSubscription,
        type: 'admin_comp',
        note: 'This is an admin-granted complimentary subscription that does not require payment'
      });
    }

    if (!stripeSubscription) {
      return createAdminErrorResponse('Failed to create Stripe subscription');
    }

    // Cancel existing subscription if any
    if (existingSubscription) {
      await supabaseAdmin
        .from('subscriptions')
        .update({ 
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          admin_notes: `Admin changed to ${plan}: ${reason}`
        })
        .eq('id', existingSubscription.id);
    }

    // Create new subscription record
    const { data: newSubscription, error } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        customer_id: stripeCustomerId,
        subscription_id: stripeSubscription.id, // Store Stripe subscription ID in separate field
        price_id: priceId,
        plan: plan,
        status: stripeSubscription.status,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription record:', error);
      return createAdminErrorResponse('Failed to save subscription');
    }

    return createAdminSuccessResponse({
      message: `Successfully changed user plan to ${plan}`,
      subscription: newSubscription,
      stripeSubscriptionId: stripeSubscription.id,
      type: 'stripe_subscription'
    });

  } catch (error) {
    console.error('Error changing plan:', error);
    return createAdminErrorResponse(`Failed to change plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function cancelSubscription(userId: string, reason: string) {
  try {
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      return createAdminErrorResponse('No active subscription found');
    }

    // Cancel in Stripe (only if there's a Stripe subscription)
    if (stripe && subscription.subscription_id) {
      try {
        await stripe.subscriptions.cancel(subscription.subscription_id, {
          cancellation_details: {
            comment: `Admin cancellation: ${reason}`
          }
        });
      } catch (stripeError) {
        console.error('Error canceling Stripe subscription:', stripeError);
        // Continue with database update even if Stripe fails
      }
    }

    // Update in database
    await supabaseAdmin
      .from('subscriptions')
      .update({ 
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        admin_notes: `Admin cancellation: ${reason}`
      })
      .eq('id', subscription.id);

    return createAdminSuccessResponse({
      message: 'Subscription canceled successfully'
    });

  } catch (error) {
    console.error('Error canceling subscription:', error);
    return createAdminErrorResponse('Failed to cancel subscription');
  }
}

async function activateFreePlan(userId: string, reason: string) {
  try {
    // Cancel any existing subscription
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      await supabaseAdmin
        .from('subscriptions')
        .update({ 
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          admin_notes: `Admin set to free plan: ${reason}`
        })
        .eq('id', existingSubscription.id);
    }

    return createAdminSuccessResponse({
      message: 'User set to free plan successfully'
    });

  } catch (error) {
    console.error('Error activating free plan:', error);
    return createAdminErrorResponse('Failed to activate free plan');
  }
}

async function reactivateSubscription(userId: string, reason: string) {
  // This would require more complex logic depending on your business rules
  void userId; // Explicitly mark as intentionally unused
  void reason; // Explicitly mark as intentionally unused
  return createAdminErrorResponse('Reactivation not implemented yet');
}

async function activateAdminComp(userId: string, reason: string) {
  try {
    // Cancel any existing subscription
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      await supabaseAdmin
        .from('subscriptions')
        .update({ 
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          admin_notes: `Admin set to comp plan: ${reason}`
        })
        .eq('id', existingSubscription.id);
    }

    // Create admin comp subscription (no Stripe involved)
    const now = new Date();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const { data: newSubscription, error } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        customer_id: `admin_comp_${userId}`, // Dummy customer ID
        subscription_id: null, // No Stripe subscription
        price_id: null, // No Stripe price
        plan: 'admin_comp',
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: oneYearFromNow.toISOString(),
        admin_notes: `Admin comp plan: ${reason}`,
        created_at: now.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating admin comp subscription:', error);
      return createAdminErrorResponse('Failed to create admin comp subscription');
    }

    return createAdminSuccessResponse({
      message: 'Admin comp plan activated successfully (full access, no payment required)',
      subscription: newSubscription
    });

  } catch (error) {
    console.error('Error activating admin comp plan:', error);
    return createAdminErrorResponse('Failed to activate admin comp plan');
  }
}

interface Subscription {
  id: string;
  user_id: string;
  customer_id?: string;
  subscription_id?: string;
  price_id?: string;
  plan?: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  admin_notes?: string;
  created_at: string;
  canceled_at?: string;
}

function getPlanFromSubscription(subscription: Subscription): string {
  console.log('getPlanFromSubscription input:', subscription);
  
  // First try to use the plan field (for admin comp subscriptions)
  if (subscription?.plan) {
    console.log('Found plan field:', subscription.plan);
    return subscription.plan;
  }
  
  // Then try to map from price ID (for Stripe subscriptions)
  if (subscription?.price_id) {
    console.log('Found price_id field:', subscription.price_id);
    const priceToplan: Record<string, string> = {
      'price_1Rfg11RASG7nuZM5TBetZKt8': 'starter',
      'price_1Rfg1TRASG7nuZM5D8Wk41Uo': 'comfort', 
      'price_1Rfg22RASG7nuZM5gsYaWWho': 'deluxe',
    };
    const mappedPlan = priceToplan[subscription.price_id] || 'unknown';
    console.log('Mapped plan from price_id:', mappedPlan);
    return mappedPlan;
  }
  
  console.log('No plan or price_id found, defaulting to free');
  return 'free';
}
