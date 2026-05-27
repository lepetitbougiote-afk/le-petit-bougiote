import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabaseClient } from '../lib/supabaseClient';
import { userService } from '../services/userService';
import type { UserProfile } from '../types';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (payload: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
  }) => Promise<UserProfile | null>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      try {
        const profile = await userService.getCurrentUser();
        if (active) {
          setUser(profile);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadCurrentUser();

    if (!supabaseClient) {
      return () => {
        active = false;
      };
    }

    const { data: listener } = supabaseClient.auth.onAuthStateChange(() => {
      void loadCurrentUser();
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    const profile = await userService.getCurrentUser();
    setUser(profile);
  };

  const login = async (email: string, password: string) => {
    const profile = await userService.signIn(email, password);
    setUser(profile);
    return profile;
  };

  const register = async (payload: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
  }) => {
    const profile = await userService.signUp(payload);
    setUser(profile);
    return profile;
  };

  const logout = async () => {
    await userService.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle: () => userService.signInWithGoogle(),
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
