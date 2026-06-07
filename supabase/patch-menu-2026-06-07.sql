update public.menu_cards
set
  title = 'Boissons fraîches',
  description = 'Boissons soft, thés glacés et smoothies réunis dans une seule fiche.',
  section_keys = '{"boissons-froides","smoothies"}',
  updated_at = timezone('utc', now())
where key = 'boissons-froides';

update public.categories
set
  description = 'Cafés classiques, boissons gourmandes et boissons fraîches réunis dans la même rubrique.',
  updated_at = timezone('utc', now())
where slug = 'boissons';

update public.products
set
  name = 'Ceasar',
  description = 'Iceberg, croûtons, poulet, copeaux de parmesan, ognion crispy, sauce ceasar.',
  updated_at = timezone('utc', now())
where slug = 'cesar';

update public.products
set
  description = 'Roquette, aubergine, feta, groseilles, noix, basilic, vinaigre balsamique.',
  updated_at = timezone('utc', now())
where slug = 'medit';

update public.products
set
  description = 'Choisissez ensuite brownie, donuts, muffins, cookies, croissant ou pain au chocolat.',
  updated_at = timezone('utc', now())
where slug = 'gourmandises';

update public.products
set
  name = 'Thé glacé',
  description = 'Menthe / pêche / autres saveurs à venir',
  updated_at = timezone('utc', now())
where slug = 'verre-de-the';

update public.products
set
  sort_order = 8,
  updated_at = timezone('utc', now())
where slug = 'smoothies';

with burger_group as (
  select pog.id
  from public.product_option_groups pog
  join public.products p on p.id = pog.product_id
  where p.configurator_key = 'burgers-beef'
    and pog.name = 'Votre burger'
)
update public.product_options po
set
  description = case po.name
    when 'Alpin' then 'Boeuf, rosti, reblochon, salade, tomates, compotée d''oignons, sauce tartare.'
    when 'Classic' then 'Boeuf, comté, salade, tomates, oignons rouges, sauce biggy.'
    when 'Magret' then 'Magret, brebis, roquette, tomates confites, compotée d''oignons, sauce poivre.'
    when 'Texan' then 'Boeuf, bacon, cheddar fumé, salade, tomates, oignons frits, sauce barbecue.'
    when 'Chèvre' then 'Boeuf, chèvre, roquette, tomates confites, oignons frits, noix, miel.'
    when 'Bombay' then 'Poulet mariné, cheddar épicé, salade, tomates, oignons rouges, sauce tandoori.'
    when 'Veggie' then 'Aubergine, tomates confites, roquette, chèvre, noix, sauce tartare.'
    when 'Cheese' then 'Boeuf, cheddar, biggy.'
    when 'Cajun' then 'Poulet cajun, comté, salade, tomates, oignons rouges, sauce mayo cajun.'
    when 'Chicken' then 'Poulet, cheddar, mayo.'
    else po.description
  end,
  metadata = case
    when po.name = 'Le Bougiote' then jsonb_set(coalesce(po.metadata, '{}'::jsonb), '{badge}', '"Burger signature"', true)
    else coalesce(po.metadata, '{}'::jsonb)
  end
from burger_group
where po.option_group_id = burger_group.id
  and po.name in ('Le Bougiote', 'Alpin', 'Classic', 'Magret', 'Texan', 'Chèvre', 'Bombay', 'Veggie', 'Cheese', 'Cajun', 'Chicken');

with burger_group as (
  select pog.id
  from public.product_option_groups pog
  join public.products p on p.id = pog.product_id
  where p.configurator_key = 'burgers-beef'
    and pog.name = 'Votre burger'
)
update public.product_options po
set
  sort_order = case po.name
    when 'Le Bougiote' then 1
    when 'Alpin' then 2
    when 'Classic' then 3
    when 'Magret' then 4
    when 'Texan' then 5
    when 'Chèvre' then 6
    when 'Bombay' then 7
    when 'Cajun' then 8
    when 'Veggie' then 9
    when 'Cheese' then 10
    when 'Chicken' then 11
    when 'Menu enfants' then 12
    else po.sort_order
  end
from burger_group
where po.option_group_id = burger_group.id
  and po.name in ('Le Bougiote', 'Alpin', 'Classic', 'Magret', 'Texan', 'Chèvre', 'Bombay', 'Cajun', 'Veggie', 'Cheese', 'Chicken', 'Menu enfants');

with gourmandise_group as (
  select pog.id
  from public.product_option_groups pog
  join public.products p on p.id = pog.product_id
  where p.configurator_key = 'gourmandises'
    and pog.name = 'Votre gourmandise'
)
delete from public.product_options po
using gourmandise_group
where po.option_group_id = gourmandise_group.id
  and po.name in ('Cookie', 'Muffin', 'Donut', 'Browkie');

with gourmandise_group as (
  select pog.id
  from public.product_option_groups pog
  join public.products p on p.id = pog.product_id
  where p.configurator_key = 'gourmandises'
    and pog.name = 'Votre gourmandise'
)
update public.product_options po
set
  sort_order = case po.name
    when 'Brownie' then 1
    when 'Croissant' then 8
    when 'Pain au chocolat' then 9
    else po.sort_order
  end,
  metadata = case
    when po.name in ('Brownie', 'Pain au chocolat', 'Croissant') then '{}'::jsonb
    else coalesce(po.metadata, '{}'::jsonb)
  end
from gourmandise_group
where po.option_group_id = gourmandise_group.id
  and po.name in ('Brownie', 'Pain au chocolat', 'Croissant');

with gourmandise_group as (
  select pog.id
  from public.product_option_groups pog
  join public.products p on p.id = pog.product_id
  where p.configurator_key = 'gourmandises'
    and pog.name = 'Votre gourmandise'
)
insert into public.product_options (option_group_id, name, description, price, metadata, is_active, sort_order)
select
  gourmandise_group.id,
  option_name,
  null,
  option_price,
  option_metadata::jsonb,
  true,
  option_sort_order
from gourmandise_group
cross join (
  values
    ('Donut chocolat', 2.50, '{"family":"Donuts"}', 2),
    ('Donut fraise', 2.50, '{"family":"Donuts"}', 3),
    ('Muffin chocolat', 3.20, '{"family":"Muffins"}', 4),
    ('Muffin speculoos', 3.20, '{"family":"Muffins"}', 5),
    ('Cookie tout chocolat', 2.40, '{"family":"Cookies"}', 6),
    ('Cookie classique', 2.40, '{"family":"Cookies"}', 7)
) as additions(option_name, option_price, option_metadata, option_sort_order)
where not exists (
  select 1
  from public.product_options existing
  where existing.option_group_id = gourmandise_group.id
    and existing.name = additions.option_name
);
