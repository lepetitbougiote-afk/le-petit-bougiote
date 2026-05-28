import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import logoImage from '../../assets/logo.png';
import { SEO } from '../../components/seo/SEO';
import { useAuth } from '../../contexts/AuthContext';
import { needsProfileCompletion } from '../../lib/utils';
import { userService } from '../../services/userService';
import type { UserProfile } from '../../types';

export default function AccountPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading, logout, refreshUser } = useAuth();
  const shouldCompleteProfile = needsProfileCompletion(profile) || searchParams.get('complete') === '1';

  useEffect(() => {
    userService.getProfile().then(setProfile);
  }, [user]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setForm({
      fullName: profile.fullName,
      phone: profile.phone,
      email: profile.email,
      address: profile.address,
    });
  }, [profile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSavedMessage('');
    setError('');

    try {
      const updatedProfile = await userService.updateProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: profile?.email ?? form.email.trim(),
        address: form.address.trim(),
      });

      setProfile(updatedProfile);
      await refreshUser();
      setSavedMessage('Vos informations ont bien été enregistrées.');

      if (searchParams.get('complete') === '1') {
        const next = new URLSearchParams(searchParams);
        next.delete('complete');
        setSearchParams(next, { replace: true });
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  }

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
            {shouldCompleteProfile ? (
              <div className="mt-6 rounded-3xl border border-brand-green/10 bg-brand-offwhite p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-green/70">Profil à compléter</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Ajoutez votre téléphone et votre adresse une fois pour retrouver un checkout plus rapide lors de vos prochaines commandes.
                </p>
              </div>
            ) : null}
          </div>
          <div className="rounded-[2rem] bg-white p-8">
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Nom
                  <input
                    value={form.fullName}
                    onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                    required
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Téléphone
                  <input
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                    required
                  />
                </label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                  Adresse
                  <input
                    value={form.address}
                    onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                    placeholder="Ex: 28 Rue Diderot, 34500 Béziers"
                    required
                  />
                </label>
                <div className="rounded-3xl bg-brand-cream p-5 sm:col-span-2">
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{profile?.email ?? '...'}</p>
                </div>
              </div>
              {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
              {savedMessage ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{savedMessage}</p> : null}
              <div className="mt-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer mes informations'}
                </button>
              </div>
            </form>
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
