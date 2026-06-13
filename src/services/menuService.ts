import { menuCardConfigs, type MenuCardConfig } from '../data/menuCards';
import { categories, productConfiguratorMap, products } from '../data/menu';
import { simulateAsync } from '../lib/dataProvider';
import { supabaseClient } from '../lib/supabaseClient';
import type { Category, Product, ProductChoiceOption, ProductConfigurator } from '../types';

let productStore = [...products];
let configuratorStore = structuredClone(productConfiguratorMap) as Record<string, ProductConfigurator>;
let menuCardStore = [...menuCardConfigs];

const localProductBySlug = new Map(products.map((product) => [product.slug, product]));
const localCategoryBySlug = new Map(categories.map((category) => [category.slug, category]));

function normalizeMenuCard(card: MenuCardConfig): MenuCardConfig {
  return card;
}

function normalizeProduct(product: Product): Product {
  return product;
}

function slugifyOptionName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function inferOptionFamily(optionName: string) {
  const normalized = slugifyOptionName(optionName);
  if (normalized.startsWith('donut')) {
    return 'Donuts';
  }
  if (normalized.startsWith('muffin')) {
    return 'Muffins';
  }
  if (normalized.startsWith('cookie')) {
    return 'Cookies';
  }
  return null;
}

function normalizeConfigurator(configurator: ProductConfigurator): ProductConfigurator {
  const fallbackConfigurator = productConfiguratorMap[configurator.key];

  return {
    ...configurator,
    choiceGroups: configurator.choiceGroups.map((group) => {
      const fallbackGroup =
        fallbackConfigurator?.choiceGroups.find((item) => item.id === group.id) ??
        fallbackConfigurator?.choiceGroups.find((item) => item.sortOrder === group.sortOrder) ??
        fallbackConfigurator?.choiceGroups.find((item) => item.name === group.name);

      return {
        ...group,
        options: group.options.map((option) => {
          const fallbackOption =
            fallbackGroup?.options.find((item) => item.id === option.id) ??
            fallbackGroup?.options.find((item) => item.name === option.name) ??
            fallbackGroup?.options.find((item) => slugifyOptionName(item.name) === slugifyOptionName(option.name));

          const inferredFamily =
            configurator.key === 'gourmandises' ||
            (configurator.key === 'formule-gourmande' && group.name === 'Pâtisserie incluse')
              ? inferOptionFamily(option.name)
              : null;

          return {
            ...option,
            meta: {
              ...(fallbackOption?.meta ?? {}),
              ...(option.meta ?? {}),
              family:
                typeof option.meta?.family === 'string'
                  ? option.meta.family
                  : inferredFamily ?? fallbackOption?.meta?.family ?? null,
            },
          };
        }),
      };
    }),
  };
}

type SupabaseCategoryRow = {
  id: string;
  name: string;
  slug: Category['slug'];
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

type SupabaseProductRow = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  price_label: string | null;
  product_type: Product['productType'] | null;
  configurator_key: string | null;
  is_available: boolean;
  availability_note: string | null;
  is_active: boolean;
  tags: string[] | null;
  sort_order: number;
  category?: Array<{
    slug: Category['slug'];
  }> | {
    slug: Category['slug'];
  } | null;
};

type SupabaseMenuCardRow = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  section_keys: string[];
  sort_order: number;
  is_active: boolean;
};

function mapCategory(row: SupabaseCategoryRow): Category {
  const fallback = localCategoryBySlug.get(row.slug);
  return {
    id: fallback?.id ?? row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? fallback?.description ?? '',
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

function mapProduct(row: SupabaseProductRow): Product {
  const fallback = localProductBySlug.get(row.slug);
  return normalizeProduct({
    id: fallback?.id ?? row.id,
    name: row.name,
    slug: row.slug,
    categoryId: fallback?.categoryId ?? 'cat-burgers',
    description: row.description ?? fallback?.description ?? '',
    price: typeof row.price === 'number' ? row.price : fallback?.price ?? null,
    priceLabel: row.price_label ?? fallback?.priceLabel,
    isAvailable: row.is_available,
    availabilityNote: row.availability_note ?? fallback?.availabilityNote,
    isActive: row.is_active,
    tags: row.tags ?? fallback?.tags ?? [],
    sortOrder: row.sort_order,
    image: fallback?.image ?? products[0].image,
    imageAlt: fallback?.imageAlt ?? row.name,
    imageStatus: fallback?.imageStatus ?? 'placeholder',
    imageFit: fallback?.imageFit,
    productType: row.product_type ?? fallback?.productType ?? 'simple',
    configuratorKey: row.configurator_key ?? fallback?.configuratorKey,
  });
}

function mapMenuCard(row: SupabaseMenuCardRow): MenuCardConfig {
  const fallback = menuCardConfigs.find((card) => card.key === row.key);
  return normalizeMenuCard({
    id: fallback?.id ?? row.id,
    key: row.key,
    title: row.title,
    description: row.description ?? fallback?.description ?? '',
    sectionKeys: (row.section_keys as MenuCardConfig['sectionKeys']) ?? fallback?.sectionKeys ?? [],
    sortOrder: row.sort_order,
    isActive: row.is_active,
  });
}

async function getSupabaseCategories(): Promise<Category[] | null> {
  if (!supabaseClient) {
    return null;
  }

  const { data, error } = await supabaseClient
    .from('categories')
    .select('id, name, slug, description, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !data?.length) {
    return null;
  }

  return (data as SupabaseCategoryRow[]).map(mapCategory);
}

async function getSupabaseProducts(): Promise<Product[] | null> {
  if (!supabaseClient) {
    return null;
  }

  const { data, error } = await supabaseClient
    .from('products')
    .select(`
      id,
      category_id,
      name,
      slug,
      description,
      price,
      price_label,
      product_type,
      configurator_key,
      is_available,
      availability_note,
      is_active,
      tags,
      sort_order,
      category:categories(slug)
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !data?.length) {
    return null;
  }

  return (data as SupabaseProductRow[]).map((row) => {
    const product = mapProduct(row);
    const categorySlug = Array.isArray(row.category) ? row.category[0]?.slug : row.category?.slug;
    if (categorySlug) {
      const fallbackCategory = categories.find((category) => category.slug === categorySlug);
      if (fallbackCategory) {
        product.categoryId = fallbackCategory.id;
      }
    }
    return product;
  });
}

async function getSupabaseMenuCards(): Promise<MenuCardConfig[] | null> {
  if (!supabaseClient) {
    return null;
  }

  const { data, error } = await supabaseClient
    .from('menu_cards')
    .select('id, key, title, description, section_keys, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !data?.length) {
    return null;
  }

  return (data as SupabaseMenuCardRow[]).map(mapMenuCard);
}

async function resolveRemoteCategoryId(localCategoryId: string): Promise<string | null> {
  if (!supabaseClient) {
    return null;
  }

  const localCategory = categories.find((category) => category.id === localCategoryId);
  if (!localCategory) {
    return localCategoryId;
  }

  const { data, error } = await supabaseClient
    .from('categories')
    .select('id')
    .eq('slug', localCategory.slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.id;
}

async function getSupabaseConfigurator(configuratorKey: string): Promise<ProductConfigurator | null> {
  if (!supabaseClient) {
    return null;
  }

  const { data: productRow, error: productError } = await supabaseClient
    .from('products')
    .select('id, slug, name, description, configurator_key')
    .eq('configurator_key', configuratorKey)
    .maybeSingle();

  if (productError || !productRow) {
    return null;
  }

  const { data: groups, error: groupsError } = await supabaseClient
    .from('product_option_groups')
    .select('id, name, helper_text, is_required, sort_order')
    .eq('product_id', productRow.id)
    .order('sort_order', { ascending: true });

  if (groupsError || !groups?.length) {
    return null;
  }

  const groupIds = groups.map((group) => group.id);
  const { data: options, error: optionsError } = await supabaseClient
    .from('product_options')
    .select('id, option_group_id, name, description, price, metadata, is_active, sort_order')
    .in('option_group_id', groupIds)
    .order('sort_order', { ascending: true });

  if (optionsError) {
    return null;
  }

  const fallbackConfigurator = productConfiguratorMap[configuratorKey];
  const fallbackProduct = products.find((item) => item.configuratorKey === configuratorKey);
  const fallbackGroups = fallbackConfigurator?.choiceGroups ?? [];

  return normalizeConfigurator({
    key: configuratorKey,
    productId: fallbackProduct?.id ?? productRow.slug,
    title: productRow.name,
    description: productRow.description ?? fallbackConfigurator?.description ?? '',
    quantityEnabled: true,
    // Keep stable local ids so the ordering UI can target the same groups/options
    // whether data comes from mock data or Supabase.
    choiceGroups: groups.map((group) => {
      const fallbackGroup =
        fallbackGroups.find((item) => item.sortOrder === group.sort_order) ??
        fallbackGroups.find((item) => item.name === group.name);

      return {
        id: fallbackGroup?.id ?? group.id,
        name: group.name,
        helperText: group.helper_text ?? fallbackGroup?.helperText ?? undefined,
        required: group.is_required,
        sortOrder: group.sort_order,
        options: (options ?? [])
          .filter((option) => option.option_group_id === group.id)
          .map((option) => {
            const fallbackOption = fallbackGroup?.options.find((item) => item.name === option.name);

            return {
              id: fallbackOption?.id ?? option.id,
              name: option.name,
              description: option.description ?? fallbackOption?.description ?? undefined,
              price: Number(option.price ?? 0),
              isActive: option.is_active,
              meta: {
                ...(fallbackOption?.meta ?? {}),
                ...((option.metadata as Record<string, string | number | boolean | null> | null) ?? {}),
                remoteOptionId: option.id,
              },
            };
          }),
      };
    }),
  });
}

export const menuService = {
  async getCategories(): Promise<Category[]> {
    const remoteCategories = await getSupabaseCategories();
    if (remoteCategories) {
      return remoteCategories;
    }

    return simulateAsync(
      [...categories].sort((a, b) => a.sortOrder - b.sortOrder),
    );
  },

  async createCategory(category: Category): Promise<Category> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('categories')
        .insert({
          name: category.name,
          slug: category.slug,
          description: category.description,
          sort_order: category.sortOrder,
          is_active: category.isActive,
        })
        .select('id, name, slug, description, sort_order, is_active')
        .maybeSingle();

      if (!error && data) {
        return simulateAsync(mapCategory(data as SupabaseCategoryRow), 120);
      }
    }

    return simulateAsync(category);
  },

  async updateCategory(categoryId: string, updates: Partial<Category>): Promise<Category | undefined> {
    const currentCategory = categories.find((category) => category.id === categoryId);
    if (!currentCategory) {
      return undefined;
    }

    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('categories')
        .update({
          name: updates.name ?? currentCategory.name,
          slug: updates.slug ?? currentCategory.slug,
          description: updates.description ?? currentCategory.description,
          sort_order: updates.sortOrder ?? currentCategory.sortOrder,
          is_active: updates.isActive ?? currentCategory.isActive,
        })
        .eq('slug', currentCategory.slug)
        .select('id, name, slug, description, sort_order, is_active')
        .maybeSingle();

      if (!error && data) {
        return simulateAsync(mapCategory(data as SupabaseCategoryRow), 120);
      }
    }

    return simulateAsync({
      ...currentCategory,
      ...updates,
    });
  },

  async deleteCategory(categoryId: string): Promise<{ ok: boolean; reason?: string }> {
    const currentCategory = categories.find((category) => category.id === categoryId);
    if (!currentCategory) {
      return { ok: false, reason: 'Catégorie introuvable.' };
    }

    if (supabaseClient) {
      const remoteCategoryId = await resolveRemoteCategoryId(categoryId);
      if (!remoteCategoryId) {
        return { ok: false, reason: 'Catégorie distante introuvable.' };
      }

      const { count, error: countError } = await supabaseClient
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', remoteCategoryId)
        .eq('is_active', true);

      if (countError) {
        return { ok: false, reason: countError.message };
      }

      if ((count ?? 0) > 0) {
        return { ok: false, reason: 'Retirez ou déplacez d’abord les produits de cette catégorie.' };
      }

      const { error } = await supabaseClient
        .from('categories')
        .delete()
        .eq('id', remoteCategoryId);

      if (!error) {
        return { ok: true };
      }

      return { ok: false, reason: error.message };
    }

    return { ok: true };
  },

  async getProducts(): Promise<Product[]> {
    const remoteProducts = await getSupabaseProducts();
    if (remoteProducts) {
      productStore = remoteProducts;
      return remoteProducts;
    }

    return simulateAsync(
      [...productStore].map(normalizeProduct).sort((a, b) => a.sortOrder - b.sortOrder),
    );
  },

  async getMenuCards(): Promise<MenuCardConfig[]> {
    const remoteMenuCards = await getSupabaseMenuCards();
    if (remoteMenuCards) {
      menuCardStore = remoteMenuCards;
      return remoteMenuCards;
    }

    return simulateAsync(
      [...menuCardStore].map(normalizeMenuCard).filter((card) => card.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    );
  },

  async createMenuCard(card: MenuCardConfig): Promise<MenuCardConfig> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('menu_cards')
        .insert({
          key: card.key,
          title: card.title,
          description: card.description,
          section_keys: card.sectionKeys,
          sort_order: card.sortOrder,
          is_active: card.isActive,
        })
        .select('id, key, title, description, section_keys, sort_order, is_active')
        .maybeSingle();

      if (!error && data) {
        const mapped = mapMenuCard(data as SupabaseMenuCardRow);
        menuCardStore = [...menuCardStore, mapped].sort((a, b) => a.sortOrder - b.sortOrder);
        return simulateAsync(mapped, 120);
      }
    }

    menuCardStore = [...menuCardStore, card].sort((a, b) => a.sortOrder - b.sortOrder);
    return simulateAsync(card);
  },

  async updateMenuCard(cardId: string, updates: Partial<MenuCardConfig>): Promise<MenuCardConfig | undefined> {
    const currentCard = menuCardStore.find((card) => card.id === cardId) ?? menuCardConfigs.find((card) => card.id === cardId);
    if (!currentCard) {
      return undefined;
    }

    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('menu_cards')
        .update({
          key: updates.key ?? currentCard.key,
          title: updates.title ?? currentCard.title,
          description: updates.description ?? currentCard.description,
          section_keys: updates.sectionKeys ?? currentCard.sectionKeys,
          sort_order: updates.sortOrder ?? currentCard.sortOrder,
          is_active: updates.isActive ?? currentCard.isActive,
        })
        .eq('key', currentCard.key)
        .select('id, key, title, description, section_keys, sort_order, is_active')
        .maybeSingle();

      if (!error && data) {
        const mapped = mapMenuCard(data as SupabaseMenuCardRow);
        menuCardStore = menuCardStore
          .map((card) => (card.id === cardId ? mapped : card))
          .sort((a, b) => a.sortOrder - b.sortOrder);
        return simulateAsync(mapped, 120);
      }
    }

    const next = { ...currentCard, ...updates };
    menuCardStore = menuCardStore
      .map((card) => (card.id === cardId ? next : card))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return simulateAsync(next);
  },

  async deleteMenuCard(cardId: string): Promise<boolean> {
    const currentCard = menuCardStore.find((card) => card.id === cardId) ?? menuCardConfigs.find((card) => card.id === cardId);
    if (!currentCard) {
      return false;
    }

    if (supabaseClient) {
      const { error } = await supabaseClient
        .from('menu_cards')
        .delete()
        .eq('key', currentCard.key);

      if (!error) {
        menuCardStore = menuCardStore.filter((card) => card.id !== cardId);
        return simulateAsync(true, 120);
      }
    }

    menuCardStore = menuCardStore.filter((card) => card.id !== cardId);
    return simulateAsync(true);
  },

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const allProducts = await this.getProducts();
    return allProducts
      .filter((product) => product.categoryId === categoryId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async getProductById(productId: string): Promise<Product | undefined> {
    const allProducts = await this.getProducts();
    return allProducts.find((product) => product.id === productId);
  },

  async getProductConfigurator(configuratorKey: string): Promise<ProductConfigurator | undefined> {
    const remoteConfigurator = await getSupabaseConfigurator(configuratorKey);
    if (remoteConfigurator) {
      configuratorStore = {
        ...configuratorStore,
        [configuratorKey]: remoteConfigurator,
      };
      return remoteConfigurator;
    }

    const localConfigurator = configuratorStore[configuratorKey];
    return simulateAsync(localConfigurator ? normalizeConfigurator(localConfigurator) : undefined);
  },

  async createProduct(product: Product): Promise<Product> {
    if (supabaseClient) {
      const remoteCategoryId = await resolveRemoteCategoryId(product.categoryId);
      if (remoteCategoryId) {
        const { data, error } = await supabaseClient
          .from('products')
          .insert({
            category_id: remoteCategoryId,
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: product.price,
            price_label: product.priceLabel ?? null,
            product_type: product.productType ?? 'simple',
            configurator_key: product.configuratorKey ?? null,
            is_available: product.isAvailable,
            availability_note: product.availabilityNote ?? null,
            is_active: product.isActive,
            tags: product.tags,
            sort_order: product.sortOrder,
          })
          .select(`
            id,
            category_id,
            name,
            slug,
            description,
            price,
            price_label,
            product_type,
            configurator_key,
            is_available,
            availability_note,
            is_active,
            tags,
            sort_order,
            category:categories(slug)
          `)
          .maybeSingle();

        if (!error && data) {
          const createdRow = data as SupabaseProductRow;
          const mapped = mapProduct(createdRow);
          const categoryRelation = createdRow.category;
          const categorySlug = Array.isArray(categoryRelation)
            ? categoryRelation[0]?.slug
            : categoryRelation?.slug;
          if (categorySlug) {
            const fallbackCategory = categories.find((category) => category.slug === categorySlug);
            if (fallbackCategory) {
              mapped.categoryId = fallbackCategory.id;
            }
          }
          productStore = [mapped, ...productStore];
          return simulateAsync(mapped, 120);
        }
      }
    }

    productStore = [product, ...productStore];
    return simulateAsync(product);
  },

  async updateProduct(productId: string, updates: Partial<Product>): Promise<Product | undefined> {
    if (supabaseClient) {
      const currentProduct = productStore.find((product) => product.id === productId) ?? products.find((product) => product.id === productId);
      if (currentProduct) {
        const nextCategoryId = updates.categoryId ?? currentProduct.categoryId;
        const remoteCategoryId = await resolveRemoteCategoryId(nextCategoryId);
        const { data, error } = await supabaseClient
          .from('products')
          .update({
            category_id: remoteCategoryId,
            name: updates.name ?? currentProduct.name,
            slug: updates.slug ?? currentProduct.slug,
            description: updates.description ?? currentProduct.description,
            price: updates.price ?? currentProduct.price,
            price_label: updates.priceLabel ?? currentProduct.priceLabel ?? null,
            product_type: updates.productType ?? currentProduct.productType ?? 'simple',
            configurator_key: updates.configuratorKey ?? currentProduct.configuratorKey ?? null,
            is_available: updates.isAvailable ?? currentProduct.isAvailable,
            availability_note: updates.availabilityNote ?? currentProduct.availabilityNote ?? null,
            is_active: updates.isActive ?? currentProduct.isActive,
            tags: updates.tags ?? currentProduct.tags,
            sort_order: updates.sortOrder ?? currentProduct.sortOrder,
          })
          .eq('slug', currentProduct.slug)
          .select(`
            id,
            category_id,
            name,
            slug,
            description,
            price,
            price_label,
            product_type,
            configurator_key,
            is_available,
            availability_note,
            is_active,
            tags,
            sort_order,
            category:categories(slug)
          `)
          .maybeSingle();

        if (!error && data) {
          const updatedRow = data as SupabaseProductRow;
          const mapped = mapProduct(updatedRow);
          const categoryRelation = updatedRow.category;
          const categorySlug = Array.isArray(categoryRelation)
            ? categoryRelation[0]?.slug
            : categoryRelation?.slug;
          if (categorySlug) {
            const fallbackCategory = categories.find((category) => category.slug === categorySlug);
            if (fallbackCategory) {
              mapped.categoryId = fallbackCategory.id;
            }
          }
          productStore = productStore.map((product) => (product.id === productId ? mapped : product));
          return simulateAsync(mapped, 120);
        }
      }
    }

    productStore = productStore.map((product) =>
      product.id === productId ? { ...product, ...updates } : product,
    );
    return simulateAsync(productStore.find((product) => product.id === productId));
  },

  async deleteProduct(productId: string): Promise<boolean> {
    if (supabaseClient) {
      const currentProduct = productStore.find((product) => product.id === productId) ?? products.find((product) => product.id === productId);
      if (currentProduct) {
        const { error } = await supabaseClient
          .from('products')
          .delete()
          .eq('slug', currentProduct.slug);

        if (!error) {
          productStore = productStore.filter((product) => product.id !== productId);
          return simulateAsync(true, 120);
        }
      }
    }

    productStore = productStore.filter((product) => product.id !== productId);
    return simulateAsync(true);
  },

  async updateProductAvailability(productId: string, isAvailable: boolean, availabilityNote?: string): Promise<Product | undefined> {
    return this.updateProduct(productId, { isAvailable, availabilityNote });
  },

  async updateProductSortOrder(productId: string, sortOrder: number): Promise<Product | undefined> {
    return this.updateProduct(productId, { sortOrder });
  },

  async updateProductChoiceAvailability(
    configuratorKey: string,
    optionId: string,
    isActive: boolean,
    availabilityNote?: string,
  ): Promise<ProductConfigurator | undefined> {
    const currentConfigurator =
      (await getSupabaseConfigurator(configuratorKey)) ??
      configuratorStore[configuratorKey];

    if (!currentConfigurator) {
      return undefined;
    }

    const nextGroups = currentConfigurator.choiceGroups.map((group) => ({
      ...group,
      options: group.options.map((option) => {
        if (option.id !== optionId) {
          return option;
        }

        return {
          ...option,
          isActive,
          meta: {
            ...(option.meta ?? {}),
            availabilityNote: isActive ? null : availabilityNote ?? null,
          },
        };
      }),
    }));

    const updatedConfigurator: ProductConfigurator = {
      ...currentConfigurator,
      choiceGroups: nextGroups,
    };

    const remoteOptionId = nextGroups
      .flatMap((group) => group.options)
      .find((option) => option.id === optionId)?.meta?.remoteOptionId;

    if (supabaseClient && typeof remoteOptionId === 'string') {
      const option = nextGroups.flatMap((group) => group.options).find((item) => item.id === optionId);
      const metadata = { ...(option?.meta ?? {}) };
      delete metadata.remoteOptionId;

      const { error } = await supabaseClient
        .from('product_options')
        .update({
          is_active: isActive,
          metadata: metadata,
        })
        .eq('id', remoteOptionId);

      if (error) {
        return undefined;
      }
    }

    configuratorStore = {
      ...configuratorStore,
      [configuratorKey]: updatedConfigurator,
    };

    return simulateAsync(updatedConfigurator, 120);
  },

  async updateProductChoice(
    configuratorKey: string,
    optionId: string,
    updates: Partial<ProductChoiceOption>,
  ): Promise<ProductConfigurator | undefined> {
    const currentConfigurator =
      (await getSupabaseConfigurator(configuratorKey)) ??
      configuratorStore[configuratorKey];

    if (!currentConfigurator) {
      return undefined;
    }

    let remoteOptionId: string | undefined;
    let nextMetadata: Record<string, string | number | boolean | null> | undefined;

    const nextGroups = currentConfigurator.choiceGroups.map((group) => ({
      ...group,
      options: group.options.map((option) => {
        if (option.id !== optionId) {
          return option;
        }

        remoteOptionId =
          typeof option.meta?.remoteOptionId === 'string' ? option.meta.remoteOptionId : undefined;

        nextMetadata = {
          ...(option.meta ?? {}),
          ...(updates.meta ?? {}),
        };
        delete nextMetadata.remoteOptionId;

        return {
          ...option,
          ...updates,
          meta: {
            ...(nextMetadata ?? {}),
            ...(remoteOptionId ? { remoteOptionId } : {}),
          },
        };
      }),
    }));

    const updatedConfigurator: ProductConfigurator = {
      ...currentConfigurator,
      choiceGroups: nextGroups,
    };

    if (supabaseClient && remoteOptionId) {
      const updatedOption = nextGroups.flatMap((group) => group.options).find((option) => option.id === optionId);
      const { error } = await supabaseClient
        .from('product_options')
        .update({
          name: updatedOption?.name,
          description: updatedOption?.description ?? null,
          price: updatedOption?.price ?? 0,
          metadata: nextMetadata ?? {},
          is_active: updatedOption?.isActive ?? true,
        })
        .eq('id', remoteOptionId);

      if (error) {
        return undefined;
      }
    }

    configuratorStore = {
      ...configuratorStore,
      [configuratorKey]: updatedConfigurator,
    };

    return simulateAsync(updatedConfigurator, 120);
  },

  async updateProductChoiceSortOrder(
    configuratorKey: string,
    optionId: string,
    sortOrder: number,
  ): Promise<ProductConfigurator | undefined> {
    const currentConfigurator =
      (await getSupabaseConfigurator(configuratorKey)) ??
      configuratorStore[configuratorKey];

    if (!currentConfigurator) {
      return undefined;
    }

    const optionToMove = currentConfigurator.choiceGroups
      .flatMap((group) => group.options)
      .find((option) => option.id === optionId);
    const remoteOptionId =
      typeof optionToMove?.meta?.remoteOptionId === 'string' ? optionToMove.meta.remoteOptionId : undefined;

    if (supabaseClient && remoteOptionId) {
      const { error } = await supabaseClient
        .from('product_options')
        .update({ sort_order: sortOrder })
        .eq('id', remoteOptionId);

      if (error) {
        return undefined;
      }
    }

    const nextConfigurator: ProductConfigurator = {
      ...currentConfigurator,
      choiceGroups: currentConfigurator.choiceGroups.map((group) => ({
        ...group,
        options: group.options.map((option) =>
          option.id === optionId
            ? {
                ...option,
                meta: {
                  ...(option.meta ?? {}),
                  sortOrder,
                },
              }
            : option,
        ),
      })),
    };

    configuratorStore = {
      ...configuratorStore,
      [configuratorKey]: nextConfigurator,
    };

    return simulateAsync(nextConfigurator, 120);
  },
};
