import { Bike, Clock3, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';
import { Reveal } from '../../components/ui/Reveal';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { business } from '../../data/business';
import { formatPrice } from '../../lib/utils';
import { analyticsService } from '../../services/analyticsService';

const DELIVERY_FEE = 4;

export default function OrderPage() {
  return (
    <>
      <SEO
        title="Livraison | Le Petit Bougiote Béziers"
        description="Informations sur la livraison locale du Petit Bougiote à Béziers, son fonctionnement et la confirmation éventuelle des créneaux."
        path="/livraison"
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Livraison"
            title="Une livraison locale, simple et attentive"
            description={`Le Petit Bougiote propose une livraison locale sur Béziers avec un tarif fixe de ${formatPrice(DELIVERY_FEE)}. Pour rester proche du quartier et soutenir les acteurs locaux, la livraison s’appuie sur une organisation de proximité, avec une attention particulière à la qualité de service.`}
          />
          <div className="mt-8 flex flex-wrap gap-2">
            <StatusBadge tone="success">Béziers</StatusBadge>
            <StatusBadge>Livraison locale {formatPrice(DELIVERY_FEE)}</StatusBadge>
            <StatusBadge>Double confirmation possible</StatusBadge>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal className="rounded-[2rem] bg-white p-8 shadow-[0_18px_45px_-30px_rgba(40,55,40,0.22)]">
            <div className="grid gap-5 md:grid-cols-2">
              {[
                {
                  icon: Bike,
                  title: 'Livraison sur Béziers',
                  text: 'La livraison est disponible localement avec un forfait fixe clair, ajouté au moment du récapitulatif.',
                },
                {
                  icon: Clock3,
                  title: 'Créneau à confirmer si nécessaire',
                  text: 'Pour certaines demandes à horaire précis, une double confirmation peut être nécessaire afin de vérifier la disponibilité du livreur.',
                },
                {
                  icon: MapPin,
                  title: 'Service de proximité',
                  text: 'Le but est de garder un traitement plus attentif des commandes tout en restant proche du quartier.',
                },
                {
                  icon: Phone,
                  title: 'Contact rapide',
                  text: 'Si un ajustement est nécessaire, le restaurant peut vous confirmer rapidement un créneau validé.',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-[1.7rem] border border-brand-green/10 bg-brand-offwhite p-5">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-deepgreen">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="mt-4 text-lg font-semibold text-slate-950">{item.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </Reveal>

          <Reveal className="rounded-[2rem] bg-[linear-gradient(145deg,#2F5E33,#3E281A)] p-8 text-white shadow-[0_18px_45px_-30px_rgba(21,39,28,0.5)]" delay={120}>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/65">Commander</p>
            <h2 className="mt-4 text-3xl font-semibold">La commande se fait directement depuis le menu</h2>
            <p className="mt-4 text-sm leading-7 text-white/78">
              Depuis la carte, vous choisissez ensuite le mode souhaité: sur place, click & collect ou livraison. Si vous sélectionnez la livraison, le panier et le checkout ajoutent automatiquement le forfait Béziers.
            </p>
            <div className="mt-8 grid gap-3">
              <Link to="/menu?service=delivery" className="rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-brand-green">
                Ouvrir le menu en mode livraison
              </Link>
              <a
                href={`tel:${business.phonePrimary.replace(/\s+/g, '')}`}
                onClick={() => analyticsService.trackCallClick()}
                className="rounded-full border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white"
              >
                Appeler pour confirmer
              </a>
            </div>
            <p className="mt-6 text-sm leading-7 text-white/72">
              En cas de créneau très précis, nous pouvons vous recontacter pour confirmer la disponibilité ou proposer un horaire validé.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
