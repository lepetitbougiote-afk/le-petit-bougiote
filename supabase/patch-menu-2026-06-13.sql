update public.products
set description = 'Roquette, aubergine, feta, groseilles, noix, vinaigrette basilic-balsamique.'
where slug = 'medit';

update public.products
set description = 'Choisissez ensuite brownie, brookie, donuts, muffins, cookies, croissant ou pain au chocolat.'
where slug = 'gourmandises';

with gourmandises_product as (
  select id
  from public.products
  where configurator_key = 'gourmandises'
),
gourmandise_group as (
  select pog.id
  from public.product_option_groups pog
  join gourmandises_product gp on gp.id = pog.product_id
  where pog.sort_order = 1
  limit 1
)
insert into public.product_options (option_group_id, name, price, is_active, sort_order)
select
  gg.id,
  'Brookie',
  2.6,
  true,
  coalesce((
    select max(po.sort_order) + 1
    from public.product_options po
    where po.option_group_id = gg.id
  ), 1)
from gourmandise_group gg
where not exists (
  select 1
  from public.product_options po
  where po.option_group_id = gg.id
    and lower(po.name) = 'brookie'
);

update public.product_options po
set price = 2.6,
    is_active = true
where lower(po.name) = 'brookie'
  and exists (
    select 1
    from public.product_option_groups pog
    join public.products p on p.id = pog.product_id
    where pog.id = po.option_group_id
      and p.configurator_key = 'gourmandises'
  );

with formule_product as (
  select id
  from public.products
  where configurator_key = 'formule-gourmande'
),
pastry_group as (
  select pog.id
  from public.product_option_groups pog
  join formule_product fp on fp.id = pog.product_id
  where pog.name = 'Pâtisserie incluse'
  limit 1
)
insert into public.product_options (option_group_id, name, price, is_active, sort_order)
select
  pg.id,
  'Brookie',
  0,
  true,
  coalesce((
    select max(po.sort_order) + 1
    from public.product_options po
    where po.option_group_id = pg.id
  ), 1)
from pastry_group pg
where not exists (
  select 1
  from public.product_options po
  where po.option_group_id = pg.id
    and lower(po.name) = 'brookie'
);

update public.product_options po
set price = 0,
    is_active = true
where lower(po.name) = 'brookie'
  and exists (
    select 1
    from public.product_option_groups pog
    join public.products p on p.id = pog.product_id
    where pog.id = po.option_group_id
      and p.configurator_key = 'formule-gourmande'
      and pog.name = 'Pâtisserie incluse'
  );
