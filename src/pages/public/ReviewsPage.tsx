import { ExternalLink, Star } from 'lucide-react';
import { SEO } from '../../components/seo/SEO';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { business, reviewStat } from '../../data/business';

export default function ReviewsPage() {
  return (
    <>
      <SEO
        title="Avis clients | Le Petit Bougiote Béziers"
        description="Consultez la note Google du Petit Bougiote, retrouvez le lien vers les avis et laissez votre propre retour."
        path="/avis"
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Avis"
          title="5,0 / 5 sur Google"
          description="Une page simple et claire pour retrouver la note Google du restaurant et accéder directement aux avis."
          align="center"
        />
        <div className="mx-auto mt-8 max-w-xl rounded-[2rem] bg-[linear-gradient(145deg,#2F5E33,#3E281A)] p-8 text-center text-white">
          <div className="flex justify-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className="h-6 w-6 fill-white text-white" />
            ))}
          </div>
          <p className="mt-4 text-5xl font-semibold">{reviewStat.rating.toFixed(1).replace('.', ',')}</p>
          <p className="mt-2 text-white/70">{reviewStat.reviewCountLabel}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href={business.reviewUrl} target="_blank" rel="noreferrer" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-green">
              Voir les avis Google
            </a>
            <a href={business.leaveReviewUrl} target="_blank" rel="noreferrer" className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white">
              Laisser un avis
            </a>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-3xl rounded-[2rem] bg-white p-8 text-center shadow-[0_18px_45px_-34px_rgba(62,40,26,0.25)]">
          <p className="text-lg font-semibold text-slate-950">Retrouvez la fiche Google du restaurant pour consulter les avis les plus récents ou partager votre expérience.</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">Consultez les retours les plus récents directement sur Google ou partagez votre propre expérience après votre passage.</p>
          <a href={business.reviewUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center text-sm font-semibold text-brand-green">
            Ouvrir la fiche Google <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </div>
      </section>
    </>
  );
}
