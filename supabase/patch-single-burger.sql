update public.products
set
  name = 'Burgers',
  description = 'Choisissez ensuite Classic, Alpin, Magret, Texan, Chèvre, Bombay, Veggie, Cheese, Cajun ou Chicken.',
  tags = array['group', 'burger'],
  sort_order = 1
where configurator_key = 'burgers-beef';

update public.products
set
  is_active = false,
  is_available = false,
  description = 'Ancien groupe fusionné dans la carte burgers.'
where configurator_key = 'burgers-chicken';

with beef_group as (
  select pog.id
  from public.product_option_groups pog
  join public.products p on p.id = pog.product_id
  where p.configurator_key = 'burgers-beef'
    and pog.name = 'Votre burger'
  limit 1
)
insert into public.product_options (option_group_id, name, description, price, metadata, is_active, sort_order)
select
  beef_group.id,
  option_seed.name,
  option_seed.description,
  option_seed.price,
  '{}'::jsonb,
  true,
  option_seed.sort_order
from beef_group
cross join (
  values
    ('Cajun', 'Poulet, comté, sauce mayo cajun.', 11.90, 9),
    ('Chicken', 'Poulet, cheddar et sauce maison.', 8.90, 10)
) as option_seed(name, description, price, sort_order)
where not exists (
  select 1
  from public.product_options po
  where po.option_group_id = beef_group.id
    and po.name = option_seed.name
);
