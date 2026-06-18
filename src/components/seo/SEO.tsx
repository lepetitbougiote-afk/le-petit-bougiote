import { Helmet } from 'react-helmet-async';
import { brandAssets } from '../../data/business';
import { useRestaurant } from '../../contexts/RestaurantContext';

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
}

const siteUrl = 'https://le-petit-bougiote.pages.dev';

export function SEO({ title, description, path = '/', image = brandAssets.heroImage }: SEOProps) {
  const { settings } = useRestaurant();
  const url = new URL(path, siteUrl).toString();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: settings.name,
    image: new URL(image, siteUrl).toString(),
    logo: new URL(brandAssets.logoImage, siteUrl).toString(),
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address,
      addressLocality: settings.city,
      postalCode: settings.postalCode,
      addressCountry: 'FR',
    },
    telephone: [settings.phonePrimary, settings.phoneSecondary],
    priceRange: settings.priceRange,
    servesCuisine: ['Burgers', 'Coffee', 'Desserts', 'Snacking'],
    url,
    openingHoursSpecification: settings.openingHours
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
