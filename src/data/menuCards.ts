export type MenuCardSectionKey =
  | 'burgers'
  | 'accompagnements'
  | 'desserts'
  | 'gourmandises'
  | 'petit-dejeuner'
  | 'boissons-chaudes-simples'
  | 'cafes-classiques'
  | 'boissons-gourmandes'
  | 'smoothies'
  | 'formule-gourmande'
  | 'boissons-froides';

export interface MenuCardConfig {
  id: string;
  key: string;
  title: string;
  description: string;
  sectionKeys: MenuCardSectionKey[];
  sortOrder: number;
  isActive: boolean;
}

export const menuCardConfigs: MenuCardConfig[] = [
  {
    id: 'menu-card-burgers',
    key: 'burgers',
    title: 'Burgers',
    description: 'Toutes les recettes burgers regroupées dans une seule fiche.',
    sectionKeys: ['burgers'],
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'menu-card-accompagnements',
    key: 'accompagnements',
    title: 'Accompagnements',
    description: 'Salades, frites et petites assiettes dans une seule fiche.',
    sectionKeys: ['accompagnements'],
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'menu-card-boissons-froides',
    key: 'boissons-froides',
    title: 'Boissons froides',
    description: 'Smoothies et boissons fraîches réunis dans une seule fiche.',
    sectionKeys: ['smoothies', 'boissons-froides'],
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'menu-card-boissons-chaudes',
    key: 'boissons-chaudes',
    title: 'Boissons chaudes',
    description: 'Cafés classiques, boissons gourmandes, petit-déjeuner et formule gourmande dans une seule fiche.',
    sectionKeys: ['petit-dejeuner', 'cafes-classiques', 'boissons-chaudes-simples', 'boissons-gourmandes', 'formule-gourmande'],
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 'menu-card-douceurs',
    key: 'douceurs',
    title: 'Desserts & gourmandises',
    description: 'Desserts à l’assiette et douceurs regroupés dans la même fiche.',
    sectionKeys: ['desserts', 'gourmandises'],
    sortOrder: 5,
    isActive: true,
  },
];
