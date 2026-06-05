import { Outlet } from 'react-router-dom';
import { ScrollToTop } from './ScrollToTop';
import { PublicFooter } from '../public/PublicFooter';
import { PublicNavbar } from '../public/PublicNavbar';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { useEffect, useMemo, useState } from 'react';

export function PublicLayout() {
  const { loading, orderingDisabledMessage, settings } = useRestaurant();
  const [showOrderingModal, setShowOrderingModal] = useState(false);
  const modalStorageKey = useMemo(
    () => `bougiote-ordering-modal:${settings.orderingEnabled ? 'open' : orderingDisabledMessage}`,
    [orderingDisabledMessage, settings.orderingEnabled],
  );

  useEffect(() => {
    if (loading || settings.orderingEnabled) {
      setShowOrderingModal(false);
      return;
    }

    if (typeof window === 'undefined') {
      setShowOrderingModal(true);
      return;
    }

    const alreadySeen = window.sessionStorage.getItem(modalStorageKey) === 'seen';
    setShowOrderingModal(!alreadySeen);
  }, [loading, modalStorageKey, settings.orderingEnabled]);

  function dismissOrderingModal() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(modalStorageKey, 'seen');
    }
    setShowOrderingModal(false);
  }

  return (
    <div className="min-h-screen bg-brand-cream text-slate-900">
      <ScrollToTop />
      <PublicNavbar />
      {!loading && !settings.orderingEnabled && showOrderingModal ? (
        <div className="fixed inset-0 z-[1100] grid place-items-center bg-slate-950/55 px-4">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl shadow-black/20">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-wood/75">
              Information importante
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              Les commandes en ligne sont temporairement fermées
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{orderingDisabledMessage}</p>
            <button
              type="button"
              onClick={dismissOrderingModal}
              className="mt-6 rounded-full bg-brand-deepgreen px-5 py-3 text-sm font-semibold text-white"
            >
              J’ai compris
            </button>
          </div>
        </div>
      ) : null}
      <main>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
