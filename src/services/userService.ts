import type { User } from '@supabase/supabase-js';
import { mockCustomers } from '../data/mockUsers';
import { simulateAsync } from '../lib/dataProvider';
import { supabaseClient } from '../lib/supabaseClient';
import type { CustomerSummary, UserProfile } from '../types';

export interface AdminProfileSummary extends UserProfile {
  roles: Array<'customer' | 'admin' | 'super_admin'>;
  createdAt?: string;
}

let profileStore: UserProfile | null = null;

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
    throw new Error('Authentification indisponible.');
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    profileStore?.fullName ??
    'Client';
  const phone = (user.user_metadata?.phone as string | undefined) ?? profileStore?.phone ?? '';
  const address = (user.user_metadata?.address as string | undefined) ?? profileStore?.address ?? '';

  await supabaseClient.from('profiles').upsert({
    id: user.id,
    full_name: fullName,
    phone,
    email: user.email ?? null,
    address,
  });

  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('id, full_name, phone, email, address')
    .eq('id', user.id)
    .maybeSingle();

  const role = await loadRole(user.id);

  return {
    id: profile?.id ?? user.id,
    fullName: profile?.full_name ?? fullName,
    phone: profile?.phone ?? phone,
    email: profile?.email ?? user.email ?? '',
    address: profile?.address ?? address,
    role,
  };
}

export const userService = {
  async getCurrentUser(): Promise<UserProfile | null> {
    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getUser();
      if (!data.user) {
        profileStore = null;
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
          full_name: updates.fullName ?? profileStore?.fullName ?? 'Client',
          phone: updates.phone ?? profileStore?.phone ?? '',
          email: updates.email ?? profileStore?.email ?? data.user.email ?? '',
          address: updates.address ?? profileStore?.address ?? '',
        };

        const { error } = await supabaseClient.from('profiles').upsert(payload);
        if (!error) {
          const role = await loadRole(data.user.id);
          profileStore = {
            id: data.user.id,
            fullName: payload.full_name,
            phone: payload.phone,
            email: payload.email,
            address: payload.address,
            role,
          };
          return simulateAsync(profileStore, 100);
        }
      }
    }

    profileStore = {
      id: profileStore?.id ?? 'local-user',
      fullName: updates.fullName ?? profileStore?.fullName ?? 'Client',
      phone: updates.phone ?? profileStore?.phone ?? '',
      email: updates.email ?? profileStore?.email ?? '',
      address: updates.address ?? profileStore?.address ?? '',
      role: updates.role ?? profileStore?.role,
    };
    return simulateAsync(profileStore);
  },

  async getCustomers(): Promise<CustomerSummary[]> {
    if (supabaseClient) {
      const { data: profiles, error } = await supabaseClient
        .from('profiles')
        .select('id, full_name, phone, email, address')
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
            address: profile.address ?? '',
            orderCount: relatedOrders.length,
            lastOrderDate: relatedOrders[0]?.created_at ?? new Date(0).toISOString(),
          };
        });
      }
    }

    return simulateAsync(mockCustomers);
  },

  async getAdminProfiles(): Promise<AdminProfileSummary[]> {
    if (supabaseClient) {
      const { data: profiles, error } = await supabaseClient
        .from('profiles')
        .select('id, full_name, phone, email, address, created_at')
        .order('created_at', { ascending: false });

      if (!error && profiles) {
        const { data: roles } = await supabaseClient
          .from('user_roles')
          .select('user_id, role');

        return profiles.map((profile) => {
          const profileRoles = (roles ?? [])
            .filter((role) => role.user_id === profile.id)
            .map((role) => role.role) as AdminProfileSummary['roles'];

          const role =
            profileRoles.includes('super_admin')
              ? 'super_admin'
              : profileRoles.includes('admin')
                ? 'admin'
                : 'customer';

          return {
            id: profile.id,
            fullName: profile.full_name ?? 'Client',
            phone: profile.phone ?? '',
            email: profile.email ?? '',
            address: profile.address ?? '',
            role,
            roles: profileRoles.length ? profileRoles : ['customer'],
            createdAt: profile.created_at,
          };
        });
      }
    }

    return simulateAsync(
      mockCustomers.map((customer) => ({
        ...customer,
        roles: [customer.role ?? 'customer'],
        createdAt: customer.lastOrderDate,
      })),
    );
  },

  async setAdminRole(userId: string, makeAdmin: boolean): Promise<boolean> {
    if (supabaseClient) {
      if (makeAdmin) {
        const { error } = await supabaseClient
          .from('user_roles')
          .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });
        return !error;
      }

      const { error } = await supabaseClient
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');
      return !error;
    }

    return simulateAsync(true);
  },

  async signIn(email: string, password: string): Promise<UserProfile> {
    if (!supabaseClient) {
      throw new Error('Connexion indisponible pour le moment.');
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
    email,
    password,
  }: {
    fullName: string;
    email: string;
    password: string;
  }): Promise<UserProfile | null> {
    if (!supabaseClient) {
      throw new Error('Inscription indisponible pour le moment.');
    }

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: '',
          address: '',
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
    profileStore = null;
  },

  async signInWithGoogle(redirectPath?: string): Promise<void> {
    if (!supabaseClient) {
      return;
    }

    const callbackUrl = new URL('/auth/callback', window.location.origin);
    if (redirectPath?.startsWith('/') && !redirectPath.startsWith('//')) {
      callbackUrl.searchParams.set('redirect', redirectPath);
    }

    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      throw error;
    }
  },
};
