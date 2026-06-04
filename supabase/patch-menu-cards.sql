create table if not exists public.menu_cards (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  description text,
  section_keys text[] not null default '{}',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_menu_cards_active_sort on public.menu_cards(is_active, sort_order);

drop trigger if exists set_menu_cards_updated_at on public.menu_cards;
create trigger set_menu_cards_updated_at before update on public.menu_cards for each row execute procedure public.set_updated_at();

alter table public.menu_cards enable row level security;

drop policy if exists "public read active menu cards" on public.menu_cards;
create policy "public read active menu cards" on public.menu_cards
for select using (is_active = true);

drop policy if exists "admins manage menu cards" on public.menu_cards;
create policy "admins manage menu cards" on public.menu_cards
for all using (public.is_admin()) with check (public.is_admin());

insert into public.menu_cards (key, title, description, section_keys, sort_order, is_active) values
  ('burgers', 'Burgers', 'Toutes les recettes burgers regroupées dans une seule fiche.', '{"burgers"}', 1, true),
  ('accompagnements', 'Accompagnements', 'Salades, frites et petites assiettes dans une seule fiche.', '{"accompagnements"}', 2, true),
  ('boissons-froides', 'Boissons froides', 'Smoothies et boissons fraîches réunis dans une seule fiche.', '{"smoothies","boissons-froides"}', 3, true),
  ('boissons-chaudes', 'Boissons chaudes', 'Cafés classiques, boissons gourmandes, petit-déjeuner et formule gourmande dans une seule fiche.', '{"petit-dejeuner","cafes-classiques","boissons-chaudes-simples","boissons-gourmandes","formule-gourmande"}', 4, true),
  ('douceurs', 'Desserts & gourmandises', 'Desserts à l’assiette et douceurs regroupés dans la même fiche.', '{"desserts","gourmandises"}', 5, true)
on conflict (key) do update set
  title = excluded.title,
  description = excluded.description,
  section_keys = excluded.section_keys,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;
