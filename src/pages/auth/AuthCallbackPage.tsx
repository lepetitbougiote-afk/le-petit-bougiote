import { Navigate } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';
import { useAuth } from '../../contexts/AuthContext';
import { getPostLoginPath } from '../../lib/utils';

export default function AuthCallbackPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <>
        <SEO title="Connexion en cours | Le Petit Bougiote Béziers" description="Connexion en cours..." path="/auth/callback" />
        <section className="mx-auto flex max-w-md px-4 py-16 sm:px-6 lg:px-8">
          <div className="w-full rounded-[2rem] bg-white p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-green/70">Connexion</p>
            <h1 className="mt-4 text-2xl font-semibold text-slate-950">Connexion en cours...</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">Nous préparons votre espace et votre redirection.</p>
          </div>
        </section>
      </>
    );
  }

  if (!user) {
    return <Navigate to="/connexion" replace />;
  }

  return <Navigate to={getPostLoginPath(user)} replace />;
}
