import type { IncomingMessage, ServerResponse } from 'node:http';
import { createClient } from '@supabase/supabase-js';
import type { CartItem, CheckoutPayload, DiningMode, FulfillmentType, OrderStatus } from '../src/types';

const DELIVERY_FEE_EUR = 4;
const FIVE_MINUTES_MS = 5 * 60 * 1000;

export interface StripeCheckoutEnvironment {
  stripeSecretKey?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export interface StripeCheckoutRequestBody {
  origin: string;
  payload: CheckoutPayload;
}

export interface StripeActionResult {
  statusCode: number;
  body: unknown;
}

interface ValidatedCheckoutRequest {
  origin: string;
  payload: CheckoutPayload;
}

interface StripeLineItem {
  name: string;
  description?: string;
  quantity: number;
  unitAmountCents: number;
}

interface StripeCheckoutStatusResponse {
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

interface CapturePaymentRequestBody {
  orderId: string;
  actor: 'admin_accept' | 'customer_accept_proposed_time';
  confirmedDeliveryTime?: string | null;
  restaurantNote?: string | null;
  nextStatus?: OrderStatus | null;
}

interface CancelAuthorizedPaymentRequestBody {
  orderId: string;
  actor:
    | 'admin_cancel'
    | 'customer_cancel_within_10_minutes'
    | 'customer_refused_proposed_time';
  restaurantNote?: string | null;
  cancellationReason?: string | null;
}

interface RefundPaymentRequestBody {
  orderId: string;
  reason?: string | null;
}

interface RemoteOrder {
  id: string;
  user_id: string | null;
  customer_email: string | null;
  status: string;
  payment_status: string;
  fulfillment_type: FulfillmentType;
  desired_time: string | null;
  requested_delivery_time: string | null;
  confirmation_status: string;
  proposed_time: string | null;
  confirmed_delivery_time: string | null;
  customer_confirmation_required: boolean;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  customer_can_cancel_until: string | null;
  restaurant_note: string | null;
}

interface RestaurantOrderingRow {
  announcement: string | null;
  is_ordering_enabled: boolean;
  is_temporarily_closed: boolean;
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(body));
}

function toCents(value: number) {
  return Math.round(value * 100);
}

function isFulfillmentType(value: unknown): value is FulfillmentType {
  return value === 'click_collect' || value === 'delivery';
}

function isDiningMode(value: unknown): value is DiningMode {
  return value === 'sur_place' || value === 'a_emporter' || value === null;
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Partial<CartItem>;
  return (
    typeof item.productId === 'string' &&
    typeof item.name === 'string' &&
    typeof item.quantity === 'number' &&
    Number.isFinite(item.quantity) &&
    typeof item.price === 'number' &&
    Number.isFinite(item.price) &&
    typeof item.image === 'string' &&
    typeof item.imageAlt === 'string'
  );
}

async function readRequestBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
}

function getCartItemDescription(item: CartItem) {
  const details: string[] = [];
  if (item.selectedOptions?.length) {
    details.push(item.selectedOptions.map((option) => option.label).join(', '));
  }
  if (item.note.trim()) {
    details.push(`Note: ${item.note.trim()}`);
  }
  return details.join(' • ');
}

function getDeliveryDescription(payload: CheckoutPayload) {
  const details: string[] = ['Livraison locale sur Béziers'];
  if (payload.deliveryAddress?.trim()) {
    details.push(payload.deliveryAddress.trim());
  }
  return details.join(' • ');
}

function getNowIso() {
  return new Date().toISOString();
}

function getCancelDeadlineIso(createdAt: string) {
  return new Date(new Date(createdAt).getTime() + FIVE_MINUTES_MS).toISOString();
}

function validateCheckoutRequest(input: unknown): ValidatedCheckoutRequest {
  if (!input || typeof input !== 'object') {
    throw new Error('La demande de paiement est invalide.');
  }

  const body = input as Partial<StripeCheckoutRequestBody>;
  if (typeof body.origin !== 'string' || !body.origin.startsWith('http')) {
    throw new Error('Origine de redirection invalide.');
  }

  const payload = body.payload;
  if (!payload || typeof payload !== 'object') {
    throw new Error('Le contenu de la commande est invalide.');
  }

  if (!isFulfillmentType(payload.fulfillmentType)) {
    throw new Error('Mode de récupération invalide.');
  }

  if (!isDiningMode(payload.diningMode ?? null)) {
    throw new Error('Mode de service invalide.');
  }

  if (typeof payload.customerName !== 'string' || payload.customerName.trim().length < 2) {
    throw new Error('Nom client invalide.');
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0 || !payload.items.every(isCartItem)) {
    throw new Error('Le panier est vide ou invalide.');
  }

  const invalidItem = payload.items.find(
    (item) =>
      item.quantity <= 0 ||
      !Number.isInteger(item.quantity) ||
      item.price === null ||
      item.price <= 0,
  );

  if (invalidItem) {
    throw new Error(`Article invalide: ${invalidItem.name}.`);
  }

  if (
    payload.fulfillmentType === 'delivery' &&
    (!payload.deliveryAddress || payload.deliveryAddress.trim().length < 4)
  ) {
    throw new Error('Adresse de livraison invalide.');
  }

  return {
    origin: body.origin,
    payload: {
      ...payload,
      customerName: payload.customerName.trim(),
      customerPhone: payload.customerPhone?.trim() || undefined,
      customerEmail: payload.customerEmail?.trim() || undefined,
      deliveryAddress: payload.deliveryAddress?.trim() || undefined,
      desiredTime: payload.desiredTime?.trim() || undefined,
      customerNote: payload.customerNote?.trim() || undefined,
      restaurantNote: payload.restaurantNote?.trim() || undefined,
      items: payload.items.map((item) => ({
        ...item,
        name: item.name.trim(),
        note: item.note.trim(),
      })),
    },
  };
}

function buildLineItems(payload: CheckoutPayload): StripeLineItem[] {
  const lineItems = payload.items.map((item) => ({
    name: item.name,
    description: getCartItemDescription(item) || undefined,
    quantity: item.quantity,
    unitAmountCents: toCents(item.price ?? 0),
  }));

  if (payload.fulfillmentType === 'delivery') {
    lineItems.push({
      name: 'Livraison Béziers',
      description: getDeliveryDescription(payload),
      quantity: 1,
      unitAmountCents: toCents(payload.deliveryFee ?? DELIVERY_FEE_EUR),
    });
  }

  return lineItems;
}

function readBearerTokenFromHeader(authorization?: string | null) {
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }
  return authorization.slice('Bearer '.length).trim() || null;
}

function readBearerToken(request: IncomingMessage) {
  return readBearerTokenFromHeader(request.headers.authorization);
}

function createAuthedSupabaseClient(env: StripeCheckoutEnvironment, accessToken: string) {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error('Configuration Supabase manquante côté serveur local.');
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function createPublicSupabaseClient(env: StripeCheckoutEnvironment) {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error('Configuration Supabase manquante côté serveur.');
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function ensureOrderingEnabled(env: StripeCheckoutEnvironment) {
  const client = createPublicSupabaseClient(env);
  const { data, error } = await client
    .from('restaurant_settings')
    .select('announcement, is_ordering_enabled, is_temporarily_closed')
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return;
  }

  const settings = data as RestaurantOrderingRow;
  if (!settings.is_ordering_enabled || settings.is_temporarily_closed) {
    throw new Error(
      settings.announcement?.trim() ||
        'Les commandes en ligne sont temporairement indisponibles pour le moment.',
    );
  }
}

async function getAuthenticatedUser(env: StripeCheckoutEnvironment, request: IncomingMessage) {
  const accessToken = readBearerToken(request);
  if (!accessToken) {
    throw new Error('Session utilisateur manquante.');
  }

  const client = createAuthedSupabaseClient(env, accessToken);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    throw new Error('Utilisateur non authentifié.');
  }

  return {
    accessToken,
    client,
    user: data.user,
  };
}

async function requireAdmin(env: StripeCheckoutEnvironment, request: IncomingMessage) {
  const auth = await getAuthenticatedUser(env, request);
  const { data, error } = await auth.client
    .from('user_roles')
    .select('role')
    .eq('user_id', auth.user.id);

  if (error || !data?.some((row) => row.role === 'admin' || row.role === 'super_admin')) {
    throw new Error('Accès admin requis.');
  }

  return auth;
}

async function fetchOrder(
  client: ReturnType<typeof createAuthedSupabaseClient>,
  orderId: string,
) {
  const { data, error } = await client
    .from('orders')
    .select(
      `
        id,
        user_id,
        customer_email,
        status,
        payment_status,
        fulfillment_type,
        desired_time,
        requested_delivery_time,
        confirmation_status,
        proposed_time,
        confirmed_delivery_time,
        customer_confirmation_required,
        stripe_payment_intent_id,
        stripe_checkout_session_id,
        customer_can_cancel_until,
        restaurant_note
      `,
    )
    .eq('id', orderId)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Commande introuvable.');
  }

  return data as RemoteOrder;
}

async function fetchStripeJson<T>(
  secretKey: string,
  path: string,
  options?: {
    method?: 'GET' | 'POST';
    params?: URLSearchParams;
  },
) {
  const method = options?.method ?? 'GET';
  const response = await fetch(`https://api.stripe.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(method === 'POST'
        ? { 'Content-Type': 'application/x-www-form-urlencoded' }
        : {}),
    },
    body: method === 'POST' ? options?.params?.toString() : undefined,
  });

  const data = (await response.json()) as T & { error?: { message?: string } };

  if (data && typeof data === 'object' && 'error' in data && data.error?.message) {
    throw new Error(data.error.message);
  }

  if (!response.ok) {
    throw new Error('Réponse Stripe invalide.');
  }

  return data;
}

async function createStripeCheckoutSession(secretKey: string, request: ValidatedCheckoutRequest) {
  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('locale', 'fr');
  params.set('success_url', `${request.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${request.origin}/checkout/cancel`);

  if (request.payload.customerEmail) {
    params.set('customer_email', request.payload.customerEmail);
  }

  params.set('metadata[fulfillment_type]', request.payload.fulfillmentType);
  params.set('metadata[dining_mode]', request.payload.diningMode ?? 'none');
  params.set('metadata[customer_name]', request.payload.customerName);
  if (request.payload.customerPhone) {
    params.set('metadata[customer_phone]', request.payload.customerPhone);
  }
  if (request.payload.desiredTime) {
    params.set('metadata[desired_time]', request.payload.desiredTime);
  }

  if (request.payload.fulfillmentType === 'delivery') {
    params.set('payment_intent_data[capture_method]', 'manual');
  }

  buildLineItems(request.payload).forEach((item, index) => {
    params.set(`line_items[${index}][quantity]`, String(item.quantity));
    params.set(`line_items[${index}][price_data][currency]`, 'eur');
    params.set(`line_items[${index}][price_data][unit_amount]`, String(item.unitAmountCents));
    params.set(`line_items[${index}][price_data][product_data][name]`, item.name);
    if (item.description) {
      params.set(`line_items[${index}][price_data][product_data][description]`, item.description);
    }
  });

  const data = await fetchStripeJson<{ id?: string; url?: string }>(secretKey, '/v1/checkout/sessions', {
    method: 'POST',
    params,
  });

  if (!data.id || !data.url) {
    throw new Error('La réponse Stripe est incomplète.');
  }

  return {
    id: data.id,
    url: data.url,
  };
}

async function getStripeCheckoutSession(secretKey: string, sessionId: string): Promise<StripeCheckoutStatusResponse> {
  const data = await fetchStripeJson<{
    id?: string;
    status?: string;
    payment_status?: string;
    customer_email?: string | null;
    amount_total?: number | null;
    currency?: string | null;
    payment_intent?:
      | string
      | {
          id?: string;
          status?: string;
          capture_method?: string;
        }
      | null;
  }>(
    secretKey,
    `/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=payment_intent`,
  );

  const paymentIntent =
    data.payment_intent && typeof data.payment_intent === 'object' ? data.payment_intent : null;

  return {
    id: data.id ?? sessionId,
    status: data.status ?? 'open',
    paymentStatus: data.payment_status ?? 'unpaid',
    customerEmail: data.customer_email ?? null,
    amountTotal: data.amount_total ?? null,
    currency: data.currency ?? null,
    paymentIntentId:
      paymentIntent?.id ??
      (typeof data.payment_intent === 'string' ? data.payment_intent : null),
    paymentIntentStatus: paymentIntent?.status ?? null,
    captureMethod: paymentIntent?.capture_method ?? null,
  };
}

async function capturePaymentIntent(secretKey: string, paymentIntentId: string) {
  return fetchStripeJson<{ id?: string; status?: string }>(
    secretKey,
    `/v1/payment_intents/${encodeURIComponent(paymentIntentId)}/capture`,
    {
      method: 'POST',
      params: new URLSearchParams(),
    },
  );
}

async function cancelPaymentIntent(secretKey: string, paymentIntentId: string) {
  return fetchStripeJson<{ id?: string; status?: string }>(
    secretKey,
    `/v1/payment_intents/${encodeURIComponent(paymentIntentId)}/cancel`,
    {
      method: 'POST',
      params: new URLSearchParams(),
    },
  );
}

async function refundPaymentIntent(secretKey: string, paymentIntentId: string, reason?: string | null) {
  const params = new URLSearchParams();
  params.set('payment_intent', paymentIntentId);
  if (reason?.trim()) {
    params.set('reason', reason.trim());
  }

  return fetchStripeJson<{ id?: string; status?: string }>(secretKey, '/v1/refunds', {
    method: 'POST',
    params,
  });
}

function ensureOrderSupportsDeliveryFlow(order: RemoteOrder) {
  if (order.fulfillment_type !== 'delivery') {
    throw new Error('Cette opération est réservée aux commandes en livraison.');
  }
}

function getConfirmedDeliveryTime(
  order: RemoteOrder,
  preferredTime?: string | null,
) {
  return (
    preferredTime?.trim() ||
    order.proposed_time ||
    order.confirmed_delivery_time ||
    order.requested_delivery_time ||
    order.desired_time ||
    null
  );
}

async function syncOrderUpdate(
  client: ReturnType<typeof createAuthedSupabaseClient>,
  orderId: string,
  patch: Record<string, unknown>,
) {
  const { error } = await client.from('orders').update(patch).eq('id', orderId);
  if (error) {
    throw new Error(error.message);
  }
}

function missingStripeSecretResult(): StripeActionResult {
  return {
    statusCode: 500,
    body: { error: 'STRIPE_SECRET_KEY manquant en environnement.' },
  };
}

export async function processStripeCheckoutRequest(
  rawBody: string,
  env: StripeCheckoutEnvironment,
): Promise<StripeActionResult> {
  if (!env.stripeSecretKey) {
    return missingStripeSecretResult();
  }

  try {
    const parsed = JSON.parse(rawBody);
    const validated = validateCheckoutRequest(parsed);
    await ensureOrderingEnabled(env);
    const session = await createStripeCheckoutSession(env.stripeSecretKey, validated);
    return {
      statusCode: 200,
      body: session,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erreur lors de la création de la session Stripe.';
    return {
      statusCode: 400,
      body: { error: message },
    };
  }
}

export async function processStripeCheckoutStatusRequest(
  requestUrl: URL,
  env: StripeCheckoutEnvironment,
): Promise<StripeActionResult> {
  if (!env.stripeSecretKey) {
    return missingStripeSecretResult();
  }

  const sessionId = requestUrl.searchParams.get('session_id');
  if (!sessionId) {
    return {
      statusCode: 400,
      body: { error: 'session_id manquant.' },
    };
  }

  try {
    const session = await getStripeCheckoutSession(env.stripeSecretKey, sessionId);
    return {
      statusCode: 200,
      body: session,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erreur lors de la lecture de la session Stripe.';
    return {
      statusCode: 400,
      body: { error: message },
    };
  }
}

export async function processCapturePaymentRequest(
  rawBody: string,
  authorizationHeader: string | null | undefined,
  env: StripeCheckoutEnvironment,
): Promise<StripeActionResult> {
  if (!env.stripeSecretKey) {
    return missingStripeSecretResult();
  }

  try {
    const parsed = JSON.parse(rawBody) as Partial<CapturePaymentRequestBody>;
    if (!parsed.orderId || !parsed.actor) {
      throw new Error('Données de capture incomplètes.');
    }

    if (parsed.actor === 'admin_accept') {
      const accessToken = readBearerTokenFromHeader(authorizationHeader);
      if (!accessToken) {
        throw new Error('Session utilisateur manquante.');
      }

      const client = createAuthedSupabaseClient(env, accessToken);
      const { data, error } = await client.auth.getUser();
      if (error || !data.user) {
        throw new Error('Utilisateur non authentifié.');
      }

      const { data: roles, error: roleError } = await client
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id);

      if (roleError || !roles?.some((row) => row.role === 'admin' || row.role === 'super_admin')) {
        throw new Error('Accès admin requis.');
      }

      const order = await fetchOrder(client, parsed.orderId);
      ensureOrderSupportsDeliveryFlow(order);

      const confirmedTime = getConfirmedDeliveryTime(order, parsed.confirmedDeliveryTime);
      if (!confirmedTime) {
        throw new Error('Aucun créneau confirmé n’a pu être déterminé.');
      }

      if (order.payment_status === 'authorized' && order.stripe_payment_intent_id) {
        try {
          await capturePaymentIntent(env.stripeSecretKey, order.stripe_payment_intent_id);
        } catch (error) {
          await syncOrderUpdate(client, order.id, {
            payment_status: 'capture_failed',
          });
          throw error;
        }
      }

      await syncOrderUpdate(client, order.id, {
        payment_status: 'paid',
        captured_at: getNowIso(),
        status: parsed.nextStatus ?? 'confirmed',
        confirmation_status: 'confirmed',
        customer_confirmation_required: false,
        proposed_time: null,
        desired_time: confirmedTime,
        confirmed_delivery_time: confirmedTime,
        restaurant_note: parsed.restaurantNote?.trim() || order.restaurant_note,
        last_customer_notification_at: getNowIso(),
      });

      return {
        statusCode: 200,
        body: { ok: true, orderId: order.id },
      };
    }

    const accessToken = readBearerTokenFromHeader(authorizationHeader);
    if (!accessToken) {
      throw new Error('Session utilisateur manquante.');
    }

    const client = createAuthedSupabaseClient(env, accessToken);
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) {
      throw new Error('Utilisateur non authentifié.');
    }

    const order = await fetchOrder(client, parsed.orderId);
    ensureOrderSupportsDeliveryFlow(order);

    const ownsOrder =
      order.user_id === data.user.id ||
      (order.customer_email && order.customer_email === data.user.email);

    if (!ownsOrder) {
      throw new Error('Commande introuvable pour ce compte.');
    }

    if (
      order.confirmation_status !== 'time_adjustment_requested' ||
      !order.customer_confirmation_required
    ) {
      throw new Error('Aucun nouveau créneau n’attend votre confirmation.');
    }

    const confirmedTime = getConfirmedDeliveryTime(order, parsed.confirmedDeliveryTime);
    if (!confirmedTime) {
      throw new Error('Créneau confirmé introuvable.');
    }

    if (order.payment_status === 'authorized' && order.stripe_payment_intent_id) {
      try {
        await capturePaymentIntent(env.stripeSecretKey, order.stripe_payment_intent_id);
      } catch (error) {
        await syncOrderUpdate(client, order.id, {
          payment_status: 'capture_failed',
        });
        throw error;
      }
    }

    await syncOrderUpdate(client, order.id, {
      payment_status: 'paid',
      captured_at: getNowIso(),
      status: 'confirmed',
      confirmation_status: 'confirmed',
      customer_confirmation_required: false,
      customer_confirmed_at: getNowIso(),
      proposed_time: null,
      desired_time: confirmedTime,
      confirmed_delivery_time: confirmedTime,
      last_customer_notification_at: getNowIso(),
    });

    return {
      statusCode: 200,
      body: { ok: true, orderId: order.id },
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erreur lors de la capture du paiement.';
    return {
      statusCode: 400,
      body: { error: message },
    };
  }
}

export async function processCancelAuthorizedPaymentRequest(
  rawBody: string,
  authorizationHeader: string | null | undefined,
  env: StripeCheckoutEnvironment,
): Promise<StripeActionResult> {
  if (!env.stripeSecretKey) {
    return missingStripeSecretResult();
  }

  try {
    const parsed = JSON.parse(rawBody) as Partial<CancelAuthorizedPaymentRequestBody>;
    if (!parsed.orderId || !parsed.actor) {
      throw new Error('Données d’annulation incomplètes.');
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const accessToken = readBearerTokenFromHeader(authorizationHeader);
    if (!accessToken) {
      throw new Error('Session utilisateur manquante.');
    }

    const client = createAuthedSupabaseClient(env, accessToken);
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) {
      throw new Error('Utilisateur non authentifié.');
    }

    if (parsed.actor === 'admin_cancel') {
      const { data: roles, error: roleError } = await client
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id);

      if (roleError || !roles?.some((row) => row.role === 'admin' || row.role === 'super_admin')) {
        throw new Error('Accès admin requis.');
      }

      const order = await fetchOrder(client, parsed.orderId);
      ensureOrderSupportsDeliveryFlow(order);

      if (order.payment_status === 'authorized' && order.stripe_payment_intent_id) {
        await cancelPaymentIntent(env.stripeSecretKey, order.stripe_payment_intent_id);
      }

      await syncOrderUpdate(client, order.id, {
        status: 'cancelled',
        confirmation_status: 'cancelled',
        payment_status:
          order.payment_status === 'authorized' ? 'cancelled' : order.payment_status,
        cancelled_at: nowIso,
        cancellation_reason:
          parsed.cancellationReason?.trim() || 'restaurant_cancelled_delivery_request',
        customer_confirmation_required: false,
        restaurant_note: parsed.restaurantNote?.trim() || order.restaurant_note,
        last_customer_notification_at: nowIso,
      });

      return {
        statusCode: 200,
        body: { ok: true, orderId: order.id },
      };
    }

    const order = await fetchOrder(client, parsed.orderId);
    ensureOrderSupportsDeliveryFlow(order);

    const ownsOrder =
      order.user_id === data.user.id ||
      (order.customer_email && order.customer_email === data.user.email);

    if (!ownsOrder) {
      throw new Error('Commande introuvable pour ce compte.');
    }

    const withinTenMinutes =
      !!order.customer_can_cancel_until &&
      now.getTime() <= new Date(order.customer_can_cancel_until).getTime();

    const proposedTimePending =
      order.confirmation_status === 'time_adjustment_requested' &&
      order.customer_confirmation_required;

    const canCancelAutomatically =
      parsed.actor === 'customer_cancel_within_10_minutes'
        ? withinTenMinutes &&
          !['confirmed', 'preparing', 'ready', 'completed'].includes(order.status)
        : proposedTimePending;

    if (!canCancelAutomatically) {
      throw new Error(
        parsed.actor === 'customer_cancel_within_10_minutes'
          ? 'Le délai automatique de 5 minutes est dépassé.'
          : 'Ce créneau ne peut plus être refusé automatiquement.',
      );
    }

    if (order.payment_status === 'authorized' && order.stripe_payment_intent_id) {
      await cancelPaymentIntent(env.stripeSecretKey, order.stripe_payment_intent_id);
    } else if (order.payment_status === 'paid') {
      throw new Error(
        'Le paiement a déjà été capturé. Contactez le restaurant pour une demande de remboursement.',
      );
    }

    await syncOrderUpdate(client, order.id, {
      status: 'cancelled',
      confirmation_status: 'cancelled',
      payment_status:
        order.payment_status === 'authorized' ? 'cancelled' : order.payment_status,
      cancelled_at: nowIso,
      cancellation_reason:
        parsed.cancellationReason?.trim() ||
        (parsed.actor === 'customer_refused_proposed_time'
          ? 'customer_refused_proposed_time'
          : 'customer_cancelled_within_10_minutes'),
      customer_confirmation_required: false,
      customer_confirmed_at:
        parsed.actor === 'customer_refused_proposed_time' ? nowIso : null,
      last_customer_notification_at: nowIso,
    });

    return {
      statusCode: 200,
      body: { ok: true, orderId: order.id },
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erreur lors de l’annulation du paiement autorisé.';
    return {
      statusCode: 400,
      body: { error: message },
    };
  }
}

export async function processRefundPaymentRequest(
  rawBody: string,
  authorizationHeader: string | null | undefined,
  env: StripeCheckoutEnvironment,
): Promise<StripeActionResult> {
  if (!env.stripeSecretKey) {
    return missingStripeSecretResult();
  }

  try {
    const accessToken = readBearerTokenFromHeader(authorizationHeader);
    if (!accessToken) {
      throw new Error('Session utilisateur manquante.');
    }

    const client = createAuthedSupabaseClient(env, accessToken);
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) {
      throw new Error('Utilisateur non authentifié.');
    }

    const { data: roles, error: roleError } = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id);

    if (roleError || !roles?.some((row) => row.role === 'admin' || row.role === 'super_admin')) {
      throw new Error('Accès admin requis.');
    }

    const parsed = JSON.parse(rawBody) as Partial<RefundPaymentRequestBody>;
    if (!parsed.orderId) {
      throw new Error('orderId manquant.');
    }

    const order = await fetchOrder(client, parsed.orderId);
    if (!order.stripe_payment_intent_id) {
      throw new Error('Aucun paiement Stripe à rembourser.');
    }

    const refund = await refundPaymentIntent(
      env.stripeSecretKey,
      order.stripe_payment_intent_id,
      parsed.reason,
    );

    await syncOrderUpdate(client, order.id, {
      payment_status: refund.status === 'succeeded' ? 'refunded' : 'refund_failed',
      refund_id: refund.id ?? null,
      refund_status: refund.status ?? 'failed',
      cancelled_at: getNowIso(),
      status: 'cancelled',
      confirmation_status: 'cancelled',
    });

    return {
      statusCode: 200,
      body: {
        ok: true,
        orderId: order.id,
        refundId: refund.id ?? null,
        refundStatus: refund.status ?? null,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erreur lors du remboursement Stripe.';
    return {
      statusCode: 400,
      body: { error: message },
    };
  }
}

export async function handleStripeCheckoutRequest(
  request: IncomingMessage,
  response: ServerResponse,
  env: StripeCheckoutEnvironment,
) {
  const result = await processStripeCheckoutRequest(await readRequestBody(request), env);
  sendJson(response, result.statusCode, result.body);
}

export async function handleStripeCheckoutStatusRequest(
  requestUrl: URL,
  response: ServerResponse,
  env: StripeCheckoutEnvironment,
) {
  const result = await processStripeCheckoutStatusRequest(requestUrl, env);
  sendJson(response, result.statusCode, result.body);
}

export async function handleCapturePaymentRequest(
  request: IncomingMessage,
  response: ServerResponse,
  env: StripeCheckoutEnvironment,
) {
  const result = await processCapturePaymentRequest(
    await readRequestBody(request),
    request.headers.authorization,
    env,
  );
  sendJson(response, result.statusCode, result.body);
}

export async function handleCancelAuthorizedPaymentRequest(
  request: IncomingMessage,
  response: ServerResponse,
  env: StripeCheckoutEnvironment,
) {
  const result = await processCancelAuthorizedPaymentRequest(
    await readRequestBody(request),
    request.headers.authorization,
    env,
  );
  sendJson(response, result.statusCode, result.body);
}

export async function handleRefundPaymentRequest(
  request: IncomingMessage,
  response: ServerResponse,
  env: StripeCheckoutEnvironment,
) {
  const result = await processRefundPaymentRequest(
    await readRequestBody(request),
    request.headers.authorization,
    env,
  );
  sendJson(response, result.statusCode, result.body);
}
