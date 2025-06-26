"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
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

  useEffect(() => {
    const setupAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth session error:", error);
          setConnectionError("Failed to connect to authentication service. Please try again later.");
          setIsLoading(false);
          return;
        }
        
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
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
    } catch (error) {
      console.error("Sign out error:", error);
      setConnectionError("Failed to sign out. Please try again later.");
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
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        return data.session.access_token;
      }

      // For testing/demo purposes, return a mock token if user exists but no token
      if (user) {
        return "mock-token-for-testing";
      }

      return null;
    } catch (error) {
      console.error("Error getting ID token:", error);
      return null;
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