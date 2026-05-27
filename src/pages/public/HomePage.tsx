import { ArrowRight, MapPin, Phone, ShoppingBag, Star } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OrderModeSelector, type OrderModeChoice } from '../../components/public/OrderModeSelector';
import { ProductConfiguratorModal } from '../../components/public/ProductConfiguratorModal';
import { ProductCard } from '../../components/public/ProductCard';
import { SEO } from '../../components/seo/SEO';
import { Reveal } from '../../components/ui/Reveal';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { brandAssets, business } from '../../data/business';
import { products } from '../../data/menu';
import { useCart } from '../../contexts/CartContext';
import { getTodayOpeningStatus } from '../../lib/utils';
import { analyticsService } from '../../services/analyticsService';
import type { Product } from '../../types';

const featuredProducts = products.filter((product) =>
  ['prod-group-burgers-beef', 'prod-petite-salade', 'prod-group-desserts'].includes(product.id),
);
const burgerProduct = products.find((product) => product.id === 'prod-group-burgers-beef') ?? null;
const dessertProduct = products.find((product) => product.id === 'prod-group-desserts') ?? null;
const saladProduct = products.find((product) => product.id === 'prod-medit') ?? null;

type PendingAction =
  | { type: 'add'; product: Product }
  | { type: 'open'; product: Product }
  | null;

export default function HomePage() {
  const navigate = useNavigate();
  const { addItem, addCustomItem, setFulfillmentType, setDiningMode } = useCart();
  const [showModeDialog, setShowModeDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  function openModeDialog(action: PendingAction = null) {
    setPendingAction(action);
    setShowModeDialog(true);
  }

  function chooseMode(choice: OrderModeChoice) {
    setShowModeDialog(false);

    if (choice === 'delivery') {
      setFulfillmentType('delivery');
      setDiningMode(null);
    } else {
      setFulfillmentType('click_collect');
      setDiningMode(choice);
    }

    if (pendingAction?.type === 'add') {
      addItem(pendingAction.product);
    }
    if (pendingAction?.type === 'open') {
      setSelectedProduct(pendingAction.product);
    }

    setPendingAction(null);
    navigate(choice === 'delivery' ? '/menu?service=delivery' : `/menu?service=${choice}`);
  }

  return (
    <>
      <SEO
        title="Le Petit Bougiote Béziers | Coffee, Burger & Desserts"
        description="Restaurant convivial à Béziers, Le Petit Bougiote propose burgers, cafés, desserts, boissons et vente à emporter au 28 Rue Diderot."
        path="/"
      />

      {showModeDialog ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 px-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto">
            <OrderModeSelector
              compact
              title="Choisissez votre mode de commande"
              description="Sur place, click & collect ou livraison locale: nous adaptons ensuite le panier et le checkout automatiquement."
              onChoose={chooseMode}
            />
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setShowModeDialog(false);
                  setPendingAction(null);
                }}
                className="rounded-full border border-white/25 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={brandAssets.heroImage}
            alt="Le Petit Bougiote Coffee & Burger"
            className="h-full w-full object-cover object-[56%_center] md:object-[66%_center] lg:object-[76%_center]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(112deg,rgba(11,14,12,0.72),rgba(27,43,33,0.48),rgba(31,22,18,0.3))]" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:py-16 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12 lg:px-8 lg:py-24">
          <Reveal className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="success">Sur place</StatusBadge>
              <StatusBadge tone="success">Livraison locale</StatusBadge>
              <StatusBadge>5,0 sur Google</StatusBadge>
              <StatusBadge>{business.brandLine}</StatusBadge>
              <StatusBadge>{getTodayOpeningStatus(business.openingHours)}</StatusBadge>
            </div>
            <img
              src={brandAssets.logoImage}
              alt="Le Petit Bougiote Coffee & Burger"
              className="mt-2 hidden h-56 w-56 rounded-full object-cover shadow-[0_24px_40px_-20px_rgba(0,0,0,0.5)] lg:block"
            />
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:mt-5 lg:text-[5.1rem] lg:leading-[0.95]">
              Burgers, cafés & douceurs dans une ambiance familiale à Béziers
            </h1>
            <img
              src={brandAssets.logoImage}
              alt="Le Petit Bougiote Coffee & Burger"
              className="mt-6 h-44 w-44 rounded-full object-cover shadow-[0_24px_40px_-20px_rgba(0,0,0,0.5)] sm:h-48 sm:w-48 lg:hidden"
            />
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/84">
              Le Petit Bougiote vous accueille rue Diderot avec des burgers généreux, des cafés, des formules petit-déjeuner, des desserts et une ambiance simple, propre et conviviale.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/menu" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-green shadow-lg shadow-black/10">
                Voir le menu
              </Link>
              <button
                type="button"
                onClick={() => openModeDialog()}
                className="rounded-full bg-brand-green/88 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/15"
              >
                Commander
              </button>
              <a
                href={`tel:${business.phonePrimary.replace(/\s+/g, '')}`}
                onClick={() => analyticsService.trackCallClick()}
                className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white"
              >
                Appeler maintenant
              </a>
              <a
                href={business.mapUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => analyticsService.trackDirectionsClick()}
                className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white"
              >
                Itinéraire Google Maps
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/76">
              <span className="rounded-full border border-white/15 bg-white/8 px-4 py-2">Burgers + menu</span>
              <span className="rounded-full border border-white/15 bg-white/8 px-4 py-2">Petite salade</span>
              <span className="rounded-full border border-white/15 bg-white/8 px-4 py-2">Desserts</span>
              <span className="rounded-full border border-white/15 bg-white/8 px-4 py-2">Livraison Béziers</span>
            </div>
          </Reveal>

          <Reveal className="grid gap-4 self-end lg:pt-8" delay={120}>
            {burgerProduct ? (
              <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))] p-5 shadow-2xl shadow-black/20 backdrop-blur-md">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/65">Produit populaire</p>
                <div className="mt-4 overflow-hidden rounded-[1.6rem] bg-white/10">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={burgerProduct.image} alt={burgerProduct.imageAlt} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-5 text-white">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-semibold">Classic</h2>
                        <p className="mt-1 text-sm text-white/74">Burger bœuf & sauce maison</p>
                      </div>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">10,90 €</span>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-4">
                      <p className="text-sm text-white/72">Disponible en burger seul ou en menu +3 €</p>
                      <button
                        type="button"
                        onClick={() => openModeDialog({ type: 'open', product: burgerProduct })}
                        className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-deepgreen"
                      >
                        Commander <ArrowRight className="ml-2 h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-3">
              {saladProduct ? (
                <button
                  type="button"
                  onClick={() => openModeDialog({ type: 'add', product: saladProduct })}
                  className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/12 p-3 text-left text-white backdrop-blur-md"
                >
                  <div className="aspect-square overflow-hidden rounded-[1.2rem] bg-white/10">
                    <img src={saladProduct.image} alt={saladProduct.imageAlt} className="h-full w-full object-cover" />
                  </div>
                  <p className="mt-3 text-sm font-semibold">Salades</p>
                  <p className="mt-1 text-xs text-white/70">Fraîches & gourmandes</p>
                </button>
              ) : null}
              {dessertProduct ? (
                <button
                  type="button"
                  onClick={() => openModeDialog({ type: 'open', product: dessertProduct })}
                  className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/12 p-3 text-left text-white backdrop-blur-md"
                >
                  <div className="aspect-square overflow-hidden rounded-[1.2rem] bg-white/10">
                    <img src={dessertProduct.image} alt={dessertProduct.imageAlt} className="h-full w-full object-cover" />
                  </div>
                  <p className="mt-3 text-sm font-semibold">{dessertProduct.name}</p>
                  <p className="mt-1 text-xs text-white/70">{dessertProduct.priceLabel}</p>
                </button>
              ) : null}
              <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(145deg,rgba(74,139,69,0.26),rgba(62,40,26,0.38))] p-4 text-white backdrop-blur-md">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/65">Rue Diderot</p>
                <p className="mt-3 text-base font-semibold">Sur place, click & collect ou livraison</p>
                <p className="mt-2 text-sm leading-6 text-white/74">Une commande plus fluide, pensée pour le quartier et les pauses gourmandes.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Reveal className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: MapPin, title: 'Rue Diderot', text: 'Adresse simple à trouver pour un déjeuner, un café ou un retrait rapide.' },
            { icon: ShoppingBag, title: 'Commande flexible', text: 'Sur place, click & collect ou livraison selon le moment et votre besoin.' },
            { icon: Star, title: '5,0 Google', text: 'Une excellente impression locale à valoriser proprement, sans surjouer.' },
            { icon: Phone, title: 'Double contact', text: 'Deux numéros visibles pour la prise de commande et les questions rapides.' },
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

      <Reveal className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="À découvrir"
          title="Une carte pensée pour composer facilement votre commande"
          description="Commencez par un burger avec menu, ajoutez une salade ou une petite salade, puis terminez avec un dessert: le panier se construit plus naturellement, même depuis l’accueil."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featuredProducts.map((product) => (
            <div key={product.id}>
              <ProductCard
                product={product}
                compact
                onAdd={
                  product.productType === 'simple'
                    ? (currentProduct) => openModeDialog({ type: 'add', product: currentProduct })
                    : undefined
                }
                onOpen={
                  product.productType === 'configurable'
                    ? (currentProduct) => openModeDialog({ type: 'open', product: currentProduct })
                    : undefined
                }
              />
            </div>
          ))}
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
            description={<span className="text-white/76">Préparez votre panier, choisissez votre mode de récupération et avancez jusqu’au checkout. Le paiement en ligne sera intégré directement à cette étape.</span>}
            actions={
              <button type="button" onClick={() => openModeDialog()} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-green">
                Commander
              </button>
            }
          />
        </div>
      </Reveal>

      <Reveal className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="rounded-[2rem] bg-white p-8">
          <SectionHeading
            eyebrow="Ambiance"
            title="Une adresse conviviale pour bien manger, prendre un café et revenir facilement"
            description="Le ton reste chaleureux, propre et généreux, avec une identité visuelle proche de la carte imprimée et du logo vert existant."
          />
        </div>
        <div className="rounded-[2rem] border border-brand-green/10 bg-[radial-gradient(circle_at_top,#6ea35f,transparent_55%),linear-gradient(145deg,#2F5E33,#3E281A)] p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/65">Avis Google</p>
          <p className="mt-4 text-4xl font-semibold">5,0 / 5</p>
          <p className="mt-2 text-white/75">{business.reviewCountLabel}</p>
          <Link to="/avis" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-green">
            Voir les avis
          </Link>
        </div>
      </Reveal>

      <ProductConfiguratorModal
        product={selectedProduct}
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onConfirm={(item) => {
          addCustomItem(item);
        }}
      />
    </>
  );
}
