alter table public.restaurant_settings
add column if not exists google_analytics_measurement_id text;

alter table public.orders
add column if not exists public_confirmation_token uuid default gen_random_uuid();

alter table public.orders
add column if not exists confirmation_link_expires_at timestamptz;

alter table public.orders
add column if not exists last_customer_notification_at timestamptz;

update public.orders
set public_confirmation_token = gen_random_uuid()
where public_confirmation_token is null;

alter table public.orders
alter column public_confirmation_token set not null;

create unique index if not exists idx_orders_public_confirmation_token
on public.orders(public_confirmation_token);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'phone',
    new.email
  )
  on conflict (id) do update
    set
      full_name = excluded.full_name,
      phone = excluded.phone,
      email = excluded.email,
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();
