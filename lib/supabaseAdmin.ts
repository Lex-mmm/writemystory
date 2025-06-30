import { createClient } from '@supabase/supabase-js';

// Admin client with service role key for full database access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Ensure we're not accidentally using the service role key on the client side
if (typeof window !== 'undefined') {
  throw new Error('Supabase admin client should only be used on the server side');
}

// Create the admin client - use dummy values for build time if missing
const createAdminClient = () => {
  if (!supabaseServiceKey) {
    // During build time or when service key is missing, create a dummy client
    console.warn('Missing SUPABASE_SERVICE_ROLE_KEY environment variable - admin features will not work');
    return createClient(
      supabaseUrl, 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkdW1teSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDB9.dummy', 
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  // Debug the service key format only when we have a key
  console.log('Service key length:', supabaseServiceKey.length);
  console.log('Service key starts with:', supabaseServiceKey.substring(0, 20));

  // Decode JWT to check if it has the correct role
  try {
    const payload = JSON.parse(atob(supabaseServiceKey.split('.')[1]));
    console.log('JWT payload role:', payload.role || payload.rose); // Check for typo
    if (payload.rose && !payload.role) {
      console.error('⚠️  Service key has "rose" instead of "role" - this key is invalid!');
    }
  } catch (e) {
    console.error('Could not decode service key JWT:', e);
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export const supabaseAdmin = createAdminClient();

// Test admin connection function
export async function testAdminConnection() {
  try {
    // Check if we have a real service key
    if (!supabaseServiceKey) {
      console.warn('No service key available - admin features disabled');
      return false;
    }

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
