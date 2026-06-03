import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';
import { Reveal } from '../../components/ui/Reveal';
import { useCart } from '../../contexts/CartContext';
import {
  clearPendingCheckoutSession,
  readCompletedCheckoutSession,
  readPendingCheckoutSession,
  saveCompletedCheckoutSession,
} from '../../lib/stripeCheckout';
import { formatPrice, getDiningModeLabel, getFulfillmentTypeLabel } from '../../lib/utils';
import { analyticsService } from '../../services/analyticsService';
import { orderService } from '../../services/orderService';
import type { Order } from '../../types';

interface SessionStatusResponse {
  id: string;
  status: string;
  paymentStatus: string;
  customerEmail?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  paymentIntentId?: string | null;
  paymentIntentStatus?: string | null;
  captureMethod?: string | null;
}

async function readApiResponse<T>(response: Response): Promise<T | { message?: string; error?: string }> {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as T | { message?: string; error?: string };
  } catch {
    return {
      error: text,
    };
  }
}

type SuccessState =
  | { status: 'loading' }
  | { status: 'ready'; order: Order }
  | { status: 'pending'; sessionId: string; paymentStatus: string }
  | { status: 'missing'; sessionId: string }
  | { status: 'error'; message: string; sessionId?: string };

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [state, setState] = useState<SuccessState>({ status: 'loading' });

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setState({
        status: 'error',
        message: 'Aucune session Stripe n’a été retrouvée pour cette confirmation.',
      });
      return;
    }

    async function finalizeStripeCheckout() {
      try {
        const statusResponse = await fetch(
          `/api/checkout-session-status?session_id=${encodeURIComponent(sessionId)}`,
        );
        const statusData = await readApiResponse<SessionStatusResponse>(statusResponse);

        if (!statusResponse.ok || !('id' in statusData) || !statusData.id) {
          const message =
            'message' in statusData
              ? statusData.message
              : 'error' in statusData
                ? statusData.error
                : undefined;
          throw new Error(message || 'Impossible de vérifier le paiement Stripe.');
        }

        const pending = readPendingCheckoutSession();
        const fulfillmentType = pending?.payload.fulfillmentType;
        const isDeliveryAuthorization =
          fulfillmentType === 'delivery' &&
          statusData.captureMethod === 'manual' &&
          statusData.paymentIntentStatus === 'requires_capture';
        const isImmediatePayment =
          statusData.paymentStatus === 'paid' ||
          statusData.paymentIntentStatus === 'succeeded';

        if (!isDeliveryAuthorization && !isImmediatePayment) {
          setState({
            status: 'pending',
            sessionId,
            paymentStatus: statusData.paymentIntentStatus ?? statusData.paymentStatus,
          });
          return;
        }

        const completed = readCompletedCheckoutSession();
        if (completed?.sessionId === sessionId) {
          const existingOrder = await orderService.getOrderById(completed.orderId);
          if (existingOrder) {
            setState({ status: 'ready', order: existingOrder });
            return;
          }
        }

        if (!pending || pending.sessionId !== sessionId) {
          setState({ status: 'missing', sessionId });
          return;
        }

        const nowIso = new Date().toISOString();
        const createdOrder = await orderService.createOrder({
          ...pending.payload,
          status:
            pending.payload.fulfillmentType === 'delivery'
              ? 'awaiting_restaurant_confirmation'
              : 'confirmed',
          paymentStatus:
            pending.payload.fulfillmentType === 'delivery' ? 'authorized' : 'paid',
          confirmationStatus:
            pending.payload.fulfillmentType === 'delivery' ? 'pending' : 'confirmed',
          customerConfirmationRequired: false,
          restaurantNote:
            pending.payload.fulfillmentType === 'delivery'
              ? 'Votre paiement est autorisé. Le restaurant va confirmer votre créneau de livraison.'
              : pending.payload.restaurantNote,
          stripeCheckoutSessionId: sessionId,
          stripePaymentIntentId: statusData.paymentIntentId ?? undefined,
          authorizedAt:
            pending.payload.fulfillmentType === 'delivery' ? nowIso : undefined,
          capturedAt:
            pending.payload.fulfillmentType === 'delivery' ? null : nowIso,
          customerCanCancelUntil:
            pending.payload.fulfillmentType === 'delivery'
              ? new Date(Date.now() + 10 * 60 * 1000).toISOString()
              : null,
        });

        analyticsService.trackOrderSubmitted({
          order_id: createdOrder.id,
          total: createdOrder.total,
          fulfillment_type: createdOrder.fulfillmentType,
          dining_mode: createdOrder.diningMode ?? 'none',
          stripe_session_id: sessionId,
        });

        clearCart();
        clearPendingCheckoutSession();
        saveCompletedCheckoutSession({
          sessionId,
          orderId: createdOrder.id,
          completedAt: new Date().toISOString(),
        });
        setState({ status: 'ready', order: createdOrder });
      } catch (error) {
        setState({
          status: 'error',
          sessionId,
          message:
            error instanceof Error
              ? error.message
              : 'Le paiement a été accepté, mais la finalisation de la commande a échoué.',
        });
      }
    }

    void finalizeStripeCheckout();
  }, [clearCart, searchParams]);

  return (
    <>
      <SEO
        title="Paiement confirmé | Le Petit Bougiote Béziers"
        description="Votre paiement a bien été pris en compte et votre commande est en cours de traitement."
        path="/checkout/success"
      />
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-green/70">
            Stripe Checkout
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            Paiement confirmé
          </h1>
        </Reveal>

        {state.status === 'loading' ? (
          <Reveal className="mt-8 rounded-[2rem] bg-white p-8">
            <p className="text-slate-600">
              Nous finalisons votre commande et vérifions la confirmation de paiement.
            </p>
          </Reveal>
        ) : null}

        {state.status === 'pending' ? (
          <Reveal className="mt-8 rounded-[2rem] bg-white p-8">
            <p className="text-slate-950">
              Le paiement Stripe est encore en cours de confirmation ({state.paymentStatus}).
            </p>
            <p className="mt-3 text-slate-600">
              Rafraîchissez cette page dans un instant ou revenez au panier si nécessaire.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/panier"
                className="rounded-full border border-brand-green/10 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Retour au panier
              </Link>
            </div>
          </Reveal>
        ) : null}

        {state.status === 'missing' ? (
          <Reveal className="mt-8 rounded-[2rem] bg-white p-8">
            <p className="text-slate-950">
              Le paiement Stripe semble validé, mais la session locale de commande n’a pas été
              retrouvée.
            </p>
            <p className="mt-3 text-slate-600">
              Conservez votre confirmation Stripe et contactez le restaurant si besoin avec la
              session {state.sessionId}.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white"
              >
                Contacter le restaurant
              </Link>
            </div>
          </Reveal>
        ) : null}

        {state.status === 'error' ? (
          <Reveal className="mt-8 rounded-[2rem] bg-white p-8">
            <p className="text-slate-950">{state.message}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/checkout"
                className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white"
              >
                Retour au checkout
              </Link>
            </div>
          </Reveal>
        ) : null}

        {state.status === 'ready' ? (
          <Reveal className="mt-8 rounded-[2rem] bg-white p-8">
            <h2 className="text-2xl font-semibold text-slate-950">Commande enregistrée</h2>
            <p className="mt-3 text-slate-600">
              Merci {state.order.customerName}. Votre commande a bien été enregistrée sous le
              numéro {state.order.id}.
            </p>
            <div className="mt-4 rounded-3xl bg-brand-offwhite p-5 text-sm leading-7 text-slate-700">
              {state.order.fulfillmentType === 'delivery'
                ? 'Votre paiement est autorisé. Le restaurant va confirmer votre créneau de livraison avant capture définitive.'
                : 'Votre paiement a bien été reçu et votre commande passe directement en préparation côté restaurant.'}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-brand-cream p-5">
                <p className="text-sm text-slate-500">Mode choisi</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {getFulfillmentTypeLabel(state.order.fulfillmentType)}
                </p>
              </div>
              {state.order.fulfillmentType === 'click_collect' ? (
                <div className="rounded-3xl bg-brand-cream p-5">
                  <p className="text-sm text-slate-500">Service</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">
                    {getDiningModeLabel(state.order.diningMode)}
                  </p>
                </div>
              ) : (
                <div className="rounded-3xl bg-brand-cream p-5">
                  <p className="text-sm text-slate-500">Livraison Béziers</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">
                    {formatPrice(state.order.deliveryFee ?? 4)}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 rounded-3xl bg-brand-offwhite p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-green/70">
                Détail
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                {state.order.items.map((item, index) => (
                  <div
                    key={`${item.productNameSnapshot}-${index}`}
                    className="flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-950">
                        {item.quantity} x {item.productNameSnapshot}
                      </p>
                      {item.selectedOptions?.length ? (
                        <p className="text-slate-500">
                          {item.selectedOptions.map((option) => option.label).join(', ')}
                        </p>
                      ) : null}
                    </div>
                    <p className="font-semibold text-slate-950">{formatPrice(item.total)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/compte/commandes"
                className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white"
              >
                Voir mes commandes
              </Link>
              <Link
                to={state.order.fulfillmentType === 'delivery' ? '/livraison' : '/menu'}
                className="rounded-full border border-brand-green/10 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Revenir à la carte
              </Link>
            </div>
          </Reveal>
        ) : null}
      </section>
    </>
  );
}
