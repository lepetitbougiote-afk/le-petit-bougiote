import beefBurgers from '../assets/menu/beef-burgers.webp';
import brownies from '../assets/menu/brownies.webp';
import cappuccino from '../assets/menu/cappuccino.webp';
import cesarSalad from '../assets/menu/cesar-salad.webp';
import cheesecake from '../assets/menu/cheesecake.webp';
import chickenBurgers from '../assets/menu/chicken-burgers.webp';
import chocolatChaud from '../assets/menu/chocolat-chaud.webp';
import cookies from '../assets/menu/cookies.webp';
import croissant from '../assets/menu/croissant.webp';
import donuts from '../assets/menu/donuts.webp';
import espresso from '../assets/menu/espresso.webp';
import fries from '../assets/menu/fries.webp';
import gourmetHotDrink from '../assets/menu/gourmet-hot-drink.webp';
import layerCake from '../assets/menu/layer-cake.webp';
import meditSalad from '../assets/menu/medit-salad.webp';
import muffins from '../assets/menu/muffins.webp';
import painAuChocolat from '../assets/menu/pain-au-chocolat.webp';
import petiteSalade from '../assets/menu/petite-salade.webp';
import salonVide from '../assets/venue/salon-vide.jpg';
import salonMonde from '../assets/venue/salon-monde.jpg';
import terasseVide from '../assets/venue/terasse-vide.jpg';
import terasseMonde from '../assets/venue/terasse-monde.jpg';
import type { GalleryImage } from '../types';

export const galleryImages: GalleryImage[] = [
  { id: 'gallery-salon-vide', title: 'Le salon', alt: 'Salon du Petit Bougiote', category: 'Ambiance', image: salonVide, isActive: true, sortOrder: 1 },
  { id: 'gallery-salon-monde', title: 'Le salon animé', alt: 'Salon du Petit Bougiote avec des clients', category: 'Ambiance', image: salonMonde, isActive: true, sortOrder: 2 },
  { id: 'gallery-terasse-vide', title: 'La terrasse', alt: 'Terrasse du Petit Bougiote', category: 'Terrasse', image: terasseVide, isActive: true, sortOrder: 3 },
  { id: 'gallery-terasse-monde', title: 'La terrasse animée', alt: 'Terrasse du Petit Bougiote avec des clients', category: 'Terrasse', image: terasseMonde, isActive: true, sortOrder: 4 },
  { id: 'gallery-burger-1', title: 'Burger signature', alt: 'Burger signature Le Petit Bougiote', category: 'Burgers', image: beefBurgers, isActive: true, sortOrder: 5 },
  { id: 'gallery-burger-2', title: 'Burger poulet', alt: 'Burger poulet du Petit Bougiote', category: 'Burgers', image: chickenBurgers, isActive: true, sortOrder: 6 },
  { id: 'gallery-cesar', title: 'Salade César', alt: 'Salade César du Petit Bougiote', category: 'Menu', image: cesarSalad, isActive: true, sortOrder: 7 },
  { id: 'gallery-medit', title: 'Salade Médit', alt: 'Salade Médit du Petit Bougiote', category: 'Menu', image: meditSalad, isActive: true, sortOrder: 8 },
  { id: 'gallery-fries', title: 'Frites', alt: 'Portion de frites du Petit Bougiote', category: 'Menu', image: fries, isActive: true, sortOrder: 9 },
  { id: 'gallery-petite-salade', title: 'Petite salade', alt: 'Petite salade du Petit Bougiote', category: 'Menu', image: petiteSalade, isActive: true, sortOrder: 10 },
  { id: 'gallery-cheesecake', title: 'Dessert à l’assiette', alt: 'Dessert à l’assiette du Petit Bougiote', category: 'Desserts', image: cheesecake, isActive: true, sortOrder: 11 },
  { id: 'gallery-layer-cake', title: 'Layer cake', alt: 'Layer cake du Petit Bougiote', category: 'Desserts', image: layerCake, isActive: true, sortOrder: 12 },
  { id: 'gallery-brownies', title: 'Brownies', alt: 'Brownies du Petit Bougiote', category: 'Desserts', image: brownies, isActive: true, sortOrder: 13 },
  { id: 'gallery-cookies', title: 'Cookies', alt: 'Cookies du Petit Bougiote', category: 'Desserts', image: cookies, isActive: true, sortOrder: 14 },
  { id: 'gallery-donuts', title: 'Donuts', alt: 'Donuts du Petit Bougiote', category: 'Desserts', image: donuts, isActive: true, sortOrder: 15 },
  { id: 'gallery-muffins', title: 'Muffins', alt: 'Muffins du Petit Bougiote', category: 'Desserts', image: muffins, isActive: true, sortOrder: 16 },
  { id: 'gallery-croissant', title: 'Croissant', alt: 'Croissant du Petit Bougiote', category: 'Menu', image: croissant, isActive: true, sortOrder: 17 },
  { id: 'gallery-pain-choco', title: 'Pain au chocolat', alt: 'Pain au chocolat du Petit Bougiote', category: 'Menu', image: painAuChocolat, isActive: true, sortOrder: 18 },
  { id: 'gallery-espresso', title: 'Expresso', alt: 'Expresso servi chez Le Petit Bougiote', category: 'Cafes', image: espresso, isActive: true, sortOrder: 19 },
  { id: 'gallery-cappuccino', title: 'Cappuccino', alt: 'Cappuccino servi chez Le Petit Bougiote', category: 'Cafes', image: cappuccino, isActive: true, sortOrder: 20 },
  { id: 'gallery-chocolat-chaud', title: 'Chocolat chaud', alt: 'Chocolat chaud servi chez Le Petit Bougiote', category: 'Cafes', image: chocolatChaud, isActive: true, sortOrder: 21 },
  { id: 'gallery-gourmet-drink', title: 'Boisson gourmande', alt: 'Boisson gourmande servie chez Le Petit Bougiote', category: 'Ambiance', image: gourmetHotDrink, isActive: true, sortOrder: 22 },
];
