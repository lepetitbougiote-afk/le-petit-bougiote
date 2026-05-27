import { productImageMap } from './productImages';
import type { GalleryImage } from '../types';

export const galleryImages: GalleryImage[] = [
  {
    id: 'gallery-burger',
    title: 'Burgers gourmands',
    alt: 'Sélection de burgers gourmands du Petit Bougiote',
    category: 'Burgers',
    image: productImageMap['prod-group-burgers-beef'].image,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'gallery-cafe',
    title: 'Pause café',
    alt: 'Café et cappuccino dans une ambiance chaleureuse',
    category: 'Cafes',
    image: productImageMap['prod-group-boissons-gourmandes'].image,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'gallery-dessert',
    title: 'Douceurs',
    alt: 'Desserts et gourmandises au comptoir',
    category: 'Desserts',
    image: productImageMap['prod-group-desserts'].image,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'gallery-terrasse',
    title: 'Coin pause',
    alt: 'Ambiance calme pour une pause sur place',
    category: 'Terrasse',
    image: productImageMap['prod-group-cafes-classiques'].image,
    isActive: true,
    sortOrder: 4,
  },
  {
    id: 'gallery-menu',
    title: 'Carte & formules',
    alt: 'Aperçu de la carte du restaurant',
    category: 'Menu',
    image: productImageMap['prod-formule-gourmande'].image,
    isActive: true,
    sortOrder: 5,
  },
  {
    id: 'gallery-ambiance',
    title: 'Ambiance',
    alt: 'Ambiance familiale et chaleureuse du Petit Bougiote',
    category: 'Ambiance',
    image: productImageMap['prod-group-gourmandises'].image,
    isActive: true,
    sortOrder: 6,
  },
];
