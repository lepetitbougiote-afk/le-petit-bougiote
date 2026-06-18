import { X } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { ScrollToTop } from './ScrollToTop';
import { PublicFooter } from '../public/PublicFooter';
import { PublicNavbar } from '../public/PublicNavbar';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { useEffect, useMemo, useState } from 'react';

export function PublicLayout() {
  const { loading, orderingDisabledMessage, settings } = useRestaurant();
  const [showOrderingModal, setShowOrderingModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const publicAnnouncement = settings.announcement.trim();
  const modalStorageKey = useMemo(
    () => `bougiote-ordering-modal:${settings.orderingEnabled ? 'open' : orderingDisabledMessage}`,
    [orderingDisabledMessage, settings.orderingEnabled],
  );
  const announcementStorageKey = useMemo(
    () => `bougiote-announcement:${publicAnnouncement}`,
    [publicAnnouncement],
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

  useEffect(() => {
    if (loading || !publicAnnouncement) {
      setShowAnnouncementModal(false);
      return;
    }

    if (typeof window === 'undefined') {
      setShowAnnouncementModal(true);
      return;
    }

    const alreadySeen = window.sessionStorage.getItem(announcementStorageKey) === 'seen';
    setShowAnnouncementModal(!alreadySeen);
  }, [announcementStorageKey, loading, publicAnnouncement]);

  function dismissOrderingModal() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(modalStorageKey, 'seen');
    }
    setShowOrderingModal(false);
  }

  function dismissAnnouncementModal() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(announcementStorageKey, 'seen');
    }
    setShowAnnouncementModal(false);
  }

  return (
    <div className="min-h-screen bg-brand-cream text-slate-900">
      <ScrollToTop />
      <PublicNavbar />
      {!loading && publicAnnouncement && showAnnouncementModal ? (
        <div className="fixed inset-0 z-[1080] grid place-items-start bg-slate-950/45 px-4 pt-24 sm:pt-28">
          <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-brand-green/15 bg-[linear-gradient(135deg,rgba(255,248,232,0.98),rgba(255,255,255,0.98))] p-6 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-7">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-green/12 blur-2xl" />
            <div className="absolute -bottom-14 -left-10 h-32 w-32 rounded-full bg-brand-wood/10 blur-2xl" />
            <button
              type="button"
              onClick={dismissAnnouncementModal}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-green/10 bg-white/90 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-900"
              aria-label="Fermer l'annonce"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="relative">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-green/80">
                Nouveaux horaires
              </p>
              <h2 className="mt-3 max-w-[24rem] text-2xl font-semibold leading-tight text-slate-950 sm:text-[2rem]">
                Nouveaux horaires d'été à partir de lundi
              </h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-slate-700 sm:text-lg">
                {publicAnnouncement}
              </p>
              <button
                type="button"
                onClick={dismissAnnouncementModal}
                className="mt-6 rounded-full bg-brand-deepgreen px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-deepgreen/20"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
