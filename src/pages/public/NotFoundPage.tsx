import { Link } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <SEO title="Page introuvable | Le Petit Bougiote" description="Cette page n’existe pas ou a été déplacée." path="/404" noindex />
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-green/70">Erreur 404</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">Cette page est introuvable</h1>
      <p className="mt-4 leading-7 text-slate-600">Retrouvez les informations utiles depuis l’accueil, la carte ou la page contact.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="rounded-full bg-brand-deepgreen px-5 py-3 text-sm font-semibold text-white">Accueil</Link>
        <Link to="/menu" className="rounded-full border border-brand-border bg-white px-5 py-3 text-sm font-semibold text-slate-700">Menu</Link>
        <Link to="/contact" className="rounded-full border border-brand-border bg-white px-5 py-3 text-sm font-semibold text-slate-700">Contact</Link>
      </div>
    </section>
  );
}
