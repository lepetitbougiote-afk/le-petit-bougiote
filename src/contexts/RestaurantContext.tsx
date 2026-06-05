import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { business } from '../data/business';
import { adminService } from '../services/adminService';
import type { BusinessSettings } from '../types';

interface RestaurantContextValue {
  settings: BusinessSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  orderingDisabledMessage: string;
}

const DEFAULT_DISABLED_MESSAGE =
  'Les commandes en ligne sont temporairement indisponibles pour le moment. Merci de revenir un peu plus tard ou de nous appeler directement.';

const RestaurantContext = createContext<RestaurantContextValue | undefined>(undefined);

function getOrderingDisabledMessage(settings: BusinessSettings) {
  return settings.announcement.trim() || DEFAULT_DISABLED_MESSAGE;
}

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BusinessSettings>(business);
  const [loading, setLoading] = useState(true);

  async function refreshSettings() {
    const nextSettings = await adminService.getRestaurantSettings();
    setSettings(nextSettings);
    setLoading(false);
  }

  useEffect(() => {
    void refreshSettings();
  }, []);

  const value = useMemo<RestaurantContextValue>(
    () => ({
      settings,
      loading,
      refreshSettings,
      orderingDisabledMessage: getOrderingDisabledMessage(settings),
    }),
    [loading, settings],
  );

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within RestaurantProvider');
  }
  return context;
}
