update public.products
set description = 'Choisissez ensuite Alpin, Classic, Magret, Texan, Chèvre, Bombay, Veggie, Cheese, Cajun, Chicken, Le Bougiote ou le menu enfants.'
where configurator_key = 'burgers-beef';

update public.products
set description = 'Expresso / Déca / Café allongé + 1 viennoiserie.'
where slug = 'formule-express';

update public.products
set description = 'Double expresso / café crème / thé + 1 viennoiserie.'
where slug = 'formule-classic';

update public.products
set description = 'Double expresso / café crème / thé + 1 viennoiserie + jus d’orange.'
where slug = 'formule-pdj';

update public.products
set description = 'Choisissez ensuite votre café classique : expresso, café allongé, café noisette, déca, thé ou infusion.'
where slug = 'cafes-classiques';

update public.products
set description = '50 cl'
where slug = 'eau';

update public.products
set description = '50 cl'
where slug = 'eau-gazeuse';

update public.products
set description = '33 cl'
where slug = 'soda';

update public.products
set description = '25 cl'
where slug = 'jus';

update public.products
set description = 'Heineken — 25 cl'
where slug = 'biere-sans-alcool';

with boissons_category as (
  select id
  from public.categories
  where slug = 'boissons'
  limit 1
)
insert into public.products (
  category_id,
  name,
  slug,
  description,
  price,
  product_type,
  is_available,
  is_active,
  tags,
  sort_order
)
select
  boissons_category.id,
  'Verre de thé',
  'verre-de-the',
  'Menthe / pêche / autres saveurs à venir',
  2.50,
  'simple',
  true,
  true,
  array['frais', 'the'],
  6
from boissons_category
where not exists (
  select 1
  from public.products
  where slug = 'verre-de-the'
);

update public.products
set
  description = 'Menthe / pêche / autres saveurs à venir',
  price = 2.50,
  is_available = true,
  is_active = true,
  tags = array['frais', 'the'],
  sort_order = 6
where slug = 'verre-de-the';

with burger_group as (
  select pog.id
  from public.product_option_groups pog
  join public.products p on p.id = pog.product_id
  where p.configurator_key = 'burgers-beef'
    and pog.name = 'Votre burger'
  limit 1
)
insert into public.product_options (
  option_group_id,
  name,
  description,
  price,
  metadata,
  is_active,
  sort_order
)
select
  burger_group.id,
  'Le Bougiote',
  'Gambas, sauce à l’ail, salade, citron confit, cheddar, oignons crispy.',
  14.90,
  jsonb_build_object('badge', 'Burger signature'),
  true,
  1
from burger_group
where not exists (
  select 1
  from public.product_options po
  where po.option_group_id = burger_group.id
    and po.name = 'Le Bougiote'
);

update public.product_options po
set
  description = 'Gambas, sauce à l’ail, salade, citron confit, cheddar, oignons crispy.',
  price = 14.90,
  metadata = coalesce(po.metadata, '{}'::jsonb) || jsonb_build_object('badge', 'Burger signature'),
  is_active = true,
  sort_order = 1
from public.product_option_groups pog
join public.products p on p.id = pog.product_id
where po.option_group_id = pog.id
  and p.configurator_key = 'burgers-beef'
  and pog.name = 'Votre burger'
  and po.name = 'Le Bougiote';

update public.product_options po
set sort_order =
  case po.name
    when 'Alpin' then 2
    when 'Classic' then 3
    when 'Magret' then 4
    when 'Texan' then 5
    when 'Chèvre' then 6
    when 'Bombay' then 7
    when 'Veggie' then 8
    when 'Cheese' then 9
    when 'Cajun' then 10
    when 'Chicken' then 11
    when 'Menu enfants' then 12
    else po.sort_order
  end
from public.product_option_groups pog
join public.products p on p.id = pog.product_id
where po.option_group_id = pog.id
  and p.configurator_key = 'burgers-beef'
  and pog.name = 'Votre burger'
  and po.name in ('Alpin', 'Classic', 'Magret', 'Texan', 'Chèvre', 'Bombay', 'Veggie', 'Cheese', 'Cajun', 'Chicken', 'Menu enfants');

with smoothie_group as (
  select pog.id
  from public.product_option_groups pog
  join public.products p on p.id = pog.product_id
  where p.configurator_key = 'smoothies'
    and pog.name = 'Votre smoothie'
  limit 1
)
insert into public.product_options (option_group_id, name, description, price, metadata, is_active, sort_order)
select
  smoothie_group.id,
  option_seed.name,
  option_seed.description,
  3.50,
  '{}'::jsonb,
  true,
  option_seed.sort_order
from smoothie_group
cross join (
  values
    ('Berry Cherry', 'Cerise, banane, fraise et cassis.', 4),
    ('Raspberry Heaven', 'Pomme, framboise, mangue et myrtille.', 5),
    ('Green Reviver', 'Banane, chou kale, mangue et citronnelle.', 8)
) as option_seed(name, description, sort_order)
where not exists (
  select 1
  from public.product_options po
  where po.option_group_id = smoothie_group.id
    and po.name = option_seed.name
);

update public.product_options po
set
  description = case po.name
    when 'Golden Glow' then 'Mangue, orange, papaye, crème de coco, citron, gingembre, piment rouge et curcuma.'
    when 'Berry Cherry' then 'Cerise, banane, fraise et cassis.'
    when 'Raspberry Heaven' then 'Pomme, framboise, mangue et myrtille.'
    when 'Green Reviver' then 'Banane, chou kale, mangue et citronnelle.'
    else po.description
  end,
  sort_order = case po.name
    when 'Coconut Crush' then 1
    when 'Strawberry Fantasy' then 2
    when 'Pineapple Sunset' then 3
    when 'Berry Cherry' then 4
    when 'Raspberry Heaven' then 5
    when 'Golden Glow' then 6
    when 'Dazzling Dragon' then 7
    when 'Green Reviver' then 8
    else po.sort_order
  end
from public.product_option_groups pog
join public.products p on p.id = pog.product_id
where po.option_group_id = pog.id
  and p.configurator_key = 'smoothies'
  and pog.name = 'Votre smoothie'
  and po.name in (
    'Coconut Crush',
    'Strawberry Fantasy',
    'Pineapple Sunset',
    'Berry Cherry',
    'Raspberry Heaven',
    'Golden Glow',
    'Dazzling Dragon',
    'Green Reviver'
  );
