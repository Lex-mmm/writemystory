import { useState } from 'react';

interface SubscriptionManagerProps {
  userId: string;
  currentPlan: string;
  adminToken: string;
  onUpdate: () => void;
}

interface PlanChangeRequest {
  action: string;
  plan?: string;
  reason: string;
  priceId?: string;
}

interface PlanOption {
  value: string;
  label: string;
  priceId: string | null;
  adminOnly?: boolean;
}

const PLAN_OPTIONS: PlanOption[] = [
  { value: 'free', label: 'Free Plan', priceId: null },
  { value: 'starter', label: 'Starter (€19/month)', priceId: 'price_1Rfg11RASG7nuZM5TBetZKt8' },
  { value: 'comfort', label: 'Comfort (€69/month)', priceId: 'price_1Rfg1TRASG7nuZM5D8Wk41Uo' },
  { value: 'deluxe', label: 'Deluxe (€99/month)', priceId: 'price_1Rfg22RASG7nuZM5gsYaWWho' },
  { value: 'admin_comp', label: '🎁 Admin Comp (Full Access)', priceId: null, adminOnly: true }
];

export default function SubscriptionManager({ userId, currentPlan, adminToken, onUpdate }: SubscriptionManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Debug logging
  console.log('SubscriptionManager: PLAN_OPTIONS:', PLAN_OPTIONS);
  console.log('SubscriptionManager: currentPlan:', currentPlan);

  // Early return if userId is invalid
  if (!userId || userId === 'undefined') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: Invalid user ID provided to SubscriptionManager</p>
        <p className="text-sm text-red-600">User ID: &quot;{userId}&quot;</p>
      </div>
    );
  }

  const handlePlanChange = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for the plan change');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const selectedPlanData = PLAN_OPTIONS.find(p => p.value === selectedPlan);
      
      let action = 'change_plan';
      let requestBody: PlanChangeRequest = {
        action,
        plan: selectedPlan,
        reason: reason.trim()
      };

      if (selectedPlan === 'free') {
        action = 'activate_free';
        requestBody = { action, reason: reason.trim() };
      } else if (selectedPlan === 'admin_comp') {
        action = 'activate_admin_comp';
        requestBody = { action, reason: reason.trim() };
      } else if (selectedPlanData?.priceId) {
        requestBody.priceId = selectedPlanData.priceId;
      }

      const response = await fetch(`/api/admin/users/${userId}/subscription`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken
        },
        body: JSON.stringify(requestBody)
      });

      console.log('SubscriptionManager: Sent request to:', `/api/admin/users/${userId}/subscription`);
      console.log('SubscriptionManager: userId:', userId);
      console.log('SubscriptionManager: Request body:', requestBody);

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Plan changed successfully');
        setReason('');
        onUpdate();
      } else {
        setError(data.error || 'Failed to change plan');
      }
    } catch (err) {
      setError('An error occurred while changing the plan');
      console.error('Error changing plan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    if (!confirm('Are you sure you want to cancel this user\'s subscription?')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/subscription`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken
        },
        body: JSON.stringify({
          action: 'cancel',
          reason: reason.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Subscription canceled successfully');
        setSelectedPlan('free');
        setReason('');
        onUpdate();
      } else {
        setError(data.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      setError('An error occurred while canceling the subscription');
      console.error('Error canceling subscription:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Subscription Management</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Plan: <span className="font-bold capitalize">{currentPlan}</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Change to Plan:
          </label>
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PLAN_OPTIONS.map(plan => {
              console.log('Rendering plan option:', plan);
              return (
                <option key={plan.value} value={plan.value}>
                  {plan.label}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Change: <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for plan change (required for audit trail)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handlePlanChange}
            disabled={isLoading || selectedPlan === currentPlan || !reason.trim()}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Updating...' : 'Change Plan'}
          </button>

          {currentPlan !== 'free' && (
            <button
              onClick={handleCancelSubscription}
              disabled={isLoading || !reason.trim()}
              className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Canceling...' : 'Cancel Subscription'}
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Plan Features:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          {selectedPlan === 'free' && (
            <ul className="list-disc list-inside">
              <li>1 project maximum</li>
              <li>10 questions per project</li>
              <li>Basic features only</li>
            </ul>
          )}
          {selectedPlan === 'starter' && (
            <ul className="list-disc list-inside">
              <li>1 project</li>
              <li>50 questions per project</li>
              <li>WhatsApp support</li>
              <li>Print upgrade available</li>
            </ul>
          )}
          {selectedPlan === 'comfort' && (
            <ul className="list-disc list-inside">
              <li>3 projects</li>
              <li>100 questions per project</li>
              <li>Image support</li>
              <li>AI chapters</li>
              <li>WhatsApp support</li>
            </ul>
          )}
          {selectedPlan === 'deluxe' && (
            <ul className="list-disc list-inside">
              <li>Unlimited projects</li>
              <li>Unlimited questions</li>
              <li>All features included</li>
              <li>Human review & editing</li>
              <li>Priority support</li>
            </ul>
          )}
          {selectedPlan === 'admin_comp' && (
            <ul className="list-disc list-inside">
              <li>🎁 Admin-granted complimentary access</li>
              <li>Unlimited projects</li>
              <li>Unlimited questions</li>
              <li>All premium features included</li>
              <li>Image support & AI chapters</li>
              <li>Human review & editing</li>
              <li>Priority support</li>
              <li>No payment required</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
