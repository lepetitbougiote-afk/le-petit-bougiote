import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';
import { Reveal } from '../../components/ui/Reveal';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { savePendingCheckoutSession } from '../../lib/stripeCheckout';
import {
  formatPrice,
  getDesiredTimeLabel,
  getDiningModeLabel,
  getFulfillmentTypeLabel,
  isDeliveryRestrictedCartItem,
} from '../../lib/utils';
import { analyticsService } from '../../services/analyticsService';
import { userService } from '../../services/userService';
import type { CheckoutPayload, ConfirmationStatus, DiningMode, FulfillmentType } from '../../types';

const DELIVERY_FEE = 4;

interface CheckoutSessionResponse {
  id: string;
  url: string;
}

async function readApiResponse<T>(response: Response): Promise<T | { error?: string; message?: string }> {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as T | { error?: string; message?: string };
  } catch {
    return {
      error: text,
    };
  }
}

export default function CheckoutPage() {
  const { user, loading } = useAuth();
  const {
    items,
    fulfillmentType: cartFulfillmentType,
    diningMode: cartDiningMode,
    setFulfillmentType,
    setDiningMode,
    removeItems,
    subtotal,
  } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showDeliveryNotice, setShowDeliveryNotice] = useState(true);
  const [deliveryRestrictionNotice, setDeliveryRestrictionNotice] = useState<string | null>(null);
  const [fulfillmentType, setLocalFulfillmentType] =
    useState<FulfillmentType>(cartFulfillmentType);
  const [diningMode, setLocalDiningMode] = useState<DiningMode>(cartDiningMode ?? 'sur_place');
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryAddress: '',
    desiredTime: '',
    customerNote: '',
  });

  const isDelivery = fulfillmentType === 'delivery';
  const deliveryFee = isDelivery ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  const desiredTimeLabel = getDesiredTimeLabel(fulfillmentType);
  const deliveryRestrictedItems = useMemo(
    () => items.filter((item) => isDeliveryRestrictedCartItem(item)),
    [items],
  );

  const confirmationStatus: ConfirmationStatus = useMemo(
    () => (isDelivery ? 'pending' : 'confirmed'),
    [isDelivery],
  );
  const requiresDeliveryAccount = isDelivery && !loading && !user;

  useEffect(() => {
    if (!user || profileLoaded) {
      return;
    }

    async function loadProfile() {
      const profile = await userService.getProfile();
      if (!profile) {
        setProfileLoaded(true);
        return;
      }

      setForm((current) => ({
        ...current,
        customerName: current.customerName || profile.fullName,
        customerPhone: current.customerPhone || profile.phone,
        customerEmail: current.customerEmail || profile.email,
        deliveryAddress: current.deliveryAddress || profile.address,
      }));
      setProfileLoaded(true);
    }

    void loadProfile();
  }, [profileLoaded, user]);

  useEffect(() => {
    if (fulfillmentType !== 'delivery') {
      setDeliveryRestrictionNotice(null);
      return;
    }

    if (deliveryRestrictedItems.length === 0) {
      setDeliveryRestrictionNotice(null);
      return;
    }

    removeItems(deliveryRestrictedItems.map((item) => item.id));
    setDeliveryRestrictionNotice(
      deliveryRestrictedItems.length === 1
        ? 'Une boisson chaude ou formule chaude a été retirée du panier, car elle n’est pas disponible en livraison.'
        : 'Certaines boissons chaudes ou formules chaudes ont été retirées du panier, car elles ne sont pas disponibles en livraison.',
    );
  }, [deliveryRestrictedItems, fulfillmentType, removeItems]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0) {
      return;
    }

    setSubmitting(true);
    setCheckoutError(null);

    setFulfillmentType(fulfillmentType);
    setDiningMode(isDelivery ? null : diningMode);

    const payload: CheckoutPayload = {
      fulfillmentType,
      diningMode: isDelivery ? null : diningMode,
      orderSource: isDelivery ? 'delivery_web' : 'menu_qr',
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim() || undefined,
      customerEmail: form.customerEmail.trim() || undefined,
      deliveryAddress: isDelivery ? form.deliveryAddress.trim() || undefined : undefined,
      deliveryFee,
      desiredTime: form.desiredTime.trim() || undefined,
      confirmationStatus,
      proposedTime: undefined,
      customerConfirmationRequired: false,
      customerConfirmedAt: null,
      restaurantNote: isDelivery
        ? 'Votre paiement sera d’abord autorisé, puis capturé après confirmation du créneau.'
        : undefined,
      customerNote: form.customerNote.trim() || undefined,
      paymentMode: 'online_payment_pending',
      items,
    };

    try {
      analyticsService.trackCheckoutStart({
        subtotal,
        total,
        item_count: items.length,
        fulfillment_type: fulfillmentType,
        dining_mode: diningMode ?? 'none',
      });

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: window.location.origin,
          payload,
        }),
      });

      const data = await readApiResponse<CheckoutSessionResponse>(response);

      if (!response.ok || !('id' in data) || !data.id || !('url' in data) || !data.url) {
        const message =
          'message' in data
            ? data.message
            : 'error' in data
              ? data.error
              : undefined;
        throw new Error(message || 'Impossible de lancer le paiement Stripe.');
      }

      savePendingCheckoutSession({
        sessionId: data.id,
        payload,
        createdAt: new Date().toISOString(),
      });

      window.location.href = data.url;
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : 'Le paiement n’a pas pu être lancé pour le moment.',
      );
      setSubmitting(false);
    }
  }

  return (
    <>
      <SEO
        title="Paiement | Le Petit Bougiote Béziers"
        description="Finalisez votre commande puis réglez-la via Stripe Checkout."
        path="/checkout"
      />
      {requiresDeliveryAccount ? <Navigate to="/connexion?redirect=%2Fcheckout" replace /> : null}
      {isDelivery && showDeliveryNotice ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl shadow-black/20">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-wood/75">
              Information livraison
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              Confirmation possible du créneau
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Afin de préserver la meilleure qualité de service et de préparation, nous
              vous informons que la livraison peut demander un court délai de confirmation.
              Le Petit Bougiote travaille avec une solution de livraison locale et attentive:
              selon le créneau demandé, nous pouvons avoir besoin de vérifier la
              disponibilité du livreur avant validation définitive. Si un ajustement est
              nécessaire, nous vous proposerons rapidement un horaire estimé ou confirmé.
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Vérifiez votre commande dans les 5 minutes si le restaurant vous propose un nouveau créneau.
              Sans réponse de votre part passé ce délai, ce nouveau créneau sera automatiquement accepté.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowDeliveryNotice(false)}
                className="rounded-full bg-brand-deepgreen px-5 py-3 text-sm font-semibold text-white"
              >
                J’ai compris
              </button>
              <Link
                to="/livraison"
                className="rounded-full border border-brand-green/10 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Retour à la livraison
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-green/70">
            Paiement
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            Validation de commande
          </h1>
        </Reveal>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <Reveal className="rounded-[2rem] bg-white p-8">
            <form onSubmit={handleSubmit}>
              <section>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-green/70">
                  Étape 1
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Vos informations
                </h2>
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    Nom
                    <input
                      required
                      name="customerName"
                      value={form.customerName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          customerName: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Téléphone
                    <input
                      required={isDelivery}
                      name="customerPhone"
                      value={form.customerPhone}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          customerPhone: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700 md:col-span-2">
                    Email {isDelivery ? '' : '(optionnel)'}
                    <input
                      required={isDelivery}
                      name="customerEmail"
                      type="email"
                      value={form.customerEmail}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          customerEmail: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                    />
                  </label>
                </div>
              </section>

              <section className="mt-8">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-green/70">
                  Étape 2
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Mode de récupération
                </h2>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setLocalFulfillmentType('click_collect')}
                    className={`rounded-[1.6rem] border p-5 text-left ${
                      fulfillmentType === 'click_collect'
                        ? 'border-brand-green bg-brand-offwhite'
                        : 'border-brand-border bg-white'
                    }`}
                  >
                    <p className="font-semibold text-slate-950">Click & Collect</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Retrait ou commande sur place, avec un parcours plus direct.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalFulfillmentType('delivery')}
                    className={`rounded-[1.6rem] border p-5 text-left ${
                      fulfillmentType === 'delivery'
                        ? 'border-brand-green bg-brand-offwhite'
                        : 'border-brand-border bg-white'
                    }`}
                  >
                    <p className="font-semibold text-slate-950">Livraison</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Livraison locale à Béziers avec tarif fixe et validation attentive du
                      créneau.
                    </p>
                  </button>
                </div>

                {fulfillmentType === 'click_collect' ? (
                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div className="rounded-[1.6rem] border border-brand-green/10 bg-brand-offwhite p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-green/70">
                        Service
                      </p>
                      <div className="mt-4 grid gap-3">
                        <button
                          type="button"
                          onClick={() => setLocalDiningMode('sur_place')}
                          className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${
                            diningMode === 'sur_place'
                              ? 'border-brand-green bg-white text-slate-950'
                              : 'border-brand-border bg-white/80 text-slate-700'
                          }`}
                        >
                          Sur place
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocalDiningMode('a_emporter')}
                          className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${
                            diningMode === 'a_emporter'
                              ? 'border-brand-green bg-white text-slate-950'
                              : 'border-brand-border bg-white/80 text-slate-700'
                          }`}
                        >
                          À emporter
                        </button>
                      </div>
                    </div>
                    <label className="text-sm font-medium text-slate-700">
                      Heure souhaitée
                      <input
                        name="desiredTime"
                        type="time"
                        value={form.desiredTime}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            desiredTime: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700 md:col-span-2">
                      Adresse de livraison
                      <input
                        required={isDelivery}
                        name="deliveryAddress"
                        value={form.deliveryAddress}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            deliveryAddress: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                        placeholder="Rue, numéro, étage, code d’accès si besoin"
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Créneau de livraison souhaité
                      <input
                        name="desiredTime"
                        type="time"
                        value={form.desiredTime}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            desiredTime: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                      />
                    </label>
                    <div className="rounded-[1.6rem] border border-brand-green/10 bg-brand-offwhite p-5">
                      <p className="text-sm font-semibold text-slate-950">
                        Livraison Béziers
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        Tarif fixe : {formatPrice(DELIVERY_FEE)}. Un créneau précis peut
                        nécessiter une confirmation complémentaire.
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        Les boissons chaudes, petits-déjeuners et formules chaudes ne sont pas disponibles en livraison.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              <section className="mt-8">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-green/70">
                  Étape 3
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Notes et paiement
                </h2>
                <label className="mt-5 block text-sm font-medium text-slate-700">
                  Note de commande
                  <textarea
                    name="customerNote"
                    value={form.customerNote}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        customerNote: event.target.value,
                      }))
                    }
                    className="mt-2 min-h-32 w-full rounded-2xl border border-brand-green/10 bg-brand-cream p-4 outline-none"
                    placeholder={
                      isDelivery
                        ? 'Précision de livraison, code, étage, demande simple...'
                        : 'Précision de retrait, préférence simple, demande pour le service...'
                    }
                  />
                </label>
                <div className="mt-6 rounded-3xl bg-brand-cream p-5">
                  <p className="text-sm font-semibold text-slate-950">Paiement Stripe</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Vous allez être redirigé vers Stripe Checkout pour finaliser le
                    règlement de votre commande en toute sécurité.
                  </p>
                </div>
                {isDelivery ? (
                  <div className="mt-4 rounded-3xl border border-brand-wood/12 bg-[linear-gradient(145deg,rgba(245,240,230,0.96),rgba(251,248,242,0.96))] p-5 text-sm leading-7 text-slate-600">
                    Votre créneau de livraison peut nécessiter une confirmation. Nous vous
                    confirmerons rapidement la disponibilité.
                    <p className="mt-3">
                      Si un nouveau créneau vous est proposé, pensez à vérifier votre commande dans les 5 minutes.
                      Sans réponse, le créneau proposé sera accepté automatiquement.
                    </p>
                  </div>
                ) : null}
                {deliveryRestrictionNotice ? (
                  <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {deliveryRestrictionNotice}
                  </p>
                ) : null}
                {checkoutError ? (
                  <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {checkoutError}
                  </p>
                ) : null}

                <button
                  disabled={items.length === 0 || submitting}
                  className="mt-6 rounded-full bg-brand-deepgreen px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {submitting ? 'Redirection en cours...' : 'Procéder au paiement'}
                </button>
              </section>
            </form>
          </Reveal>

          <Reveal
            className="rounded-[1.8rem] border border-brand-green/10 bg-white p-6 lg:sticky lg:top-24 lg:h-fit"
            delay={120}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-green/70">
              Étape 3
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Récapitulatif</h2>
            {fulfillmentType === 'delivery' && deliveryRestrictedItems.length > 0 ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Les boissons chaudes et formules chaudes seront retirées si vous passez en livraison.
              </div>
            ) : null}
            <div className="mt-5 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                  <div className="flex gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-brand-offwhite">
                      <img
                        src={item.image}
                        alt={item.imageAlt}
                        className={`h-full w-full ${
                          item.imageFit === 'contain' ? 'object-contain p-3' : 'object-cover'
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">
                        {item.name} x{item.quantity}
                      </p>
                      {item.note ? <p className="mt-1 text-slate-500">{item.note}</p> : null}
                    </div>
                  </div>
                  <p className="font-semibold text-slate-950">
                    {formatPrice((item.price ?? 0) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-3 border-t border-brand-green/10 pt-4 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Mode</span>
                <span className="font-semibold text-slate-950">
                  {getFulfillmentTypeLabel(fulfillmentType)}
                </span>
              </div>
              {fulfillmentType === 'click_collect' ? (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Service</span>
                  <span className="font-semibold text-slate-950">
                    {getDiningModeLabel(diningMode)}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between text-slate-600">
                <span>Sous-total</span>
                <span className="font-semibold text-slate-950">
                  {formatPrice(subtotal, '0 €')}
                </span>
              </div>
              {isDelivery ? (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Livraison Béziers</span>
                  <span className="font-semibold text-slate-950">
                    {formatPrice(deliveryFee)}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between text-slate-600">
                <span>Total</span>
                <span className="text-lg font-semibold text-slate-950">
                  {formatPrice(total, '0 €')}
                </span>
              </div>
              <div className="rounded-2xl bg-brand-cream px-4 py-3 text-xs leading-6 text-slate-600">
                Paiement sécurisé via Stripe Checkout. Vous retrouverez ensuite le détail de
                commande et le suivi depuis votre espace client.
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
