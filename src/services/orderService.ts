import { mockOrders } from '../data/mockOrders';
import { currentUser } from '../data/mockUsers';
import { simulateAsync } from '../lib/dataProvider';
import { supabaseClient } from '../lib/supabaseClient';
import type { CheckoutPayload, ConfirmationStatus, Order, OrderStatus, PaymentStatus } from '../types';

let orderStore = [...mockOrders];

type SupabaseOrderItemRow = {
  id: string;
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
  confirmation_status: Order['confirmationStatus'];
  proposed_time: string | null;
  customer_confirmation_required: boolean;
  customer_confirmed_at: string | null;
  restaurant_note: string | null;
  customer_note: string | null;
  notes: string | null;
  payment_status: PaymentStatus;
  public_confirmation_token: string | null;
  confirmation_link_expires_at: string | null;
  last_customer_notification_at: string | null;
  subtotal: number;
  total: number;
  created_at: string;
  order_items?: SupabaseOrderItemRow[] | null;
};

function mapOrder(row: SupabaseOrderRow): Order {
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
    desiredTime: row.desired_time ?? undefined,
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
    publicConfirmationToken: row.public_confirmation_token,
    confirmationLinkExpiresAt: row.confirmation_link_expires_at,
    lastCustomerNotificationAt: row.last_customer_notification_at,
    notes: row.notes ?? undefined,
    subtotal: Number(row.subtotal ?? 0),
    total: Number(row.total ?? 0),
    items: (row.order_items ?? []).map((item) => ({
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
  confirmation_status,
  proposed_time,
  customer_confirmation_required,
  customer_confirmed_at,
  restaurant_note,
  customer_note,
  notes,
  payment_status,
  public_confirmation_token,
  confirmation_link_expires_at,
  last_customer_notification_at,
  subtotal,
  total,
  created_at,
  order_items (
    id,
    product_id,
    product_name_snapshot,
    unit_price_snapshot,
    quantity,
    item_notes,
    selected_options,
    total
  )
`;

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

  return (data as SupabaseOrderRow[]).map(mapOrder);
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
      desiredTime: payload.desiredTime,
      confirmationStatus: payload.confirmationStatus ?? 'pending',
      proposedTime: payload.proposedTime,
      customerConfirmationRequired: payload.customerConfirmationRequired ?? payload.fulfillmentType === 'delivery',
      customerConfirmedAt: payload.customerConfirmedAt ?? null,
      restaurantNote: payload.restaurantNote,
      customerNote: payload.customerNote,
      status: 'pending',
      paymentStatus: 'unpaid',
      paymentMode: payload.paymentMode,
      createdAt: new Date().toISOString(),
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
          confirmation_status: newOrder.confirmationStatus,
          proposed_time: newOrder.proposedTime,
          customer_confirmation_required: newOrder.customerConfirmationRequired,
          customer_confirmed_at: newOrder.customerConfirmedAt,
          restaurant_note: newOrder.restaurantNote,
          customer_note: newOrder.customerNote,
          notes: newOrder.notes,
          payment_status: 'unpaid',
          subtotal: newOrder.subtotal,
          total: newOrder.total,
        })
        .select('id, public_confirmation_token, confirmation_link_expires_at, last_customer_notification_at')
        .single();

      if (!orderError && insertedOrder) {
        const { error: itemsError } = await supabaseClient.from('order_items').insert(
          newOrder.items.map((item) => ({
            order_id: insertedOrder.id,
            product_id: item.productId,
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
    }

    return simulateAsync(
      orderStore.filter(
        (order) =>
          order.customerEmail === currentUser.email ||
          order.customerPhone === currentUser.phone,
      ),
    );
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
        .select(`
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
          confirmation_status,
          proposed_time,
          customer_confirmation_required,
          customer_confirmed_at,
          restaurant_note,
          customer_note,
          notes,
          payment_status,
          public_confirmation_token,
          confirmation_link_expires_at,
          last_customer_notification_at,
          subtotal,
          total,
          created_at,
          order_items (
            id,
            product_id,
            product_name_snapshot,
            unit_price_snapshot,
            quantity,
            item_notes,
            selected_options,
            total
          )
        `)
        .maybeSingle();

      if (!error && data) {
        return simulateAsync(mapOrder(data as SupabaseOrderRow), 120);
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
        return simulateAsync(mapOrder(data as SupabaseOrderRow), 120);
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

  async respondToConfirmation(
    orderId: string,
    response: {
      accepted: boolean;
    },
  ): Promise<Order | undefined> {
    if (supabaseClient) {
      const updatePayload = response.accepted
        ? {
            confirmation_status: 'confirmed' as ConfirmationStatus,
            status: 'accepted' as OrderStatus,
            customer_confirmation_required: false,
            customer_confirmed_at: new Date().toISOString(),
          }
        : {
            confirmation_status: 'cancelled' as ConfirmationStatus,
            status: 'cancelled' as OrderStatus,
            customer_confirmation_required: false,
            customer_confirmed_at: new Date().toISOString(),
          };

      const currentOrder = await this.getOrderById(orderId);
      const { data, error } = await supabaseClient
        .from('orders')
        .update({
          ...updatePayload,
          desired_time: response.accepted
            ? currentOrder?.proposedTime ?? currentOrder?.desiredTime ?? null
            : currentOrder?.desiredTime ?? null,
          proposed_time: response.accepted ? null : currentOrder?.proposedTime ?? null,
        })
        .eq('id', orderId)
        .select(ORDER_SELECT)
        .maybeSingle();

      if (!error && data) {
        return simulateAsync(mapOrder(data as SupabaseOrderRow), 120);
      }
    }

    orderStore = orderStore.map((order) =>
      order.id === orderId
        ? {
            ...order,
            confirmationStatus: response.accepted ? 'confirmed' : 'cancelled',
            status: response.accepted ? 'accepted' : 'cancelled',
            customerConfirmationRequired: false,
            customerConfirmedAt: new Date().toISOString(),
            desiredTime: response.accepted ? order.proposedTime ?? order.desiredTime : order.desiredTime,
            proposedTime: response.accepted ? undefined : order.proposedTime,
          }
        : order,
    );
    return simulateAsync(orderStore.find((order) => order.id === orderId));
  },
};
