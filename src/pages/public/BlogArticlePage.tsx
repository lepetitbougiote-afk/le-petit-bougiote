import { Link, Navigate, useParams } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';
import { getBlogArticle } from '../../data/blogArticles';
import { SEO_CONFIG } from '../../config/seo';
import { articleSchema, breadcrumbSchema } from '../../lib/schema';

export default function BlogArticlePage() {
  const { slug } = useParams();
  const article = getBlogArticle(slug);

  if (!article) {
    return <Navigate to="/404" replace />;
  }

  const path = `/blog/${article.slug}`;

  return (
    <>
      <SEO
        title={article.metaTitle}
        description={article.description}
        path={path}
        type="article"
        schemas={[
          articleSchema(article),
          breadcrumbSchema([
            { name: 'Accueil', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: article.title, path },
          ]),
        ]}
      />
      <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <nav aria-label="Fil d’Ariane" className="text-sm text-slate-600">
          <Link to="/">Accueil</Link> <span aria-hidden="true">/</span> <Link to="/blog">Blog</Link>
        </nav>
        <header className="mt-7 rounded-[2rem] bg-white p-7 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-green/70">Guide local • Béziers</p>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">{article.title}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">{article.excerpt}</p>
        </header>

        <div className="mt-10 space-y-10">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{section.heading}</h2>
              <div className="mt-4 space-y-4 text-base leading-8 text-slate-700">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}

          <section className="rounded-[2rem] bg-white p-7 sm:p-9">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Questions fréquentes</h2>
            <div className="mt-6 space-y-6">
              {article.faq.map((item) => (
                <div key={item.question}>
                  <h3 className="text-lg font-semibold text-slate-950">{item.question}</h3>
                  <p className="mt-2 leading-7 text-slate-600">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-[2rem] bg-[linear-gradient(145deg,#2F5E33,#3E281A)] p-7 text-white sm:p-9">
            <h2 className="text-3xl font-semibold">Préparer votre venue</h2>
            <p className="mt-4 leading-7 text-white/80">
              Le Petit Bougiote • {SEO_CONFIG.address.street}, {SEO_CONFIG.address.postalCode} {SEO_CONFIG.address.city} • {SEO_CONFIG.phoneDisplay}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={`tel:${SEO_CONFIG.phoneInternational}`} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-green">Appeler</a>
              <Link to="/menu" className="rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white">Voir la carte</Link>
              <Link to="/contact" className="rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white">Adresse et itinéraire</Link>
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}
