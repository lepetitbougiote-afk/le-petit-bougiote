import { Menu, Phone, ShoppingBag, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink } from 'react-router-dom';
import logoImage from '../../assets/logo.png';
import { business } from '../../data/business';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsService } from '../../services/analyticsService';
import { cn } from '../../lib/utils';

const navLinks = [
  { label: 'Accueil', to: '/' },
  { label: 'Menu', to: '/menu' },
  { label: 'Livraison', to: '/livraison' },
  { label: 'À propos', to: '/a-propos' },
  { label: 'Galerie', to: '/galerie' },
  { label: 'Avis', to: '/avis' },
  { label: 'Contact', to: '/contact' },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const { totalItems } = useCart();
  const { user } = useAuth();
  const accountTarget =
    user?.role === 'admin' || user?.role === 'super_admin'
      ? '/admin/dashboard'
      : user
        ? '/compte/commandes'
        : '/connexion';
  const accountLabel =
    user?.role === 'admin' || user?.role === 'super_admin'
      ? 'Admin'
      : user
        ? 'Mes commandes'
        : 'Connexion';

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-[1000] border-b border-brand-border/70 bg-brand-offwhite/96 shadow-[0_12px_40px_-28px_rgba(62,40,26,0.5)] backdrop-blur">
      <div className="relative z-[70] mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <img src={logoImage} alt="Le Petit Bougiote Coffee & Burger" className="h-12 w-12 rounded-full object-cover ring-1 ring-brand-green/10" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight text-slate-950">{business.name}</p>
            <p className="truncate text-xs font-medium uppercase tracking-[0.25em] text-brand-green/70">{business.brandLine}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'text-sm font-medium transition-colors hover:text-brand-green',
                  isActive ? 'text-brand-green' : 'text-slate-600',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/panier" className="relative inline-flex h-11 items-center justify-center rounded-full border border-brand-green/15 px-4 text-sm font-semibold text-slate-700 hover:border-brand-green/35">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Panier
            {totalItems > 0 ? <span className="ml-2 rounded-full bg-brand-green px-2 py-0.5 text-xs text-white">{totalItems}</span> : null}
          </Link>
          <Link
            to={accountTarget}
            className="inline-flex h-11 items-center justify-center rounded-full border border-brand-green/15 px-4 text-sm font-semibold text-slate-700 hover:border-brand-green/35"
          >
            <User className="mr-2 h-4 w-4" />
            {accountLabel}
          </Link>
          <a
            href={`tel:${business.phonePrimary.replace(/\s+/g, '')}`}
            onClick={() => analyticsService.trackCallClick()}
            className="inline-flex h-11 items-center justify-center rounded-full bg-brand-green px-5 text-sm font-semibold text-white shadow-lg shadow-brand-green/20"
          >
            <Phone className="mr-2 h-4 w-4" />
            Appeler
          </a>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Link
            to="/panier"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-border bg-white text-slate-700 shadow-sm"
            aria-label="Voir le panier"
          >
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand-green px-1 text-[11px] font-semibold text-white">
                {totalItems}
              </span>
            ) : null}
          </Link>
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-border bg-white text-slate-700 shadow-sm" onClick={() => setOpen((value) => !value)} aria-label="Ouvrir le menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && typeof document !== 'undefined'
        ? createPortal(
        <div className="fixed inset-0 z-[999] lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-brand-espresso/38 backdrop-blur-[4px]"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 top-[74px] bottom-0 z-[1000] max-h-[calc(100vh-74px)] overflow-y-auto border-t border-brand-border/80 bg-[linear-gradient(180deg,rgba(251,248,242,1),rgba(245,240,230,1))] shadow-[0_18px_45px_-28px_rgba(62,40,26,0.55)]">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:px-6">
            <div className="rounded-[1.75rem] bg-[linear-gradient(135deg,rgba(74,139,69,0.09),rgba(62,40,26,0.08))] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-wood/75">Coffee & Burger</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">Burgers gourmands, pauses café et douceurs à Béziers.</p>
            </div>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-2xl px-4 py-3.5 text-sm font-medium shadow-sm',
                    isActive ? 'bg-brand-deepgreen text-white' : 'bg-white text-slate-700',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Link to="/panier" onClick={() => setOpen(false)} className="rounded-2xl border border-brand-border bg-white px-4 py-3.5 text-center text-sm font-semibold text-slate-700 shadow-sm">
                Panier {totalItems > 0 ? `(${totalItems})` : ''}
              </Link>
              <Link
                to={accountTarget}
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-brand-border bg-white px-4 py-3.5 text-center text-sm font-semibold text-slate-700 shadow-sm"
              >
                {accountLabel}
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <a
                href={`tel:${business.phonePrimary.replace(/\s+/g, '')}`}
                onClick={() => analyticsService.trackCallClick()}
                className="rounded-2xl bg-brand-deepgreen px-4 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-brand-deepgreen/20"
              >
                Appeler
              </a>
            </div>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </header>
  );
}
