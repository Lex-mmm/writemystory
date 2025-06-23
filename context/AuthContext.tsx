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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  getIdToken: async () => null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setupAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);

      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    setupAuth();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Add a method to get the ID token for API authorization
  const getIdToken = async (): Promise<string | null> => {
    try {
      // For Supabase, we can use the session access token
      if (session?.access_token) {
        return session.access_token;
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};