import { Link } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { blogArticles } from '../../data/blogArticles';
import { breadcrumbSchema, webPageSchema } from '../../lib/schema';

const title = 'Conseils restaurant et burger à Béziers | Blog';
const description = 'Guides locaux pour choisir un restaurant, un burger, une pause café ou une vente à emporter dans le centre-ville de Béziers.';

export default function BlogIndexPage() {
  return (
    <>
      <SEO
        title={title}
        description={description}
        path="/blog"
        schemas={[
          webPageSchema('/blog', title, description),
          breadcrumbSchema([{ name: 'Accueil', path: '/' }, { name: 'Blog', path: '/blog' }]),
        ]}
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          level={1}
          eyebrow="Guides locaux"
          title="Manger et faire une pause au centre-ville de Béziers"
          description="Des conseils pratiques sur les burgers, le café, les desserts et la vente à emporter, avec des informations vérifiées sur Le Petit Bougiote."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {blogArticles.map((article) => (
            <article key={article.slug} className="rounded-[2rem] border border-brand-green/10 bg-white p-7 shadow-[0_18px_45px_-34px_rgba(62,40,26,0.25)]">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-green/70">Béziers centre-ville</p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight text-slate-950">
                <Link to={`/blog/${article.slug}`} className="hover:text-brand-green">{article.title}</Link>
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">{article.excerpt}</p>
              <Link to={`/blog/${article.slug}`} className="mt-6 inline-flex rounded-full bg-brand-deepgreen px-5 py-3 text-sm font-semibold text-white">
                Lire le guide
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
