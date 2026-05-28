create extension if not exists "pgcrypto";

create type public.order_status as enum (
  'pending',
  'accepted',
  'preparing',
  'ready',
  'completed',
  'cancelled'
);

create type public.user_role as enum (
  'customer',
  'admin',
  'super_admin'
);

create type public.payment_status as enum (
  'unpaid',
  'paid',
  'refunded',
  'cancelled'
);

create type public.fulfillment_type as enum (
  'click_collect',
  'delivery'
);

create type public.dining_mode as enum (
  'sur_place',
  'a_emporter'
);

create type public.order_source as enum (
  'menu_qr',
  'delivery_web'
);

create type public.confirmation_status as enum (
  'pending',
  'confirmed',
  'time_adjustment_requested',
  'cancelled'
);

create type public.product_type as enum (
  'simple',
  'configurable'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email, address)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'phone',
    new.email,
    new.raw_user_meta_data ->> 'address'
  )
  on conflict (id) do update
    set
      full_name = excluded.full_name,
      phone = excluded.phone,
      email = excluded.email,
      address = coalesce(excluded.address, public.profiles.address),
      updated_at = timezone('utc', now());

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id, role) do nothing;

  if lower(coalesce(new.email, '')) = 'lepetitbougiote@gmail.com' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, role)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10,2),
  price_label text,
  product_type public.product_type not null default 'simple',
  configurator_key text,
  is_available boolean not null default true,
  availability_note text,
  is_active boolean not null default true,
  tags text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_option_groups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  helper_text text,
  is_required boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_options (
  id uuid primary key default gen_random_uuid(),
  option_group_id uuid not null references public.product_option_groups(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  fulfillment_type public.fulfillment_type not null default 'click_collect',
  dining_mode public.dining_mode,
  order_source public.order_source not null default 'delivery_web',
  delivery_address text,
  delivery_fee numeric(10,2) not null default 0,
  desired_time text,
  confirmation_status public.confirmation_status not null default 'pending',
  proposed_time text,
  customer_confirmation_required boolean not null default false,
  customer_confirmed_at timestamptz,
  restaurant_note text,
  customer_note text,
  public_confirmation_token uuid not null default gen_random_uuid(),
  confirmation_link_expires_at timestamptz,
  last_customer_notification_at timestamptz,
  notes text,
  subtotal numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot text not null,
  unit_price_snapshot numeric(10,2) not null default 0,
  quantity integer not null default 1,
  item_notes text,
  selected_options jsonb not null default '[]'::jsonb,
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.restaurant_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand_line text,
  address text,
  phone_primary text,
  phone_secondary text,
  google_maps_url text,
  announcement text,
  is_ordering_enabled boolean not null default true,
  is_temporarily_closed boolean not null default false,
  google_analytics_measurement_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.opening_hours (
  id uuid primary key default gen_random_uuid(),
  day_of_week integer not null check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (day_of_week)
);

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt_text text,
  category text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customer_reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text,
  rating integer not null check (rating between 1 and 5),
  content text,
  source text,
  is_published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  payload jsonb not null default '{}'::jsonb,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_active_available on public.products(is_active, is_available);
create index if not exists idx_products_configurator_key on public.products(configurator_key);
create index if not exists idx_product_option_groups_product_id on public.product_option_groups(product_id);
create index if not exists idx_product_options_group_id on public.product_options(option_group_id);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_fulfillment_type on public.orders(fulfillment_type);
create index if not exists idx_orders_confirmation_status on public.orders(confirmation_status);
create unique index if not exists idx_orders_public_confirmation_token on public.orders(public_confirmation_token);
create index if not exists idx_orders_order_source on public.orders(order_source);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_gallery_images_active on public.gallery_images(is_active);
create index if not exists idx_analytics_events_name on public.analytics_events(event_name);
create index if not exists idx_admin_logs_admin on public.admin_logs(admin_user_id);

create trigger set_profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger set_categories_updated_at before update on public.categories for each row execute procedure public.set_updated_at();
create trigger set_products_updated_at before update on public.products for each row execute procedure public.set_updated_at();
create trigger set_orders_updated_at before update on public.orders for each row execute procedure public.set_updated_at();
create trigger set_restaurant_settings_updated_at before update on public.restaurant_settings for each row execute procedure public.set_updated_at();
create trigger set_opening_hours_updated_at before update on public.opening_hours for each row execute procedure public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();
