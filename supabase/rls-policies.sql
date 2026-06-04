create or replace function public.has_role(target_user_id uuid, role_name text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = target_user_id
      and role::text = role_name
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'super_admin');
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
as $$
  select public.has_role(auth.uid(), 'super_admin');
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.menu_cards enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_option_groups enable row level security;
alter table public.product_options enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.restaurant_settings enable row level security;
alter table public.opening_hours enable row level security;
alter table public.gallery_images enable row level security;
alter table public.customer_reviews enable row level security;
alter table public.analytics_events enable row level security;
alter table public.admin_logs enable row level security;

create policy "public read active categories" on public.categories
for select using (is_active = true);

create policy "public read active menu cards" on public.menu_cards
for select using (is_active = true);

create policy "public read active products" on public.products
for select using (is_active = true);

create policy "public read product images" on public.product_images
for select using (true);

create policy "public read option groups" on public.product_option_groups
for select using (true);

create policy "public read options" on public.product_options
for select using (true);

create policy "public read restaurant settings" on public.restaurant_settings
for select using (true);

create policy "public read opening hours" on public.opening_hours
for select using (true);

create policy "public read active gallery images" on public.gallery_images
for select using (is_active = true);

create policy "public read published reviews" on public.customer_reviews
for select using (is_published = true);

create policy "users read own profile" on public.profiles
for select using (auth.uid() = id);

create policy "users update own profile" on public.profiles
for update using (auth.uid() = id);

create policy "users insert own profile" on public.profiles
for insert with check (auth.uid() = id);

create policy "users read own roles" on public.user_roles
for select using (auth.uid() = user_id);

create policy "customers create orders" on public.orders
for insert with check (true);

create policy "customers read own orders" on public.orders
for select using (auth.uid() = user_id or customer_email = auth.jwt() ->> 'email');

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

create policy "customers read own order items" on public.order_items
for select using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and (orders.user_id = auth.uid() or orders.customer_email = auth.jwt() ->> 'email')
  )
);

create policy "customers insert order items" on public.order_items
for insert with check (true);

create policy "admins manage categories" on public.categories
for all using (public.is_admin()) with check (public.is_admin());

create policy "admins manage menu cards" on public.menu_cards
for all using (public.is_admin()) with check (public.is_admin());

create policy "admins manage profiles" on public.profiles
for all using (public.is_admin()) with check (public.is_admin());

create policy "admins manage products" on public.products
for all using (public.is_admin()) with check (public.is_admin());

create policy "admins manage product images" on public.product_images
for all using (public.is_admin()) with check (public.is_admin());

create policy "admins manage product option groups" on public.product_option_groups
for all using (public.is_admin()) with check (public.is_admin());

create policy "admins manage product options" on public.product_options
for all using (public.is_admin()) with check (public.is_admin());

create policy "admins manage orders" on public.orders
for all using (public.is_admin()) with check (public.is_admin());

create policy "admins manage order items" on public.order_items
for all using (public.is_admin()) with check (public.is_admin());

create policy "admins manage settings" on public.restaurant_settings
for all using (public.is_admin()) with check (public.is_admin());

create policy "admins manage opening hours" on public.opening_hours
for all using (public.is_admin()) with check (public.is_admin());

create policy "admins manage gallery" on public.gallery_images
for all using (public.is_admin()) with check (public.is_admin());

create policy "admins manage reviews" on public.customer_reviews
for all using (public.is_admin()) with check (public.is_admin());

create policy "admins manage analytics" on public.analytics_events
for all using (public.is_admin()) with check (public.is_admin());

create policy "admins read user roles" on public.user_roles
for select using (public.is_admin());

create policy "super admins manage user roles" on public.user_roles
for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy "admins read logs" on public.admin_logs
for select using (public.is_admin());

create policy "admins write logs" on public.admin_logs
for insert with check (public.is_admin());
