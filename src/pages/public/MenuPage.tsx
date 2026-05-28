import { Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { OrderModeSelector, type OrderModeChoice } from '../../components/public/OrderModeSelector';
import { ProductConfiguratorModal } from '../../components/public/ProductConfiguratorModal';
import { SEO } from '../../components/seo/SEO';
import { Reveal } from '../../components/ui/Reveal';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { formatPrice } from '../../lib/utils';
import { menuService } from '../../services/menuService';
import type { CartItem, Product, ProductChoiceOption, ProductConfigurator } from '../../types';

type MenuServiceMode = OrderModeChoice | null;
type QuantityMap = Record<string, number>;
type BurgerSelectionMap = Record<string, { solo: number; menu: number }>;

type MenuSectionKey =
  | 'burgers'
  | 'accompagnements'
  | 'desserts'
  | 'gourmandises'
  | 'petit-dejeuner'
  | 'cafes-classiques'
  | 'boissons-gourmandes'
  | 'smoothies'
  | 'formule-gourmande'
  | 'boissons-froides';

type MenuSection = {
  key: MenuSectionKey;
  title: string;
  description: string;
  kind: 'burgers' | 'simple' | 'options' | 'configurable';
  hiddenForDelivery?: boolean;
  product?: Product;
  products?: Product[];
  configurator?: ProductConfigurator;
};

type MenuCard = {
  key: 'burgers' | 'accompagnements' | 'boissons' | 'douceurs' | 'formules';
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  sectionKeys: MenuSectionKey[];
  hidden?: boolean;
};

function getModeFromSearchParam(value: string | null): MenuServiceMode {
  if (value === 'sur_place' || value === 'a_emporter' || value === 'delivery') {
    return value;
  }
  return null;
}

function QuantityControl({
  value,
  onDecrease,
  onIncrease,
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-brand-green/10 bg-white px-2 py-1">
      <button type="button" onClick={onDecrease} className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-green/10 text-slate-700">
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-6 text-center text-sm font-semibold text-slate-950">{value}</span>
      <button type="button" onClick={onIncrease} className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-green/10 text-slate-700">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function getConfiguratorGroup(configurator: ProductConfigurator | undefined, expectedId: string) {
  if (!configurator) {
    return undefined;
  }

  return (
    configurator.choiceGroups.find((group) => group.id === expectedId) ??
    configurator.choiceGroups[0]
  );
}

export default function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [configurators, setConfigurators] = useState<Record<string, ProductConfigurator>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [serviceMode, setServiceMode] = useState<MenuServiceMode>(() => getModeFromSearchParam(searchParams.get('service')));
  const [openCardKey, setOpenCardKey] = useState<MenuCard['key'] | null>(null);
  const [simpleSelections, setSimpleSelections] = useState<Record<string, QuantityMap>>({});
  const [burgerSelections, setBurgerSelections] = useState<BurgerSelectionMap>({});
  const { addCustomItem, setFulfillmentType, setDiningMode, totalItems } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    void menuService.getProducts().then(setProducts);
    void Promise.all([
      menuService.getProductConfigurator('burgers-beef'),
      menuService.getProductConfigurator('desserts'),
      menuService.getProductConfigurator('gourmandises'),
      menuService.getProductConfigurator('cafes-classiques'),
      menuService.getProductConfigurator('boissons-gourmandes'),
      menuService.getProductConfigurator('smoothies'),
      menuService.getProductConfigurator('formule-gourmande'),
    ]).then((values) => {
      const next = values.reduce<Record<string, ProductConfigurator>>((accumulator, configurator) => {
        if (configurator) {
          accumulator[configurator.key] = configurator;
        }
        return accumulator;
      }, {});
      setConfigurators(next);
    });
  }, []);

  useEffect(() => {
    setServiceMode(getModeFromSearchParam(searchParams.get('service')));
  }, [searchParams]);

  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const sections = useMemo<MenuSection[]>(() => {
    const burgerProduct = productById.get('prod-group-burgers-beef');
    const dessertProduct = productById.get('prod-group-desserts');
    const gourmandisesProduct = productById.get('prod-group-gourmandises');
    const cafesProduct = productById.get('prod-group-cafes-classiques');
    const gourmetProduct = productById.get('prod-group-boissons-gourmandes');
    const smoothiesProduct = productById.get('prod-group-smoothies');
    const formuleProduct = productById.get('prod-formule-gourmande');

    return [
      {
        key: 'burgers',
        title: 'Burgers',
        description: 'Choisissez vos burgers avec deux quantités séparées: burger seul ou formule menu.',
        kind: 'burgers',
        product: burgerProduct,
        configurator: configurators['burgers-beef'],
      },
      {
        key: 'accompagnements',
        title: 'Accompagnements',
        description: 'Salades, frites et petites assiettes à ajouter selon l’envie.',
        kind: 'simple',
        products: ['prod-cesar', 'prod-medit', 'prod-frites', 'prod-petite-salade']
          .map((id) => productById.get(id))
          .filter(Boolean) as Product[],
      },
      {
        key: 'desserts',
        title: 'Desserts à l’assiette',
        description: 'Les desserts servis à l’assiette, avec quantités directes.',
        kind: 'options',
        product: dessertProduct,
        configurator: configurators.desserts,
      },
      {
        key: 'gourmandises',
        title: 'Gourmandises',
        description: 'Les douceurs et viennoiseries dans un même choix rapide.',
        kind: 'options',
        product: gourmandisesProduct,
        configurator: configurators.gourmandises,
      },
      {
        key: 'petit-dejeuner',
        title: 'Petit-déjeuner',
        description: 'Les formules du matin, simples et rapides.',
        kind: 'simple',
        hiddenForDelivery: true,
        products: ['prod-formule-express', 'prod-formule-classic', 'prod-formule-pdj']
          .map((id) => productById.get(id))
          .filter(Boolean) as Product[],
      },
      {
        key: 'cafes-classiques',
        title: 'Cafés classiques',
        description: 'Les boissons chaudes classiques à commander en quelques gestes.',
        kind: 'options',
        hiddenForDelivery: true,
        product: cafesProduct,
        configurator: configurators['cafes-classiques'],
      },
      {
        key: 'boissons-gourmandes',
        title: 'Boissons gourmandes',
        description: 'Les boissons chaudes gourmandes de la carte.',
        kind: 'options',
        hiddenForDelivery: true,
        product: gourmetProduct,
        configurator: configurators['boissons-gourmandes'],
      },
      {
        key: 'smoothies',
        title: 'Smoothies',
        description: 'Les smoothies fruités à ajouter à la commande.',
        kind: 'options',
        product: smoothiesProduct,
        configurator: configurators.smoothies,
      },
      {
        key: 'formule-gourmande',
        title: 'Formule gourmande',
        description: 'Une formule prête à composer avec boisson gourmande et pâtisserie.',
        kind: 'configurable',
        hiddenForDelivery: true,
        product: formuleProduct,
      },
      {
        key: 'boissons-froides',
        title: 'Boissons froides',
        description: 'Les boissons fraîches à ajouter simplement à la commande.',
        kind: 'simple',
        products: ['prod-eau', 'prod-eau-gazeuse', 'prod-soda', 'prod-jus', 'prod-biere-sans-alcool']
          .map((id) => productById.get(id))
          .filter(Boolean) as Product[],
      },
    ].filter((section) => {
      if (serviceMode === 'delivery' && section.hiddenForDelivery) {
        return false;
      }
      if (section.kind === 'simple') {
        return Boolean(section.products?.length);
      }
      return Boolean(section.product);
    });
  }, [configurators, productById, serviceMode]);

  const sectionByKey = useMemo(
    () => new Map(sections.map((section) => [section.key, section])),
    [sections],
  );

  const cards = useMemo<MenuCard[]>(() => {
    const burgerSection = sectionByKey.get('burgers');
    const accompagnementsSection = sectionByKey.get('accompagnements');
    const boissonsImageSource =
      sectionByKey.get('cafes-classiques')?.product ??
      sectionByKey.get('boissons-gourmandes')?.product ??
      sectionByKey.get('boissons-froides')?.products?.[0];
    const dessertsImageSource =
      sectionByKey.get('desserts')?.product ?? sectionByKey.get('gourmandises')?.product;
    const formulesImageSource =
      sectionByKey.get('petit-dejeuner')?.products?.[0] ?? sectionByKey.get('formule-gourmande')?.product;

    return [
      {
        key: 'burgers',
        title: 'Burgers',
        description: 'Toutes les recettes burgers regroupées dans une seule fiche.',
        image: burgerSection?.product?.image,
        imageAlt: burgerSection?.product?.imageAlt,
        sectionKeys: ['burgers'],
        hidden: !burgerSection,
      },
      {
        key: 'accompagnements',
        title: 'Accompagnements',
        description: 'Salades, frites et petites assiettes dans une seule fiche.',
        image: accompagnementsSection?.products?.[0]?.image,
        imageAlt: accompagnementsSection?.products?.[0]?.imageAlt,
        sectionKeys: ['accompagnements'],
        hidden: !accompagnementsSection,
      },
      {
        key: 'boissons',
        title: 'Boissons',
        description: serviceMode === 'delivery' ? 'Boissons fraîches et smoothies uniquement en livraison.' : 'Boissons chaudes classiques, gourmandes, smoothies et boissons froides.',
        image: boissonsImageSource?.image,
        imageAlt: boissonsImageSource?.imageAlt,
        sectionKeys: ['cafes-classiques', 'boissons-gourmandes', 'smoothies', 'boissons-froides'],
        hidden: !sectionByKey.get('boissons-froides') && !sectionByKey.get('cafes-classiques') && !sectionByKey.get('boissons-gourmandes') && !sectionByKey.get('smoothies'),
      },
      {
        key: 'douceurs',
        title: 'Desserts & gourmandises',
        description: 'Desserts à l’assiette et douceurs regroupés dans la même fiche.',
        image: dessertsImageSource?.image,
        imageAlt: dessertsImageSource?.imageAlt,
        sectionKeys: ['desserts', 'gourmandises'],
        hidden: !sectionByKey.get('desserts') && !sectionByKey.get('gourmandises'),
      },
      {
        key: 'formules',
        title: 'Petit-déjeuner & formules',
        description: 'Les formules du matin et la formule gourmande dans un seul espace.',
        image: formulesImageSource?.image,
        imageAlt: formulesImageSource?.imageAlt,
        sectionKeys: ['petit-dejeuner', 'formule-gourmande'],
        hidden: !sectionByKey.get('petit-dejeuner') && !sectionByKey.get('formule-gourmande'),
      },
    ].filter((card) => !card.hidden);
  }, [sectionByKey, serviceMode]);

  const openCard = cards.find((card) => card.key === openCardKey) ?? null;

  function chooseMode(choice: OrderModeChoice) {
    if (choice === 'delivery') {
      setFulfillmentType('delivery');
      setDiningMode(null);
    } else {
      setFulfillmentType('click_collect');
      setDiningMode(choice);
    }
    setServiceMode(choice);
    setSearchParams({ service: choice });
  }

  function updateSelection(sectionKey: string, itemKey: string, delta: number) {
    setSimpleSelections((current) => ({
      ...current,
      [sectionKey]: {
        ...(current[sectionKey] ?? {}),
        [itemKey]: Math.max(0, (current[sectionKey]?.[itemKey] ?? 0) + delta),
      },
    }));
  }

  function updateBurgerSelection(optionId: string, variant: 'solo' | 'menu', delta: number) {
    setBurgerSelections((current) => {
      const previous = current[optionId] ?? { solo: 0, menu: 0 };
      return {
        ...current,
        [optionId]: {
          ...previous,
          [variant]: Math.max(0, previous[variant] + delta),
        },
      };
    });
  }

  function getSimpleSelectionCount(sectionKey: string) {
    return (Object.values(simpleSelections[sectionKey] ?? {}) as number[]).reduce(
      (sum, quantity) => sum + quantity,
      0,
    );
  }

  function getBurgerSelectionCount() {
    return (Object.values(burgerSelections) as Array<{ solo: number; menu: number }>).reduce(
      (sum, selection) => sum + selection.solo + selection.menu,
      0,
    );
  }

  function isOptionAvailable(option: ProductChoiceOption) {
    return option.isActive ?? true;
  }

  function getOptionAvailabilityNote(option: ProductChoiceOption) {
    return typeof option.meta?.availabilityNote === 'string' ? option.meta.availabilityNote : '';
  }

  function buildBurgerItems(section: MenuSection): Array<Omit<CartItem, 'id'>> {
    const burgerOptions = getConfiguratorGroup(section.configurator, 'burger-choice')?.options ?? [];
    if (!section.product) {
      return [];
    }
    return burgerOptions.flatMap((option) => {
      if (!isOptionAvailable(option)) {
        return [];
      }
      const selection = burgerSelections[option.id] ?? { solo: 0, menu: 0 };
      const items: Array<Omit<CartItem, 'id'>> = [];
      if (selection.solo > 0) {
        const standaloneLabel =
          typeof option.meta?.standaloneLabel === 'string' ? option.meta.standaloneLabel : 'Burger seul';
        items.push({
          productId: section.product.id,
          name: `${option.name} — ${standaloneLabel}`,
          price: option.price,
          quantity: selection.solo,
          note: '',
          image: section.product.image,
          imageAlt: section.product.imageAlt,
          imageFit: section.product.imageFit,
          configuratorKey: 'burgers-beef',
          selectedOptions: [
            { groupId: 'burger-choice', optionId: option.id, label: option.name, price: option.price },
            { groupId: 'service-format', optionId: 'burger-seul', label: standaloneLabel, price: 0 },
          ],
        });
      }
      if (!option.meta?.menuUpgradeDisabled && selection.menu > 0) {
        items.push({
          productId: section.product.id,
          name: `${option.name} — Menu`,
          price: option.price + 3,
          quantity: selection.menu,
          note: '',
          image: section.product.image,
          imageAlt: section.product.imageAlt,
          imageFit: section.product.imageFit,
          configuratorKey: 'burgers-beef',
          selectedOptions: [
            { groupId: 'burger-choice', optionId: option.id, label: option.name, price: option.price },
            { groupId: 'service-format', optionId: 'menu-plus-3', label: 'Menu +3 €', price: 3 },
          ],
        });
      }
      return items;
    });
  }

  function buildSimpleItems(section: MenuSection): Array<Omit<CartItem, 'id'>> {
    if (section.kind === 'simple') {
      return (section.products ?? []).flatMap((product) => {
        const quantity = simpleSelections[section.key]?.[product.id] ?? 0;
        if (quantity <= 0) {
          return [];
        }
        return [{
          productId: product.id,
          name: product.name,
          price: product.price,
          priceLabel: product.priceLabel,
          quantity,
          note: '',
          image: product.image,
          imageAlt: product.imageAlt,
          imageFit: product.imageFit,
          configuratorKey: product.configuratorKey,
        }];
      });
    }

    if (section.kind === 'options' && section.configurator && section.product) {
      const group = section.configurator.choiceGroups[0];
      return group.options.flatMap((option) => {
        if (!isOptionAvailable(option)) {
          return [];
        }
        const quantity = simpleSelections[section.key]?.[option.id] ?? 0;
        if (quantity <= 0) {
          return [];
        }
        return [{
          productId: section.product.id,
          name: option.name,
          price: option.price,
          quantity,
          note: '',
          image: section.product.image,
          imageAlt: section.product.imageAlt,
          imageFit: section.product.imageFit,
          configuratorKey: section.configurator?.key,
          selectedOptions: [{ groupId: group.id, optionId: option.id, label: option.name, price: option.price }],
        }];
      });
    }

    return [];
  }

  function addSectionSelection(section: MenuSection) {
    if (serviceMode === 'delivery') {
      setFulfillmentType('delivery');
      setDiningMode(null);
    } else {
      setFulfillmentType('click_collect');
      setDiningMode(serviceMode ?? 'sur_place');
    }

    if (section.kind === 'burgers') {
      buildBurgerItems(section).forEach((item) => addCustomItem(item));
      setBurgerSelections({});
      setOpenCardKey(null);
      return;
    }

    buildSimpleItems(section).forEach((item) => addCustomItem(item));
    setSimpleSelections((current) => ({ ...current, [section.key]: {} }));
    setOpenCardKey(null);
  }

  function renderSection(section: MenuSection) {
    if (section.kind === 'burgers' && section.product && section.configurator) {
      const burgerOptions = getConfiguratorGroup(section.configurator, 'burger-choice')?.options ?? [];
      return (
        <div>
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="overflow-hidden rounded-[1.5rem] bg-brand-offwhite">
              <img src={section.product.image} alt={section.product.imageAlt} className="h-44 w-full object-cover" />
            </div>
            <div className="rounded-[1.5rem] border border-brand-green/10 bg-brand-offwhite p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-green/70">Menu +3 €</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">Frites + boisson</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">Chaque burger peut être commandé en version seule, en version menu, ou les deux à la fois.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            {burgerOptions.map((option) => {
              const selection = burgerSelections[option.id] ?? { solo: 0, menu: 0 };
              const menuUpgradeDisabled = option.meta?.menuUpgradeDisabled === true;
              const standaloneLabel =
                typeof option.meta?.standaloneLabel === 'string' ? option.meta.standaloneLabel : 'Seul';
              const availabilityNote = getOptionAvailabilityNote(option);
              const isAvailable = isOptionAvailable(option);
              return (
                <div key={option.id} className="rounded-[1.5rem] border border-brand-green/10 bg-brand-offwhite p-4">
                  <div className={`grid gap-4 xl:items-center ${menuUpgradeDisabled ? 'xl:grid-cols-[1.15fr_180px]' : 'xl:grid-cols-[1.15fr_180px_180px]'}`}>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-xl font-semibold text-slate-950">{option.name}</p>
                        {!isAvailable ? (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                            Indisponible
                          </span>
                        ) : null}
                      </div>
                      {option.description ? <p className="mt-1 text-sm leading-7 text-slate-600">{option.description}</p> : null}
                      {!isAvailable && availabilityNote ? (
                        <p className="mt-2 text-sm leading-6 text-amber-800">{availabilityNote}</p>
                      ) : null}
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-sm font-semibold text-slate-950">{standaloneLabel} {formatPrice(option.price)}</p>
                      <div className="mt-3 flex justify-end">
                        <QuantityControl
                          value={selection.solo}
                          onDecrease={() => isAvailable && updateBurgerSelection(option.id, 'solo', -1)}
                          onIncrease={() => isAvailable && updateBurgerSelection(option.id, 'solo', 1)}
                        />
                      </div>
                    </div>
                    {!menuUpgradeDisabled ? (
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-sm font-semibold text-slate-950">Menu {formatPrice(option.price + 3)}</p>
                        <div className="mt-3 flex justify-end">
                          <QuantityControl
                            value={selection.menu}
                            onDecrease={() => isAvailable && updateBurgerSelection(option.id, 'menu', -1)}
                            onIncrease={() => isAvailable && updateBurgerSelection(option.id, 'menu', 1)}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-brand-green/10 bg-brand-offwhite px-5 py-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-green/70">Sélection burgers</p>
              <p className="mt-1 text-sm text-slate-600">{getBurgerSelectionCount() > 0 ? `${getBurgerSelectionCount()} article${getBurgerSelectionCount() > 1 ? 's' : ''} prêt${getBurgerSelectionCount() > 1 ? 's' : ''} à ajouter` : 'Aucune sélection pour le moment'}</p>
            </div>
            <button
              type="button"
              disabled={getBurgerSelectionCount() === 0}
              onClick={() => addSectionSelection(section)}
              className="rounded-full bg-brand-deepgreen px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Ajouter la sélection au panier
            </button>
          </div>
        </div>
      );
    }

    if (section.kind === 'simple') {
      const sectionCount = getSimpleSelectionCount(section.key);
      return (
        <div>
          <div className="grid gap-3">
            {(section.products ?? []).map((product) => {
              const quantity = simpleSelections[section.key]?.[product.id] ?? 0;
              return (
                <div key={product.id} className="rounded-[1.5rem] border border-brand-green/10 bg-brand-offwhite p-4">
                  <div className="grid gap-4 md:grid-cols-[1fr_180px] md:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-semibold text-slate-950">{product.name}</p>
                        {!product.isAvailable ? (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                            Indisponible
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-7 text-slate-600">{product.description}</p>
                      {!product.isAvailable && product.availabilityNote ? (
                        <p className="mt-2 text-sm leading-6 text-amber-800">{product.availabilityNote}</p>
                      ) : null}
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-sm font-semibold text-slate-950">{formatPrice(product.price, product.priceLabel)}</p>
                      <div className="mt-3 flex justify-end">
                        <QuantityControl
                          value={quantity}
                          onDecrease={() => updateSelection(section.key, product.id, -1)}
                          onIncrease={() => product.isAvailable && updateSelection(section.key, product.id, 1)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-brand-green/10 bg-brand-offwhite px-5 py-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-green/70">Sélection courante</p>
              <p className="mt-1 text-sm text-slate-600">{sectionCount > 0 ? `${sectionCount} article${sectionCount > 1 ? 's' : ''} prêt${sectionCount > 1 ? 's' : ''} à ajouter` : 'Aucune sélection pour le moment'}</p>
            </div>
            <button
              type="button"
              disabled={sectionCount === 0}
              onClick={() => addSectionSelection(section)}
              className="rounded-full bg-brand-deepgreen px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Ajouter la sélection au panier
            </button>
          </div>
        </div>
      );
    }

    if (section.kind === 'options' && section.configurator) {
      const group = section.configurator.choiceGroups[0];
      const sectionCount = getSimpleSelectionCount(section.key);
      return (
        <div>
          <div className="grid gap-3">
            {group.options.map((option: ProductChoiceOption) => {
              const quantity = simpleSelections[section.key]?.[option.id] ?? 0;
              const availabilityNote = getOptionAvailabilityNote(option);
              const isAvailable = isOptionAvailable(option);
              return (
                <div key={option.id} className="rounded-[1.5rem] border border-brand-green/10 bg-brand-offwhite p-4">
                  <div className="grid gap-4 md:grid-cols-[1fr_180px] md:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-semibold text-slate-950">{option.name}</p>
                        {!isAvailable ? (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                            Indisponible
                          </span>
                        ) : null}
                      </div>
                      {option.description ? <p className="mt-1 text-sm leading-7 text-slate-600">{option.description}</p> : null}
                      {!isAvailable && availabilityNote ? (
                        <p className="mt-2 text-sm leading-6 text-amber-800">{availabilityNote}</p>
                      ) : null}
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-sm font-semibold text-slate-950">{formatPrice(option.price)}</p>
                      <div className="mt-3 flex justify-end">
                        <QuantityControl
                          value={quantity}
                          onDecrease={() => isAvailable && updateSelection(section.key, option.id, -1)}
                          onIncrease={() => isAvailable && updateSelection(section.key, option.id, 1)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-brand-green/10 bg-brand-offwhite px-5 py-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-green/70">Sélection courante</p>
              <p className="mt-1 text-sm text-slate-600">{sectionCount > 0 ? `${sectionCount} article${sectionCount > 1 ? 's' : ''} prêt${sectionCount > 1 ? 's' : ''} à ajouter` : 'Aucune sélection pour le moment'}</p>
            </div>
            <button
              type="button"
              disabled={sectionCount === 0}
              onClick={() => addSectionSelection(section)}
              className="rounded-full bg-brand-deepgreen px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Ajouter la sélection au panier
            </button>
          </div>
        </div>
      );
    }

    if (section.kind === 'configurable' && section.product) {
      return (
        <div className="rounded-[1.5rem] border border-brand-green/10 bg-brand-offwhite p-5">
          <div className="grid gap-5 md:grid-cols-[220px_1fr] md:items-center">
            <div className="overflow-hidden rounded-[1.4rem] bg-white">
              <img src={section.product.image} alt={section.product.imageAlt} className="h-44 w-full object-cover" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-950">{section.product.name}</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">{section.product.description}</p>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <span className="text-base font-semibold text-brand-deepgreen">{formatPrice(section.product.price, section.product.priceLabel)}</span>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(section.product ?? null)}
                  className="rounded-full bg-brand-deepgreen px-5 py-3 text-sm font-semibold text-white"
                >
                  Composer la formule
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <>
      <SEO
        title="Menu Le Petit Bougiote Béziers | Burgers, cafés, desserts & boissons"
        description="Découvrez le menu Le Petit Bougiote à Béziers : burgers, accompagnements, boissons, desserts et formules."
        path="/menu"
      />
      <Reveal className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Menu"
          title="Choisissez d’abord votre mode de commande"
          description="Sur place, click & collect ou livraison: le parcours s’adapte ensuite automatiquement à votre commande."
        />

        {!serviceMode ? (
          <div className="mt-8">
            <OrderModeSelector
              title="Avant de voir la carte, choisissez votre parcours"
              description="Le menu peut être utilisé pour une commande sur place, à emporter ou en livraison locale. Le panier et le checkout s’adaptent ensuite automatiquement."
              onChoose={chooseMode}
            />
          </div>
        ) : (
          <>
            <div className="mt-8 rounded-[1.8rem] border border-brand-green/10 bg-white p-6 shadow-[0_18px_45px_-34px_rgba(62,40,26,0.22)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge tone="success">Commande rapide</StatusBadge>
                  <StatusBadge tone="success">Paiement en ligne bientôt</StatusBadge>
                  <StatusBadge>
                    {serviceMode === 'delivery'
                      ? 'Livraison locale'
                      : serviceMode === 'sur_place'
                        ? 'Commande sur place'
                        : 'Click & Collect'}
                  </StatusBadge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user ? (
                    <Link
                      to="/compte/commandes"
                      className="rounded-full border border-brand-green/15 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Mes commandes
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => chooseMode('sur_place')}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${serviceMode === 'sur_place' ? 'bg-brand-deepgreen text-white' : 'bg-brand-cream text-slate-700'}`}
                  >
                    Sur place
                  </button>
                  <button
                    type="button"
                    onClick={() => chooseMode('a_emporter')}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${serviceMode === 'a_emporter' ? 'bg-brand-deepgreen text-white' : 'bg-brand-cream text-slate-700'}`}
                  >
                    Click & Collect
                  </button>
                  <button
                    type="button"
                    onClick={() => chooseMode('delivery')}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${serviceMode === 'delivery' ? 'bg-brand-deepgreen text-white' : 'border border-brand-green/15 bg-white text-slate-700'}`}
                  >
                    Livraison
                  </button>
                </div>
              </div>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">
                Les familles de produits sont regroupées dans des fiches simples: burgers, accompagnements, boissons, douceurs et formules. Vous ouvrez la fiche voulue puis ajoutez votre sélection au panier.
              </p>
              {serviceMode === 'delivery' ? (
                <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                  En livraison, les boissons chaudes sont retirées de la carte pour préserver la qualité du service. Le forfait Béziers de 4,00 € s’ajoute automatiquement au récapitulatif.
                </p>
              ) : null}
            </div>

            <div className="mt-8">
              <SectionHeading
                eyebrow="À découvrir"
                title="Une carte pensée pour aller à l’essentiel"
                description="Burgers, accompagnements, douceurs, boissons et formules sont regroupés pour rendre la commande plus simple et plus claire."
              />
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => setOpenCardKey(card.key)}
                  className="overflow-hidden rounded-[1.8rem] border border-brand-border bg-white text-left shadow-[0_18px_45px_-34px_rgba(62,40,26,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_55px_-34px_rgba(62,40,26,0.42)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-brand-offwhite">
                    {card.image ? <img src={card.image} alt={card.imageAlt ?? card.title} className="h-full w-full object-cover" /> : null}
                    <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(30,30,30,0.72))] p-4">
                      <p className="text-2xl font-semibold text-white">{card.title}</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm leading-7 text-slate-600">{card.description}</p>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-sm font-semibold text-brand-deepgreen">Ouvrir la fiche</span>
                      <span className="rounded-full bg-brand-cream px-4 py-2 text-sm font-semibold text-slate-700">Choisir</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[1.6rem] border border-brand-green/10 bg-white px-5 py-4 shadow-[0_16px_40px_-30px_rgba(62,40,26,0.22)]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-green/70">Panier</p>
                <p className="mt-1 text-sm text-slate-600">{totalItems} article{totalItems > 1 ? 's' : ''} dans le panier</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/panier" className="rounded-full border border-brand-green/15 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
                  Voir le panier
                </Link>
                {user ? (
                  <Link to="/compte/commandes" className="rounded-full border border-brand-green/15 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
                    Mes commandes
                  </Link>
                ) : null}
                <Link to="/checkout" className="rounded-full bg-brand-deepgreen px-5 py-3 text-sm font-semibold text-white">
                  Passer au checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </Reveal>

      {openCard ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 px-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-green/70">Commande</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-950">{openCard.title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{openCard.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenCardKey(null)}
                className="rounded-full border border-brand-green/10 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Fermer
              </button>
            </div>
            <div className="mt-6 grid gap-6">
              {openCard.sectionKeys.map((sectionKey) => {
                const section = sectionByKey.get(sectionKey);
                if (!section) {
                  return null;
                }
                return (
                  <section key={section.key} className="rounded-[1.8rem] border border-brand-green/10 bg-white p-5">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-slate-950">{section.title}</h3>
                      <p className="mt-1 text-sm leading-7 text-slate-600">{section.description}</p>
                    </div>
                    {renderSection(section)}
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <ProductConfiguratorModal
        product={selectedProduct}
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onConfirm={(items) => {
          if (serviceMode === 'delivery') {
            setFulfillmentType('delivery');
            setDiningMode(null);
          } else {
            setFulfillmentType('click_collect');
            setDiningMode(serviceMode ?? 'sur_place');
          }
          items.forEach((item) => addCustomItem(item));
        }}
      />
    </>
  );
}
