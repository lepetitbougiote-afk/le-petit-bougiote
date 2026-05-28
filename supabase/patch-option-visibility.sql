drop policy if exists "public read options" on public.product_options;

create policy "public read options" on public.product_options
for select using (true);
