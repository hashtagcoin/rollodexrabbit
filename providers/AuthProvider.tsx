 import React, { useState, useEffect, createContext, useContext, PropsWithChildren } from 'react';
import { supabase } from '../lib/supabase'; // Assuming supabase client setup is here
import { Session, User } from '@supabase/supabase-js';
import { RewardsService } from '../lib/rewardsService';

// Define the shape of the context data
type AuthData = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
};

// Create the context with a default value
const AuthContext = createContext<AuthData>({
  session: null,
  user: null,
  loading: true,
  signIn: async () => {},
});

// Create the provider component
export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the initial session
    const fetchSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    // Listen for auth state changes (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        // Set loading to false again in case this triggers after initial load
        if (loading) setLoading(false); 
      }
    );

    // Cleanup listener on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // Run only once on mount

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      // Track login activity for rewards
      if (data.user) {
        try {
          // Update login streak
          await RewardsService.updateUserStreak(data.user.id, 'login');
          
          // Track login activity
          await RewardsService.trackActivity(data.user.id, 'login', {
            loginCount: 1,
            timestamp: new Date().toISOString()
          });
        } catch (rewardsErr: unknown) {
          // Don't let rewards tracking errors affect the login flow
          console.error('Error tracking login activity:', rewardsErr instanceof Error ? rewardsErr.message : 'Unknown error');
        }
      }
      
      return data;
    } catch (err: unknown) {
      console.error('Error signing in:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during sign in');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    loading,
    signIn,
  };

  // Provide the context value to children
  // Show loading indicator or children based on loading state
  return (
    <AuthContext.Provider value={value}>
      {/* You might want to add a global loading indicator here instead of null */}
      {/* Or handle loading state within specific screens using the hook */}
      {children} 
    </AuthContext.Provider>
  );
};

// Create the custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
