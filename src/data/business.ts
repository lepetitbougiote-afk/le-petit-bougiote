import heroImage from '../assets/hero-section.jpg';
import logoImage from '../assets/logo.png';
import heroTransparentLogoImage from '../assets/hero-logo.png';
import type { BusinessSettings, ReviewExample, ReviewStat } from '../types';

export const business: BusinessSettings = {
  name: 'Le Petit Bougiote',
  brandLine: 'Coffee & Burger',
  address: '28 Rue Diderot',
  city: 'Béziers',
  postalCode: '34500',
  phonePrimary: '04 58 28 15 22',
  phoneSecondary: '07 59 71 46 29',
  mapUrl: 'https://maps.app.goo.gl/NfQJQyESrN5161rz9',
  reviewUrl: 'https://maps.app.goo.gl/NfQJQyESrN5161rz9',
  leaveReviewUrl: 'https://maps.app.goo.gl/NfQJQyESrN5161rz9',
  orderModeLabel: 'Sur place, click & collect & livraison',
  services: [
    'Repas sur place',
    'Vente à emporter',
    'Click & Collect',
    'Livraison locale',
    'Coffee',
    'Burgers',
    'Desserts',
    'Gourmandises',
    'Petit-déjeuner',
    'Cafés classiques',
    'Boissons gourmandes',
    'Boissons froides',
    'Salades',
    'Frites',
  ],
  rating: 5,
  reviewCountLabel: '~30 avis',
  priceRange: '10–20 €',
  openingHours: [
    { day: 'Lundi', opensAt: '07:00', closesAt: '20:00', isClosed: false },
    { day: 'Mardi', opensAt: '07:00', closesAt: '20:00', isClosed: false },
    { day: 'Mercredi', opensAt: '07:00', closesAt: '20:00', isClosed: false },
    { day: 'Jeudi', opensAt: '07:00', closesAt: '20:00', isClosed: false },
    { day: 'Vendredi', opensAt: '07:00', closesAt: '22:00', isClosed: false },
    { day: 'Samedi', opensAt: '11:00', closesAt: '22:00', isClosed: false },
    { day: 'Dimanche', opensAt: null, closesAt: null, isClosed: true },
  ],
  announcement: 'Sur place, click & collect et livraison locale selon l’organisation du moment.',
  orderingEnabled: true,
  googleAnalyticsMeasurementId: import.meta.env.VITE_GA_MEASUREMENT_ID,
};

export const brandAssets = {
  heroImage,
  logoImage,
  heroTransparentLogoImage,
};

export const reviewStat: ReviewStat = {
  rating: 5,
  reviewCountLabel: '30 avis environ',
};

export const reviewExamples: ReviewExample[] = [];
