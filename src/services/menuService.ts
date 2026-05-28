import { categories, productConfiguratorMap, products } from '../data/menu';
import { simulateAsync } from '../lib/dataProvider';
import { supabaseClient } from '../lib/supabaseClient';
import type { Category, Product, ProductConfigurator } from '../types';

let productStore = [...products];
let configuratorStore = structuredClone(productConfiguratorMap) as Record<string, ProductConfigurator>;

const localProductBySlug = new Map(products.map((product) => [product.slug, product]));
const localCategoryBySlug = new Map(categories.map((category) => [category.slug, category]));

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
  return {
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
  };
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

  return {
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
  };
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

  async getProducts(): Promise<Product[]> {
    const remoteProducts = await getSupabaseProducts();
    if (remoteProducts) {
      return remoteProducts;
    }

    return simulateAsync(
      [...productStore].sort((a, b) => a.sortOrder - b.sortOrder),
    );
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
      return remoteConfigurator;
    }

    return simulateAsync(configuratorStore[configuratorKey]);
  },

  async createProduct(product: Product): Promise<Product> {
    // TODO: Replace with Supabase insert.
    productStore = [product, ...productStore];
    return simulateAsync(product);
  },

  async updateProduct(productId: string, updates: Partial<Product>): Promise<Product | undefined> {
    if (supabaseClient) {
      const currentProduct = productStore.find((product) => product.id === productId) ?? products.find((product) => product.id === productId);
      if (currentProduct) {
        const { data, error } = await supabaseClient
          .from('products')
          .update({
            description: updates.description ?? currentProduct.description,
            price: updates.price ?? currentProduct.price,
            price_label: updates.priceLabel ?? currentProduct.priceLabel ?? null,
            is_available: updates.isAvailable ?? currentProduct.isAvailable,
            availability_note: updates.availabilityNote ?? currentProduct.availabilityNote ?? null,
            is_active: updates.isActive ?? currentProduct.isActive,
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
    // TODO: Replace with Supabase delete.
    productStore = productStore.filter((product) => product.id !== productId);
    return simulateAsync(true);
  },

  async updateProductAvailability(productId: string, isAvailable: boolean, availabilityNote?: string): Promise<Product | undefined> {
    return this.updateProduct(productId, { isAvailable, availabilityNote });
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
};
