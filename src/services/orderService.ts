import { mockOrders } from '../data/mockOrders';
import { products } from '../data/menu';
import { simulateAsync } from '../lib/dataProvider';
import { supabaseClient } from '../lib/supabaseClient';
import type { CheckoutPayload, ConfirmationStatus, Order, OrderStatus, PaymentStatus } from '../types';

let orderStore = [...mockOrders];
const localProductById = new Map(products.map((product) => [product.id, product]));

type SupabaseOrderItemRow = {
  id: string;
  order_id?: string;
  product_id: string | null;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  item_notes: string | null;
  selected_options: Order['items'][number]['selectedOptions'] | null;
  total: number;
};

type SupabaseOrderRow = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  status: OrderStatus;
  fulfillment_type: Order['fulfillmentType'];
  dining_mode: Order['diningMode'];
  order_source: Order['orderSource'];
  delivery_address: string | null;
  delivery_fee: number | null;
  desired_time: string | null;
  requested_delivery_time: string | null;
  confirmed_delivery_time: string | null;
  confirmation_status: Order['confirmationStatus'];
  proposed_time: string | null;
  customer_confirmation_required: boolean;
  customer_confirmed_at: string | null;
  restaurant_note: string | null;
  customer_note: string | null;
  notes: string | null;
  payment_status: PaymentStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  authorized_at: string | null;
  captured_at: string | null;
  customer_can_cancel_until: string | null;
  cancelled_at: string | null;
  refund_id: string | null;
  refund_status: string | null;
  cancellation_reason: string | null;
  public_confirmation_token: string | null;
  confirmation_link_expires_at: string | null;
  last_customer_notification_at: string | null;
  subtotal: number;
  total: number;
  created_at: string;
  order_items?: SupabaseOrderItemRow[] | null;
};

function mapOrder(row: SupabaseOrderRow, orderItems?: SupabaseOrderItemRow[]): Order {
  return {
    id: row.id,
    fulfillmentType: row.fulfillment_type,
    diningMode: row.dining_mode,
    orderSource: row.order_source,
    customerName: row.customer_name,
    customerPhone: row.customer_phone ?? undefined,
    customerEmail: row.customer_email ?? undefined,
    deliveryAddress: row.delivery_address ?? undefined,
    deliveryFee: row.delivery_fee ?? 0,
    desiredTime: row.requested_delivery_time ?? row.desired_time ?? undefined,
    confirmationStatus: row.confirmation_status,
    proposedTime: row.proposed_time ?? undefined,
    customerConfirmationRequired: row.customer_confirmation_required,
    customerConfirmedAt: row.customer_confirmed_at,
    restaurantNote: row.restaurant_note ?? undefined,
    customerNote: row.customer_note ?? undefined,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMode: 'online_payment_pending',
    createdAt: row.created_at,
    stripeCheckoutSessionId: row.stripe_checkout_session_id ?? null,
    stripePaymentIntentId: row.stripe_payment_intent_id ?? null,
    authorizedAt: row.authorized_at ?? null,
    capturedAt: row.captured_at ?? null,
    customerCanCancelUntil: row.customer_can_cancel_until ?? null,
    confirmedDeliveryTime: row.confirmed_delivery_time ?? null,
    cancelledAt: row.cancelled_at ?? null,
    refundId: row.refund_id ?? null,
    refundStatus: row.refund_status ?? null,
    cancellationReason: row.cancellation_reason ?? null,
    publicConfirmationToken: row.public_confirmation_token,
    confirmationLinkExpiresAt: row.confirmation_link_expires_at,
    lastCustomerNotificationAt: row.last_customer_notification_at,
    notes: row.notes ?? undefined,
    subtotal: Number(row.subtotal ?? 0),
    total: Number(row.total ?? 0),
    items: (orderItems ?? row.order_items ?? []).map((item) => ({
      productId: item.product_id,
      productNameSnapshot: item.product_name_snapshot,
      unitPriceSnapshot: Number(item.unit_price_snapshot ?? 0),
      quantity: item.quantity,
      itemNotes: item.item_notes ?? undefined,
      selectedOptions: item.selected_options ?? undefined,
      total: Number(item.total ?? 0),
    })),
  };
}

async function getAuthOrderScope() {
  if (!supabaseClient) {
    return null;
  }

  const { data } = await supabaseClient.auth.getUser();
  if (!data.user) {
    return null;
  }

  return {
    userId: data.user.id,
    email: data.user.email ?? null,
  };
}

async function getAccessToken() {
  if (!supabaseClient) {
    return null;
  }

  const { data } = await supabaseClient.auth.getSession();
  return data.session?.access_token ?? null;
}

function getCancelDeadline(createdAt: string) {
  return new Date(new Date(createdAt).getTime() + 10 * 60 * 1000).toISOString();
}

async function callOrderStripeAction<T extends object>(path: string, body: Record<string, unknown>) {
  const accessToken = await getAccessToken();
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const data = text
    ? (() => {
        try {
          return JSON.parse(text) as T | { error?: string; message?: string };
        } catch {
          return { error: text };
        }
      })()
    : {};

  if (!response.ok) {
    const message =
      'message' in data
        ? data.message
        : 'error' in data
          ? data.error
          : undefined;
    throw new Error(message || 'Action Stripe impossible.');
  }

  return data as T;
}

async function getRemoteProductIdMap(productIds: Array<string | null | undefined>) {
  if (!supabaseClient) {
    return new Map<string, string>();
  }

  const localProducts = Array.from(new Set(productIds.filter(Boolean) as string[]))
    .map((productId) => localProductById.get(productId))
    .filter(Boolean);

  if (localProducts.length === 0) {
    return new Map<string, string>();
  }

  const slugs = localProducts.map((product) => product.slug);
  const configuratorKeys = localProducts
    .map((product) => product.configuratorKey)
    .filter(Boolean) as string[];

  const remoteProductMap = new Map<string, string>();

  if (slugs.length > 0) {
    const { data } = await supabaseClient
      .from('products')
      .select('id, slug, configurator_key')
      .in('slug', slugs);

    (data ?? []).forEach((row) => {
      remoteProductMap.set(row.slug, row.id);
      if (row.configurator_key) {
        remoteProductMap.set(row.configurator_key, row.id);
      }
    });
  }

  if (configuratorKeys.length > 0) {
    const { data } = await supabaseClient
      .from('products')
      .select('id, slug, configurator_key')
      .in('configurator_key', configuratorKeys);

    (data ?? []).forEach((row) => {
      remoteProductMap.set(row.slug, row.id);
      if (row.configurator_key) {
        remoteProductMap.set(row.configurator_key, row.id);
      }
    });
  }

  return localProducts.reduce((accumulator, product) => {
    const remoteId =
      remoteProductMap.get(product.configuratorKey ?? '') ??
      remoteProductMap.get(product.slug);

    if (remoteId) {
      accumulator.set(product.id, remoteId);
    }

    return accumulator;
  }, new Map<string, string>());
}

const ORDER_SELECT = `
  id,
  customer_name,
  customer_phone,
  customer_email,
  status,
  fulfillment_type,
  dining_mode,
  order_source,
  delivery_address,
  delivery_fee,
  desired_time,
  requested_delivery_time,
  confirmed_delivery_time,
  confirmation_status,
  proposed_time,
  customer_confirmation_required,
  customer_confirmed_at,
  restaurant_note,
  customer_note,
  notes,
  payment_status,
  stripe_checkout_session_id,
  stripe_payment_intent_id,
  authorized_at,
  captured_at,
  customer_can_cancel_until,
  cancelled_at,
  refund_id,
  refund_status,
  cancellation_reason,
  public_confirmation_token,
  confirmation_link_expires_at,
  last_customer_notification_at,
  subtotal,
  total,
  created_at
`;

const ORDER_ITEMS_SELECT = `
  id,
  order_id,
  product_id,
  product_name_snapshot,
  unit_price_snapshot,
  quantity,
  item_notes,
  selected_options,
  total,
  created_at
`;

async function fetchOrderItemsByOrderIds(orderIds: string[]) {
  if (!supabaseClient || orderIds.length === 0) {
    return new Map<string, SupabaseOrderItemRow[]>();
  }

  const { data, error } = await supabaseClient
    .from('order_items')
    .select(ORDER_ITEMS_SELECT)
    .in('order_id', orderIds)
    .order('created_at', { ascending: true });

  if (error || !data) {
    return new Map<string, SupabaseOrderItemRow[]>();
  }

  return (data as SupabaseOrderItemRow[]).reduce((accumulator, item) => {
    const orderId = item.order_id;
    if (!orderId) {
      return accumulator;
    }
    const existing = accumulator.get(orderId) ?? [];
    existing.push(item);
    accumulator.set(orderId, existing);
    return accumulator;
  }, new Map<string, SupabaseOrderItemRow[]>());
}

async function fetchOrders(query: {
  order: (column: string, options: { ascending: boolean }) => PromiseLike<{
    data: unknown;
    error: unknown;
  }>;
}) {
  const { data, error } = await query.order('created_at', { ascending: false });

  if (error || !data) {
    return null;
  }

  const rows = data as SupabaseOrderRow[];
  const orderItemsByOrderId = await fetchOrderItemsByOrderIds(rows.map((row) => row.id));
  return rows.map((row) => mapOrder(row, orderItemsByOrderId.get(row.id)));
}

function createOrderId(prefix: 'LIV' | 'CLC') {
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${timestamp}`;
}

export const orderService = {
  async createOrder(payload: CheckoutPayload): Promise<Order> {
    const subtotal = payload.items.reduce(
      (sum, item) => sum + (item.price ?? 0) * item.quantity,
      0,
    );
    const deliveryFee = payload.fulfillmentType === 'delivery' ? payload.deliveryFee ?? 4 : 0;
    const createdAt = new Date().toISOString();
    const requestedDeliveryTime =
      payload.fulfillmentType === 'delivery' ? payload.desiredTime : undefined;
    const status =
      payload.status ??
      (payload.fulfillmentType === 'delivery'
        ? 'awaiting_restaurant_confirmation'
        : 'confirmed');
    const paymentStatus = payload.paymentStatus ?? 'unpaid';
    const customerCanCancelUntil =
      payload.customerCanCancelUntil ??
      (payload.fulfillmentType === 'delivery' ? getCancelDeadline(createdAt) : null);
    const newOrder: Order = {
      id: createOrderId(payload.fulfillmentType === 'delivery' ? 'LIV' : 'CLC'),
      fulfillmentType: payload.fulfillmentType,
      diningMode: payload.diningMode,
      orderSource: payload.orderSource,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerEmail: payload.customerEmail,
      deliveryAddress: payload.deliveryAddress,
      deliveryFee,
      desiredTime: requestedDeliveryTime,
      confirmationStatus: payload.confirmationStatus ?? 'pending',
      proposedTime: payload.proposedTime,
      customerConfirmationRequired: payload.customerConfirmationRequired ?? false,
      customerConfirmedAt: payload.customerConfirmedAt ?? null,
      restaurantNote: payload.restaurantNote,
      customerNote: payload.customerNote,
      status,
      paymentStatus,
      paymentMode: payload.paymentMode,
      createdAt,
      stripeCheckoutSessionId: payload.stripeCheckoutSessionId ?? null,
      stripePaymentIntentId: payload.stripePaymentIntentId ?? null,
      authorizedAt: payload.authorizedAt ?? null,
      capturedAt: payload.capturedAt ?? null,
      customerCanCancelUntil,
      confirmedDeliveryTime: payload.confirmedDeliveryTime ?? null,
      cancelledAt: payload.cancelledAt ?? null,
      refundId: payload.refundId ?? null,
      refundStatus: payload.refundStatus ?? null,
      cancellationReason: payload.cancellationReason ?? null,
      publicConfirmationToken: null,
      confirmationLinkExpiresAt: null,
      lastCustomerNotificationAt: null,
      notes: payload.customerNote,
      subtotal,
      total: subtotal + deliveryFee,
      items: payload.items.map((item) => ({
        productId: item.productId,
        productNameSnapshot: item.name,
        unitPriceSnapshot: item.price ?? 0,
        quantity: item.quantity,
        itemNotes: item.note,
        selectedOptions: item.selectedOptions,
        total: (item.price ?? 0) * item.quantity,
      })),
    };

    if (supabaseClient) {
      const authScope = await getAuthOrderScope();
      const remoteProductIds = await getRemoteProductIdMap(newOrder.items.map((item) => item.productId));
      const { data: insertedOrder, error: orderError } = await supabaseClient
        .from('orders')
        .insert({
          user_id: authScope?.userId ?? null,
          customer_name: newOrder.customerName,
          customer_phone: newOrder.customerPhone,
          customer_email: newOrder.customerEmail,
          fulfillment_type: newOrder.fulfillmentType,
          dining_mode: newOrder.diningMode,
          order_source: newOrder.orderSource,
          delivery_address: newOrder.deliveryAddress,
          delivery_fee: newOrder.deliveryFee ?? 0,
          desired_time: newOrder.desiredTime,
          requested_delivery_time: requestedDeliveryTime,
          confirmed_delivery_time: newOrder.confirmedDeliveryTime,
          confirmation_status: newOrder.confirmationStatus,
          proposed_time: newOrder.proposedTime,
          customer_confirmation_required: newOrder.customerConfirmationRequired,
          customer_confirmed_at: newOrder.customerConfirmedAt,
          restaurant_note: newOrder.restaurantNote,
          customer_note: newOrder.customerNote,
          notes: newOrder.notes,
          status: newOrder.status,
          payment_status: newOrder.paymentStatus ?? 'unpaid',
          stripe_checkout_session_id: newOrder.stripeCheckoutSessionId,
          stripe_payment_intent_id: newOrder.stripePaymentIntentId,
          authorized_at: newOrder.authorizedAt,
          captured_at: newOrder.capturedAt,
          customer_can_cancel_until: newOrder.customerCanCancelUntil,
          cancelled_at: newOrder.cancelledAt,
          refund_id: newOrder.refundId,
          refund_status: newOrder.refundStatus,
          cancellation_reason: newOrder.cancellationReason,
          subtotal: newOrder.subtotal,
          total: newOrder.total,
        })
        .select(
          'id, public_confirmation_token, confirmation_link_expires_at, last_customer_notification_at',
        )
        .single();

      if (!orderError && insertedOrder) {
        const { error: itemsError } = await supabaseClient.from('order_items').insert(
          newOrder.items.map((item) => ({
            order_id: insertedOrder.id,
            product_id: item.productId ? remoteProductIds.get(item.productId) ?? null : null,
            product_name_snapshot: item.productNameSnapshot,
            unit_price_snapshot: item.unitPriceSnapshot,
            quantity: item.quantity,
            item_notes: item.itemNotes,
            selected_options: item.selectedOptions ?? [],
            total: item.total,
          })),
        );

        if (!itemsError) {
          return simulateAsync(
            {
              ...newOrder,
              id: insertedOrder.id,
              publicConfirmationToken: insertedOrder.public_confirmation_token ?? null,
              confirmationLinkExpiresAt: insertedOrder.confirmation_link_expires_at ?? null,
              lastCustomerNotificationAt: insertedOrder.last_customer_notification_at ?? null,
            },
            150,
          );
        }
      }
    }

    orderStore = [newOrder, ...orderStore];
    return simulateAsync(newOrder, 300);
  },

  async getCurrentUserOrders(): Promise<Order[]> {
    if (supabaseClient) {
      const authScope = await getAuthOrderScope();
      if (authScope) {
        let query = supabaseClient.from('orders').select(ORDER_SELECT);
        if (authScope.email) {
          query = query.or(`user_id.eq.${authScope.userId},customer_email.eq.${authScope.email}`);
        } else {
          query = query.eq('user_id', authScope.userId);
        }

        const remoteOrders = await fetchOrders(query);
        if (remoteOrders) {
          return simulateAsync(remoteOrders, 120);
        }
      }

      return simulateAsync([], 80);
    }

    return simulateAsync([]);
  },

  async getOrderById(orderId: string): Promise<Order | undefined> {
    if (supabaseClient) {
      const remoteOrders = await fetchOrders(
        supabaseClient.from('orders').select(ORDER_SELECT).eq('id', orderId),
      );
      if (remoteOrders?.length) {
        return simulateAsync(remoteOrders[0], 120);
      }
    }

    return simulateAsync(orderStore.find((order) => order.id === orderId));
  },

  async getAdminOrders(): Promise<Order[]> {
    if (supabaseClient) {
      const remoteOrders = await fetchOrders(supabaseClient.from('orders').select(ORDER_SELECT));
      if (remoteOrders) {
        return simulateAsync(remoteOrders, 120);
      }
    }

    return simulateAsync([...orderStore]);
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | undefined> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select(ORDER_SELECT)
        .maybeSingle();

      if (!error && data) {
        const orderItemsByOrderId = await fetchOrderItemsByOrderIds([orderId]);
        return simulateAsync(mapOrder(data as SupabaseOrderRow, orderItemsByOrderId.get(orderId)), 120);
      }
    }

    orderStore = orderStore.map((order) =>
      order.id === orderId ? { ...order, status } : order,
    );
    return simulateAsync(orderStore.find((order) => order.id === orderId));
  },

  async cancelOrder(orderId: string): Promise<Order | undefined> {
    return this.updateOrderStatus(orderId, 'cancelled');
  },

  async updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus): Promise<Order | undefined> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('orders')
        .update({ payment_status: paymentStatus })
        .eq('id', orderId)
        .select(ORDER_SELECT)
        .maybeSingle();

      if (!error && data) {
        const orderItemsByOrderId = await fetchOrderItemsByOrderIds([orderId]);
        return simulateAsync(mapOrder(data as SupabaseOrderRow, orderItemsByOrderId.get(orderId)), 120);
      }
    }

    orderStore = orderStore.map((order) =>
      order.id === orderId ? { ...order, paymentStatus } : order,
    );
    return simulateAsync(orderStore.find((order) => order.id === orderId));
  },

  async deleteOrder(orderId: string): Promise<boolean> {
    if (supabaseClient) {
      const { error } = await supabaseClient.from('orders').delete().eq('id', orderId);
      if (!error) {
        return simulateAsync(true, 120);
      }
    }

    const initialLength = orderStore.length;
    orderStore = orderStore.filter((order) => order.id !== orderId);
    return simulateAsync(orderStore.length < initialLength, 120);
  },

  async captureDeliveryPaymentByAdmin(
    orderId: string,
    payload: {
      confirmedDeliveryTime?: string | null;
      restaurantNote?: string | null;
      nextStatus?: OrderStatus | null;
    },
  ): Promise<Order | undefined> {
    if (supabaseClient) {
      await callOrderStripeAction('/api/capture-payment', {
        orderId,
        actor: 'admin_accept',
        confirmedDeliveryTime: payload.confirmedDeliveryTime ?? null,
        restaurantNote: payload.restaurantNote ?? null,
        nextStatus: payload.nextStatus ?? null,
      });
      return this.getOrderById(orderId);
    }

    orderStore = orderStore.map((order) =>
      order.id === orderId
        ? {
            ...order,
            paymentStatus: 'paid',
            capturedAt: new Date().toISOString(),
            status: payload.nextStatus ?? 'confirmed',
            confirmationStatus: 'confirmed',
            customerConfirmationRequired: false,
            proposedTime: undefined,
            desiredTime:
              payload.confirmedDeliveryTime ?? order.proposedTime ?? order.desiredTime,
            confirmedDeliveryTime:
              payload.confirmedDeliveryTime ?? order.proposedTime ?? order.desiredTime,
            restaurantNote: payload.restaurantNote ?? order.restaurantNote,
          }
        : order,
    );
    return simulateAsync(orderStore.find((order) => order.id === orderId));
  },

  async cancelAuthorizedPaymentByAdmin(
    orderId: string,
    payload?: {
      restaurantNote?: string | null;
      cancellationReason?: string | null;
    },
  ): Promise<Order | undefined> {
    if (supabaseClient) {
      await callOrderStripeAction('/api/cancel-authorized-payment', {
        orderId,
        actor: 'admin_cancel',
        restaurantNote: payload?.restaurantNote ?? null,
        cancellationReason: payload?.cancellationReason ?? null,
      });
      return this.getOrderById(orderId);
    }

    orderStore = orderStore.map((order) =>
      order.id === orderId
        ? {
            ...order,
            status: 'cancelled',
            confirmationStatus: 'cancelled',
            paymentStatus: order.paymentStatus === 'authorized' ? 'cancelled' : order.paymentStatus,
            cancelledAt: new Date().toISOString(),
            customerConfirmationRequired: false,
            restaurantNote: payload?.restaurantNote ?? order.restaurantNote,
            cancellationReason:
              payload?.cancellationReason ?? 'restaurant_cancelled_delivery_request',
          }
        : order,
    );
    return simulateAsync(orderStore.find((order) => order.id === orderId));
  },

  async updateOrderConfirmationByAdmin(
    orderId: string,
    updates: {
      confirmationStatus: ConfirmationStatus;
      status?: OrderStatus;
      proposedTime?: string | null;
      restaurantNote?: string;
      customerConfirmationRequired?: boolean;
      desiredTime?: string | null;
    },
  ): Promise<Order | undefined> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('orders')
        .update({
          confirmation_status: updates.confirmationStatus,
          status: updates.status,
          proposed_time: updates.proposedTime ?? null,
          restaurant_note: updates.restaurantNote ?? null,
          customer_confirmation_required: updates.customerConfirmationRequired ?? false,
          desired_time: updates.desiredTime ?? undefined,
          last_customer_notification_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select(ORDER_SELECT)
        .maybeSingle();

      if (!error && data) {
        const orderItemsByOrderId = await fetchOrderItemsByOrderIds([orderId]);
        return simulateAsync(mapOrder(data as SupabaseOrderRow, orderItemsByOrderId.get(orderId)), 120);
      }
    }

    orderStore = orderStore.map((order) =>
      order.id === orderId
        ? {
            ...order,
            confirmationStatus: updates.confirmationStatus,
            status: updates.status ?? order.status,
            proposedTime: updates.proposedTime ?? undefined,
            restaurantNote: updates.restaurantNote ?? undefined,
            customerConfirmationRequired:
              updates.customerConfirmationRequired ?? order.customerConfirmationRequired,
            desiredTime: updates.desiredTime ?? order.desiredTime,
            lastCustomerNotificationAt: new Date().toISOString(),
          }
        : order,
    );
    return simulateAsync(orderStore.find((order) => order.id === orderId));
  },

  async proposeDeliveryTimeByAdmin(
    orderId: string,
    updates: {
      proposedTime: string;
      restaurantNote?: string;
    },
  ): Promise<Order | undefined> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('orders')
        .update({
          confirmation_status: 'time_adjustment_requested',
          status: 'time_adjustment_requested',
          proposed_time: updates.proposedTime,
          restaurant_note: updates.restaurantNote ?? null,
          customer_confirmation_required: true,
          last_customer_notification_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select(ORDER_SELECT)
        .maybeSingle();

      if (!error && data) {
        const orderItemsByOrderId = await fetchOrderItemsByOrderIds([orderId]);
        return simulateAsync(mapOrder(data as SupabaseOrderRow, orderItemsByOrderId.get(orderId)), 120);
      }
    }

    orderStore = orderStore.map((order) =>
      order.id === orderId
        ? {
            ...order,
            confirmationStatus: 'time_adjustment_requested',
            status: 'time_adjustment_requested',
            proposedTime: updates.proposedTime,
            restaurantNote: updates.restaurantNote ?? order.restaurantNote,
            customerConfirmationRequired: true,
            lastCustomerNotificationAt: new Date().toISOString(),
          }
        : order,
    );
    return simulateAsync(orderStore.find((order) => order.id === orderId));
  },

  async acceptProposedTimeByCustomer(orderId: string): Promise<Order | undefined> {
    if (supabaseClient) {
      await callOrderStripeAction('/api/capture-payment', {
        orderId,
        actor: 'customer_accept_proposed_time',
      });
      return this.getOrderById(orderId);
    }

    return this.respondToConfirmation(orderId, { accepted: true });
  },

  async cancelDeliveryOrderByCustomer(
    orderId: string,
    actor: 'customer_cancel_within_10_minutes' | 'customer_refused_proposed_time',
  ): Promise<Order | undefined> {
    if (supabaseClient) {
      await callOrderStripeAction('/api/cancel-authorized-payment', {
        orderId,
        actor,
      });
      return this.getOrderById(orderId);
    }

    return this.respondToConfirmation(orderId, { accepted: false });
  },

  async respondToConfirmation(
    orderId: string,
    response: {
      accepted: boolean;
    },
  ): Promise<Order | undefined> {
    if (response.accepted) {
      return this.acceptProposedTimeByCustomer(orderId);
    }

    return this.cancelDeliveryOrderByCustomer(orderId, 'customer_refused_proposed_time');
  },
};
