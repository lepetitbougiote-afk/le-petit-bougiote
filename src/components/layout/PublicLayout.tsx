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
        <div className="pointer-events-none fixed inset-x-0 top-[5.6rem] z-[1080] px-3 sm:px-5 lg:inset-x-auto lg:bottom-8 lg:left-8 lg:top-auto lg:px-0">
          <div className="pointer-events-auto relative w-full max-w-[20.5rem] overflow-hidden rounded-[2.2rem] rounded-br-[3rem] border border-brand-green/15 bg-[linear-gradient(135deg,rgba(255,248,232,0.97),rgba(255,255,255,0.98))] p-[1.125rem] shadow-[0_18px_48px_-24px_rgba(0,0,0,0.38)] backdrop-blur-sm sm:max-w-[24rem] sm:rounded-[1.8rem] sm:rounded-br-[1.8rem] sm:p-5 lg:max-w-[28rem] lg:p-6">
            <div className="absolute -right-14 -top-14 h-28 w-28 rounded-full bg-brand-green/12 blur-2xl lg:h-36 lg:w-36" />
            <div className="absolute -bottom-12 -left-8 h-24 w-24 rounded-full bg-brand-wood/10 blur-2xl lg:h-28 lg:w-28" />
            <button
              type="button"
              onClick={dismissAnnouncementModal}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-green/10 bg-white/90 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-900 lg:right-4 lg:top-4 lg:h-10 lg:w-10"
              aria-label="Fermer l'annonce"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="relative">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-brand-green/80 sm:text-xs lg:text-sm">
                Nouveaux horaires
              </p>
              <h2 className="mt-2 max-w-[12.75rem] pr-10 text-[1.2rem] font-semibold leading-[1.08] tracking-tight text-slate-950 sm:max-w-[18rem] sm:text-[1.8rem] lg:mt-3 lg:max-w-[20rem] lg:text-[2.2rem]">
                Nouveaux horaires d'été à partir de lundi
              </h2>
              <p className="mt-2.5 max-w-[15.75rem] text-[0.88rem] leading-5 text-slate-700 sm:max-w-[20rem] sm:text-[1.02rem] lg:mt-4 lg:max-w-md lg:text-[1.08rem] lg:leading-7">
                {publicAnnouncement}
              </p>
              <button
                type="button"
                onClick={dismissAnnouncementModal}
                className="mt-3.5 rounded-full bg-brand-deepgreen px-4 py-2.5 text-[0.88rem] font-semibold text-white shadow-lg shadow-brand-deepgreen/20 sm:px-4 sm:py-2.5 sm:text-sm lg:mt-5 lg:px-5 lg:py-3"
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
