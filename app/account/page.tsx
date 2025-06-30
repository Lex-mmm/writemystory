'use client';

import { useState, useEffect } from 'react';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

interface UserSubscription {
  id: string;
  plan: string;
  interval: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  customer_id: string;
  subscription_id: string;
  canceled_at?: string;
}

interface UserStats {
  totalProjects: number;
  totalAnswers: number;
  accountCreated: string;
}

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccountData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Fetch subscription data
        const subscriptionResponse = await fetch(`/api/account/subscription?userId=${user.id}`);
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          setSubscription(subscriptionData.subscription);
        }

        // Fetch user stats
        const statsResponse = await fetch(`/api/account/stats?userId=${user.id}`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.stats);
        }

      } catch (err) {
        console.error('Error fetching account data:', err);
        setError('Er ging iets mis bij het ophalen van je accountgegevens.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccountData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlanDisplayName = (plan: string, interval: string) => {
    const planNames = {
      basic: 'Basis Verhaal',
      premium: 'Premium Verhaal'
    };
    const intervalNames = {
      monthly: 'maandelijks',
      yearly: 'jaarlijks'
    };
    return `${planNames[plan as keyof typeof planNames] || plan} (${intervalNames[interval as keyof typeof intervalNames] || interval})`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actief';
      case 'canceled':
        return 'Geannuleerd';
      case 'past_due':
        return 'Betaling achterstallig';
      default:
        return status;
    }
  };

  return (
    <ProtectedRoute>
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mijn Account</h1>
          <p className="text-gray-600">Beheer je account en bekijk je abonnement</p>
        </div>

        {isLoading ? (
          <div className="text-center py-10">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Account gegevens worden geladen...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Account Informatie</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
                  <p className="text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account aangemaakt</label>
                  <p className="text-gray-900">
                    {stats?.accountCreated ? formatDate(stats.accountCreated) : formatDate(user?.created_at || '')}
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Abonnement</h2>
              
              {subscription ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {getPlanDisplayName(subscription.plan, subscription.interval)}
                      </h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
                        {getStatusText(subscription.status)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Volgende factuur</p>
                      <p className="font-medium">{formatDate(subscription.current_period_end)}</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Huidige periode</p>
                        <p className="font-medium">
                          {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Facturering</p>
                        <p className="font-medium">
                          {subscription.interval === 'monthly' ? 'Maandelijks' : 'Jaarlijks'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {subscription.canceled_at && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800">
                        <strong>Abonnement geannuleerd:</strong> Je abonnement is geannuleerd op {formatDate(subscription.canceled_at)} 
                        en blijft actief tot {formatDate(subscription.current_period_end)}.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Link
                      href="/pricing"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Abonnement wijzigen
                    </Link>
                    <button
                      onClick={() => alert('Contacteer support voor abonnement annulering')}
                      className="text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Gratis Account</h3>
                  <p className="text-gray-600 mb-4">
                    Je gebruikt momenteel de gratis versie van WriteMyStory.ai
                  </p>
                  <Link
                    href="/pricing"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Upgrade naar premium
                  </Link>
                </div>
              )}
            </div>

            {/* Usage Statistics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Gebruiksstatistieken</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {stats?.totalProjects || 0}
                  </div>
                  <p className="text-gray-600">Verhalen</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {stats?.totalAnswers || 0}
                  </div>
                  <p className="text-gray-600">Beantwoorde vragen</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {subscription ? '∞' : '5'}
                  </div>
                  <p className="text-gray-600">
                    {subscription ? 'Onbeperkt vragen' : 'Gratis vragen resterend'}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Account Acties</h2>
              <div className="space-y-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Naar mijn verhalen
                </Link>
                
                <Link
                  href="/start"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Nieuw verhaal starten
                </Link>

                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center text-red-600 hover:text-red-800"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Uitloggen
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </ProtectedRoute>
  );
}
