import logoImage from '../assets/logo.png';
import beefBurgers from '../assets/menu/beef-burgers.webp';
import brownies from '../assets/menu/brownies.webp';
import boissonsFroides from '../assets/menu/boissons-froides.webp';
import cappuccino from '../assets/menu/cappuccino.webp';
import cesarSalad from '../assets/menu/cesar-salad.webp';
import cheesecake from '../assets/menu/cheesecake.webp';
import chickenBurgers from '../assets/menu/chicken-burgers.webp';
import cookies from '../assets/menu/cookies.webp';
import croissant from '../assets/menu/croissant.webp';
import donuts from '../assets/menu/donuts.webp';
import espresso from '../assets/menu/espresso.webp';
import fries from '../assets/menu/fries.webp';
import gourmetHotDrink from '../assets/menu/gourmet-hot-drink.webp';
import meditSalad from '../assets/menu/medit-salad.webp';
import muffins from '../assets/menu/muffins.webp';
import painAuChocolat from '../assets/menu/pain-au-chocolat.webp';
import petiteSalade from '../assets/menu/petite-salade.webp';
import type { ProductImageFit, ProductImageStatus } from '../types';

interface ProductImageConfig {
  image: string;
  imageAlt: string;
  imageStatus: ProductImageStatus;
  imageFit?: ProductImageFit;
}

function realImage(image: string, imageAlt: string): ProductImageConfig {
  return {
    image,
    imageAlt,
    imageStatus: 'real',
    imageFit: 'cover',
  };
}

function brandedDrinkPlaceholder(imageAlt: string): ProductImageConfig {
  return {
    image: logoImage,
    imageAlt,
    imageStatus: 'placeholder',
    imageFit: 'contain',
  };
}

export const productImageMap: Record<string, ProductImageConfig> = {
  'prod-group-burgers-beef': realImage(beefBurgers, 'Sélection de burgers bœuf chez Le Petit Bougiote'),
  'prod-group-burgers-chicken': realImage(chickenBurgers, 'Sélection de burgers poulet chez Le Petit Bougiote'),
  'prod-cesar': realImage(cesarSalad, 'Salade Ceasar servie chez Le Petit Bougiote'),
  'prod-medit': realImage(meditSalad, 'Salade Médit servie chez Le Petit Bougiote'),
  'prod-frites': realImage(fries, 'Portion de frites servie chez Le Petit Bougiote'),
  'prod-petite-salade': realImage(petiteSalade, 'Petite salade servie chez Le Petit Bougiote'),
  'prod-group-desserts': realImage(cheesecake, 'Desserts servis chez Le Petit Bougiote'),
  'prod-group-gourmandises': realImage(donuts, 'Gourmandises servies chez Le Petit Bougiote'),
  'prod-formule-express': realImage(croissant, 'Formule express du petit-déjeuner chez Le Petit Bougiote'),
  'prod-formule-classic': realImage(espresso, 'Formule classic du petit-déjeuner chez Le Petit Bougiote'),
  'prod-formule-pdj': realImage(cappuccino, 'Formule petit-déjeuner chez Le Petit Bougiote'),
  'prod-group-cafes-classiques': realImage(espresso, 'Cafés classiques servis chez Le Petit Bougiote'),
  'prod-group-boissons-gourmandes': realImage(gourmetHotDrink, 'Boissons gourmandes servies chez Le Petit Bougiote'),
  'prod-group-smoothies': realImage(boissonsFroides, 'Boissons fraîches servies chez Le Petit Bougiote'),
  'prod-formule-gourmande': realImage(gourmetHotDrink, 'Formule gourmande servie chez Le Petit Bougiote'),
  'prod-eau': brandedDrinkPlaceholder('Boisson fraîche Le Petit Bougiote'),
  'prod-eau-gazeuse': brandedDrinkPlaceholder('Boisson fraîche Le Petit Bougiote'),
  'prod-soda': brandedDrinkPlaceholder('Boisson fraîche Le Petit Bougiote'),
  'prod-jus': brandedDrinkPlaceholder('Boisson fraîche Le Petit Bougiote'),
  'prod-biere-sans-alcool': brandedDrinkPlaceholder('Logo Le Petit Bougiote Coffee & Burger'),
  'prod-verre-de-the': brandedDrinkPlaceholder('Thé glacé Le Petit Bougiote'),
};
