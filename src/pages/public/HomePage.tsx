import { MapPin, Phone, ShoppingBag, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';
import { Reveal } from '../../components/ui/Reveal';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { getTodayOpeningStatus } from '../../lib/utils';
import { analyticsService } from '../../services/analyticsService';
import heroBackground from '../../../identity/hero picture.png';
import heroBackgroundMobile from '../../assets/hero-section-mobile version.png';
import heroMobileLogo from '../../assets/transparent-logo-hero.png';
import beefBurgers from '../../assets/menu/beef-burgers.webp';
import cesarSalad from '../../assets/menu/cesar-salad.webp';
import salonMonde from '../../assets/venue/salon-monde.jpg';

export default function HomePage() {
  const { settings } = useRestaurant();
  const galleryHighlights = [
    {
      title: 'Burger signature',
      description: 'Un burger généreux préparé minute, au coeur de la carte.',
      image: beefBurgers,
      alt: 'Burger signature du Petit Bougiote',
    },
    {
      title: 'Salade fraîche',
      description: 'Une option fraîche et équilibrée pour varier les envies.',
      image: cesarSalad,
      alt: 'Salade du Petit Bougiote',
    },
    {
      title: 'Salon animé',
      description: 'Une ambiance simple et familiale.',
      image: salonMonde,
      alt: 'Salon du Petit Bougiote avec des clients',
    },
  ];

  return (
    <>
      <SEO
        title="Le Petit Bougiote Béziers | Coffee, Burger & Desserts"
        description="Restaurant convivial à Béziers, Le Petit Bougiote propose burgers, cafés, desserts, boissons et vente à emporter au 28 Rue Diderot."
        path="/"
      />

      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroBackgroundMobile}
            alt="Le Petit Bougiote Coffee & Burger"
            className="h-full w-full object-cover object-[center_18%] lg:hidden"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <img
            src={heroBackground}
            alt="Le Petit Bougiote Coffee & Burger"
            className="hidden h-full w-full object-cover object-[center_38%] lg:block"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_34%),linear-gradient(180deg,rgba(5,18,29,0.18)_0%,rgba(8,20,31,0.10)_20%,rgba(10,22,32,0.18)_52%,rgba(10,20,28,0.42)_100%)] lg:bg-[radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.18),transparent_22%),linear-gradient(115deg,rgba(3,17,28,0.62)_0%,rgba(7,20,32,0.40)_28%,rgba(11,23,33,0.16)_50%,rgba(10,18,28,0.12)_100%)]" />
        </div>
        <div className="relative mx-auto min-h-[47rem] max-w-7xl px-4 pb-12 pt-5 sm:min-h-[52rem] sm:px-6 sm:pb-14 sm:pt-6 lg:min-h-[50rem] lg:px-6 lg:pb-16 lg:pt-10">
          <div className="pointer-events-none absolute inset-x-0 top-[0.75rem] z-[2] flex justify-center sm:top-[1rem] lg:hidden">
            <img
              src={heroMobileLogo}
              alt=""
              aria-hidden="true"
              className="w-[38rem] max-w-[152vw] opacity-[0.98] mix-blend-normal [filter:drop-shadow(0_0_26px_rgba(255,248,220,0.34))_drop-shadow(0_0_54px_rgba(120,255,210,0.18))_saturate(1.35)_contrast(1.08)_brightness(1.18)]"
              decoding="async"
            />
          </div>
          <Reveal className="relative z-10 max-w-[23rem] pt-[28rem] sm:max-w-[29rem] sm:pt-[31rem] lg:max-w-[20.5rem] lg:pt-[2.25rem]">
            <div className="rounded-[2rem] bg-[linear-gradient(180deg,rgba(10,18,28,0.10),rgba(10,18,28,0.22))] p-4 shadow-[0_24px_80px_-45px_rgba(0,0,0,0.7)] backdrop-blur-[2px] sm:p-5 lg:rounded-[1.35rem] lg:border lg:border-white/18 lg:bg-[linear-gradient(180deg,rgba(8,18,28,0.34),rgba(10,18,28,0.18))] lg:p-3.5 lg:shadow-[0_26px_90px_-40px_rgba(0,0,0,0.72)] lg:backdrop-blur-md">
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone="success">Sur place</StatusBadge>
                <StatusBadge tone="success">Livraison locale</StatusBadge>
                <StatusBadge>5,0 sur Google</StatusBadge>
                <StatusBadge>{settings.brandLine}</StatusBadge>
                <StatusBadge>{getTodayOpeningStatus(settings.openingHours)}</StatusBadge>
              </div>
              <h1 className="mt-5 max-w-[18rem] text-[1.18rem] font-semibold leading-[1.12] tracking-tight text-white [text-shadow:0_8px_30px_rgba(0,0,0,0.38)] sm:max-w-[22rem] sm:text-[1.5rem] lg:mt-3 lg:max-w-[16.5rem] lg:text-[1.85rem] lg:leading-[1]">
                Burgers, cafés & douceurs dans une ambiance familiale à Béziers
              </h1>
              <div className="mt-4 flex max-w-[20rem] flex-wrap gap-2.5 sm:max-w-[22rem] lg:mt-4 lg:max-w-[17rem] lg:flex-row lg:items-start">
                <Link to="/menu" className="rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-green/20">
                  Menu
                </Link>
                <a
                  href={`tel:${settings.phonePrimary.replace(/\s+/g, '')}`}
                  onClick={() => analyticsService.trackCallClick()}
                  className="rounded-full border border-white/28 bg-white/18 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm"
                >
                  Appeler maintenant
                </a>
                <a
                  href={settings.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => analyticsService.trackDirectionsClick()}
                  className="rounded-full border border-white/28 bg-white/18 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm"
                >
                  Itinéraire Google Maps
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal
            className="absolute right-8 top-8 z-10 hidden w-full max-w-[18rem] gap-2.5 lg:grid"
            delay={120}
          >
            <Link
              to="/galerie"
              className="group overflow-hidden rounded-[1.45rem] border border-white/45 bg-white/26 text-left shadow-[0_18px_45px_-30px_rgba(32,44,35,0.28)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/40"
            >
              <div className="overflow-hidden aspect-[1/1.05] lg:aspect-[16/9]">
                <img
                  src={galleryHighlights[0].image}
                  alt={galleryHighlights[0].alt}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="hidden p-3 lg:block">
                <p className="text-sm font-semibold text-slate-950">{galleryHighlights[0].title}</p>
                <p className="mt-1 text-xs leading-6 text-slate-700/78">{galleryHighlights[0].description}</p>
              </div>
            </Link>
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:gap-3">
              {galleryHighlights.slice(1).map((item) => (
                <Link
                  key={item.title}
                  to="/galerie"
                  className="group overflow-hidden rounded-[1.3rem] border border-white/45 bg-white/26 text-left shadow-[0_18px_45px_-30px_rgba(32,44,35,0.28)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/40"
                >
                  <div className="overflow-hidden aspect-[4/4.9] lg:aspect-[4/4.6]">
                    <img
                      src={item.image}
                      alt={item.alt}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="hidden p-3 lg:block">
                    <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs leading-6 text-slate-700/78">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Reveal>

          <Reveal className="relative z-10 mt-12 grid gap-3 sm:mt-14 lg:hidden" delay={120}>
            <Link
              to="/galerie"
              className="group overflow-hidden rounded-[1.45rem] border border-white/45 bg-white/26 text-left shadow-[0_18px_45px_-30px_rgba(32,44,35,0.28)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/40"
            >
              <div className="overflow-hidden aspect-[16/10]">
                <img
                  src={galleryHighlights[0].image}
                  alt={galleryHighlights[0].alt}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-slate-950">{galleryHighlights[0].title}</p>
                <p className="mt-1 text-xs leading-6 text-slate-700/78">{galleryHighlights[0].description}</p>
              </div>
            </Link>
            <div className="grid grid-cols-2 gap-3">
              {galleryHighlights.slice(1).map((item) => (
                <Link
                  key={item.title}
                  to="/galerie"
                  className="group overflow-hidden rounded-[1.3rem] border border-white/45 bg-white/26 text-left shadow-[0_18px_45px_-30px_rgba(32,44,35,0.28)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/40"
                >
                  <div className="overflow-hidden aspect-[4/5]">
                    <img
                      src={item.image}
                      alt={item.alt}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs leading-6 text-slate-700/78">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <Reveal className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: MapPin, title: 'Rue Diderot', text: 'Une adresse pratique à Béziers pour déjeuner, faire une pause café ou récupérer sa commande.' },
            { icon: ShoppingBag, title: 'Commande flexible', text: 'Sur place, à emporter ou en livraison locale selon votre envie du moment.' },
            { icon: Star, title: '5,0 Google', text: 'Une adresse appréciée pour son accueil, ses burgers et son ambiance familiale.' },
            { icon: Phone, title: 'Contact rapide', text: 'Un appel suffit pour se renseigner, commander ou confirmer un créneau.' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-[1.8rem] border border-brand-green/10 bg-white p-6 shadow-[0_18px_45px_-30px_rgba(40,55,40,0.35)]">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
              </div>
            );
          })}
        </div>
      </Reveal>

      <Reveal className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="rounded-[2rem] bg-white p-8 shadow-[0_18px_45px_-30px_rgba(40,55,40,0.35)]">
          <SectionHeading
            eyebrow="Coffee & desserts"
            title="Un rythme de café de quartier, avec une vraie place pour les douceurs"
            description="Cafés classiques, boissons gourmandes, gourmandises du comptoir et desserts à l’assiette rythment la journée sur place comme à emporter."
          />
        </div>
        <div className="rounded-[2rem] bg-[linear-gradient(145deg,#2F5E33,#3E281A)] p-8 text-white shadow-[0_18px_45px_-30px_rgba(21,39,28,0.55)]">
          <SectionHeading
            eyebrow="Livraison"
            title={<span className="text-white">Une solution locale sur Béziers, avec validation attentive des créneaux</span>}
            description={<span className="text-white/76">Consultez librement la carte, ajoutez vos produits puis choisissez à la fin entre sur place, à emporter ou livraison.</span>}
            actions={
              <Link to="/menu" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-green">Voir le menu</Link>
            }
          />
        </div>
      </Reveal>

      <Reveal className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="rounded-[2rem] bg-white p-8">
          <SectionHeading
            eyebrow="Ambiance"
            title="Une adresse conviviale pour bien manger, prendre un café et revenir facilement"
            description="Une ambiance chaleureuse, une carte gourmande et un service simple pour un vrai moment de quartier à Béziers."
          />
        </div>
        <div className="rounded-[2rem] border border-brand-green/10 bg-[radial-gradient(circle_at_top,#6ea35f,transparent_55%),linear-gradient(145deg,#2F5E33,#3E281A)] p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/65">Avis Google</p>
          <p className="mt-4 text-4xl font-semibold">5,0 / 5</p>
          <p className="mt-2 text-white/75">{settings.reviewCountLabel}</p>
          <Link to="/avis" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-green">
            Voir les avis
          </Link>
        </div>
      </Reveal>

    </>
  );
}
