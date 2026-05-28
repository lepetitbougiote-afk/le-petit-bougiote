import { Link } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';
import { useCart } from '../../contexts/CartContext';
import { analyticsService } from '../../services/analyticsService';
import { formatPrice, getDiningModeLabel, getFulfillmentTypeLabel } from '../../lib/utils';

export default function CartPage() {
  const {
    items,
    fulfillmentType,
    diningMode,
    removeItem,
    updateItemNote,
    updateQuantity,
    subtotal,
    clearCart,
  } = useCart();

  const deliveryFee = fulfillmentType === 'delivery' ? 4 : 0;
  const total = subtotal + deliveryFee;
  const continuePath = fulfillmentType === 'delivery' ? '/menu?service=delivery' : `/menu?service=${diningMode === 'a_emporter' ? 'a_emporter' : 'sur_place'}`;
  const continueLabel = fulfillmentType === 'delivery' ? 'Continuer la commande livraison' : diningMode === 'a_emporter' ? 'Continuer à emporter' : 'Continuer sur place';
  const emptyText = fulfillmentType === 'delivery' ? 'Ajoutez quelques produits depuis la carte en mode livraison.' : 'Ajoutez quelques produits depuis la carte sur place.';

  return (
    <>
      <SEO
        title="Panier | Le Petit Bougiote Béziers"
        description="Retrouvez les articles de votre commande, modifiez les quantités et ajoutez une note avant le checkout."
        path="/panier"
      />
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-green/70">Panier</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Votre sélection</h1>
          </div>
          {items.length > 0 ? (
            <button type="button" onClick={clearCart} className="rounded-full border border-brand-green/10 px-5 py-3 text-sm font-semibold text-slate-700">
              Vider le panier
            </button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <div className="mt-8 rounded-[2rem] bg-white p-10 text-center">
            <p className="text-lg font-semibold text-slate-950">Votre panier est vide.</p>
            <p className="mt-2 text-slate-600">{emptyText}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to={continuePath} className="inline-flex rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white">{continueLabel}</Link>
              <Link to="/compte/commandes" className="inline-flex rounded-full border border-brand-green/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
                Mes commandes
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="grid gap-4">
              {items.map((item) => (
                <article key={item.id} className="rounded-[1.8rem] border border-brand-green/10 bg-white p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-4">
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-brand-offwhite">
                        <img src={item.image} alt={item.imageAlt} className={`h-full w-full ${item.imageFit === 'contain' ? 'object-contain p-4' : 'object-cover'}`} />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-slate-950">{item.name}</h2>
                        <p className="mt-2 text-sm font-semibold text-brand-green">{formatPrice(item.price, item.priceLabel)}</p>
                        {item.selectedOptions?.length ? (
                          <p className="mt-2 text-sm text-slate-500">{item.selectedOptions.map((option) => option.label).join(' • ')}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-10 w-10 rounded-full border border-brand-green/10 text-lg">-</button>
                      <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-10 w-10 rounded-full border border-brand-green/10 text-lg">+</button>
                    </div>
                  </div>
                  <label className="mt-4 block text-sm text-slate-700">
                    Note produit
                    <textarea
                      value={item.note}
                      onChange={(event) => updateItemNote(item.id, event.target.value)}
                      className="mt-2 min-h-24 w-full rounded-2xl border border-brand-green/10 bg-brand-cream p-4 outline-none"
                    />
                  </label>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-slate-600">Total ligne: <span className="font-semibold text-slate-950">{formatPrice((item.price ?? 0) * item.quantity)}</span></p>
                    <button
                      type="button"
                      onClick={() => {
                        removeItem(item.id);
                        analyticsService.trackEvent('remove_from_cart', { product_id: item.productId });
                      }}
                      className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700"
                    >
                      Retirer
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <aside className="rounded-[1.8rem] border border-brand-green/10 bg-white p-6 lg:sticky lg:top-24 lg:h-fit">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-green/70">Résumé</p>
              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Mode</span>
                  <span className="font-semibold text-slate-950">{getFulfillmentTypeLabel(fulfillmentType)}</span>
                </div>
                {fulfillmentType === 'click_collect' ? (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Choix actuel</span>
                    <span className="font-semibold text-slate-950">{getDiningModeLabel(diningMode)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-slate-600">
                  <span>Sous-total</span>
                  <span className="font-semibold text-slate-950">{formatPrice(subtotal, '0 €')}</span>
                </div>
                {fulfillmentType === 'delivery' ? (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Livraison Béziers</span>
                    <span className="font-semibold text-slate-950">{formatPrice(deliveryFee)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-slate-600">
                  <span>Total estimé</span>
                  <span className="font-semibold text-slate-950">{formatPrice(total, '0 €')}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Paiement</span>
                  <span className="font-semibold text-slate-950">En ligne bientôt</span>
                </div>
              </div>
              <div className="mt-6 grid gap-3">
                <Link to={continuePath} className="rounded-full border border-brand-green/10 px-5 py-3 text-center text-sm font-semibold text-slate-700">{continueLabel}</Link>
                <Link to="/compte/commandes" className="rounded-full border border-brand-green/10 px-5 py-3 text-center text-sm font-semibold text-slate-700">
                  Mes commandes
                </Link>
                <Link to="/checkout" onClick={() => analyticsService.trackCheckoutStart({ item_count: items.length, subtotal })} className="rounded-full bg-brand-green px-5 py-3 text-center text-sm font-semibold text-white">
                  Passer au checkout
                </Link>
              </div>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}
