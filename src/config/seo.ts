export const SEO_CONFIG = {
  siteName: 'Le Petit Bougiote',
  siteUrl: 'https://lepetitbougiote.fr',
  locale: 'fr_FR',
  language: 'fr',
  phoneDisplay: '04 58 28 15 22',
  phoneInternational: '+33458281522',
  address: {
    street: '28 Rue Diderot',
    postalCode: '34500',
    city: 'Béziers',
    country: 'FR',
  },
  social: {
    // TODO: add verified Instagram, Facebook and Google Business Profile URLs.
    sameAs: [] as string[],
  },
} as const;

export const INDEXABLE_ROUTES = [
  '/',
  '/menu',
  '/contact',
  '/blog',
  '/blog/restaurant-centre-ville-beziers',
  '/blog/burger-beziers-fait-maison',
  '/blog/vente-a-emporter-beziers',
  '/blog/cafe-dessert-beziers',
  '/blog/ou-manger-burger-beziers',
  '/a-propos',
  '/galerie',
  '/avis',
] as const;

export function absoluteUrl(path: string) {
  return new URL(path, `${SEO_CONFIG.siteUrl}/`).toString();
}
