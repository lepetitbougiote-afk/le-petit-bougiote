import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';
import { Reveal } from '../../components/ui/Reveal';
import { useCart } from '../../contexts/CartContext';
import { formatPrice, getDesiredTimeLabel, getDiningModeLabel, getFulfillmentTypeLabel } from '../../lib/utils';
import { analyticsService } from '../../services/analyticsService';
import { orderService } from '../../services/orderService';
import type { ConfirmationStatus, DiningMode, FulfillmentType, Order } from '../../types';

const DELIVERY_FEE = 4;

export default function CheckoutPage() {
  const {
    items,
    fulfillmentType: cartFulfillmentType,
    diningMode: cartDiningMode,
    setFulfillmentType,
    setDiningMode,
    subtotal,
    clearCart,
  } = useCart();
  const [confirmation, setConfirmation] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDeliveryNotice, setShowDeliveryNotice] = useState(true);
  const [fulfillmentType, setLocalFulfillmentType] = useState<FulfillmentType>(cartFulfillmentType);
  const [diningMode, setLocalDiningMode] = useState<DiningMode>(cartDiningMode ?? 'sur_place');

  const isDelivery = fulfillmentType === 'delivery';
  const deliveryFee = isDelivery ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  const desiredTimeLabel = getDesiredTimeLabel(fulfillmentType);

  const confirmationStatus: ConfirmationStatus = useMemo(
    () => (isDelivery ? 'pending' : 'confirmed'),
    [isDelivery],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSubmitting(true);

    setFulfillmentType(fulfillmentType);
    setDiningMode(isDelivery ? null : diningMode);

    const order = await orderService.createOrder({
      fulfillmentType,
      diningMode: isDelivery ? null : diningMode,
      orderSource: isDelivery ? 'delivery_web' : 'menu_qr',
      customerName: String(formData.get('customerName') ?? '').trim(),
      customerPhone: String(formData.get('customerPhone') ?? '').trim() || undefined,
      customerEmail: String(formData.get('customerEmail') ?? '').trim() || undefined,
      deliveryAddress: isDelivery ? String(formData.get('deliveryAddress') ?? '').trim() || undefined : undefined,
      deliveryFee,
      desiredTime: String(formData.get('desiredTime') ?? '').trim() || undefined,
      confirmationStatus,
      proposedTime: undefined,
      customerConfirmationRequired: isDelivery,
      customerConfirmedAt: null,
      restaurantNote: isDelivery ? 'A confirmer selon la disponibilité du livreur.' : undefined,
      customerNote: String(formData.get('customerNote') ?? '').trim() || undefined,
      paymentMode: 'online_payment_pending',
      items,
    });
    analyticsService.trackOrderSubmitted({
      order_id: order.id,
      total: order.total,
      fulfillment_type: fulfillmentType,
      dining_mode: diningMode ?? 'none',
    });
    clearCart();
    setConfirmation(order);
    setSubmitting(false);
  }

  return (
    <>
      <SEO
        title="Checkout | Le Petit Bougiote Béziers"
        description="Finalisez votre commande en choisissant le mode souhaité puis relisez votre récapitulatif."
        path="/checkout"
      />
      {!confirmation && isDelivery && showDeliveryNotice ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl shadow-black/20">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-wood/75">Information livraison</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">Confirmation possible du créneau</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Afin de préserver la meilleure qualité de service et de préparation, nous vous informons que la livraison peut demander un court délai de confirmation. Le Petit Bougiote travaille avec une solution de livraison locale et attentive: selon le créneau demandé, nous pouvons avoir besoin de vérifier la disponibilité du livreur avant validation définitive. Si un ajustement est nécessaire, nous vous proposerons rapidement un horaire estimé ou confirmé.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => setShowDeliveryNotice(false)} className="rounded-full bg-brand-deepgreen px-5 py-3 text-sm font-semibold text-white">
                J’ai compris
              </button>
              <Link to="/livraison" className="rounded-full border border-brand-green/10 px-5 py-3 text-sm font-semibold text-slate-700">
                Retour à la livraison
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-green/70">Checkout</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Validation de commande</h1>
        </Reveal>

        {confirmation ? (
          <Reveal className="mt-8 rounded-[2rem] bg-white p-8">
            <h2 className="text-2xl font-semibold text-slate-950">Commande envoyée</h2>
            <p className="mt-3 text-slate-600">
              Merci {confirmation.customerName}. Votre demande a bien été enregistrée sous le numéro {confirmation.id}. Le paiement en ligne sera intégré à cette étape.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-brand-cream p-5">
                <p className="text-sm text-slate-500">Mode choisi</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{getFulfillmentTypeLabel(confirmation.fulfillmentType)}</p>
              </div>
              {confirmation.fulfillmentType === 'click_collect' ? (
                <div className="rounded-3xl bg-brand-cream p-5">
                  <p className="text-sm text-slate-500">Service</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{getDiningModeLabel(confirmation.diningMode)}</p>
                </div>
              ) : (
                <div className="rounded-3xl bg-brand-cream p-5">
                  <p className="text-sm text-slate-500">Livraison Béziers</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{formatPrice(confirmation.deliveryFee ?? DELIVERY_FEE)}</p>
                </div>
              )}
              {confirmation.desiredTime ? (
                <div className="rounded-3xl bg-brand-cream p-5">
                  <p className="text-sm text-slate-500">{getDesiredTimeLabel(confirmation.fulfillmentType)}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{confirmation.desiredTime}</p>
                </div>
              ) : null}
              {confirmation.deliveryAddress ? (
                <div className="rounded-3xl bg-brand-cream p-5">
                  <p className="text-sm text-slate-500">Adresse</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{confirmation.deliveryAddress}</p>
                </div>
              ) : null}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={confirmation.fulfillmentType === 'delivery' ? '/livraison' : '/menu'} className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white">
                Nouvelle commande
              </Link>
              <Link to="/compte/commandes" className="rounded-full border border-brand-green/10 px-5 py-3 text-sm font-semibold text-slate-700">
                Voir l’historique
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
            <Reveal className="rounded-[2rem] bg-white p-8">
              <form onSubmit={handleSubmit}>
                <section>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-green/70">Étape 1</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">Vos informations</h2>
                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">
                      Nom
                      <input required name="customerName" className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none" />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Téléphone
                      <input required={isDelivery} name="customerPhone" className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none" />
                    </label>
                    <label className="text-sm font-medium text-slate-700 md:col-span-2">
                      Email (optionnel)
                      <input name="customerEmail" type="email" className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none" />
                    </label>
                  </div>
                </section>

                <section className="mt-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-green/70">Étape 2</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">Mode de récupération</h2>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setLocalFulfillmentType('click_collect')}
                      className={`rounded-[1.6rem] border p-5 text-left ${fulfillmentType === 'click_collect' ? 'border-brand-green bg-brand-offwhite' : 'border-brand-border bg-white'}`}
                    >
                      <p className="font-semibold text-slate-950">Click & Collect</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">Retrait ou commande sur place, avec un parcours plus direct.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocalFulfillmentType('delivery')}
                      className={`rounded-[1.6rem] border p-5 text-left ${fulfillmentType === 'delivery' ? 'border-brand-green bg-brand-offwhite' : 'border-brand-border bg-white'}`}
                    >
                      <p className="font-semibold text-slate-950">Livraison</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">Livraison locale à Béziers avec tarif fixe et validation attentive du créneau.</p>
                    </button>
                  </div>

                  {fulfillmentType === 'click_collect' ? (
                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                      <div className="rounded-[1.6rem] border border-brand-green/10 bg-brand-offwhite p-5">
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-green/70">Service</p>
                        <div className="mt-4 grid gap-3">
                          <button
                            type="button"
                            onClick={() => setLocalDiningMode('sur_place')}
                            className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${diningMode === 'sur_place' ? 'border-brand-green bg-white text-slate-950' : 'border-brand-border bg-white/80 text-slate-700'}`}
                          >
                            Sur place
                          </button>
                          <button
                            type="button"
                            onClick={() => setLocalDiningMode('a_emporter')}
                            className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${diningMode === 'a_emporter' ? 'border-brand-green bg-white text-slate-950' : 'border-brand-border bg-white/80 text-slate-700'}`}
                          >
                            À emporter
                          </button>
                        </div>
                      </div>
                      <label className="text-sm font-medium text-slate-700">
                        Heure souhaitée
                        <input name="desiredTime" type="time" className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none" />
                      </label>
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                      <label className="text-sm font-medium text-slate-700 md:col-span-2">
                        Adresse de livraison
                        <input required={isDelivery} name="deliveryAddress" className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none" placeholder="Rue, numéro, étage, code d’accès si besoin" />
                      </label>
                      <label className="text-sm font-medium text-slate-700">
                        Créneau de livraison souhaité
                        <input name="desiredTime" type="time" className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none" />
                      </label>
                      <div className="rounded-[1.6rem] border border-brand-green/10 bg-brand-offwhite p-5">
                        <p className="text-sm font-semibold text-slate-950">Livraison Béziers</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                          Tarif fixe : {formatPrice(DELIVERY_FEE)}. Un créneau précis peut nécessiter une confirmation complémentaire.
                        </p>
                      </div>
                    </div>
                  )}
                </section>

                <section className="mt-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-green/70">Étape 3</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">Notes et validation</h2>
                  <label className="mt-5 block text-sm font-medium text-slate-700">
                    Note de commande
                    <textarea
                      name="customerNote"
                      className="mt-2 min-h-32 w-full rounded-2xl border border-brand-green/10 bg-brand-cream p-4 outline-none"
                      placeholder={isDelivery ? 'Précision de livraison, code, étage, demande simple...' : 'Précision de retrait, préférence simple, demande pour le service...'}
                    />
                  </label>
                  <div className="mt-6 rounded-3xl bg-brand-cream p-5">
                    <p className="text-sm font-semibold text-slate-950">Paiement</p>
                    <p className="mt-2 text-sm text-slate-600">Paiement en ligne bientôt disponible. Votre commande sera validée selon le mode choisi.</p>
                  </div>
                  {isDelivery ? (
                    <div className="mt-4 rounded-3xl border border-brand-wood/12 bg-[linear-gradient(145deg,rgba(245,240,230,0.96),rgba(251,248,242,0.96))] p-5 text-sm leading-7 text-slate-600">
                      Votre créneau de livraison peut nécessiter une confirmation. Nous vous confirmerons rapidement la disponibilité.
                    </div>
                  ) : null}

                  <button disabled={items.length === 0 || submitting} className="mt-6 rounded-full bg-brand-deepgreen px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
                    {submitting ? 'Envoi en cours...' : 'Envoyer la commande'}
                  </button>
                </section>
              </form>
            </Reveal>

            <Reveal className="rounded-[1.8rem] border border-brand-green/10 bg-white p-6 lg:sticky lg:top-24 lg:h-fit" delay={120}>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-green/70">Étape 3</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">Récapitulatif</h2>
              <div className="mt-5 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                    <div className="flex gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-brand-offwhite">
                        <img src={item.image} alt={item.imageAlt} className={`h-full w-full ${item.imageFit === 'contain' ? 'object-contain p-3' : 'object-cover'}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950">{item.name} x{item.quantity}</p>
                        {item.note ? <p className="mt-1 text-slate-500">{item.note}</p> : null}
                      </div>
                    </div>
                    <p className="font-semibold text-slate-950">{formatPrice((item.price ?? 0) * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-3 border-t border-brand-green/10 pt-4 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Mode</span>
                  <span className="font-semibold text-slate-950">{getFulfillmentTypeLabel(fulfillmentType)}</span>
                </div>
                {fulfillmentType === 'click_collect' ? (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Service</span>
                    <span className="font-semibold text-slate-950">{getDiningModeLabel(diningMode)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-slate-600">
                  <span>Sous-total</span>
                  <span className="font-semibold text-slate-950">{formatPrice(subtotal, '0 €')}</span>
                </div>
                {isDelivery ? (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Livraison Béziers</span>
                    <span className="font-semibold text-slate-950">{formatPrice(deliveryFee)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-slate-600">
                  <span>Total</span>
                  <span className="text-lg font-semibold text-slate-950">{formatPrice(total, '0 €')}</span>
                </div>
              </div>
            </Reveal>
          </div>
        )}
      </section>
    </>
  );
}
