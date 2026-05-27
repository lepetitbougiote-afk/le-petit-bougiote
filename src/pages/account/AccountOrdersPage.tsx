import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { supabaseClient } from '../../lib/supabaseClient';
import { orderService } from '../../services/orderService';
import type { Order } from '../../types';
import { formatDate, formatPrice, getConfirmationStatusLabel, getDesiredTimeLabel, getFulfillmentTypeLabel, getOrderStatusLabel } from '../../lib/utils';

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
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
    const updated = await orderService.respondToConfirmation(orderId, { accepted });
    setOrders((current) => current.map((order) => (order.id === orderId && updated ? updated : order)));
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
                {order.fulfillmentType === 'delivery' && order.confirmationStatus === 'time_adjustment_requested' && order.customerConfirmationRequired ? (
                  <div className="mt-4 rounded-[1.5rem] border border-brand-green/10 bg-white p-4">
                    <p className="text-sm leading-7 text-slate-600">
                      Un nouvel horaire vous est proposé. Confirmez ce créneau pour poursuivre votre commande.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void handleConfirmationResponse(order.id, true)}
                        className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white"
                      >
                        J’accepte ce créneau
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleConfirmationResponse(order.id, false)}
                        className="rounded-full border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-700"
                      >
                        Je refuse
                      </button>
                    </div>
                  </div>
                ) : null}
                {order.fulfillmentType === 'delivery' && order.confirmationStatus === 'confirmed' && order.status === 'accepted' ? (
                  <div className="mt-4 rounded-[1.5rem] border border-brand-green/10 bg-brand-offwhite p-4 text-sm leading-7 text-slate-600">
                    Votre commande est validée. Le paiement en ligne sera activé à cette étape dès sa mise en service.
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
