# Le Petit Bougiote

Application React + Vite pour le restaurant Le Petit Bougiote à Béziers.

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Variables d'environnement

Copier `.env.example` vers `.env` puis renseigner si besoin :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GA_MEASUREMENT_ID`

L’application fonctionne sans Supabase branché grâce à la couche de services mock.

## Structure

- `src/data`: données métier locales et mocks
- `src/services`: interface stable prête pour le remplacement par Supabase
- `src/pages/public`: site public + commande
- `src/pages/account`: pages compte client
- `src/pages/admin`: espace administration mock
- `supabase`: schéma, seed, RLS et policies storage
