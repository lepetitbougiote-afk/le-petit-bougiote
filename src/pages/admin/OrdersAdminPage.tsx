import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { supabaseClient } from '../../lib/supabaseClient';
import { orderService } from '../../services/orderService';
import { analyticsService } from '../../services/analyticsService';
import type { Order, OrderStatus } from '../../types';
import { formatPrice, getConfirmationStatusLabel, getDesiredTimeLabel, getFulfillmentTypeLabel, getOrderStatusLabel } from '../../lib/utils';

const statuses: Array<OrderStatus | 'all'> = ['all', 'pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<(typeof statuses)[number]>('all');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [proposedTimeDrafts, setProposedTimeDrafts] = useState<Record<string, string>>({});

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

  async function handleStatusUpdate(orderId: string, status: OrderStatus) {
    const updated = await orderService.updateOrderStatus(orderId, status);
    setOrders((current) => current.map((order) => (order.id === orderId && updated ? updated : order)));
    analyticsService.trackAdminOrderStatusUpdate({ order_id: orderId, status });
  }

  async function handleAccept(order: Order) {
    const updated = await orderService.updateOrderConfirmationByAdmin(order.id, {
      confirmationStatus: 'confirmed',
      status: 'accepted',
      proposedTime: null,
      desiredTime: order.desiredTime ?? null,
      restaurantNote:
        noteDrafts[order.id]?.trim() ||
        'Votre créneau a bien été accepté. Vous pouvez finaliser votre commande dès maintenant.',
      customerConfirmationRequired: false,
    });
    setOrders((current) => current.map((item) => (item.id === order.id && updated ? updated : item)));
  }

  async function handleProposeTime(order: Order) {
    const proposedTime = proposedTimeDrafts[order.id]?.trim();
    if (!proposedTime) {
      return;
    }

    const updated = await orderService.updateOrderConfirmationByAdmin(order.id, {
      confirmationStatus: 'time_adjustment_requested',
      status: 'pending',
      proposedTime,
      restaurantNote:
        noteDrafts[order.id]?.trim() ||
        'Le créneau demandé n’est pas disponible. Merci de confirmer le nouvel horaire proposé.',
      customerConfirmationRequired: true,
    });
    setOrders((current) => current.map((item) => (item.id === order.id && updated ? updated : item)));
  }

  async function handleRefuse(order: Order) {
    const updated = await orderService.updateOrderConfirmationByAdmin(order.id, {
      confirmationStatus: 'cancelled',
      status: 'cancelled',
      proposedTime: null,
      restaurantNote:
        noteDrafts[order.id]?.trim() ||
        'Nous sommes désolés, cette demande ne peut pas être validée dans les conditions demandées.',
      customerConfirmationRequired: false,
    });
    setOrders((current) => current.map((item) => (item.id === order.id && updated ? updated : item)));
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
          filteredOrders.map((order) => (
            <article key={order.id} className="rounded-[1.8rem] bg-white p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xl font-semibold text-slate-950">{order.customerName}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {order.id} • {getFulfillmentTypeLabel(order.fulfillmentType)}
                    {order.customerPhone ? ` • ${order.customerPhone}` : ''}
                    {order.desiredTime ? ` • ${getDesiredTimeLabel(order.fulfillmentType).toLowerCase()} ${order.desiredTime}` : ''}
                  </p>
                </div>
                <StatusBadge tone={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'}>
                  {getOrderStatusLabel(order.status)}
                </StatusBadge>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <StatusBadge tone={order.confirmationStatus === 'confirmed' ? 'success' : order.confirmationStatus === 'cancelled' ? 'danger' : 'warning'}>
                  {getConfirmationStatusLabel(order.confirmationStatus)}
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
              {order.fulfillmentType === 'delivery' ? (
                <div className="mt-5 rounded-[1.5rem] border border-brand-green/10 bg-brand-offwhite p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-green/70">Double confirmation</p>
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
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => void handleAccept(order)} className="rounded-full bg-brand-green px-4 py-2 text-sm font-semibold text-white">
                      Accepter le créneau
                    </button>
                    <button type="button" onClick={() => void handleProposeTime(order)} className="rounded-full border border-brand-green/20 bg-white px-4 py-2 text-sm font-semibold text-slate-800">
                      Proposer un autre horaire
                    </button>
                    <button type="button" onClick={() => void handleRefuse(order)} className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700">
                      Refuser la demande
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {(['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'] as OrderStatus[]).map((status) => (
                  <button key={status} type="button" onClick={() => void handleStatusUpdate(order.id, status)} className="rounded-full border border-brand-green/10 px-4 py-2 text-sm font-semibold text-slate-700">
                    {getOrderStatusLabel(status)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => void handleDelete(order.id)}
                  className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700"
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
