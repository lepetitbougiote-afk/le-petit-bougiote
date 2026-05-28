update public.products
set
  description = 'Choisissez ensuite Alpin, Classic, Magret, Texan, Chèvre, Bombay, Veggie, Cheese, Cajun, Chicken ou le menu enfants.'
where configurator_key = 'burgers-beef';

with burger_group as (
  select pog.id
  from public.product_option_groups pog
  join public.products p on p.id = pog.product_id
  where p.configurator_key = 'burgers-beef'
  order by pog.sort_order
  limit 1
)
insert into public.product_options (option_group_id, name, description, price, metadata, is_active, sort_order)
select
  burger_group.id,
  'Menu enfants',
  '5 nuggets + petite frite + 1 Capri-Sun.',
  6.00,
  jsonb_build_object('menuUpgradeDisabled', true, 'standaloneLabel', 'Menu enfants'),
  true,
  11
from burger_group
where not exists (
  select 1
  from public.product_options po
  where po.option_group_id = burger_group.id
    and po.name = 'Menu enfants'
);

with boissons_category as (
  select id
  from public.categories
  where slug = 'boissons'
  limit 1
),
inserted_product as (
  insert into public.products (
    category_id,
    name,
    slug,
    description,
    price,
    price_label,
    product_type,
    configurator_key,
    is_available,
    is_active,
    tags,
    sort_order
  )
  select
    boissons_category.id,
    'Smoothies',
    'smoothies',
    'Choisissez votre smoothie fruité parmi la sélection du moment.',
    3.50,
    'À partir de 3,50 €',
    'configurable',
    'smoothies',
    true,
    true,
    array['group', 'smoothie'],
    2
  from boissons_category
  where not exists (
    select 1 from public.products where configurator_key = 'smoothies'
  )
  returning id
),
smoothie_product as (
  select id
  from inserted_product
  union all
  select id
  from public.products
  where configurator_key = 'smoothies'
  limit 1
),
smoothie_group as (
  insert into public.product_option_groups (product_id, name, helper_text, is_required, sort_order)
  select
    smoothie_product.id,
    'Votre smoothie',
    null,
    true,
    1
  from smoothie_product
  where not exists (
    select 1
    from public.product_option_groups pog
    where pog.product_id = smoothie_product.id
  )
  returning id
),
resolved_group as (
  select id
  from smoothie_group
  union all
  select pog.id
  from public.product_option_groups pog
  join smoothie_product sp on sp.id = pog.product_id
  order by id
  limit 1
)
insert into public.product_options (option_group_id, name, description, price, metadata, is_active, sort_order)
select
  resolved_group.id,
  option_seed.name,
  option_seed.description,
  3.50,
  '{}'::jsonb,
  true,
  option_seed.sort_order
from resolved_group
cross join (
  values
    ('Coconut Crush', 'Ananas et lait de coco.', 1),
    ('Strawberry Fantasy', 'Fraise et banane.', 2),
    ('Pineapple Sunset', 'Ananas, mangue et papaye.', 3),
    ('Golden Glow', 'Mangue, orange, papaye, crème de coco, citron, gingembre et curcuma.', 4),
    ('Dazzling Dragon', 'Fruit du dragon, mangue, banane, pomme, myrtille sauvage et jus de citron vert.', 5)
) as option_seed(name, description, sort_order)
where not exists (
  select 1
  from public.product_options po
  where po.option_group_id = resolved_group.id
    and po.name = option_seed.name
);
