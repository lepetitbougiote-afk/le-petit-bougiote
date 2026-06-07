import { Bell, LayoutDashboard, MenuSquare, Settings, Users, UtensilsCrossed, Image as ImageIcon, Clock3, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, NavLink, Outlet } from 'react-router-dom';
import logoImage from '../../assets/logo.png';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/commandes', label: 'Commandes', icon: ClipboardList },
  { to: '/admin/menu', label: 'Menu', icon: MenuSquare },
  { to: '/admin/produits', label: 'Produits', icon: UtensilsCrossed },
  { to: '/admin/categories', label: 'Catégories', icon: MenuSquare },
  { to: '/admin/clients', label: 'Clients', icon: Users },
  { to: '/admin/profils', label: 'Profils', icon: Users },
  { to: '/admin/galerie', label: 'Galerie', icon: ImageIcon },
  { to: '/admin/horaires', label: 'Horaires', icon: Clock3 },
  { to: '/admin/parametres', label: 'Paramètres', icon: Settings },
];

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f6f0] px-6 text-center">
        <div className="rounded-[2rem] bg-white px-8 py-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-green/70">Admin</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">Chargement de votre espace de gestion...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return <Navigate to="/connexion" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f7f6f0] text-slate-900 lg:grid lg:grid-cols-[280px_1fr]">
      <aside className={cn('border-r border-brand-green/10 bg-white px-5 py-6 lg:block', open ? 'block' : 'hidden lg:block')}>
        <Link to="/" className="flex items-center gap-3">
          <img src={logoImage} alt="Le Petit Bougiote Coffee & Burger" className="h-12 w-12 rounded-full object-cover" />
          <div>
            <p className="text-base font-semibold">Le Petit Bougiote</p>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-green/70">Admin</p>
          </div>
        </Link>
        <nav className="mt-8 grid gap-2">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium',
                    isActive ? 'bg-brand-green text-white' : 'text-slate-700 hover:bg-brand-cream',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-brand-green/10 bg-white/92 px-4 py-4 backdrop-blur sm:px-6">
          <button className="rounded-full border border-brand-green/10 px-4 py-2 text-sm font-semibold lg:hidden" onClick={() => setOpen((value) => !value)}>
            Menu admin
          </button>
          <div>
            <p className="text-sm font-semibold text-slate-950">Espace gestion</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-cream text-brand-green">
            <Bell className="h-5 w-5" />
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
