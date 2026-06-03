alter type public.order_status add value if not exists 'pending_payment';
alter type public.order_status add value if not exists 'awaiting_restaurant_confirmation';
alter type public.order_status add value if not exists 'confirmed';
alter type public.order_status add value if not exists 'time_adjustment_requested';

alter type public.payment_status add value if not exists 'authorized';
alter type public.payment_status add value if not exists 'capture_failed';
alter type public.payment_status add value if not exists 'refund_failed';
