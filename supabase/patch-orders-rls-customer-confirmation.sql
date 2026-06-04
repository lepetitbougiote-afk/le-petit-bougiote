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
