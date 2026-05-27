# Supabase setup

## Ordre d'exécution

1. `schema.sql`
2. `rls-policies.sql`
3. `storage-policies.sql`
4. `seed.sql`

## Variables requises

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GA_MEASUREMENT_ID`

## Première création d'admin

1. Créer l’utilisateur dans Supabase Auth.
2. Récupérer son `auth.users.id`.
3. Insérer un rôle dans `public.user_roles` avec `admin` ou `super_admin`.

Exemple :

```sql
insert into public.user_roles (user_id, role)
values ('<AUTH_USER_UUID>', 'admin');
```

## Notes sécurité

- Ne jamais exposer la service role key côté frontend.
- Le client web doit utiliser uniquement `VITE_SUPABASE_ANON_KEY`.
- Les services frontend sont déjà structurés pour remplacer les mocks par des requêtes Supabase.
- Vérifier les policies storage avant tout upload depuis l’admin.

## Préparation des commandes

- Le schéma est prêt pour deux parcours distincts:
  - `click_collect` pour les commandes sur place / à emporter issues du menu / QR code
  - `delivery` pour les demandes de livraison à confirmer
- Les colonnes `order_source`, `delivery_address`, `delivery_fee`, `desired_time`, `confirmation_status`, `proposed_time`, `customer_confirmation_required` et `customer_confirmed_at` permettent de brancher plus tard:
  - un checkout click & collect avec choix `sur_place` / `a_emporter`
  - un checkout livraison avec adresse, frais fixes, créneau et double confirmation éventuelle
- Les tables `product_option_groups` et `product_options` préparent:
  - les burgers groupés
  - les cafés classiques
  - les boissons gourmandes
  - la formule gourmande
