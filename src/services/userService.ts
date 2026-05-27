import type { User } from '@supabase/supabase-js';
import { mockCustomers, currentUser } from '../data/mockUsers';
import { simulateAsync } from '../lib/dataProvider';
import { supabaseClient } from '../lib/supabaseClient';
import type { CustomerSummary, UserProfile } from '../types';

let profileStore = { ...currentUser };

async function loadRole(userId: string): Promise<UserProfile['role'] | undefined> {
  if (!supabaseClient) {
    return undefined;
  }

  const { data } = await supabaseClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  const roles = (data ?? []).map((item) => item.role);
  if (roles.includes('super_admin')) {
    return 'super_admin';
  }
  if (roles.includes('admin')) {
    return 'admin';
  }
  if (roles.includes('customer')) {
    return 'customer';
  }
  return undefined;
}

async function upsertProfileFromAuthUser(user: User): Promise<UserProfile> {
  if (!supabaseClient) {
    return profileStore;
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    profileStore.fullName;
  const phone = (user.user_metadata?.phone as string | undefined) ?? profileStore.phone;

  await supabaseClient.from('profiles').upsert({
    id: user.id,
    full_name: fullName,
    phone,
    email: user.email ?? null,
  });

  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('id, full_name, phone, email')
    .eq('id', user.id)
    .maybeSingle();

  const role = await loadRole(user.id);

  return {
    id: profile?.id ?? user.id,
    fullName: profile?.full_name ?? fullName,
    phone: profile?.phone ?? phone,
    email: profile?.email ?? user.email ?? '',
    role,
  };
}

export const userService = {
  async getCurrentUser(): Promise<UserProfile | null> {
    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getUser();
      if (!data.user) {
        return null;
      }
      const profile = await upsertProfileFromAuthUser(data.user);
      profileStore = profile;
      return profile;
    }

    return simulateAsync(profileStore);
  },

  async getProfile(): Promise<UserProfile | null> {
    if (supabaseClient) {
      const profile = await this.getCurrentUser();
      return profile;
    }

    return simulateAsync(profileStore);
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getUser();
      if (data.user) {
        const payload = {
          id: data.user.id,
          full_name: updates.fullName ?? profileStore.fullName,
          phone: updates.phone ?? profileStore.phone,
          email: updates.email ?? profileStore.email,
        };

        const { error } = await supabaseClient.from('profiles').upsert(payload);
        if (!error) {
          const role = await loadRole(data.user.id);
          profileStore = {
            id: data.user.id,
            fullName: payload.full_name,
            phone: payload.phone,
            email: payload.email,
            role,
          };
          return simulateAsync(profileStore, 100);
        }
      }
    }

    profileStore = { ...profileStore, ...updates };
    return simulateAsync(profileStore);
  },

  async getCustomers(): Promise<CustomerSummary[]> {
    if (supabaseClient) {
      const { data: profiles, error } = await supabaseClient
        .from('profiles')
        .select('id, full_name, phone, email')
        .order('created_at', { ascending: false });

      if (!error && profiles) {
        const { data: orders } = await supabaseClient
          .from('orders')
          .select('user_id, customer_email, created_at')
          .order('created_at', { ascending: false });

        return profiles.map((profile) => {
          const relatedOrders = (orders ?? []).filter(
            (order) => order.user_id === profile.id || (profile.email && order.customer_email === profile.email),
          );
          return {
            id: profile.id,
            fullName: profile.full_name ?? 'Client',
            phone: profile.phone ?? '',
            email: profile.email ?? '',
            orderCount: relatedOrders.length,
            lastOrderDate: relatedOrders[0]?.created_at ?? new Date(0).toISOString(),
          };
        });
      }
    }

    return simulateAsync(mockCustomers);
  },

  async signIn(email: string, password: string): Promise<UserProfile> {
    if (!supabaseClient) {
      return simulateAsync(profileStore);
    }

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }

    const profile = await this.getCurrentUser();
    if (!profile) {
      throw new Error('Connexion impossible.');
    }
    return profile;
  },

  async signUp({
    fullName,
    phone,
    email,
    password,
  }: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
  }): Promise<UserProfile | null> {
    if (!supabaseClient) {
      profileStore = { ...profileStore, fullName, phone, email };
      return simulateAsync(profileStore);
    }

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
        },
      },
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      return null;
    }

    const profile = await upsertProfileFromAuthUser(data.user);
    profileStore = profile;
    return profile;
  },

  async signOut(): Promise<void> {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    profileStore = { ...currentUser };
  },

  async signInWithGoogle(): Promise<void> {
    if (!supabaseClient) {
      return;
    }

    const redirectTo = `${window.location.origin}/compte`;
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      throw error;
    }
  },
};
