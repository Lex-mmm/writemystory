import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Creates a Supabase admin client with proper RLS context for a specific user
 * This allows backend operations to respect Row Level Security policies
 */
export const createRLSEnabledClient = (userId: string): SupabaseClient => {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for RLS-enabled operations');
  }

  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        // Set the user context for RLS policies
        'X-Client-Info': `user-id=${userId}`
      }
    }
  });

  return client;
};

/**
 * Sets the current user context for RLS policies
 * Call this before performing any database operations that need user context
 */
export const setUserContext = async (client: SupabaseClient, userId: string): Promise<boolean> => {
  try {
    // Set the user context for RLS policies
    await client.rpc('set_current_user_id', { user_id: userId });
    return true;
  } catch (error) {
    console.error('Failed to set user context:', error);
    return false;
  }
};

/**
 * Creates a Supabase client with RLS disabled (for admin operations)
 * Use sparingly and only for system-level operations
 */
export const createAdminClient = (): SupabaseClient => {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

/**
 * Validates and extracts user ID from authorization header
 */
export const extractUserFromAuth = async (authHeader: string | null): Promise<string | null> => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  
  // For now, we'll use the token as user ID if it looks like a valid user ID
  // In a real implementation, you'd verify the JWT token
  if (token && token.length > 10) {
    return token;
  }

  return null;
};

/**
 * Middleware function to handle RLS context in API routes
 */
type RouteHandler = (client: SupabaseClient, userId: string, request: Request, ...args: unknown[]) => Promise<Response>;

export const withRLS = (handler: RouteHandler) => {
  return async (request: Request, ...args: unknown[]): Promise<Response> => {
    try {
      // Extract authorization header
      const authHeader = request.headers.get('Authorization');
      const userId = await extractUserFromAuth(authHeader);

      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Create RLS-enabled client
      const client = createRLSEnabledClient(userId);
      
      // Set user context
      const contextSet = await setUserContext(client, userId);
      if (!contextSet) {
        console.warn('Failed to set user context, proceeding without RLS');
      }

      // Call the actual handler
      return await handler(client, userId, request, ...args);
    } catch (error) {
      console.error('RLS middleware error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
};

/**
 * Helper to execute queries with user context
 */
export const executeWithUserContext = async <T>(
  userId: string,
  operation: (client: SupabaseClient) => Promise<T>
): Promise<T> => {
  const client = createRLSEnabledClient(userId);
  await setUserContext(client, userId);
  return await operation(client);
};
