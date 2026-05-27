import { Clock3, ExternalLink, MapPin, Phone, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';
import { Reveal } from '../../components/ui/Reveal';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { business } from '../../data/business';
import { analyticsService } from '../../services/analyticsService';

export default function ContactPage() {
  return (
    <>
      <SEO
        title="Contact & horaires | Le Petit Bougiote Béziers"
        description="Adresse, téléphones, horaires et accès pour rejoindre Le Petit Bougiote au 28 Rue Diderot à Béziers."
        path="/contact"
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Contact"
          title="Adresse, horaires et accès"
          description="Retrouvez facilement l’adresse, les horaires et les liens utiles pour venir sur place, appeler ou préparer une livraison."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal className="grid gap-4">
            <div className="rounded-[1.8rem] bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-cream text-brand-deepgreen"><MapPin className="h-5 w-5" /></div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-green/70">Adresse</p>
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{business.address}</p>
              <p className="mt-1 text-slate-600">{business.postalCode} {business.city}</p>
            </div>
            <div className="rounded-[1.8rem] bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-cream text-brand-deepgreen"><Phone className="h-5 w-5" /></div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-green/70">Téléphones</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {[business.phonePrimary, business.phoneSecondary].map((phone) => (
                  <a
                    key={phone}
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    onClick={() => analyticsService.trackCallClick()}
                    className="rounded-full bg-brand-cream px-5 py-3 text-sm font-semibold text-slate-700"
                  >
                    {phone}
                  </a>
                ))}
              </div>
            </div>
            <div className="rounded-[1.8rem] bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-cream text-brand-deepgreen"><Clock3 className="h-5 w-5" /></div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-green/70">Horaires</p>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-700">
                {business.openingHours.map((item) => (
                  <div key={item.day} className="flex items-center justify-between rounded-2xl bg-brand-cream px-4 py-3">
                    <span>{item.day}</span>
                    <span>{item.isClosed ? 'Fermé' : `${item.opensAt?.replace(':', 'h')} – ${item.closesAt?.replace(':', 'h')}`}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <a href={business.mapUrl} target="_blank" rel="noreferrer" onClick={() => analyticsService.trackDirectionsClick()} className="rounded-full bg-brand-deepgreen px-5 py-3 text-center text-sm font-semibold text-white">
                Itinéraire
              </a>
              <a href={business.mapUrl} target="_blank" rel="noreferrer" onClick={() => analyticsService.trackDirectionsClick()} className="rounded-full border border-brand-border bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700">
                Ouvrir dans Google Maps
              </a>
              <a href={`tel:${business.phonePrimary.replace(/\s+/g, '')}`} onClick={() => analyticsService.trackCallClick()} className="rounded-full border border-brand-border bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700">
                Appeler 04 58 28 15 22
              </a>
              <a href={`tel:${business.phoneSecondary.replace(/\s+/g, '')}`} onClick={() => analyticsService.trackCallClick()} className="rounded-full border border-brand-border bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700">
                Appeler 07 59 71 46 29
              </a>
              <Link to="/livraison" className="rounded-full bg-brand-wood px-5 py-3 text-center text-sm font-semibold text-white sm:col-span-2">
                Livraison
              </Link>
            </div>
            <div className="rounded-[1.8rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-cream text-brand-deepgreen"><Star className="h-5 w-5" /></div>
                <div>
                  <p className="text-lg font-semibold text-slate-950">5,0 / 5 sur Google</p>
                  <p className="text-sm text-slate-600">{business.reviewCountLabel} • {business.priceRange}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
                <span className="rounded-full bg-brand-cream px-4 py-2">Sur place</span>
                <span className="rounded-full bg-brand-cream px-4 py-2">Livraison & retrait</span>
              </div>
            </div>
          </Reveal>
          <Reveal className="overflow-hidden rounded-[2rem] border border-brand-green/10 bg-white" delay={120}>
            <div className="flex items-center gap-3 border-b border-brand-green/10 px-6 py-4">
              <Clock3 className="h-5 w-5 text-brand-green" />
              <p className="font-semibold text-slate-950">Carte / Google Maps</p>
            </div>
            <div className="bg-[linear-gradient(145deg,#edf4e9,#fbf8f2)] p-3 md:p-4">
              <div className="overflow-hidden rounded-[1.6rem] border border-brand-green/10 bg-white shadow-[0_18px_45px_-34px_rgba(62,40,26,0.3)]">
                <iframe
                  title="Carte Google Maps Le Petit Bougiote"
                  src="https://www.google.com/maps?q=28%20Rue%20Diderot%2C%2034500%20B%C3%A9ziers&z=17&output=embed"
                  className="h-[420px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="flex justify-center p-5">
                <a href={business.mapUrl} target="_blank" rel="noreferrer" onClick={() => analyticsService.trackDirectionsClick()} className="inline-flex items-center rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white">
                  Ouvrir la fiche Google Maps <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      <a href={`tel:${business.phonePrimary.replace(/\s+/g, '')}`} className="fixed bottom-4 right-4 inline-flex items-center rounded-full bg-brand-deepgreen px-5 py-3 text-sm font-semibold text-white shadow-2xl lg:hidden">
        <Phone className="mr-2 h-4 w-4" />
        Appeler
      </a>
    </>
  );
}
