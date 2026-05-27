import { business } from '../data/business';
import { mockOrders } from '../data/mockOrders';
import { mockCustomers } from '../data/mockUsers';
import { products } from '../data/menu';
import { simulateAsync } from '../lib/dataProvider';
import { supabaseClient } from '../lib/supabaseClient';
import type { BusinessSettings, DashboardStats, OpeningHour, Product } from '../types';

let businessStore = { ...business };

type RestaurantSettingsRow = {
  id: string;
  name: string;
  brand_line: string | null;
  address: string | null;
  phone_primary: string | null;
  phone_secondary: string | null;
  google_maps_url: string | null;
  announcement: string | null;
  is_ordering_enabled: boolean;
  is_temporarily_closed: boolean;
  google_analytics_measurement_id: string | null;
};

type OpeningHourRow = {
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
};

const dayLabels = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const;

function splitAddress(address: string | null | undefined) {
  const raw = (address ?? '').trim();
  const match = raw.match(/^(.*?)(?:,\s*(\d{5})\s+(.+))?$/);
  return {
    address: match?.[1]?.trim() || business.address,
    postalCode: match?.[2]?.trim() || business.postalCode,
    city: match?.[3]?.trim() || business.city,
  };
}

function mapOpeningHours(rows: OpeningHourRow[] | null | undefined): OpeningHour[] {
  const rowMap = new Map((rows ?? []).map((row) => [row.day_of_week, row]));
  return dayLabels.slice(1).concat(dayLabels[0]).map((day) => {
    const dayIndex = dayLabels.indexOf(day);
    const row = rowMap.get(dayIndex);
    return {
      day,
      opensAt: row?.opens_at?.slice(0, 5) ?? null,
      closesAt: row?.closes_at?.slice(0, 5) ?? null,
      isClosed: row?.is_closed ?? day === 'Dimanche',
    };
  });
}

function mapBusinessSettings(row: RestaurantSettingsRow, openingHours: OpeningHour[]): BusinessSettings {
  const split = splitAddress(row.address);
  return {
    ...businessStore,
    name: row.name,
    brandLine: row.brand_line ?? business.brandLine,
    address: split.address,
    postalCode: split.postalCode,
    city: split.city,
    phonePrimary: row.phone_primary ?? business.phonePrimary,
    phoneSecondary: row.phone_secondary ?? business.phoneSecondary,
    mapUrl: row.google_maps_url ?? business.mapUrl,
    reviewUrl: row.google_maps_url ?? business.reviewUrl,
    leaveReviewUrl: row.google_maps_url ?? business.leaveReviewUrl,
    announcement: row.announcement ?? '',
    orderingEnabled: row.is_ordering_enabled && !row.is_temporarily_closed,
    openingHours,
    googleAnalyticsMeasurementId:
      row.google_analytics_measurement_id ?? business.googleAnalyticsMeasurementId,
  };
}

async function loadSettingsBundle() {
  if (!supabaseClient) {
    return null;
  }

  const [{ data: settingsRow, error: settingsError }, { data: openingRows, error: openingError }] =
    await Promise.all([
      supabaseClient
        .from('restaurant_settings')
        .select(
          'id, name, brand_line, address, phone_primary, phone_secondary, google_maps_url, announcement, is_ordering_enabled, is_temporarily_closed, google_analytics_measurement_id',
        )
        .limit(1)
        .maybeSingle(),
      supabaseClient
        .from('opening_hours')
        .select('day_of_week, opens_at, closes_at, is_closed')
        .order('day_of_week', { ascending: true }),
    ]);

  if (settingsError || !settingsRow || openingError) {
    return null;
  }

  const mapped = mapBusinessSettings(settingsRow as RestaurantSettingsRow, mapOpeningHours(openingRows as OpeningHourRow[]));
  businessStore = mapped;
  return {
    id: settingsRow.id,
    settings: mapped,
  };
}

export const adminService = {
  async getDashboardStats(): Promise<DashboardStats> {
    if (supabaseClient) {
      const { data: orders, error } = await supabaseClient
        .from('orders')
        .select('status, total, created_at')
        .order('created_at', { ascending: false });

      if (!error && orders) {
        const todayKey = new Date().toISOString().slice(0, 10);
        const todaysOrders = orders.filter((order) => order.created_at.slice(0, 10) === todayKey);
        const settingsBundle = await loadSettingsBundle();
        return simulateAsync({
          todaysOrders: todaysOrders.length,
          pendingOrders: orders.filter((order) => order.status === 'pending').length,
          revenueEstimate: orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0),
          completedOrders: orders.filter((order) => order.status === 'completed').length,
          openingStatus:
            settingsBundle?.settings.orderingEnabled
              ? 'Ouvert à la commande'
              : 'Commande désactivée',
          announcementStatus: settingsBundle?.settings.announcement ?? businessStore.announcement,
        }, 120);
      }
    }

    const completedOrders = mockOrders.filter((order) => order.status === 'completed').length;
    return simulateAsync({
      todaysOrders: mockOrders.length,
      pendingOrders: mockOrders.filter((order) => order.status === 'pending').length,
      revenueEstimate: mockOrders.reduce((sum, order) => sum + order.total, 0),
      completedOrders,
      openingStatus: businessStore.orderingEnabled ? 'Ouvert à la commande' : 'Commande désactivée',
      announcementStatus: businessStore.announcement,
    });
  },

  async getRecentOrders() {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('orders')
        .select('id, customer_name, customer_phone, customer_email, status, fulfillment_type, dining_mode, order_source, delivery_address, delivery_fee, desired_time, confirmation_status, proposed_time, customer_confirmation_required, customer_confirmed_at, restaurant_note, customer_note, notes, subtotal, total, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        return simulateAsync(
          data.map((row) => ({
            id: row.id,
            fulfillmentType: row.fulfillment_type,
            diningMode: row.dining_mode,
            orderSource: row.order_source,
            customerName: row.customer_name,
            customerPhone: row.customer_phone ?? undefined,
            customerEmail: row.customer_email ?? undefined,
            deliveryAddress: row.delivery_address ?? undefined,
            deliveryFee: Number(row.delivery_fee ?? 0),
            desiredTime: row.desired_time ?? undefined,
            confirmationStatus: row.confirmation_status,
            proposedTime: row.proposed_time ?? undefined,
            customerConfirmationRequired: row.customer_confirmation_required,
            customerConfirmedAt: row.customer_confirmed_at,
            restaurantNote: row.restaurant_note ?? undefined,
            customerNote: row.customer_note ?? undefined,
            status: row.status,
            paymentMode: 'online_payment_pending',
            createdAt: row.created_at,
            notes: row.notes ?? undefined,
            subtotal: Number(row.subtotal ?? 0),
            total: Number(row.total ?? 0),
            items: [],
          })),
          120,
        );
      }
    }

    return simulateAsync(mockOrders.slice(0, 5));
  },

  async getBestSellingProducts(): Promise<Array<Product & { soldCount: number }>> {
    if (supabaseClient) {
      const [{ data: orderItems, error: orderItemsError }, remoteProducts] = await Promise.all([
        supabaseClient.from('order_items').select('product_id, quantity'),
        import('./menuService').then(({ menuService }) => menuService.getProducts()),
      ]);

      if (!orderItemsError && orderItems) {
        const soldCountMap = new Map<string, number>();
        orderItems.forEach((item) => {
          if (item.product_id) {
            soldCountMap.set(item.product_id, (soldCountMap.get(item.product_id) ?? 0) + item.quantity);
          }
        });

        return simulateAsync(
          remoteProducts
            .map((product) => ({
              ...product,
              soldCount: soldCountMap.get(product.id) ?? 0,
            }))
            .sort((a, b) => b.soldCount - a.soldCount)
            .slice(0, 5),
          120,
        );
      }
    }

    const soldCountMap = new Map<string, number>();
    mockOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.productId) {
          soldCountMap.set(item.productId, (soldCountMap.get(item.productId) ?? 0) + item.quantity);
        }
      });
    });
    return simulateAsync(
      products
        .map((product) => ({
          ...product,
          soldCount: soldCountMap.get(product.id) ?? 0,
        }))
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, 5),
    );
  },

  async updateRestaurantSettings(updates: Partial<BusinessSettings>) {
    if (supabaseClient) {
      const currentBundle = (await loadSettingsBundle()) ?? {
        id: crypto.randomUUID(),
        settings: businessStore,
      };
      const nextSettings = { ...currentBundle.settings, ...updates };
      const addressLine = `${nextSettings.address}, ${nextSettings.postalCode} ${nextSettings.city}`;

      const { error } = await supabaseClient.from('restaurant_settings').upsert({
        id: currentBundle.id,
        name: nextSettings.name,
        brand_line: nextSettings.brandLine,
        address: addressLine,
        phone_primary: nextSettings.phonePrimary,
        phone_secondary: nextSettings.phoneSecondary,
        google_maps_url: nextSettings.mapUrl,
        announcement: nextSettings.announcement,
        is_ordering_enabled: nextSettings.orderingEnabled,
        is_temporarily_closed: !nextSettings.orderingEnabled,
        google_analytics_measurement_id: nextSettings.googleAnalyticsMeasurementId ?? null,
      });

      if (!error) {
        businessStore = nextSettings;
        return simulateAsync(nextSettings, 120);
      }
    }

    businessStore = { ...businessStore, ...updates };
    return simulateAsync(businessStore);
  },

  async updateOpeningHours(openingHours: OpeningHour[]) {
    if (supabaseClient) {
      const payload = openingHours.map((item) => ({
        day_of_week: dayLabels.indexOf(item.day),
        opens_at: item.opensAt ? `${item.opensAt}:00` : null,
        closes_at: item.closesAt ? `${item.closesAt}:00` : null,
        is_closed: item.isClosed,
      }));

      const { error } = await supabaseClient.from('opening_hours').upsert(payload, {
        onConflict: 'day_of_week',
      });

      if (!error) {
        businessStore = { ...businessStore, openingHours };
        return simulateAsync(openingHours, 120);
      }
    }

    businessStore = { ...businessStore, openingHours };
    return simulateAsync(openingHours);
  },

  async getRecentCustomers() {
    if (supabaseClient) {
      const { userService } = await import('./userService');
      return userService.getCustomers();
    }

    return simulateAsync(mockCustomers.slice(0, 5));
  },

  async getRestaurantSettings(): Promise<BusinessSettings> {
    const bundle = await loadSettingsBundle();
    if (bundle) {
      return simulateAsync(bundle.settings, 120);
    }
    return simulateAsync(businessStore);
  },
};
