"use client";

import { useState } from 'react';
import { AdminOverview, AdminUser, AdminProject, AdminQuestion, AdminAnswer } from '../../lib/supabaseAdmin';

interface UserDetailsData {
  user: AdminUser;
  projects: AdminProject[];
  questions: AdminQuestion[];
  answers: AdminAnswer[];
  stats: {
    totalProjects: number;
    totalAnswers: number;
    averageProgress: number;
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
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserDetails(data);
        setSelectedUser(userId);
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
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
            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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
                    <p className="text-sm text-gray-900">{userDetails.user.email}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Projects</h4>
                      <p className="text-2xl font-bold text-blue-600">{userDetails.stats.totalProjects}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Answers</h4>
                      <p className="text-2xl font-bold text-green-600">{userDetails.stats.totalAnswers}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Avg Progress</h4>
                      <p className="text-2xl font-bold text-purple-600">{userDetails.stats.averageProgress}%</p>
                    </div>
                  </div>

                  {/* Project display with proper typing */}
                  {userDetails && userDetails.projects.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Projects</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {userDetails.projects.map((project: AdminProject) => (
                          <div key={project.id} className="text-sm border rounded p-2">
                            <div className="flex justify-between">
                              <span className="font-medium">{project.subject_type === 'self' ? 'Personal Story' : project.person_name}</span>
                              <span className="text-gray-500">{project.progress}%</span>
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
                  {userDetails && userDetails.questions.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Questions</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {userDetails.questions.slice(0, 3).map((question: AdminQuestion) => (
                          <div key={question.id} className="text-xs text-gray-600 border-b pb-1">
                            {question.category}: {question.question.substring(0, 60)}...
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  Select a user to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

