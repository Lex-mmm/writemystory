"use client";

import { useState } from 'react';
import { AdminOverview, AdminUser, AdminProject, AdminQuestion, AdminAnswer } from '../../lib/supabaseAdmin';
import SubscriptionManager from '../../components/SubscriptionManager';
import ContentModeration from '../../components/ContentModeration';

interface UserDetailsData {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  app_metadata?: {
    provider?: string;
    providers?: string[];
    [key: string]: unknown;
  };
  user_metadata?: {
    name?: string;
    avatar_url?: string;
    email?: string;
    [key: string]: unknown;
  };
  projects?: AdminProject[];
  questions?: AdminQuestion[];
  answers?: AdminAnswer[];
  stats?: {
    totalProjects: number;
    totalQuestions: number;
    totalAnswers: number;
    averageProgress: number;
  };
  subscription?: {
    plan: string;
    status: string;
    stripeCustomerId?: string;
    subscriptionId?: string;
  };
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetailsData | null>(null);
  const [adminToken, setAdminToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const headers = {
    'Content-Type': 'application/json',
    'x-admin-token': adminToken
  };

  const authenticate = async (token: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Attempting authentication with token:', token.substring(0, 3) + '...');
      
      // Try the admin overview endpoint directly
      const response = await fetch('/api/admin/overview', {
        headers: { 'x-admin-token': token }
      });

      if (response.ok) {
        setAdminToken(token);
        setIsAuthenticated(true);
        fetchOverview(token);
        fetchUsers(token);
      } else {
        const errorData = await response.json();
        console.error('Overview endpoint error:', errorData);
        setError('Invalid admin token or authentication failed.');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Authentication failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOverview = async (token?: string) => {
    try {
      const response = await fetch('/api/admin/overview', {
        headers: { ...headers, 'x-admin-token': token || adminToken }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOverview(data);
      }
    } catch (err) {
      console.error('Error fetching overview:', err);
    }
  };

  const fetchUsers = async (token?: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: { ...headers, 'x-admin-token': token || adminToken }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // Fetch user details and subscription data in parallel
      const [userResponse, subscriptionResponse] = await Promise.all([
        fetch(`/api/admin/users/${userId}`, { headers }),
        fetch(`/api/admin/users/${userId}/subscription`, { headers })
      ]);
      
      if (userResponse.ok) {
        const responseData = await userResponse.json();
        
        console.log('Raw response from API:', responseData);
        
        // Extract the actual user data from the response wrapper
        const userData = responseData.data || responseData;
        
        console.log('Extracted userData:', userData);
        
        // Add subscription data if available
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          console.log('Subscription data:', subscriptionData);
          console.log('Subscription response structure:', Object.keys(subscriptionData));
          
          // Extract data from the wrapped response
          const subscriptionInfo = subscriptionData.data || subscriptionData;
          console.log('Extracted subscription info:', subscriptionInfo);
          
          userData.subscription = {
            plan: subscriptionInfo.currentPlan || 'free',
            status: subscriptionInfo.subscription?.status || 'inactive',
            stripeCustomerId: subscriptionInfo.subscription?.customer_id,
            subscriptionId: subscriptionInfo.subscription?.id
          };
          
          console.log('Final subscription object:', userData.subscription);
        } else {
          console.log('Subscription response not OK:', subscriptionResponse.status, subscriptionResponse.statusText);
          // Default to free plan if subscription fetch fails
          userData.subscription = {
            plan: 'free',
            status: 'inactive'
          };
        }
        
        console.log('Final userData with subscription:', userData);
        setUserDetails(userData);
        setSelectedUser(userId);
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const syncProfiles = async () => {
    try {
      setIsLoading(true);
      setSyncMessage(null);
      
      const response = await fetch('/api/admin/sync-profiles', {
        method: 'POST',
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setSyncMessage(`✅ ${data.message}`);
        // Refresh the users list
        fetchUsers();
      } else {
        const errorData = await response.json();
        setSyncMessage(`❌ Error: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error syncing profiles:', err);
      setSyncMessage('❌ Failed to sync profiles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAction = async (action: 'disable' | 'enable', userId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        // Refresh user details
        await fetchUserDetails(userId);
        setSyncMessage(`User ${action}d successfully`);
        setTimeout(() => setSyncMessage(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      setError(`Failed to ${action} user`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Admin Token"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => authenticate(adminToken)}
              disabled={isLoading || !adminToken}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={syncProfiles}
                disabled={isLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Syncing...' : 'Sync Profiles'}
              </button>
              <button
                onClick={() => setIsAuthenticated(false)}
                className="text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Sync Message */}
        {syncMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            syncMessage.startsWith('✅') 
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {syncMessage}
          </div>
        )}

        {/* Overview Stats */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">U</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{overview.totalUsers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">P</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Projects</dt>
                      <dd className="text-lg font-medium text-gray-900">{overview.totalProjects}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">A</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Answers</dt>
                      <dd className="text-lg font-medium text-gray-900">{overview.totalAnswers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">R</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Recent Signups</dt>
                      <dd className="text-lg font-medium text-gray-900">{overview.recentSignups}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Users List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Users</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`px-6 py-4 cursor-pointer hover:bg-gray-50 ${
                    selectedUser === user.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => fetchUserDetails(user.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      <p className="text-sm text-gray-500">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-sm text-gray-400">
                      {user.email_confirmed_at ? '✓' : '○'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Details */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">User Details</h2>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="text-center">Loading...</div>
              ) : userDetails ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Email</h3>
                    <p className="text-sm text-gray-900">{userDetails.email}</p>
                  </div>

                  {/* Subscription Info */}
                  {userDetails.subscription && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Current Subscription</h3>
                      <div className="mt-1 flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          userDetails.subscription.plan === 'free' 
                            ? 'bg-gray-100 text-gray-800'
                            : userDetails.subscription.plan === 'admin_comp'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {userDetails.subscription.plan === 'admin_comp' 
                            ? '🎁 Admin Comp' 
                            : userDetails.subscription.plan.charAt(0).toUpperCase() + userDetails.subscription.plan.slice(1)
                          }
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          userDetails.subscription.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userDetails.subscription.status}
                        </span>
                      </div>
                      {userDetails.subscription.stripeCustomerId && (
                        <p className="text-xs text-gray-500 mt-1">
                          Stripe Customer: {userDetails.subscription.stripeCustomerId}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Projects</h4>
                      <p className="text-2xl font-bold text-blue-600">{userDetails.stats?.totalProjects || 0}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Answers</h4>
                      <p className="text-2xl font-bold text-green-600">{userDetails.stats?.totalAnswers || 0}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Avg Progress</h4>
                      <p className="text-2xl font-bold text-purple-600">{userDetails.stats?.averageProgress || 0}%</p>
                    </div>
                  </div>

                  {/* Project display with proper typing */}
                  {userDetails && userDetails.projects && userDetails.projects.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Projects</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {userDetails.projects.map((project: AdminProject) => (
                          <div key={project.id} className="text-sm border rounded p-2">
                            <div className="flex justify-between">
                              <span className="font-medium">{project.subject_type === 'self' ? 'Personal Story' : project.person_name}</span>
                              <span className="text-gray-500">{project.progress || 0}%</span>
                            </div>
                            <div className="text-gray-600">
                              Status: {project.status} • {project.writing_style}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Questions and Answers display */}
                  {userDetails && userDetails.questions && userDetails.questions.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Questions</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {userDetails.questions.slice(0, 3).map((question: AdminQuestion) => (
                          <div key={question.id} className="text-xs text-gray-600 border-b pb-1">
                            {question.category}: {question.question?.substring(0, 60)}...
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* User Management Actions */}
                  {userDetails && (
                    <div className="mt-6 p-4 border border-gray-200 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">User Management</h4>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleUserAction('disable', userDetails.id)}
                          disabled={isLoading}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          Disable Account
                        </button>
                        <button
                          onClick={() => handleUserAction('enable', userDetails.id)}
                          disabled={isLoading}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          Enable Account
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Disabled accounts cannot log in or access their data.
                      </p>
                    </div>
                  )}

                  {/* Subscription Management */}
                  {userDetails && (
                    <div className="mt-6">
                      <div className="mb-2 text-sm text-gray-500">
                        Debug: User ID = {userDetails.id || 'UNDEFINED!'}
                        <br />
                        Debug: User object keys = {Object.keys(userDetails).join(', ')}
                      </div>
                      {userDetails.id ? (
                        <SubscriptionManager
                          userId={userDetails.id}
                          currentPlan={userDetails.subscription?.plan || 'free'}
                          adminToken={adminToken}
                          onUpdate={() => {
                            // Add a small delay to ensure database updates are complete
                            setTimeout(() => {
                              fetchUserDetails(userDetails.id);
                            }, 1000);
                          }}
                        />
                      ) : (
                        <div className="text-red-600">
                          Error: User ID is missing from user data!
                        </div>
                      )}
                    </div>
                  )}

                  {/* User Enable/Disable Actions */}
                  <div className="mt-4">
                    <button
                      onClick={() => handleUserAction(userDetails.subscription?.status === 'active' ? 'disable' : 'enable', userDetails.id)}
                      className={`w-full px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
                        userDetails.subscription?.status === 'active'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4zm16 0a8 8 0 01-8 8v-8h8z"></path>
                        </svg>
                      ) : userDetails.subscription?.status === 'active' ? (
                        <>
                          <span>Disable User</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m6 0l-3 3m3-3l-3-3" />
                          </svg>
                        </>
                      ) : (
                        <>
                          <span>Enable User</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 0l3-3m-3 3l3 3" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  Select a user to view details
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Moderation Section */}
        <div className="mt-8">
          <ContentModeration adminToken={adminToken} />
        </div>
      </div>
    </div>
  );
}

