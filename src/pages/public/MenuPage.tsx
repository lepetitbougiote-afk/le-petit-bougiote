import { Minus, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { type OrderModeChoice } from '../../components/public/OrderModeSelector';
import { ProductConfiguratorModal } from '../../components/public/ProductConfiguratorModal';
import { SEO } from '../../components/seo/SEO';
import { Reveal } from '../../components/ui/Reveal';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useCart } from '../../contexts/CartContext';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { menuCardConfigs, type MenuCardConfig } from '../../data/menuCards';
import { productConfiguratorMap, products as localProducts } from '../../data/menu';
import { formatPrice } from '../../lib/utils';
import { menuService } from '../../services/menuService';
import type { CartItem, Product, ProductChoiceOption, ProductConfigurator } from '../../types';
import { menuSchema, restaurantSchema, webPageSchema } from '../../lib/schema';

type MenuServiceMode = OrderModeChoice | null;
type QuantityMap = Record<string, number>;
type BurgerSelectionMap = Record<string, { solo: number; menu: number }>;
type ConfigurableSelectionMap = Record<string, number>;

type MenuSectionKey =
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
  key: string;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  sectionKeys: MenuCardConfig['sectionKeys'];
  hidden?: boolean;
};

type OptionDisplayGroup = {
  id: string;
  title: string;
  options: ProductChoiceOption[];
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
  disabled = false,
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-brand-green/10 bg-white px-2 py-1">
      <button type="button" disabled={disabled} onClick={onDecrease} className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-green/10 text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300">
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-6 text-center text-sm font-semibold text-slate-950">{value}</span>
      <button type="button" disabled={disabled} onClick={onIncrease} className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-green/10 text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300">
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

function getSimpleProducts(products: Product[], categoryId: string) {
  return products
    .filter((product) => product.categoryId === categoryId && (product.productType ?? 'simple') === 'simple')
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function hasSectionTag(product: Product, sectionTag: string) {
  return product.tags.includes(sectionTag);
}

function getOptionDisplayGroups(options: ProductChoiceOption[]) {
  return options.reduce<OptionDisplayGroup[]>((groups, option) => {
    const family = typeof option.meta?.family === 'string' ? option.meta.family : null;
    if (!family) {
      groups.push({ id: option.id, title: option.name, options: [option] });
      return groups;
    }

    const existingGroup = groups.find((group) => group.id === family);
    if (existingGroup) {
      existingGroup.options.push(option);
      return groups;
    }

    groups.push({ id: family, title: family, options: [option] });
    return groups;
  }, []);
}

export default function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>(localProducts);
  const [configurators, setConfigurators] = useState<Record<string, ProductConfigurator>>(productConfiguratorMap);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [menuCards, setMenuCards] = useState<MenuCardConfig[]>(menuCardConfigs);
  const [serviceMode, setServiceMode] = useState<MenuServiceMode>(() => getModeFromSearchParam(searchParams.get('service')));
  const [openCardKey, setOpenCardKey] = useState<MenuCard['key'] | null>(null);
  const [simpleSelections, setSimpleSelections] = useState<Record<string, QuantityMap>>({});
  const [burgerSelections, setBurgerSelections] = useState<BurgerSelectionMap>({});
  const [configurableSelections, setConfigurableSelections] = useState<ConfigurableSelectionMap>({});
  const [selectedProductInitialQuantity, setSelectedProductInitialQuantity] = useState(1);
  const { addCustomItem, setFulfillmentType, setDiningMode, totalItems } = useCart();
  const { settings, orderingDisabledMessage } = useRestaurant();
  const orderingDisabled = !settings.orderingEnabled;

  useEffect(() => {
    void menuService.getProducts().then(setProducts);
    void menuService.getMenuCards().then(setMenuCards);
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
    const accompagnementsProducts = getSimpleProducts(products, 'cat-accompagnements');
    const petitDejeunerProducts = getSimpleProducts(products, 'cat-petit-dejeuner-formules');
    const boissonsBoissonsSimples = getSimpleProducts(products, 'cat-boissons');
    const boissonsChaudesSimplesProducts = boissonsBoissonsSimples.filter((product) =>
      hasSectionTag(product, 'section-boissons-chaudes'),
    );
    const boissonsFroidesProducts = boissonsBoissonsSimples.filter((product) =>
      !hasSectionTag(product, 'section-boissons-chaudes'),
    );

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
        products: accompagnementsProducts,
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
        products: petitDejeunerProducts,
      },
      {
        key: 'cafes-classiques',
        title: 'Cafés classiques',
        description: 'Les boissons chaudes classiques à commander en quelques gestes.',
        kind: 'options',
        product: cafesProduct,
        configurator: configurators['cafes-classiques'],
      },
      {
        key: 'boissons-chaudes-simples',
        title: 'Boissons chaudes',
        description: 'Les boissons chaudes simples à ajouter rapidement.',
        kind: 'simple',
        products: boissonsChaudesSimplesProducts,
      },
      {
        key: 'boissons-gourmandes',
        title: 'Boissons gourmandes',
        description: 'Les boissons chaudes gourmandes de la carte.',
        kind: 'options',
        product: gourmetProduct,
        configurator: configurators['boissons-gourmandes'],
      },
      {
        key: 'boissons-froides',
        title: 'Boissons soft',
        description: 'Les boissons fraîches et softs à ajouter simplement à la commande.',
        kind: 'simple',
        products: boissonsFroidesProducts,
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
        product: formuleProduct,
      },
    ].filter((section) => {
      if (section.kind === 'simple') {
        return Boolean(section.products?.length);
      }
      return Boolean(section.product);
    });
  }, [configurators, productById]);

  const sectionByKey = useMemo(
    () => new Map(sections.map((section) => [section.key, section])),
    [sections],
  );

  const cards = useMemo<MenuCard[]>(() => {
    const burgerSection = sectionByKey.get('burgers');
    const accompagnementsSection = sectionByKey.get('accompagnements');
    const boissonsChaudesImageSource =
      sectionByKey.get('cafes-classiques')?.product ??
      sectionByKey.get('boissons-gourmandes')?.product;
    const boissonsFroidesImageSource =
      sectionByKey.get('smoothies')?.product ??
      sectionByKey.get('boissons-froides')?.products?.[0];
    const dessertsImageSource =
      sectionByKey.get('desserts')?.product ?? sectionByKey.get('gourmandises')?.product;
    const imageSourceByCardKey: Record<string, { image?: string; imageAlt?: string }> = {
      burgers: {
        image: burgerSection?.product?.image,
        imageAlt: burgerSection?.product?.imageAlt,
      },
      accompagnements: {
        image: accompagnementsSection?.products?.[0]?.image,
        imageAlt: accompagnementsSection?.products?.[0]?.imageAlt,
      },
      'boissons-froides': {
        image: boissonsFroidesImageSource?.image,
        imageAlt: boissonsFroidesImageSource?.imageAlt,
      },
      'boissons-chaudes': {
        image: boissonsChaudesImageSource?.image,
        imageAlt: boissonsChaudesImageSource?.imageAlt,
      },
      douceurs: {
        image: dessertsImageSource?.image,
        imageAlt: dessertsImageSource?.imageAlt,
      },
    };

    return menuCards
      .map((card) => ({
        key: card.key,
        title: card.title,
        description: card.description,
        sectionKeys: card.sectionKeys,
        image: imageSourceByCardKey[card.key]?.image,
        imageAlt: imageSourceByCardKey[card.key]?.imageAlt,
        hidden: !card.sectionKeys.some((sectionKey) => sectionByKey.has(sectionKey)),
      }))
      .filter((card) => !card.hidden);
  }, [menuCards, sectionByKey]);

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

  function updateConfigurableSelection(productId: string, delta: number) {
    setConfigurableSelections((current) => ({
      ...current,
      [productId]: Math.max(0, (current[productId] ?? 0) + delta),
    }));
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
    if (orderingDisabled) {
      return;
    }

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
              const badgeLabel = typeof option.meta?.badge === 'string' ? option.meta.badge : '';
              const availabilityNote = getOptionAvailabilityNote(option);
              const isAvailable = isOptionAvailable(option);
              return (
                <div key={option.id} className="rounded-[1.5rem] border border-brand-green/10 bg-brand-offwhite p-4">
                  <div className={`grid gap-4 xl:items-center ${menuUpgradeDisabled ? 'xl:grid-cols-[1.15fr_180px]' : 'xl:grid-cols-[1.15fr_180px_180px]'}`}>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-xl font-semibold text-slate-950">{option.name}</p>
                        {badgeLabel ? (
                          <span className="rounded-full bg-brand-green/10 px-3 py-1 text-xs font-semibold text-brand-deepgreen">
                            {badgeLabel}
                          </span>
                        ) : null}
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
                            disabled={!isAvailable || orderingDisabled}
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
                            disabled={!isAvailable || orderingDisabled}
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
              disabled={getBurgerSelectionCount() === 0 || orderingDisabled}
              onClick={() => addSectionSelection(section)}
              className="rounded-full bg-brand-deepgreen px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {orderingDisabled ? 'Commandes indisponibles' : 'Ajouter la sélection au panier'}
            </button>
          </div>
        </div>
      );
    }

    if (section.kind === 'simple') {
      const formuleGourmandeProduct =
        section.key === 'petit-dejeuner' ? sectionByKey.get('formule-gourmande')?.product : null;
      const formuleGourmandeQuantity = formuleGourmandeProduct
        ? configurableSelections[formuleGourmandeProduct.id] ?? 0
        : 0;

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
                          disabled={!product.isAvailable || orderingDisabled}
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
            {formuleGourmandeProduct ? (
              <div className="rounded-[1.5rem] border border-brand-green/10 bg-brand-offwhite p-4">
                <div className="grid gap-4 md:grid-cols-[1fr_230px] md:items-center">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">{formuleGourmandeProduct.name}</p>
                    <p className="mt-1 text-sm leading-7 text-slate-600">{formuleGourmandeProduct.description}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-sm font-semibold text-slate-950">{formatPrice(formuleGourmandeProduct.price, formuleGourmandeProduct.priceLabel)}</p>
                    <div className="mt-3 flex justify-end">
                      <QuantityControl
                        disabled={orderingDisabled}
                        value={formuleGourmandeQuantity}
                        onDecrease={() => updateConfigurableSelection(formuleGourmandeProduct.id, -1)}
                        onIncrease={() => updateConfigurableSelection(formuleGourmandeProduct.id, 1)}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={orderingDisabled}
                      onClick={() => {
                        setSelectedProduct(formuleGourmandeProduct);
                        setSelectedProductInitialQuantity(formuleGourmandeQuantity > 0 ? formuleGourmandeQuantity : 1);
                      }}
                      className="mt-3 w-full rounded-full bg-brand-deepgreen px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {orderingDisabled ? 'Commandes indisponibles' : 'Composer la formule'}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-brand-green/10 bg-brand-offwhite px-5 py-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-green/70">Sélection courante</p>
              <p className="mt-1 text-sm text-slate-600">
                {sectionCount > 0
                  ? `${sectionCount} article${sectionCount > 1 ? 's' : ''} prêt${sectionCount > 1 ? 's' : ''} à ajouter`
                  : 'Aucune sélection pour le moment'}
              </p>
            </div>
            <button
              type="button"
              disabled={sectionCount === 0 || orderingDisabled}
              onClick={() => addSectionSelection(section)}
              className="rounded-full bg-brand-deepgreen px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {orderingDisabled ? 'Commandes indisponibles' : 'Ajouter la sélection au panier'}
            </button>
          </div>
        </div>
      );
    }

    if (section.kind === 'options' && section.configurator) {
      const group = section.configurator.choiceGroups[0];
      const displayGroups = getOptionDisplayGroups(group.options);
      const sectionCount = getSimpleSelectionCount(section.key);
      return (
        <div>
          <div className="grid gap-3">
            {displayGroups.map((displayGroup) => {
              const multiFlavor = displayGroup.options.length > 1;
              return (
                <div key={displayGroup.id} className="rounded-[1.5rem] border border-brand-green/10 bg-brand-offwhite p-4">
                  <div className={`grid gap-4 ${multiFlavor ? 'md:grid-cols-[1fr_180px_180px]' : 'md:grid-cols-[1fr_180px]'} md:items-center`}>
                    <div>
                      <p className="text-lg font-semibold text-slate-950">{displayGroup.title}</p>
                      {displayGroup.options.map((option) => {
                        const isAvailable = isOptionAvailable(option);
                        const availabilityNote = getOptionAvailabilityNote(option);
                        return (
                          <div key={option.id} className="mt-2 first:mt-1">
                            {multiFlavor ? <p className="text-sm text-slate-600">{option.name}</p> : null}
                            {option.description ? <p className="text-sm leading-7 text-slate-600">{option.description}</p> : null}
                            {!isAvailable ? (
                              <span className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                Indisponible
                              </span>
                            ) : null}
                            {!isAvailable && availabilityNote ? (
                              <p className="mt-2 text-sm leading-6 text-amber-800">{availabilityNote}</p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                    {displayGroup.options.map((option) => {
                      const quantity = simpleSelections[section.key]?.[option.id] ?? 0;
                      const isAvailable = isOptionAvailable(option);
                      return (
                        <div key={option.id} className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-sm font-semibold text-slate-950">
                            {multiFlavor ? `${option.name} ${formatPrice(option.price)}` : formatPrice(option.price)}
                          </p>
                          <div className="mt-3 flex justify-end">
                            <QuantityControl
                              disabled={!isAvailable || orderingDisabled}
                              value={quantity}
                              onDecrease={() => isAvailable && updateSelection(section.key, option.id, -1)}
                              onIncrease={() => isAvailable && updateSelection(section.key, option.id, 1)}
                            />
                          </div>
                        </div>
                      );
                    })}
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
              disabled={sectionCount === 0 || orderingDisabled}
              onClick={() => addSectionSelection(section)}
              className="rounded-full bg-brand-deepgreen px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {orderingDisabled ? 'Commandes indisponibles' : 'Ajouter la sélection au panier'}
            </button>
          </div>
        </div>
      );
    }

    if (section.kind === 'configurable' && section.product) {
      return (
        <div className="rounded-[1.5rem] border border-brand-green/10 bg-brand-offwhite p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-lg font-semibold text-slate-950">{section.product.name}</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">{section.product.description}</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">La quantité se choisit dans la fiche, pour pouvoir en ajouter plusieurs si besoin.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-base font-semibold text-brand-deepgreen">{formatPrice(section.product.price, section.product.priceLabel)}</span>
              <button
                type="button"
                disabled={orderingDisabled}
                onClick={() => setSelectedProduct(section.product ?? null)}
                className="rounded-full bg-brand-deepgreen px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {orderingDisabled ? 'Commandes indisponibles' : 'Composer la formule'}
              </button>
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
        title="Menu à Béziers : burgers, cafés et desserts"
        description="Consultez la carte du Petit Bougiote à Béziers : burgers faits maison, cafés, desserts et boissons. Disponibilités à confirmer sur place."
        path="/menu"
        schemas={[
          restaurantSchema(),
          menuSchema(),
          webPageSchema('/menu', 'Menu à Béziers : burgers, cafés et desserts', 'Carte du Petit Bougiote à Béziers.'),
        ]}
      />
      <Reveal className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          level={1}
          eyebrow="Menu"
          title="Consultez librement la carte"
          description="Préparez votre panier d’abord, puis choisissez à la fin entre sur place, à emporter ou livraison."
        />
        <div className="mt-8 rounded-[1.8rem] border border-brand-green/10 bg-white p-6 shadow-[0_18px_45px_-34px_rgba(62,40,26,0.22)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="success">Carte publique</StatusBadge>
              <StatusBadge tone="success">Paiement en ligne</StatusBadge>
              <StatusBadge>
                {serviceMode === 'delivery'
                  ? 'Mode aperçu: livraison'
                  : serviceMode === 'a_emporter'
                    ? 'Mode aperçu: à emporter'
                    : serviceMode === 'sur_place'
                      ? 'Mode aperçu: sur place'
                      : 'Choix du mode à la fin'}
              </StatusBadge>
            </div>
            <div className="flex flex-wrap gap-2">
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
                À emporter
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
            Les familles de produits sont regroupées dans des fiches simples: burgers, accompagnements, boissons fraîches, boissons chaudes, desserts et gourmandises.
          </p>
          <p className="mt-3 max-w-4xl text-sm font-medium leading-7 text-slate-700">
            Carte disponible sur place — appelez le restaurant pour confirmer les disponibilités du jour.
          </p>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
            Note livraison: les boissons chaudes, les petits-déjeuners et les formules chaudes ne sont pas disponibles en livraison. Si vous choisissez la livraison à la fin, ces articles seront retirés automatiquement du panier avec un message d’information.
          </p>
          {orderingDisabled ? (
            <div className="mt-5 rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-900">
              <p className="font-semibold text-amber-950">Commandes en ligne temporairement indisponibles</p>
              <p className="mt-2">{orderingDisabledMessage}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-8">
          <SectionHeading
            eyebrow="À découvrir"
            title="Une carte pensée pour aller à l’essentiel"
            description="Burgers, accompagnements, douceurs, boissons fraîches et boissons chaudes sont regroupés pour rendre la commande plus simple et plus claire."
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
            <Link to="/panier" className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white">
              Voir le panier
            </Link>
            {orderingDisabled ? (
              <span className="rounded-full bg-slate-300 px-5 py-3 text-sm font-semibold text-slate-600">
                Commandes indisponibles
              </span>
            ) : (
              <Link to="/checkout" className="rounded-full bg-brand-deepgreen px-5 py-3 text-sm font-semibold text-white">
                Passer au paiement
              </Link>
            )}
          </div>
        </div>
      </Reveal>

      {openCard ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 px-4">
          <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setOpenCardKey(null)}
              className="sticky top-0 z-20 ml-auto flex h-11 w-11 items-center justify-center rounded-full border border-brand-green/10 bg-white text-slate-700 shadow-sm"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-green/70">Commande</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-950">{openCard.title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{openCard.description}</p>
              </div>
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
        initialQuantity={selectedProductInitialQuantity}
        onClose={() => setSelectedProduct(null)}
        onConfirm={(items) => {
          if (orderingDisabled) {
            return;
          }
          if (serviceMode === 'delivery') {
            setFulfillmentType('delivery');
            setDiningMode(null);
          } else {
            setFulfillmentType('click_collect');
            setDiningMode(serviceMode ?? 'sur_place');
          }
          items.forEach((item) => addCustomItem(item));
          if (selectedProduct?.id) {
            setConfigurableSelections((current) => ({ ...current, [selectedProduct.id]: 0 }));
          }
        }}
        orderingDisabled={orderingDisabled}
      />
    </>
  );
}
