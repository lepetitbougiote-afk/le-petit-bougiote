import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import logoImage from '../../assets/logo.png';
import { SEO } from '../../components/seo/SEO';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import type { UserProfile } from '../../types';

export default function AccountPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    userService.getProfile().then(setProfile);
  }, [user]);

  if (!loading && !user) {
    return <Navigate to="/connexion" replace />;
  }

  return (
    <>
      <SEO title="Compte | Le Petit Bougiote Béziers" description="Profil client, coordonnées et accès à l’historique de commandes." path="/compte" />
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] bg-white p-8">
            <img src={logoImage} alt="Le Petit Bougiote Coffee & Burger" className="h-20 w-20 rounded-full object-cover" />
            <h1 className="mt-6 text-3xl font-semibold text-slate-950">Mon compte</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">Retrouvez ici vos coordonnées et vos commandes récentes.</p>
          </div>
          <div className="rounded-[2rem] bg-white p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-brand-cream p-5">
                <p className="text-sm text-slate-500">Nom</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{profile?.fullName ?? '...'}</p>
              </div>
              <div className="rounded-3xl bg-brand-cream p-5">
                <p className="text-sm text-slate-500">Téléphone</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{profile?.phone ?? '...'}</p>
              </div>
              <div className="rounded-3xl bg-brand-cream p-5 sm:col-span-2">
                <p className="text-sm text-slate-500">Email</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{profile?.email ?? '...'}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/compte/commandes" className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white">Mes commandes</Link>
              <button type="button" onClick={() => void logout()} className="rounded-full border border-brand-green/10 px-5 py-3 text-sm font-semibold text-slate-700">
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
