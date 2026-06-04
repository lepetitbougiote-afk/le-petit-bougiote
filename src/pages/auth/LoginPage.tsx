import { FormEvent, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import logoImage from '../../assets/logo.png';
import { SEO } from '../../components/seo/SEO';
import { useAuth } from '../../contexts/AuthContext';
import { getPostLoginPath, sanitizeRedirectPath } from '../../lib/utils';

export default function LoginPage() {
  const { login, loginWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const redirectPath = useMemo(() => sanitizeRedirectPath(searchParams.get('redirect')), [searchParams]);

  if (!loading && user) {
    return <Navigate to={redirectPath ?? getPostLoginPath(user)} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    setSubmitting(true);
    setError('');
    try {
      const profile = await login(email, password);
      navigate(redirectPath ?? getPostLoginPath(profile));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Connexion impossible.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SEO title="Connexion | Le Petit Bougiote Béziers" description="Connexion client pour retrouver ses informations et ses commandes." path="/connexion" />
      <section className="mx-auto flex max-w-md px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full rounded-[2rem] bg-white p-8">
          <img src={logoImage} alt="Le Petit Bougiote Coffee & Burger" className="mx-auto h-20 w-20 rounded-full object-cover" />
          <h1 className="mt-6 text-center text-3xl font-semibold text-slate-950">Connexion</h1>
          <p className="mt-3 text-center text-sm leading-7 text-slate-600">Retrouvez vos informations et vos commandes depuis votre espace client.</p>
          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            <input name="email" type="email" placeholder="Email" className="rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none" required />
            <input name="password" placeholder="Mot de passe" type="password" className="rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none" required />
            {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            <button type="submit" disabled={submitting} className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
              {submitting ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => void loginWithGoogle(redirectPath ?? undefined)}
              className="w-full rounded-full border border-brand-green/10 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              Continuer avec Google
            </button>
          </div>
          <p className="mt-6 text-center text-sm text-slate-600">Pas encore de compte ? <Link to={redirectPath ? `/inscription?redirect=${encodeURIComponent(redirectPath)}` : '/inscription'} className="font-semibold text-brand-green">Créer un compte</Link></p>
        </div>
      </section>
    </>
  );
}
