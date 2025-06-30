import { createClient } from '@supabase/supabase-js';

// Admin client with service role key for full database access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Ensure we're not accidentally using the service role key on the client side
if (typeof window !== 'undefined') {
  throw new Error('Supabase admin client should only be used on the server side');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test admin connection function
export async function testAdminConnection() {
  try {
    console.log('Testing admin connection...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service key length:', supabaseServiceKey?.length || 0);
    
    // Try to list auth users
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('Admin connection test failed:', error);
      return false;
    }
    
    console.log('Admin connection successful, users found:', data.users.length);
    return true;
  } catch (error) {
    console.error('Admin connection test error:', error);
    return false;
  }
}

// Database types
export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
}

export interface AdminProject {
  id: string;
  user_id: string;
  person_name?: string;
  subject_type: string;
  period_type: string;
  writing_style: string;
  status: string;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface AdminQuestion {
  id: string;
  story_id: string;
  category: string;
  question: string;
  type: string;
  priority: number;
  created_at: string;
}

export interface AdminAnswer {
  id: string;
  question_id: string;
  story_id: string;
  user_id: string;
  answer: string;
  created_at: string;
  updated_at: string;
}

export interface AdminOverview {
  totalUsers: number;
  totalProjects: number;
  totalQuestions: number;
  totalAnswers: number;
  activeProjects: number;
  completedProjects: number;
  recentSignups: number; // Last 7 days
}

export interface UserDetails {
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
