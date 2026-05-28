import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import logoImage from '../../assets/logo.png';
import { SEO } from '../../components/seo/SEO';
import { useAuth } from '../../contexts/AuthContext';
import { getPostLoginPath } from '../../lib/utils';

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={getPostLoginPath(user)} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      fullName: String(formData.get('fullName') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      password: String(formData.get('password') ?? ''),
    };

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const profile = await register(payload);
      if (profile) {
        navigate(getPostLoginPath(profile));
        return;
      }
      setMessage('Votre compte a été créé. Vérifiez votre boîte mail si une confirmation est demandée.');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Inscription impossible.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SEO title="Inscription | Le Petit Bougiote Béziers" description="Créez votre compte client pour préparer vos prochaines commandes plus facilement." path="/inscription" />
      <section className="mx-auto flex max-w-md px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full rounded-[2rem] bg-white p-8">
          <img src={logoImage} alt="Le Petit Bougiote Coffee & Burger" className="mx-auto h-20 w-20 rounded-full object-cover" />
          <h1 className="mt-6 text-center text-3xl font-semibold text-slate-950">Créer un compte</h1>
          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            <input name="fullName" placeholder="Nom complet" className="rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none" required />
            <input name="email" type="email" placeholder="Email" className="rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none" required />
            <input name="password" placeholder="Mot de passe" type="password" className="rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none" required minLength={6} />
            {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
            <button type="submit" disabled={submitting} className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
              {submitting ? 'Création...' : 'Créer le compte'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">Déjà inscrit ? <Link to="/connexion" className="font-semibold text-brand-green">Connexion</Link></p>
        </div>
      </section>
    </>
  );
}
