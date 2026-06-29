import { SEO_CONFIG, absoluteUrl } from '../config/seo';

export type JsonLd = Record<string, unknown>;

export function restaurantSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${SEO_CONFIG.siteUrl}/#restaurant`,
    name: SEO_CONFIG.siteName,
    url: `${SEO_CONFIG.siteUrl}/`,
    telephone: SEO_CONFIG.phoneInternational,
    image: absoluteUrl('/android-chrome-512x512.png'),
    logo: absoluteUrl('/android-chrome-512x512.png'),
    address: {
      '@type': 'PostalAddress',
      streetAddress: SEO_CONFIG.address.street,
      postalCode: SEO_CONFIG.address.postalCode,
      addressLocality: SEO_CONFIG.address.city,
      addressCountry: SEO_CONFIG.address.country,
    },
    servesCuisine: ['Burgers', 'Café', 'Desserts'],
    priceRange: '€€',
    acceptsReservations: false,
    hasMenu: absoluteUrl('/menu'),
    ...(SEO_CONFIG.social.sameAs.length ? { sameAs: SEO_CONFIG.social.sameAs } : {}),
  };
}

export function websiteSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SEO_CONFIG.siteUrl}/#website`,
    url: `${SEO_CONFIG.siteUrl}/`,
    name: SEO_CONFIG.siteName,
    inLanguage: 'fr-FR',
    publisher: { '@id': `${SEO_CONFIG.siteUrl}/#restaurant` },
  };
}

export function webPageSchema(path: string, name: string, description: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${absoluteUrl(path)}#webpage`,
    url: absoluteUrl(path),
    name,
    description,
    inLanguage: 'fr-FR',
    isPartOf: { '@id': `${SEO_CONFIG.siteUrl}/#website` },
  };
}

export function menuSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    '@id': `${absoluteUrl('/menu')}#menu`,
    name: 'Carte du Petit Bougiote',
    url: absoluteUrl('/menu'),
    hasMenuSection: ['Burgers faits maison', 'Café', 'Desserts', 'Boissons', 'Vente à emporter'].map((name) => ({
      '@type': 'MenuSection',
      name,
    })),
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleSchema(article: {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  dateModified: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    inLanguage: 'fr-FR',
    mainEntityOfPage: absoluteUrl(`/blog/${article.slug}`),
    author: { '@type': 'Organization', name: SEO_CONFIG.siteName },
    publisher: {
      '@type': 'Organization',
      name: SEO_CONFIG.siteName,
      logo: { '@type': 'ImageObject', url: absoluteUrl('/android-chrome-512x512.png') },
    },
  };
}
