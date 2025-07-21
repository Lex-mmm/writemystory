"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  connectionError: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  getIdToken: async () => null,
  connectionError: null
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Utility function to clear auth-related data
  const clearAuthData = () => {
    try {
      // Clear Supabase auth data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Error clearing auth data:", error);
    }
  };

  useEffect(() => {
    const setupAuth = async () => {
      try {
        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
          setConnectionError("Authentication service is not configured. Please contact support.");
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth session error:", error);
          
          // Handle specific refresh token errors
          if (error.message?.includes('refresh') || error.message?.includes('Refresh Token Not Found')) {
            console.log("Refresh token invalid, clearing auth state");
            // Clear any stored auth data
            clearAuthData();
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
          } else {
            setConnectionError("Failed to connect to authentication service. Please try again later.");
          }
          setIsLoading(false);
          return;
        }
        
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log("Auth state change:", event, session?.user?.email);
            
            // Handle token refresh errors
            if (event === 'TOKEN_REFRESHED' && !session) {
              console.log("Token refresh failed, signing out");
              setSession(null);
              setUser(null);
              return;
            }
            
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
            
            // Reset connection error if we succeed
            if (connectionError) setConnectionError(null);
          }
        );

        setIsLoading(false);
        
        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Auth setup error:", error);
        setConnectionError("Failed to establish connection with our servers. Please check your internet connection.");
        setIsLoading(false);
      }
    };

    setupAuth();
  }, [connectionError]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      
      // Clear any auth-related data from localStorage
      clearAuthData();
    } catch (error) {
      console.error("Sign out error:", error);
      setConnectionError("Failed to sign out. Please try again later.");
      
      // Even if signOut fails, clear local data
      clearAuthData();
    }
  };

  // Add a method to get the ID token for API authorization
  const getIdToken = async (): Promise<string | null> => {
    try {
      // For Supabase, we can use the session access token
      if (session?.access_token) {
        return session.access_token;
      }

      // Try to refresh the session
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error refreshing session:", error);
        
        // Handle refresh token errors specifically
        if (error.message?.includes('refresh') || error.message?.includes('Refresh Token Not Found')) {
          console.log("Refresh token invalid, clearing session");
          clearAuthData();
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          return null;
        }
        
        // For other errors, try to use user ID as fallback
        return user?.id || null;
      }
      
      if (data.session?.access_token) {
        return data.session.access_token;
      }

      // For testing/demo purposes, return the user ID if no token available
      if (user?.id) {
        console.log('Using user ID as fallback token:', user.id);
        return user.id;
      }

      return null;
    } catch (error) {
      console.error("Error getting ID token:", error);
      
      // Check if this is a refresh token error
      if (error instanceof Error && (error.message.includes('refresh') || error.message.includes('Refresh Token Not Found'))) {
        console.log("Refresh token error caught, signing out");
        try {
          clearAuthData();
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
        } catch (signOutError) {
          console.error("Error signing out:", signOutError);
        }
        return null;
      }
      
      return user?.id || null; // Fallback to user ID
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signOut,
    getIdToken,
    connectionError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};