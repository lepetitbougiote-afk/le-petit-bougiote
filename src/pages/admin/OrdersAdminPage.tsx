import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { supabaseClient } from '../../lib/supabaseClient';
import { orderService } from '../../services/orderService';
import { analyticsService } from '../../services/analyticsService';
import type { Order, OrderStatus } from '../../types';
import {
  formatPrice,
  getConfirmationStatusLabel,
  getDesiredTimeLabel,
  getFulfillmentTypeLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from '../../lib/utils';

const statuses: Array<OrderStatus | 'all'> = [
  'all',
  'pending_payment',
  'awaiting_restaurant_confirmation',
  'time_adjustment_requested',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled',
];

const SEEN_ORDERS_STORAGE_KEY = 'bougiote-admin-seen-orders';

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<(typeof statuses)[number]>('all');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [proposedTimeDrafts, setProposedTimeDrafts] = useState<Record<string, string>>({});
  const [actionLoadingByOrder, setActionLoadingByOrder] = useState<Record<string, boolean>>({});
  const [actionErrorByOrder, setActionErrorByOrder] = useState<Record<string, string>>({});
  const [seenOrderIds, setSeenOrderIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    const storedValue = window.localStorage.getItem(SEEN_ORDERS_STORAGE_KEY);
    if (!storedValue) {
      return [];
    }

    try {
      return JSON.parse(storedValue) as string[];
    } catch {
      return [];
    }
  });
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadOrders() {
      const nextOrders = await orderService.getAdminOrders();
      setOrders(nextOrders);
      setNoteDrafts((current) => {
        const next = { ...current };
        nextOrders.forEach((order) => {
          if (!(order.id in next)) {
            next[order.id] = order.restaurantNote ?? '';
          }
        });
        return next;
      });
      setProposedTimeDrafts((current) => {
        const next = { ...current };
        nextOrders.forEach((order) => {
          if (!(order.id in next)) {
            next[order.id] = order.proposedTime ?? '';
          }
        });
        return next;
      });
    }

    void loadOrders();

    if (!supabaseClient) {
      return;
    }

    const channel = supabaseClient
      .channel('admin-orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void loadOrders();
      })
      .subscribe();

    return () => {
      void supabaseClient.removeChannel(channel);
    };
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = activeStatus === 'all' || order.status === activeStatus;
      const query = search.toLowerCase();
      const matchesSearch =
        !query ||
        order.customerName.toLowerCase().includes(query) ||
        (order.customerPhone ?? '').includes(query) ||
        order.id.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [activeStatus, orders, search]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(SEEN_ORDERS_STORAGE_KEY, JSON.stringify(seenOrderIds));
  }, [seenOrderIds]);

  function toggleOrderOpen(orderId: string) {
    setSeenOrderIds((current) => (current.includes(orderId) ? current : [...current, orderId]));
    setExpandedOrderIds((current) =>
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId],
    );
  }

  async function handleStatusUpdate(orderId: string, status: OrderStatus) {
    try {
      setActionLoadingByOrder((current) => ({ ...current, [orderId]: true }));
      setActionErrorByOrder((current) => ({ ...current, [orderId]: '' }));
      const updated = await orderService.updateOrderStatus(orderId, status);
      setOrders((current) => current.map((order) => (order.id === orderId && updated ? updated : order)));
      analyticsService.trackAdminOrderStatusUpdate({ order_id: orderId, status });
    } catch (error) {
      setActionErrorByOrder((current) => ({
        ...current,
        [orderId]:
          error instanceof Error ? error.message : 'Impossible de mettre à jour le statut.',
      }));
    } finally {
      setActionLoadingByOrder((current) => ({ ...current, [orderId]: false }));
    }
  }

  async function handleAccept(order: Order) {
    try {
      setActionLoadingByOrder((current) => ({ ...current, [order.id]: true }));
      setActionErrorByOrder((current) => ({ ...current, [order.id]: '' }));
      const updated = await orderService.captureDeliveryPaymentByAdmin(order.id, {
        confirmedDeliveryTime: order.proposedTime ?? order.desiredTime ?? null,
        restaurantNote:
          noteDrafts[order.id]?.trim() ||
          'Votre créneau a bien été accepté. Votre commande passe en préparation.',
        nextStatus: 'confirmed',
      });
      setOrders((current) => current.map((item) => (item.id === order.id && updated ? updated : item)));
    } catch (error) {
      setActionErrorByOrder((current) => ({
        ...current,
        [order.id]:
          error instanceof Error ? error.message : 'Impossible de capturer le paiement.',
      }));
    } finally {
      setActionLoadingByOrder((current) => ({ ...current, [order.id]: false }));
    }
  }

  async function handleProposeTime(order: Order) {
    const proposedTime = proposedTimeDrafts[order.id]?.trim();
    if (!proposedTime) {
      return;
    }

    try {
      setActionLoadingByOrder((current) => ({ ...current, [order.id]: true }));
      setActionErrorByOrder((current) => ({ ...current, [order.id]: '' }));
      const updated = await orderService.proposeDeliveryTimeByAdmin(order.id, {
        proposedTime,
        restaurantNote:
          noteDrafts[order.id]?.trim() ||
          'Le créneau demandé n’est pas disponible. Merci de confirmer le nouvel horaire proposé.',
      });
      setOrders((current) => current.map((item) => (item.id === order.id && updated ? updated : item)));
    } catch (error) {
      setActionErrorByOrder((current) => ({
        ...current,
        [order.id]:
          error instanceof Error ? error.message : 'Impossible de proposer un nouvel horaire.',
      }));
    } finally {
      setActionLoadingByOrder((current) => ({ ...current, [order.id]: false }));
    }
  }

  async function handleRefuse(order: Order) {
    try {
      setActionLoadingByOrder((current) => ({ ...current, [order.id]: true }));
      setActionErrorByOrder((current) => ({ ...current, [order.id]: '' }));
      const updated = await orderService.cancelAuthorizedPaymentByAdmin(order.id, {
        restaurantNote:
          noteDrafts[order.id]?.trim() ||
          'Nous sommes désolés, cette demande ne peut pas être validée dans les conditions demandées.',
        cancellationReason: 'restaurant_cancelled_delivery_request',
      });
      setOrders((current) => current.map((item) => (item.id === order.id && updated ? updated : item)));
    } catch (error) {
      setActionErrorByOrder((current) => ({
        ...current,
        [order.id]:
          error instanceof Error ? error.message : 'Impossible d’annuler la demande.',
      }));
    } finally {
      setActionLoadingByOrder((current) => ({ ...current, [order.id]: false }));
    }
  }

  async function handleDelete(orderId: string) {
    const confirmed = window.confirm('Supprimer définitivement cette commande ?');
    if (!confirmed) {
      return;
    }

    const deleted = await orderService.deleteOrder(orderId);
    if (deleted) {
      setOrders((current) => current.filter((order) => order.id !== orderId));
    }
  }

  return (
    <section>
      <h1 className="text-3xl font-semibold text-slate-950">Commandes</h1>
      <div className="mt-6 rounded-[1.8rem] bg-white p-5">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une commande, un client ou un téléphone..." className="w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none" />
        <div className="mt-4 flex flex-wrap gap-2">
          {statuses.map((status) => (
            <button key={status} type="button" onClick={() => setActiveStatus(status)} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeStatus === status ? 'bg-brand-green text-white' : 'bg-brand-cream text-slate-700'}`}>
              {status === 'all' ? 'Toutes' : getOrderStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 grid gap-4">
        {filteredOrders.length === 0 ? (
          <div className="rounded-[1.8rem] bg-white p-10 text-center text-slate-600">Aucune commande pour ce filtre.</div>
        ) : (
          filteredOrders.map((order) => {
            const requiresDeliveryDecision =
              order.fulfillmentType === 'delivery' &&
              order.paymentStatus === 'authorized' &&
              ['awaiting_restaurant_confirmation', 'time_adjustment_requested'].includes(
                order.status,
              );
            const awaitingCustomerReply =
              order.fulfillmentType === 'delivery' &&
              order.confirmationStatus === 'time_adjustment_requested' &&
              order.customerConfirmationRequired;
            const showDeliveryConfirmationPanel =
              order.fulfillmentType === 'delivery' &&
              (requiresDeliveryDecision || awaitingCustomerReply || order.paymentStatus === 'authorized');
            const actionLoading = actionLoadingByOrder[order.id] ?? false;
            const actionError = actionErrorByOrder[order.id];
            const isSeen = seenOrderIds.includes(order.id);
            const isExpanded = expandedOrderIds.includes(order.id);

            return (
            <article key={order.id} className={`rounded-[1.8rem] border-2 p-6 transition-colors ${isSeen ? 'border-emerald-300 bg-emerald-50' : 'border-rose-400 bg-rose-100 shadow-[0_0_0_3px_rgba(244,63,94,0.08)]'}`}>
              <button
                type="button"
                onClick={() => toggleOrderOpen(order.id)}
                className="flex w-full flex-col gap-3 text-left md:flex-row md:items-start md:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xl font-semibold text-slate-950">{order.customerName}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isSeen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-600 text-white'}`}>
                      {isSeen ? 'Déjà ouverte' : 'Nouvelle'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {getFulfillmentTypeLabel(order.fulfillmentType)}
                    {order.customerPhone ? ` • ${order.customerPhone}` : ''}
                    {order.desiredTime ? ` • ${getDesiredTimeLabel(order.fulfillmentType).toLowerCase()} ${order.desiredTime}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge tone={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'}>
                    {getOrderStatusLabel(order.status)}
                  </StatusBadge>
                  <span className="text-sm font-semibold text-slate-500">
                    {isExpanded ? 'Masquer' : 'Ouvrir'}
                  </span>
                </div>
              </button>

              {isExpanded ? (
                <>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <StatusBadge tone={order.confirmationStatus === 'confirmed' ? 'success' : order.confirmationStatus === 'cancelled' ? 'danger' : 'warning'}>
                      {getConfirmationStatusLabel(order.confirmationStatus)}
                    </StatusBadge>
                    <StatusBadge
                      tone={
                        order.paymentStatus === 'paid'
                          ? 'success'
                          : order.paymentStatus === 'authorized'
                            ? 'warning'
                            : order.paymentStatus === 'cancelled' ||
                                order.paymentStatus === 'capture_failed' ||
                                order.paymentStatus === 'refund_failed'
                              ? 'danger'
                              : 'neutral'
                      }
                    >
                      {getPaymentStatusLabel(order.paymentStatus)}
                    </StatusBadge>
                    {order.fulfillmentType === 'delivery' ? (
                      <StatusBadge tone={order.customerConfirmationRequired ? 'warning' : 'neutral'}>
                        {order.customerConfirmationRequired ? 'Réponse client attendue' : 'Pas de réponse client en attente'}
                      </StatusBadge>
                    ) : null}
                  </div>
                  <div className="mt-5 rounded-[1.5rem] border border-brand-green/10 bg-brand-offwhite p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-green/70">Détail de la commande</p>
                    <div className="mt-4 grid gap-3">
                      {order.items.length === 0 ? (
                        <div className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-500">
                          Aucun article n’a pu être remonté pour cette commande.
                        </div>
                      ) : (
                        order.items.map((item, index) => (
                          <div key={`${order.id}-${index}`} className="rounded-2xl bg-white px-4 py-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-950">
                                  {item.quantity} × {item.productNameSnapshot}
                                </p>
                                {item.selectedOptions?.length ? (
                                  <p className="mt-1 text-sm text-slate-600">
                                    {item.selectedOptions.map((option) => option.label).join(' • ')}
                                  </p>
                                ) : null}
                                {item.itemNotes ? <p className="mt-1 text-sm text-slate-500">Note produit: {item.itemNotes}</p> : null}
                              </div>
                              <p className="text-sm font-semibold text-slate-950">{formatPrice(item.total)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  {order.notes ? <p className="mt-4 text-sm text-slate-600">Note: {order.notes}</p> : null}
                  {showDeliveryConfirmationPanel ? (
                <div className="mt-5 rounded-[1.5rem] border border-brand-green/10 bg-brand-offwhite p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-green/70">Double confirmation</p>
                  {order.paymentStatus === 'authorized' ? (
                    <div className="mt-3 rounded-2xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-900">
                      Paiement autorisé, non capturé pour le moment.
                    </div>
                  ) : null}
                  {order.paymentStatus === 'paid' ? (
                    <div className="mt-3 rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-900">
                      Paiement déjà capturé. Aucune autre action Stripe n’est nécessaire.
                    </div>
                  ) : null}
                  {order.paymentStatus === 'cancelled' ? (
                    <div className="mt-3 rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-900">
                      Paiement autorisé annulé. Cette demande est terminée.
                    </div>
                  ) : null}
                  {requiresDeliveryDecision ? (
                    <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                      Utilisez les actions ci-dessous pour accepter le créneau, proposer un nouvel horaire ou annuler la demande avant capture.
                    </div>
                  ) : null}
                  {awaitingCustomerReply ? (
                    <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                      Un nouvel horaire a été proposé. Le système attend maintenant la réponse du client.
                    </div>
                  ) : null}
                  <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
                    <label className="text-sm font-medium text-slate-700">
                      Message envoyé au client
                      <textarea
                        value={noteDrafts[order.id] ?? ''}
                        onChange={(event) =>
                          setNoteDrafts((current) => ({
                            ...current,
                            [order.id]: event.target.value,
                          }))
                        }
                        className="mt-2 min-h-28 w-full rounded-2xl border border-brand-green/10 bg-white p-4 outline-none"
                        placeholder="Ex: Nous pouvons vous proposer 14h00 à la place de 13h00. Merci de confirmer depuis votre espace client."
                      />
                    </label>
                    <div className="grid gap-4">
                      <label className="text-sm font-medium text-slate-700">
                        Horaire proposé
                        <input
                          type="time"
                          value={proposedTimeDrafts[order.id] ?? ''}
                          onChange={(event) =>
                            setProposedTimeDrafts((current) => ({
                              ...current,
                              [order.id]: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-white px-4 py-3 outline-none"
                        />
                      </label>
                      <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                        <p>Créneau demandé</p>
                        <p className="mt-1 font-semibold text-slate-950">{order.desiredTime ?? 'Non précisé'}</p>
                        {order.proposedTime ? (
                          <>
                            <p className="mt-3">Dernière proposition</p>
                            <p className="mt-1 font-semibold text-slate-950">{order.proposedTime}</p>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {actionError ? (
                    <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {actionError}
                    </p>
                  ) : null}
                  {requiresDeliveryDecision ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" disabled={actionLoading} onClick={() => void handleAccept(order)} className="rounded-full bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
                        Accepter le créneau
                      </button>
                      <button type="button" disabled={actionLoading} onClick={() => void handleProposeTime(order)} className="rounded-full border border-brand-green/20 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                        Proposer un autre horaire
                      </button>
                      <button type="button" disabled={actionLoading} onClick={() => void handleRefuse(order)} className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50">
                        Refuser la demande
                      </button>
                    </div>
                  ) : null}
                </div>
                  ) : null}
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {!requiresDeliveryDecision
                      ? ([
                          'pending_payment',
                          'awaiting_restaurant_confirmation',
                          'time_adjustment_requested',
                          'confirmed',
                          'preparing',
                          'ready',
                          'completed',
                          'cancelled',
                        ] as OrderStatus[]).map((status) => (
                          <button key={status} type="button" disabled={actionLoading} onClick={() => void handleStatusUpdate(order.id, status)} className="rounded-full border border-brand-green/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                            {getOrderStatusLabel(status)}
                          </button>
                        ))
                      : null}
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => void handleDelete(order.id)}
                      className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </>
              ) : null}
            </article>
            );
          })
        )}
      </div>
    </section>
  );
}
