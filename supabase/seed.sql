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
  ('Burgers', 'burgers', 'Un seul visuel clair pour choisir ensuite le burger qui vous correspond.', 1, true),
  ('Accompagnements', 'accompagnements', 'Salades, frites et accompagnements à ajouter facilement selon l’envie.', 2, true),
  ('Desserts & gourmandises', 'desserts-gourmandises', 'Desserts à l’assiette, gourmandises et viennoiseries regroupés dans un même univers sucré.', 3, true),
  ('Boissons', 'boissons', 'Cafés classiques, boissons gourmandes et boissons fraîches réunis dans la même rubrique.', 4, true),
  ('Petit-déjeuner & formules', 'petit-dejeuner-formules', 'Petit-déjeuner et formules à retrouver dans une sélection simple et pratique.', 5, true)
on conflict (slug) do nothing;

insert into public.menu_cards (key, title, description, section_keys, sort_order, is_active) values
  ('burgers', 'Burgers', 'Toutes les recettes burgers regroupées dans une seule fiche.', '{"burgers"}', 1, true),
  ('accompagnements', 'Accompagnements', 'Salades, frites et petites assiettes dans une seule fiche.', '{"accompagnements"}', 2, true),
  ('boissons-froides', 'Boissons fraîches', 'Boissons soft, thés glacés et smoothies réunis dans une seule fiche.', '{"boissons-froides","smoothies"}', 3, true),
  ('boissons-chaudes', 'Boissons chaudes', 'Cafés classiques, boissons gourmandes, petit-déjeuner et formule gourmande dans une seule fiche.', '{"petit-dejeuner","cafes-classiques","boissons-chaudes-simples","boissons-gourmandes","formule-gourmande"}', 4, true),
  ('douceurs', 'Desserts & gourmandises', 'Desserts à l’assiette et douceurs regroupés dans la même fiche.', '{"desserts","gourmandises"}', 5, true)
on conflict (key) do nothing;

with ids as (
  select id, slug from public.categories
)
insert into public.products (category_id, name, slug, description, price, price_label, product_type, configurator_key, is_available, availability_note, is_active, tags, sort_order)
values
  ((select id from ids where slug = 'burgers'), 'Burgers', 'burgers-boeuf', 'Choisissez ensuite Alpin, Classic, Magret, Texan, Chèvre, Bombay, Veggie, Cheese, Cajun, Chicken, Le Bougiote ou le menu enfants.', 8.90, 'À partir de 8,90 €', 'configurable', 'burgers-beef', true, null, true, '{"group","burger"}', 1),
  ((select id from ids where slug = 'burgers'), 'Burgers poulet', 'burgers-poulet', 'Ancien groupe fusionné dans la carte burgers.', 8.90, 'À partir de 8,90 €', 'configurable', 'burgers-chicken', false, null, false, '{"group","poulet"}', 2),
  ((select id from ids where slug = 'accompagnements'), 'Ceasar', 'cesar', 'Iceberg, croûtons, poulet, copeaux de parmesan, ognion crispy, sauce ceasar.', 10.90, null, 'simple', null, true, null, true, '{"salade"}', 1),
  ((select id from ids where slug = 'accompagnements'), 'Médit', 'medit', 'Roquette, aubergine, feta, groseilles, noix, basilic, vinaigre balsamique.', 10.90, null, 'simple', null, true, null, true, '{"salade"}', 2),
  ((select id from ids where slug = 'accompagnements'), 'Frites', 'frites', 'Frites maison.', 3.00, null, 'simple', null, true, null, true, '{"accompagnement"}', 3),
  ((select id from ids where slug = 'accompagnements'), 'Petite salade', 'petite-salade', 'Salade, tomates, oignons frits.', 1.50, null, 'simple', null, true, null, true, '{"accompagnement"}', 4),
  ((select id from ids where slug = 'desserts-gourmandises'), 'Desserts', 'desserts', 'Choisissez ensuite cheesecake, carrot cake, flan coco choco, crumble fruits rouges ou apple tart.', 3.90, 'À partir de 3,90 €', 'configurable', 'desserts', true, null, true, '{"group","dessert"}', 1),
  ((select id from ids where slug = 'desserts-gourmandises'), 'Gourmandises', 'gourmandises', 'Choisissez ensuite brownie, donuts, muffins, cookies, croissant ou pain au chocolat.', 2.40, 'À partir de 2,40 €', 'configurable', 'gourmandises', true, null, true, '{"group","gourmandise"}', 2),
  ((select id from ids where slug = 'petit-dejeuner-formules'), 'Formule express', 'formule-express', 'Expresso / Déca / Café allongé + 1 viennoiserie.', 2.20, null, 'simple', null, true, null, true, '{"pdj"}', 1),
  ((select id from ids where slug = 'petit-dejeuner-formules'), 'Formule classic', 'formule-classic', 'Double expresso / café crème / thé + 1 viennoiserie.', 3.20, null, 'simple', null, true, null, true, '{"pdj"}', 2),
  ((select id from ids where slug = 'petit-dejeuner-formules'), 'Formule PDJ', 'formule-pdj', 'Double expresso / café crème / thé + 1 viennoiserie + jus d’orange.', 4.80, null, 'simple', null, true, null, true, '{"pdj"}', 3),
  ((select id from ids where slug = 'boissons'), 'Cafés classiques', 'cafes-classiques', 'Choisissez ensuite votre café classique.', 1.50, 'À partir de 1,50 €', 'configurable', 'cafes-classiques', true, null, true, '{"group","cafe"}', 1),
  ((select id from ids where slug = 'boissons'), 'Boissons gourmandes', 'boissons-gourmandes', 'Choisissez votre boisson gourmande préférée.', 3.50, 'À partir de 3,50 €', 'configurable', 'boissons-gourmandes', true, null, true, '{"group","boisson-gourmande"}', 2),
  ((select id from ids where slug = 'petit-dejeuner-formules'), 'Formule gourmande', 'formule-gourmande', 'Boisson gourmande au choix + pâtisserie éligible.', 5.90, null, 'configurable', 'formule-gourmande', true, null, true, '{"group","formule"}', 4),
  ((select id from ids where slug = 'boissons'), 'Eau', 'eau', '50 cl', 1.00, null, 'simple', null, true, null, true, '{"frais"}', 3),
  ((select id from ids where slug = 'boissons'), 'Eau gazeuse', 'eau-gazeuse', '50 cl', 1.50, null, 'simple', null, true, null, true, '{"frais"}', 4),
  ((select id from ids where slug = 'boissons'), 'Soda', 'soda', '33 cl', 2.00, null, 'simple', null, true, null, true, '{"soft"}', 5),
  ((select id from ids where slug = 'boissons'), 'Thé glacé', 'verre-de-the', 'Menthe / pêche / autres saveurs à venir', 2.50, null, 'simple', null, true, null, true, '{"frais","the"}', 6),
  ((select id from ids where slug = 'boissons'), 'Jus', 'jus', '25 cl', 2.50, null, 'simple', null, true, null, true, '{"fruit"}', 7),
  ((select id from ids where slug = 'boissons'), 'Bière sans alcool', 'biere-sans-alcool', 'Heineken — 25 cl', 3.00, null, 'simple', null, true, null, true, '{"sans-alcool"}', 8)
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
  select id, 'Le Bougiote' as option_name, 'Gambas, sauce à l’ail, salade, citron confit, cheddar, oignons crispy.' as option_description, 14.90 as option_price, '{"badge":"Burger signature"}' as option_meta, 1 as option_sort_order from burger_beef_group where name = 'Votre burger'
  union all select id, 'Alpin', 'Boeuf, rosti, reblochon, salade, tomates, compotée d''oignons, sauce tartare.', 12.90, '{}', 2 from burger_beef_group where name = 'Votre burger'
  union all select id, 'Classic', 'Boeuf, comté, salade, tomates, oignons rouges, sauce biggy.', 10.90, '{}', 3 from burger_beef_group where name = 'Votre burger'
  union all select id, 'Magret', 'Magret, brebis, roquette, tomates confites, compotée d''oignons, sauce poivre.', 14.90, '{}', 4 from burger_beef_group where name = 'Votre burger'
  union all select id, 'Texan', 'Boeuf, bacon, cheddar fumé, salade, tomates, oignons frits, sauce barbecue.', 12.90, '{}', 5 from burger_beef_group where name = 'Votre burger'
  union all select id, 'Chèvre', 'Boeuf, chèvre, roquette, tomates confites, oignons frits, noix, miel.', 12.90, '{}', 6 from burger_beef_group where name = 'Votre burger'
  union all select id, 'Bombay', 'Poulet mariné, cheddar épicé, salade, tomates, oignons rouges, sauce tandoori.', 11.90, '{}', 7 from burger_beef_group where name = 'Votre burger'
  union all select id, 'Veggie', 'Aubergine, tomates confites, roquette, chèvre, noix, sauce tartare.', 12.90, '{}', 8 from burger_beef_group where name = 'Votre burger'
  union all select id, 'Cheese', 'Boeuf, cheddar, biggy.', 8.90, '{}', 9 from burger_beef_group where name = 'Votre burger'
  union all select id, 'Cajun', 'Poulet cajun, comté, salade, tomates, oignons rouges, sauce mayo cajun.', 11.90, '{}', 10 from burger_beef_group where name = 'Votre burger'
  union all select id, 'Chicken', 'Poulet, cheddar, mayo.', 8.90, '{}', 11 from burger_beef_group where name = 'Votre burger'
  union all select id, 'Menu enfants', '5 nuggets + petite frite + 1 Capri-Sun.', 6.00, '{"menuUpgradeDisabled":true,"standaloneLabel":"Menu enfants"}', 12 from burger_beef_group where name = 'Votre burger'
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
  union all select id, 'Brownie', null, 2.40, '{}', 1 from gourmandise_group
  union all select id, 'Donut chocolat', null, 2.50, '{"family":"Donuts"}', 2 from gourmandise_group
  union all select id, 'Donut fraise', null, 2.50, '{"family":"Donuts"}', 3 from gourmandise_group
  union all select id, 'Muffin chocolat', null, 3.20, '{"family":"Muffins"}', 4 from gourmandise_group
  union all select id, 'Muffin speculoos', null, 3.20, '{"family":"Muffins"}', 5 from gourmandise_group
  union all select id, 'Cookie tout chocolat', null, 2.40, '{"family":"Cookies"}', 6 from gourmandise_group
  union all select id, 'Cookie classique', null, 2.40, '{"family":"Cookies"}', 7 from gourmandise_group
  union all select id, 'Croissant', null, 1.10, '{}', 8 from gourmandise_group
  union all select id, 'Pain au chocolat', null, 1.20, '{}', 9 from gourmandise_group
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
  union all select id, 'Brownie', null, 0, '{}', 1 from formula_groups where name = 'Pâtisserie incluse'
  union all select id, 'Donut chocolat', null, 0, '{"family":"Donuts"}', 2 from formula_groups where name = 'Pâtisserie incluse'
  union all select id, 'Donut fraise', null, 0, '{"family":"Donuts"}', 3 from formula_groups where name = 'Pâtisserie incluse'
  union all select id, 'Muffin chocolat', null, 0, '{"family":"Muffins"}', 4 from formula_groups where name = 'Pâtisserie incluse'
  union all select id, 'Muffin speculoos', null, 0, '{"family":"Muffins"}', 5 from formula_groups where name = 'Pâtisserie incluse'
  union all select id, 'Cookie tout chocolat', null, 0, '{"family":"Cookies"}', 6 from formula_groups where name = 'Pâtisserie incluse'
  union all select id, 'Cookie classique', null, 0, '{"family":"Cookies"}', 7 from formula_groups where name = 'Pâtisserie incluse'
  union all select id, 'Croissant', null, 0, '{}', 8 from formula_groups where name = 'Pâtisserie incluse'
  union all select id, 'Pain au chocolat', null, 0, '{}', 9 from formula_groups where name = 'Pâtisserie incluse'
) as options_seed;

insert into public.gallery_images (image_url, alt_text, category, is_active, sort_order) values
  ('/src/assets/hero-section.jpg', 'Visuel principal Le Petit Bougiote', 'Burgers', true, 1),
  ('/src/assets/logo.png', 'Logo du restaurant', 'Menu', true, 2),
  ('/src/assets/hero-section.jpg', 'Pause café et dessert', 'Cafes', true, 3)
on conflict do nothing;
