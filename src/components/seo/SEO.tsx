import { Helmet } from 'react-helmet-async';
import { business, brandAssets } from '../../data/business';

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
}

const siteUrl = 'https://le-petit-bougiote.pages.dev';

export function SEO({ title, description, path = '/', image = brandAssets.heroImage }: SEOProps) {
  const url = new URL(path, siteUrl).toString();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: business.name,
    image: new URL(image, siteUrl).toString(),
    logo: new URL(brandAssets.logoImage, siteUrl).toString(),
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address,
      addressLocality: business.city,
      postalCode: business.postalCode,
      addressCountry: 'FR',
    },
    telephone: [business.phonePrimary, business.phoneSecondary],
    priceRange: business.priceRange,
    servesCuisine: ['Burgers', 'Coffee', 'Desserts', 'Snacking'],
    url,
    openingHoursSpecification: business.openingHours
      .filter((item) => !item.isClosed && item.opensAt && item.closesAt)
      .map((item) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: item.day,
        opens: item.opensAt,
        closes: item.closesAt,
      })),
  };

  return (
    <Helmet>
      <html lang="fr" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="restaurant Béziers, burger Béziers, coffee shop Béziers, desserts Béziers, vente à emporter Béziers, restaurant rue Diderot Béziers, café Béziers" />
      <meta name="theme-color" content="#3f7a3d" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={new URL(image, siteUrl).toString()} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={new URL(image, siteUrl).toString()} />
      <link rel="canonical" href={url} />
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
