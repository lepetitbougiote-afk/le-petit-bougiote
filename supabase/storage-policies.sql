insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('gallery-images', 'gallery-images', true),
  ('brand-assets', 'brand-assets', true)
on conflict (id) do nothing;

create policy "public read product images bucket" on storage.objects
for select using (bucket_id = 'product-images');

create policy "public read gallery images bucket" on storage.objects
for select using (bucket_id = 'gallery-images');

create policy "public read brand assets bucket" on storage.objects
for select using (bucket_id = 'brand-assets');

create policy "admins manage product images bucket" on storage.objects
for all using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

create policy "admins manage gallery images bucket" on storage.objects
for all using (bucket_id = 'gallery-images' and public.is_admin())
with check (bucket_id = 'gallery-images' and public.is_admin());

create policy "admins manage brand assets bucket" on storage.objects
for all using (bucket_id = 'brand-assets' and public.is_admin())
with check (bucket_id = 'brand-assets' and public.is_admin());
