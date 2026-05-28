begin;

update public.categories
set
  name = 'Accompagnements',
  slug = 'accompagnements',
  description = 'Salades, frites et accompagnements à ajouter facilement selon l’envie.',
  sort_order = 2,
  is_active = true
where slug = 'salades-frites';

update public.categories
set
  name = 'Desserts & gourmandises',
  slug = 'desserts-gourmandises',
  description = 'Desserts à l’assiette, gourmandises et viennoiseries regroupés dans un même univers sucré.',
  sort_order = 3,
  is_active = true
where slug = 'desserts';

update public.categories
set
  name = 'Boissons',
  slug = 'boissons',
  description = 'Cafés classiques, boissons gourmandes et boissons froides réunis dans la même rubrique.',
  sort_order = 4,
  is_active = true
where slug = 'cafes-classiques';

update public.categories
set
  name = 'Petit-déjeuner & formules',
  slug = 'petit-dejeuner-formules',
  description = 'Petit-déjeuner et formules à retrouver dans une sélection simple et pratique.',
  sort_order = 5,
  is_active = true
where slug = 'petit-dejeuner';

update public.categories
set is_active = false
where slug in ('gourmandises', 'boissons-gourmandes', 'formule-gourmande', 'boissons-froides');

with target_categories as (
  select slug, id
  from public.categories
  where slug in ('burgers', 'accompagnements', 'desserts-gourmandises', 'boissons', 'petit-dejeuner-formules')
)
update public.products
set category_id = target.id
from target_categories as target
where
  (
    public.products.slug in ('cesar', 'medit', 'frites', 'petite-salade')
    and target.slug = 'accompagnements'
  )
  or (
    public.products.slug in ('desserts', 'gourmandises')
    and target.slug = 'desserts-gourmandises'
  )
  or (
    public.products.slug in ('cafes-classiques', 'boissons-gourmandes', 'eau', 'eau-gazeuse', 'soda', 'jus', 'biere-sans-alcool')
    and target.slug = 'boissons'
  )
  or (
    public.products.slug in ('formule-express', 'formule-classic', 'formule-pdj', 'formule-gourmande')
    and target.slug = 'petit-dejeuner-formules'
  );

commit;
