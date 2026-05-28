alter table public.profiles
add column if not exists address text;

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
