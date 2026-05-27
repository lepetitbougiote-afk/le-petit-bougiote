import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { OrderModeSelector, type OrderModeChoice } from '../../components/public/OrderModeSelector';
import { ProductConfiguratorModal } from '../../components/public/ProductConfiguratorModal';
import { ProductCard } from '../../components/public/ProductCard';
import { SEO } from '../../components/seo/SEO';
import { Reveal } from '../../components/ui/Reveal';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useCart } from '../../contexts/CartContext';
import { menuService } from '../../services/menuService';
import type { Category, Product } from '../../types';

type MenuServiceMode = OrderModeChoice | null;

function getModeFromSearchParam(value: string | null): MenuServiceMode {
  if (value === 'sur_place' || value === 'a_emporter' || value === 'delivery') {
    return value;
  }
  return null;
}

export default function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [serviceMode, setServiceMode] = useState<MenuServiceMode>(() => getModeFromSearchParam(searchParams.get('service')));
  const { addItem, addCustomItem, setFulfillmentType, setDiningMode } = useCart();

  useEffect(() => {
    menuService.getCategories().then(setCategories);
    menuService.getProducts().then(setProducts);
  }, []);

  useEffect(() => {
    const nextMode = getModeFromSearchParam(searchParams.get('service'));
    setServiceMode(nextMode);
  }, [searchParams]);

  const visibleCategories = useMemo(() => categories.filter((category) => category.isActive), [categories]);

  function chooseMode(choice: OrderModeChoice) {
    if (choice === 'delivery') {
      setFulfillmentType('delivery');
      setDiningMode(null);
    } else {
      setFulfillmentType('click_collect');
      setDiningMode(choice);
    }
    setServiceMode(choice);
    setSearchParams({ service: choice });
  }

  return (
    <>
      <SEO
        title="Menu Le Petit Bougiote Béziers | Burgers, cafés, desserts & boissons"
        description="Découvrez le menu Le Petit Bougiote à Béziers : burgers, desserts, cafés, petit-déjeuner et boissons."
        path="/menu"
      />
      <Reveal className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Menu"
          title="Choisissez d’abord votre mode de commande"
          description="Sur place, click & collect ou livraison: le parcours s’adapte ensuite automatiquement à votre commande."
        />

        {!serviceMode ? (
          <div className="mt-8">
            <OrderModeSelector
              title="Avant de voir la carte, choisissez votre parcours"
              description="Le menu peut être utilisé pour une commande sur place, à emporter ou en livraison locale. Le panier et le checkout s’adaptent ensuite automatiquement."
              onChoose={chooseMode}
            />
          </div>
        ) : (
          <>
            <div className="mt-8 rounded-[1.8rem] border border-brand-green/10 bg-white p-6 shadow-[0_18px_45px_-34px_rgba(62,40,26,0.22)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge tone="success">QR code</StatusBadge>
                  <StatusBadge tone="success">Paiement en ligne bientôt</StatusBadge>
                  <StatusBadge>
                    {serviceMode === 'delivery'
                      ? 'Livraison locale'
                      : serviceMode === 'sur_place'
                        ? 'Commande sur place'
                        : 'Click & Collect'}
                  </StatusBadge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => chooseMode('sur_place')}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${serviceMode === 'sur_place' ? 'bg-brand-deepgreen text-white' : 'bg-brand-cream text-slate-700'}`}
                  >
                    Sur place
                  </button>
                  <button
                    type="button"
                    onClick={() => chooseMode('a_emporter')}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${serviceMode === 'a_emporter' ? 'bg-brand-deepgreen text-white' : 'bg-brand-cream text-slate-700'}`}
                  >
                    Click & Collect
                  </button>
                  <button
                    type="button"
                    onClick={() => chooseMode('delivery')}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${serviceMode === 'delivery' ? 'bg-brand-deepgreen text-white' : 'border border-brand-green/15 bg-white text-slate-700'}`}
                  >
                    Livraison
                  </button>
                </div>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                Les burgers, desserts, gourmandises, cafés classiques et boissons gourmandes sont regroupés pour rendre la commande plus claire. Vous choisissez ensuite le détail exact dans une fiche dédiée.
              </p>
              {serviceMode === 'delivery' ? (
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  La livraison locale sur Béziers ajoute automatiquement un forfait de 4,00 € au moment du récapitulatif.
                </p>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/checkout"
                  onClick={() => {
                    if (serviceMode === 'delivery') {
                      setFulfillmentType('delivery');
                      setDiningMode(null);
                    } else {
                      setFulfillmentType('click_collect');
                      setDiningMode(serviceMode);
                    }
                  }}
                  className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white"
                >
                  {serviceMode === 'delivery' ? 'Valider la livraison' : serviceMode === 'sur_place' ? 'Valider sur place' : 'Valider à emporter'}
                </Link>
                <Link to="/livraison" className="rounded-full border border-brand-green/15 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
                  Infos livraison
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setServiceMode(null);
                    setSearchParams({});
                  }}
                  className="rounded-full border border-brand-green/15 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  Changer de parcours
                </button>
              </div>
            </div>

            <div className="mt-10 grid gap-8">
              {visibleCategories.map((category) => {
                const items = products.filter((product) => product.categoryId === category.id);
                return (
                  <div key={category.id}>
                    <Reveal>
                      <section className="rounded-[2rem] border border-brand-border bg-white p-8 shadow-[0_18px_45px_-34px_rgba(62,40,26,0.22)]">
                        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                          <div>
                            <h2 className="text-2xl font-semibold text-slate-950">{category.name}</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">{category.description}</p>
                          </div>
                          <StatusBadge>{items.length} produits</StatusBadge>
                        </div>

                        {items.length === 0 ? (
                          <div className="mt-6 rounded-3xl bg-brand-cream p-6 text-sm text-slate-600">Aucun produit actif dans cette catégorie pour le moment.</div>
                        ) : (
                          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {items.map((product) => (
                              <div key={product.id}>
                                <ProductCard
                                  product={product}
                                  onAdd={
                                    product.productType === 'simple'
                                      ? (currentProduct) => {
                                          if (serviceMode === 'delivery') {
                                            setFulfillmentType('delivery');
                                            setDiningMode(null);
                                          } else {
                                            setFulfillmentType('click_collect');
                                            setDiningMode(serviceMode);
                                          }
                                          addItem(currentProduct);
                                        }
                                      : undefined
                                  }
                                  onOpen={
                                    product.productType === 'configurable'
                                      ? (currentProduct) => {
                                          if (serviceMode === 'delivery') {
                                            setFulfillmentType('delivery');
                                            setDiningMode(null);
                                          } else {
                                            setFulfillmentType('click_collect');
                                            setDiningMode(serviceMode);
                                          }
                                          setSelectedProduct(currentProduct);
                                        }
                                      : undefined
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </section>
                    </Reveal>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Reveal>

      <ProductConfiguratorModal
        product={selectedProduct}
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onConfirm={(item) => {
          if (serviceMode === 'delivery') {
            setFulfillmentType('delivery');
            setDiningMode(null);
          } else {
            setFulfillmentType('click_collect');
            setDiningMode(serviceMode ?? 'sur_place');
          }
          addCustomItem(item);
        }}
      />
    </>
  );
}
