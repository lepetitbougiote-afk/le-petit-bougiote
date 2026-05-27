insert into public.restaurant_settings (
  name,
  brand_line,
  address,
  phone_primary,
  phone_secondary,
  google_maps_url,
  announcement,
  is_ordering_enabled,
  is_temporarily_closed,
  google_analytics_measurement_id
) values (
  'Le Petit Bougiote',
  'Coffee & Burger',
  '28 Rue Diderot, 34500 Béziers',
  '04 58 28 15 22',
  '07 59 71 46 29',
  'https://maps.app.goo.gl/NfQJQyESrN5161rz9',
  'Sur place, click & collect et livraison locale selon l’organisation du moment.',
  true,
  false,
  'G-063Y6HMTZY'
)
on conflict do nothing;

insert into public.opening_hours (day_of_week, opens_at, closes_at, is_closed) values
  (1, '07:00', '20:00', false),
  (2, '07:00', '20:00', false),
  (3, '07:00', '20:00', false),
  (4, '07:00', '20:00', false),
  (5, '07:00', '22:00', false),
  (6, '11:00', '22:00', false),
  (0, null, null, true)
on conflict (day_of_week) do nothing;

insert into public.categories (name, slug, description, sort_order, is_active) values
  ('Burgers', 'burgers', 'Deux visuels clairs pour choisir ensuite le burger souhaité.', 1, true),
  ('Salades & frites', 'salades-frites', 'Salades fraîches, frites et petits accompagnements.', 2, true),
  ('Desserts', 'desserts', 'Une sélection de desserts servis à l’assiette, à choisir dans une seule carte dédiée.', 3, true),
  ('Gourmandises', 'gourmandises', 'Cookies, viennoiseries et petites douceurs à choisir dans une seule carte dédiée.', 4, true),
  ('Petit-déjeuner', 'petit-dejeuner', 'Des formules simples pour bien démarrer la journée.', 5, true),
  ('Cafés classiques', 'cafes-classiques', 'Un groupe dédié aux cafés classiques.', 6, true),
  ('Boissons gourmandes', 'boissons-gourmandes', 'Un groupe dédié aux boissons gourmandes.', 7, true),
  ('Formule gourmande', 'formule-gourmande', 'Boisson gourmande au choix + pâtisserie éligible.', 8, true),
  ('Boissons froides', 'boissons-froides', 'Eaux, sodas, jus et boissons fraîches.', 9, true)
on conflict (slug) do nothing;

with ids as (
  select id, slug from public.categories
)
insert into public.products (category_id, name, slug, description, price, price_label, product_type, configurator_key, is_available, availability_note, is_active, tags, sort_order)
values
  ((select id from ids where slug = 'burgers'), 'Burgers bœuf', 'burgers-boeuf', 'Choisissez ensuite Classic, Alpin, Magret, Texan, Chèvre, Bombay, Veggie ou Cheese.', 8.90, 'À partir de 8,90 €', 'configurable', 'burgers-beef', true, null, true, '{"group","boeuf"}', 1),
  ((select id from ids where slug = 'burgers'), 'Burgers poulet', 'burgers-poulet', 'Choisissez ensuite Cajun ou Chicken, en burger seul ou en menu +3 €.', 8.90, 'À partir de 8,90 €', 'configurable', 'burgers-chicken', true, null, true, '{"group","poulet"}', 2),
  ((select id from ids where slug = 'salades-frites'), 'César', 'cesar', 'Iceberg, croûtons, poulet, copeaux de parmesan, oignon, sauce césar.', 10.90, null, 'simple', null, true, null, true, '{"salade"}', 1),
  ((select id from ids where slug = 'salades-frites'), 'Médit', 'medit', 'Feuille, aubergine, feta, groseilles, noix, vinaigre balsamique.', 10.90, null, 'simple', null, true, null, true, '{"salade"}', 2),
  ((select id from ids where slug = 'salades-frites'), 'Frites', 'frites', 'Frites maison.', 3.00, null, 'simple', null, true, null, true, '{"accompagnement"}', 3),
  ((select id from ids where slug = 'salades-frites'), 'Petite salade', 'petite-salade', 'Salade, tomates, oignons frits.', 1.50, null, 'simple', null, true, null, true, '{"accompagnement"}', 4),
  ((select id from ids where slug = 'desserts'), 'Desserts', 'desserts', 'Choisissez ensuite cheesecake, carrot cake, flan coco choco, crumble fruits rouges ou apple tart.', 3.90, 'À partir de 3,90 €', 'configurable', 'desserts', true, null, true, '{"group","dessert"}', 1),
  ((select id from ids where slug = 'gourmandises'), 'Gourmandises', 'gourmandises', 'Choisissez ensuite cookie, brownie, croissant, pain au chocolat, muffin, donut ou browkie.', 2.40, 'À partir de 2,40 €', 'configurable', 'gourmandises', true, null, true, '{"group","gourmandise"}', 1),
  ((select id from ids where slug = 'petit-dejeuner'), 'Formule express', 'formule-express', 'Expresso + 1 viennoiserie.', 2.20, null, 'simple', null, true, null, true, '{"pdj"}', 1),
  ((select id from ids where slug = 'petit-dejeuner'), 'Formule classic', 'formule-classic', 'Double expresso / café crème / thé + 1 viennoiserie.', 3.20, null, 'simple', null, true, null, true, '{"pdj"}', 2),
  ((select id from ids where slug = 'petit-dejeuner'), 'Formule PDJ', 'formule-pdj', 'Double expresso / café crème / thé + 1 viennoiserie + jus d’orange.', 4.80, null, 'simple', null, true, null, true, '{"pdj"}', 3),
  ((select id from ids where slug = 'cafes-classiques'), 'Cafés classiques', 'cafes-classiques', 'Choisissez ensuite votre café classique.', 1.50, 'À partir de 1,50 €', 'configurable', 'cafes-classiques', true, null, true, '{"group","cafe"}', 1),
  ((select id from ids where slug = 'boissons-gourmandes'), 'Boissons gourmandes', 'boissons-gourmandes', 'Choisissez votre boisson gourmande préférée.', 3.50, 'À partir de 3,50 €', 'configurable', 'boissons-gourmandes', true, null, true, '{"group","boisson-gourmande"}', 1),
  ((select id from ids where slug = 'formule-gourmande'), 'Formule gourmande', 'formule-gourmande', 'Boisson gourmande au choix + pâtisserie éligible.', 5.90, null, 'configurable', 'formule-gourmande', true, null, true, '{"group","formule"}', 1),
  ((select id from ids where slug = 'boissons-froides'), 'Eau', 'eau', 'Bouteille d’eau.', 1.00, null, 'simple', null, true, null, true, '{"frais"}', 1),
  ((select id from ids where slug = 'boissons-froides'), 'Eau gazeuse', 'eau-gazeuse', 'Eau pétillante.', 1.50, null, 'simple', null, true, null, true, '{"frais"}', 2),
  ((select id from ids where slug = 'boissons-froides'), 'Soda', 'soda', 'Sélection de sodas.', 2.00, null, 'simple', null, true, null, true, '{"soft"}', 3),
  ((select id from ids where slug = 'boissons-froides'), 'Jus', 'jus', 'Jus de fruits.', 2.50, null, 'simple', null, true, null, true, '{"fruit"}', 4),
  ((select id from ids where slug = 'boissons-froides'), 'Bière sans alcool', 'biere-sans-alcool', 'Alternative légère.', 3.00, null, 'simple', null, true, null, true, '{"sans-alcool"}', 5)
on conflict (slug) do nothing;

with products_cte as (
  select id, slug from public.products
),
burger_beef_group as (
  insert into public.product_option_groups (product_id, name, helper_text, is_required, sort_order)
  select id, 'Votre burger', null, true, 1 from products_cte where slug = 'burgers-boeuf'
  union all
  select id, 'Format', 'Menu +3 € : frites + boisson', true, 2 from products_cte where slug = 'burgers-boeuf'
  returning id, name, product_id
),
burger_chicken_group as (
  insert into public.product_option_groups (product_id, name, helper_text, is_required, sort_order)
  select id, 'Votre burger', null, true, 1 from products_cte where slug = 'burgers-poulet'
  union all
  select id, 'Format', 'Menu +3 € : frites + boisson', true, 2 from products_cte where slug = 'burgers-poulet'
  returning id, name, product_id
),
dessert_group as (
  insert into public.product_option_groups (product_id, name, helper_text, is_required, sort_order)
  select id, 'Votre dessert', 'Desserts servis à l’assiette.', true, 1 from products_cte where slug = 'desserts'
  returning id
),
gourmandise_group as (
  insert into public.product_option_groups (product_id, name, helper_text, is_required, sort_order)
  select id, 'Votre gourmandise', null, true, 1 from products_cte where slug = 'gourmandises'
  returning id
),
coffee_group as (
  insert into public.product_option_groups (product_id, name, helper_text, is_required, sort_order)
  select id, 'Votre boisson', null, true, 1 from products_cte where slug = 'cafes-classiques'
  returning id
),
gourmet_group as (
  insert into public.product_option_groups (product_id, name, helper_text, is_required, sort_order)
  select id, 'Votre boisson', null, true, 1 from products_cte where slug = 'boissons-gourmandes'
  returning id
),
formula_groups as (
  insert into public.product_option_groups (product_id, name, helper_text, is_required, sort_order)
  select id, 'Boisson gourmande', null, true, 1 from products_cte where slug = 'formule-gourmande'
  union all
  select id, 'Pâtisserie incluse', 'Hors dessert à l’assiette.', true, 2 from products_cte where slug = 'formule-gourmande'
  returning id, name
)
insert into public.product_options (option_group_id, name, description, price, metadata, is_active, sort_order)
select id, option_name, option_description, option_price, option_meta::jsonb, true, option_sort_order
from (
  select id, 'Alpin' as option_name, 'Boeuf, reblochon, sauce tartare.' as option_description, 12.90 as option_price, '{}' as option_meta, 1 as option_sort_order from burger_beef_group where name = 'Votre burger'
  union all select id, 'Classic', 'Boeuf, comté, sauce biggy.', 10.90, '{}', 2 from burger_beef_group where name = 'Votre burger'
  union all select id, 'Magret', 'Magret de canard, sauce poivre.', 14.90, '{}', 3 from burger_beef_group where name = 'Votre burger'
  union all select id, 'Texan', 'Boeuf, bacon, cheddar fumé.', 12.90, '{}', 4 from burger_beef_group where name = 'Votre burger'
  union all select id, 'Chèvre', 'Boeuf, chèvre, noix, miel.', 12.90, '{}', 5 from burger_beef_group where name = 'Votre burger'
  union all select id, 'Bombay', 'Poulet mariné, sauce tandoori.', 11.90, '{}', 6 from burger_beef_group where name = 'Votre burger'
  union all select id, 'Veggie', 'Aubergine, tomates confites, chèvre.', 12.90, '{}', 7 from burger_beef_group where name = 'Votre burger'
  union all select id, 'Cheese', 'Boeuf, cheddar et sauce maison.', 8.90, '{}', 8 from burger_beef_group where name = 'Votre burger'
  union all select id, 'Burger seul', null, 0, '{"kind":"service-format"}', 1 from burger_beef_group where name = 'Format'
  union all select id, 'Menu +3 €', 'Frites + boisson', 3.00, '{"kind":"service-format"}', 2 from burger_beef_group where name = 'Format'
  union all select id, 'Cajun', 'Poulet, comté, sauce mayo cajun.', 11.90, '{}', 1 from burger_chicken_group where name = 'Votre burger'
  union all select id, 'Chicken', 'Poulet, cheddar et sauce maison.', 8.90, '{}', 2 from burger_chicken_group where name = 'Votre burger'
  union all select id, 'Burger seul', null, 0, '{"kind":"service-format"}', 1 from burger_chicken_group where name = 'Format'
  union all select id, 'Menu +3 €', 'Frites + boisson', 3.00, '{"kind":"service-format"}', 2 from burger_chicken_group where name = 'Format'
  union all select id, 'Cheesecake', null, 4.30, '{}', 1 from dessert_group
  union all select id, 'Carott cake', null, 4.30, '{}', 2 from dessert_group
  union all select id, 'Flan coco choco', null, 4.30, '{}', 3 from dessert_group
  union all select id, 'Crumble fruits rouges', null, 3.90, '{}', 4 from dessert_group
  union all select id, 'Apple tart', null, 4.30, '{}', 5 from dessert_group
  union all select id, 'Cookie', null, 2.40, '{}', 1 from gourmandise_group
  union all select id, 'Brownie', null, 2.40, '{}', 2 from gourmandise_group
  union all select id, 'Croissant', null, 1.10, '{}', 3 from gourmandise_group
  union all select id, 'Pain au chocolat', null, 1.20, '{}', 4 from gourmandise_group
  union all select id, 'Muffin', null, 3.20, '{}', 5 from gourmandise_group
  union all select id, 'Donut', null, 2.50, '{}', 6 from gourmandise_group
  union all select id, 'Browkie', null, 2.60, '{}', 7 from gourmandise_group
  union all select id, 'Expresso', null, 1.50, '{}', 1 from coffee_group
  union all select id, 'Café allongé', null, 1.60, '{}', 2 from coffee_group
  union all select id, 'Café noisette', null, 1.60, '{}', 3 from coffee_group
  union all select id, 'Double expresso', null, 2.50, '{}', 4 from coffee_group
  union all select id, 'Café au lait', null, 2.50, '{}', 5 from coffee_group
  union all select id, 'Déca', null, 1.60, '{}', 6 from coffee_group
  union all select id, 'Thé ou infusion', null, 3.00, '{}', 7 from coffee_group
  union all select id, 'Latte macchiato', null, 4.00, '{}', 1 from gourmet_group
  union all select id, 'Chocolat chaud', null, 3.50, '{}', 2 from gourmet_group
  union all select id, 'Cappuccino', null, 4.50, '{}', 3 from gourmet_group
  union all select id, 'Café viennois', null, 4.50, '{}', 4 from gourmet_group
  union all select id, 'Mokaccino', null, 5.00, '{}', 5 from gourmet_group
  union all select id, 'Chocolat viennois', null, 5.00, '{}', 6 from gourmet_group
  union all select id, 'Chai latte', null, 4.50, '{}', 7 from gourmet_group
  union all select id, 'Matcha latte', null, 4.50, '{}', 8 from gourmet_group
  union all select id, 'Latte macchiato', null, 0, '{}', 1 from formula_groups where name = 'Boisson gourmande'
  union all select id, 'Chocolat chaud', null, 0, '{}', 2 from formula_groups where name = 'Boisson gourmande'
  union all select id, 'Cappuccino', null, 0, '{}', 3 from formula_groups where name = 'Boisson gourmande'
  union all select id, 'Café viennois', null, 0, '{}', 4 from formula_groups where name = 'Boisson gourmande'
  union all select id, 'Mokaccino', null, 0, '{}', 5 from formula_groups where name = 'Boisson gourmande'
  union all select id, 'Chocolat viennois', null, 0, '{}', 6 from formula_groups where name = 'Boisson gourmande'
  union all select id, 'Chai latte', null, 0, '{}', 7 from formula_groups where name = 'Boisson gourmande'
  union all select id, 'Matcha latte', null, 0, '{}', 8 from formula_groups where name = 'Boisson gourmande'
  union all select id, 'Cookie', null, 0, '{}', 1 from formula_groups where name = 'Pâtisserie incluse'
  union all select id, 'Brownie', null, 0, '{}', 2 from formula_groups where name = 'Pâtisserie incluse'
  union all select id, 'Croissant', null, 0, '{}', 3 from formula_groups where name = 'Pâtisserie incluse'
  union all select id, 'Pain au chocolat', null, 0, '{}', 4 from formula_groups where name = 'Pâtisserie incluse'
  union all select id, 'Muffin', null, 0, '{}', 5 from formula_groups where name = 'Pâtisserie incluse'
  union all select id, 'Donut', null, 0, '{}', 6 from formula_groups where name = 'Pâtisserie incluse'
  union all select id, 'Browkie', null, 0, '{}', 7 from formula_groups where name = 'Pâtisserie incluse'
) as options_seed;

insert into public.gallery_images (image_url, alt_text, category, is_active, sort_order) values
  ('/src/assets/hero-section.jpg', 'Visuel principal Le Petit Bougiote', 'Burgers', true, 1),
  ('/src/assets/logo.png', 'Logo du restaurant', 'Menu', true, 2),
  ('/src/assets/hero-section.jpg', 'Pause café et dessert', 'Cafes', true, 3)
on conflict do nothing;
