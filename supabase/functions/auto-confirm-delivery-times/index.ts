import { createClient } from 'npm:@supabase/supabase-js@2'

type OverdueOrder = {
  id: string
  payment_status: 'authorized' | 'paid' | 'cancelled' | 'unpaid' | 'capture_failed' | 'refunded' | 'refund_failed'
  status: string
  confirmation_status: string
  proposed_time: string | null
  confirmed_delivery_time: string | null
  requested_delivery_time: string | null
  desired_time: string | null
  stripe_payment_intent_id: string | null
  customer_can_cancel_until: string | null
  customer_confirmation_required: boolean
  restaurant_note: string | null
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  })
}

function getConfirmedDeliveryTime(order: OverdueOrder) {
  return (
    order.proposed_time?.trim() ||
    order.confirmed_delivery_time ||
    order.requested_delivery_time ||
    order.desired_time ||
    null
  )
}

async function capturePaymentIntent(paymentIntentId: string) {
  const response = await fetch(
    `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentIntentId)}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: '',
    },
  )

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'error' in data && data.error && typeof data.error === 'object' && 'message' in data.error
        ? String(data.error.message)
        : 'Stripe capture failed.'
    throw new Error(message)
  }

  return data
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, { status: 405 })
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Supabase Edge Function environment is incomplete.' }, { status: 500 })
  }

  if (!STRIPE_SECRET_KEY) {
    return json({ error: 'Missing STRIPE_SECRET_KEY in Supabase Edge Function secrets.' }, { status: 500 })
  }

  const apikey = request.headers.get('apikey')
  if (!apikey || (SUPABASE_ANON_KEY && apikey !== SUPABASE_ANON_KEY)) {
    return json({ error: 'Unauthorized function invocation.' }, { status: 401 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const nowIso = new Date().toISOString()
  const { data: overdueOrders, error } = await supabase
    .from('orders')
    .select(`
      id,
      payment_status,
      status,
      confirmation_status,
      proposed_time,
      confirmed_delivery_time,
      requested_delivery_time,
      desired_time,
      stripe_payment_intent_id,
      customer_can_cancel_until,
      customer_confirmation_required,
      restaurant_note
    `)
    .eq('fulfillment_type', 'delivery')
    .eq('confirmation_status', 'time_adjustment_requested')
    .eq('customer_confirmation_required', true)
    .lte('customer_can_cancel_until', nowIso)
    .limit(25)

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  const processed: Array<{ orderId: string; action: string }> = []
  const failures: Array<{ orderId: string; error: string }> = []

  for (const order of (overdueOrders ?? []) as OverdueOrder[]) {
    const confirmedTime = getConfirmedDeliveryTime(order)
    if (!confirmedTime) {
      failures.push({
        orderId: order.id,
        error: 'No confirmed delivery time could be determined.',
      })
      continue
    }

    try {
      if (order.payment_status === 'authorized') {
        if (!order.stripe_payment_intent_id) {
          throw new Error('Missing Stripe payment intent on authorized order.')
        }

        await capturePaymentIntent(order.stripe_payment_intent_id)
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: order.payment_status === 'authorized' ? 'paid' : order.payment_status,
          captured_at: order.payment_status === 'authorized' ? nowIso : undefined,
          status: 'confirmed',
          confirmation_status: 'confirmed',
          customer_confirmation_required: false,
          customer_confirmed_at: nowIso,
          proposed_time: null,
          desired_time: confirmedTime,
          confirmed_delivery_time: confirmedTime,
          customer_can_cancel_until: null,
          last_customer_notification_at: nowIso,
          restaurant_note: order.restaurant_note
            ? `${order.restaurant_note}\nCréneau auto-confirmé après 5 minutes sans réponse client.`
            : 'Créneau auto-confirmé après 5 minutes sans réponse client.',
        })
        .eq('id', order.id)
        .eq('confirmation_status', 'time_adjustment_requested')
        .eq('customer_confirmation_required', true)

      if (updateError) {
        throw updateError
      }

      processed.push({
        orderId: order.id,
        action: order.payment_status === 'authorized' ? 'captured_and_confirmed' : 'confirmed',
      })
    } catch (processError) {
      const message = processError instanceof Error ? processError.message : 'Unknown auto-confirm error.'

      if (order.payment_status === 'authorized') {
        await supabase
          .from('orders')
          .update({
            payment_status: 'capture_failed',
            last_customer_notification_at: nowIso,
          })
          .eq('id', order.id)
      }

      failures.push({
        orderId: order.id,
        error: message,
      })
    }
  }

  return json({
    ok: true,
    checked: overdueOrders?.length ?? 0,
    processed,
    failures,
  })
})
