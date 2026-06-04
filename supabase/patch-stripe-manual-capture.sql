alter type public.order_status add value if not exists 'pending_payment';
alter type public.order_status add value if not exists 'awaiting_restaurant_confirmation';
alter type public.order_status add value if not exists 'confirmed';
alter type public.order_status add value if not exists 'time_adjustment_requested';

alter type public.payment_status add value if not exists 'authorized';
alter type public.payment_status add value if not exists 'capture_failed';
alter type public.payment_status add value if not exists 'refund_failed';

alter table public.orders add column if not exists requested_delivery_time text;
alter table public.orders add column if not exists confirmed_delivery_time text;
alter table public.orders add column if not exists stripe_payment_intent_id text;
alter table public.orders add column if not exists stripe_checkout_session_id text;
alter table public.orders add column if not exists authorized_at timestamptz;
alter table public.orders add column if not exists captured_at timestamptz;
alter table public.orders add column if not exists customer_can_cancel_until timestamptz;
alter table public.orders add column if not exists cancelled_at timestamptz;
alter table public.orders add column if not exists refund_id text;
alter table public.orders add column if not exists refund_status text;
alter table public.orders add column if not exists cancellation_reason text;

update public.orders
set requested_delivery_time = coalesce(requested_delivery_time, desired_time)
where fulfillment_type = 'delivery'
  and requested_delivery_time is null;

update public.orders
set customer_can_cancel_until = created_at + interval '5 minutes'
where fulfillment_type = 'delivery'
  and customer_can_cancel_until is null;

drop policy if exists "customers update own pending orders" on public.orders;
drop policy if exists "customers update own active orders" on public.orders;

create policy "customers update own active orders" on public.orders
for update using (
  (auth.uid() = user_id or customer_email = auth.jwt() ->> 'email')
  and (
    status in ('pending', 'pending_payment', 'awaiting_restaurant_confirmation', 'time_adjustment_requested')
    or confirmation_status = 'time_adjustment_requested'
  )
) with check (
  auth.uid() = user_id or customer_email = auth.jwt() ->> 'email'
);
