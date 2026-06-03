import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { supabaseClient } from '../../lib/supabaseClient';
import { orderService } from '../../services/orderService';
import type { Order } from '../../types';
import {
  formatDate,
  formatPrice,
  getConfirmationStatusLabel,
  getDesiredTimeLabel,
  getFulfillmentTypeLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from '../../lib/utils';

function canCancelWithinWindow(order: Order) {
  if (order.fulfillmentType !== 'delivery' || !order.customerCanCancelUntil) {
    return false;
  }

  if (['confirmed', 'preparing', 'ready', 'completed', 'cancelled'].includes(order.status)) {
    return false;
  }

  return Date.now() <= new Date(order.customerCanCancelUntil).getTime();
}

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [actionLoadingByOrder, setActionLoadingByOrder] = useState<Record<string, boolean>>({});
  const [actionErrorByOrder, setActionErrorByOrder] = useState<Record<string, string>>({});
  const { user, loading } = useAuth();

  useEffect(() => {
    async function loadOrders() {
      const nextOrders = await orderService.getCurrentUserOrders();
      setOrders(nextOrders);
    }

    void loadOrders();

    if (!supabaseClient || !user) {
      return;
    }

    const channel = supabaseClient
      .channel(`account-orders-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void loadOrders();
      })
      .subscribe();

    return () => {
      void supabaseClient.removeChannel(channel);
    };
  }, [user]);

  async function handleConfirmationResponse(orderId: string, accepted: boolean) {
    try {
      setActionLoadingByOrder((current) => ({ ...current, [orderId]: true }));
      setActionErrorByOrder((current) => ({ ...current, [orderId]: '' }));
      const updated = await orderService.respondToConfirmation(orderId, { accepted });
      setOrders((current) => current.map((order) => (order.id === orderId && updated ? updated : order)));
    } catch (error) {
      setActionErrorByOrder((current) => ({
        ...current,
        [orderId]:
          error instanceof Error ? error.message : 'Impossible de traiter votre réponse.',
      }));
    } finally {
      setActionLoadingByOrder((current) => ({ ...current, [orderId]: false }));
    }
  }

  async function handleCustomerCancel(orderId: string) {
    try {
      setActionLoadingByOrder((current) => ({ ...current, [orderId]: true }));
      setActionErrorByOrder((current) => ({ ...current, [orderId]: '' }));
      const updated = await orderService.cancelDeliveryOrderByCustomer(
        orderId,
        'customer_cancel_within_10_minutes',
      );
      setOrders((current) => current.map((order) => (order.id === orderId && updated ? updated : order)));
    } catch (error) {
      setActionErrorByOrder((current) => ({
        ...current,
        [orderId]:
          error instanceof Error ? error.message : 'Impossible d’annuler votre commande.',
      }));
    } finally {
      setActionLoadingByOrder((current) => ({ ...current, [orderId]: false }));
    }
  }

  if (!loading && !user) {
    return <Navigate to="/connexion" replace />;
  }

  return (
    <>
      <SEO title="Mes commandes | Le Petit Bougiote Béziers" description="Historique de commandes client avec statuts et détails." path="/compte/commandes" />
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-green/70">Compte</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Mes commandes</h1>
        </div>
        {orders.length === 0 ? (
          <div className="mt-8 rounded-[2rem] bg-white p-10 text-center text-slate-600">Aucune commande pour le moment.</div>
        ) : (
          <div className="mt-8 grid gap-4">
            {orders.map((order) => (
              <article key={order.id} className="rounded-[1.8rem] bg-white p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">{order.id}</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {formatDate(order.createdAt)} • {getFulfillmentTypeLabel(order.fulfillmentType)}
                      {order.desiredTime ? ` • ${getDesiredTimeLabel(order.fulfillmentType)} ${order.desiredTime}` : ''}
                    </p>
                  </div>
                  <StatusBadge tone={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'}>
                    {getOrderStatusLabel(order.status)}
                  </StatusBadge>
                </div>
                <div className="mt-5 grid gap-2 text-sm text-slate-600">
                  {order.items.map((item, index) => (
                    <p key={`${order.id}-${index}`}>{item.quantity} × {item.productNameSnapshot} • {formatPrice(item.total)}</p>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-brand-cream p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-green/70">Confirmation</p>
                    <p className="mt-2 font-semibold text-slate-950">{getConfirmationStatusLabel(order.confirmationStatus)}</p>
                  </div>
                  <div className="rounded-3xl bg-brand-cream p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-green/70">Paiement</p>
                    <p className="mt-2 font-semibold text-slate-950">{getPaymentStatusLabel(order.paymentStatus)}</p>
                  </div>
                  {order.proposedTime ? (
                    <div className="rounded-3xl bg-brand-cream p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-green/70">Horaire proposé</p>
                      <p className="mt-2 font-semibold text-slate-950">{order.proposedTime}</p>
                    </div>
                  ) : null}
                  {order.restaurantNote ? (
                    <div className="rounded-3xl bg-brand-cream p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-green/70">Message du restaurant</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{order.restaurantNote}</p>
                    </div>
                  ) : null}
                </div>
                {actionErrorByOrder[order.id] ? (
                  <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {actionErrorByOrder[order.id]}
                  </p>
                ) : null}
                {order.fulfillmentType === 'delivery' && order.confirmationStatus === 'time_adjustment_requested' && order.customerConfirmationRequired ? (
                  <div className="mt-4 rounded-[1.5rem] border border-brand-green/10 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-green/70">
                      Nouveau créneau proposé
                    </p>
                    <p className="text-sm leading-7 text-slate-600">
                      Un nouvel horaire vous est proposé. Confirmez ce créneau pour poursuivre votre commande.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={actionLoadingByOrder[order.id]}
                        onClick={() => void handleConfirmationResponse(order.id, true)}
                        className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        J’accepte ce créneau
                      </button>
                      <button
                        type="button"
                        disabled={actionLoadingByOrder[order.id]}
                        onClick={() => void handleConfirmationResponse(order.id, false)}
                        className="rounded-full border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Annuler ma commande
                      </button>
                    </div>
                  </div>
                ) : null}
                {order.fulfillmentType === 'delivery' &&
                order.paymentStatus === 'authorized' &&
                order.confirmationStatus === 'pending' ? (
                  <div className="mt-4 rounded-[1.5rem] border border-brand-green/10 bg-brand-offwhite p-4 text-sm leading-7 text-slate-600">
                    Votre paiement est autorisé, mais pas encore capturé. Le restaurant va confirmer votre créneau de livraison avant débit définitif.
                  </div>
                ) : null}
                {order.fulfillmentType === 'delivery' &&
                order.paymentStatus === 'paid' ? (
                  <div className="mt-4 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4 text-sm leading-7 text-emerald-800">
                    Votre paiement a bien été capturé et la commande suit maintenant son parcours normal.
                  </div>
                ) : null}
                {order.fulfillmentType === 'delivery' &&
                order.paymentStatus === 'cancelled' ? (
                  <div className="mt-4 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-rose-700">
                    L’autorisation de paiement a été annulée. Aucun débit final ne sera effectué.
                  </div>
                ) : null}
                {order.fulfillmentType === 'delivery' && canCancelWithinWindow(order) ? (
                  <div className="mt-4 rounded-[1.5rem] border border-brand-green/10 bg-white p-4">
                    <p className="text-sm leading-7 text-slate-600">
                      Annulation possible pendant les 10 premières minutes après validation de la commande.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={actionLoadingByOrder[order.id]}
                        onClick={() => void handleCustomerCancel(order.id)}
                        className="rounded-full border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Annuler ma commande
                      </button>
                    </div>
                  </div>
                ) : null}
                {order.fulfillmentType === 'delivery' &&
                !canCancelWithinWindow(order) &&
                order.confirmationStatus !== 'time_adjustment_requested' &&
                !['confirmed', 'preparing', 'ready', 'completed', 'cancelled'].includes(order.status) ? (
                  <div className="mt-4 rounded-[1.5rem] border border-brand-green/10 bg-brand-offwhite p-4 text-sm leading-7 text-slate-600">
                    Le délai d’annulation automatique est dépassé. Contactez le restaurant si besoin.
                  </div>
                ) : null}
                <p className="mt-4 text-sm font-semibold text-slate-950">Total {formatPrice(order.total)}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
