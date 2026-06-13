import { FormEvent, useEffect, useMemo, useState } from 'react';
import { menuService } from '../../services/menuService';
import type { Category, Product, ProductChoiceOption, ProductConfigurator } from '../../types';
import { formatPrice } from '../../lib/utils';

type ProductSectionKey =
  | 'burgers'
  | 'accompagnements'
  | 'desserts-gourmandises'
  | 'boissons-chaudes'
  | 'boissons-froides'
  | 'petit-dejeuner-formules';

type ProductFormState = {
  name: string;
  slug: string;
  sectionKey: ProductSectionKey;
  description: string;
  price: string;
  priceLabel: string;
  tags: string;
  sortOrder: string;
  isAvailable: boolean;
};

type OptionFormState = {
  name: string;
  description: string;
  price: string;
  isAvailable: boolean;
};

type EditableOptionRow = {
  type: 'option';
  id: string;
  sectionKey: ProductSectionKey;
  configuratorKey: string;
  groupId: string;
  groupName: string;
  parentProductName: string;
  optionIndex: number;
  option: ProductChoiceOption;
};

type EditableProductRow = {
  type: 'product';
  id: string;
  sectionKey: ProductSectionKey;
  product: Product;
};

type EditableMenuRow = EditableOptionRow | EditableProductRow;

const CONFIGURATOR_KEYS = [
  'burgers-beef',
  'desserts',
  'gourmandises',
  'cafes-classiques',
  'boissons-gourmandes',
  'smoothies',
] as const;

const SECTION_OPTIONS: Array<{ key: ProductSectionKey; label: string; categoryId: string }> = [
  { key: 'burgers', label: 'Burgers', categoryId: 'cat-burgers' },
  { key: 'accompagnements', label: 'Accompagnements', categoryId: 'cat-accompagnements' },
  { key: 'boissons-froides', label: 'Boissons fraîches', categoryId: 'cat-boissons' },
  { key: 'boissons-chaudes', label: 'Boissons chaudes', categoryId: 'cat-boissons' },
  { key: 'desserts-gourmandises', label: 'Desserts & gourmandises', categoryId: 'cat-desserts-gourmandises' },
  { key: 'petit-dejeuner-formules', label: 'Petit-déjeuner & formules', categoryId: 'cat-petit-dejeuner-formules' },
];

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createProductFormState(product?: Product, defaultCategoryId?: string): ProductFormState {
  return {
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    sectionKey: getProductSectionKey(product) ?? getSectionKeyFromCategoryId(defaultCategoryId) ?? 'accompagnements',
    description: product?.description ?? '',
    price: typeof product?.price === 'number' ? String(product.price) : '',
    priceLabel: product?.priceLabel ?? '',
    tags: product?.tags.join(', ') ?? '',
    sortOrder: String(product?.sortOrder ?? 1),
    isAvailable: product?.isAvailable ?? true,
  };
}

function createOptionFormState(option?: ProductChoiceOption): OptionFormState {
  return {
    name: option?.name ?? '',
    description: option?.description ?? '',
    price: typeof option?.price === 'number' ? String(option.price) : '',
    isAvailable: option?.isActive ?? true,
  };
}

function getSectionKeyFromCategoryId(categoryId?: string): ProductSectionKey | null {
  return SECTION_OPTIONS.find((item) => item.categoryId === categoryId)?.key ?? null;
}

function getProductSectionKey(product?: Product): ProductSectionKey | null {
  if (!product) {
    return null;
  }

  if (product.categoryId === 'cat-boissons') {
    if (product.tags.includes('section-boissons-chaudes')) {
      return 'boissons-chaudes';
    }
    if (product.configuratorKey === 'cafes-classiques' || product.configuratorKey === 'boissons-gourmandes') {
      return 'boissons-chaudes';
    }
    return 'boissons-froides';
  }

  if (product.categoryId === 'cat-burgers') {
    return 'burgers';
  }

  if (product.categoryId === 'cat-accompagnements') {
    return 'accompagnements';
  }

  if (product.categoryId === 'cat-desserts-gourmandises') {
    return 'desserts-gourmandises';
  }

  if (product.categoryId === 'cat-petit-dejeuner-formules') {
    return 'petit-dejeuner-formules';
  }

  return null;
}

function getConfiguratorSectionKey(configuratorKey: string): ProductSectionKey | null {
  switch (configuratorKey) {
    case 'burgers-beef':
      return 'burgers';
    case 'desserts':
    case 'gourmandises':
      return 'desserts-gourmandises';
    case 'cafes-classiques':
    case 'boissons-gourmandes':
      return 'boissons-chaudes';
    case 'smoothies':
      return 'boissons-froides';
    default:
      return null;
  }
}

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [configurators, setConfigurators] = useState<Record<string, ProductConfigurator>>({});
  const [form, setForm] = useState<ProductFormState>(() => createProductFormState());
  const [optionForm, setOptionForm] = useState<OptionFormState>(() => createOptionFormState());
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingOption, setEditingOption] = useState<EditableOptionRow | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  async function refreshMenuData() {
    const [nextProducts, nextCategories, configuratorEntries] = await Promise.all([
      menuService.getProducts(),
      menuService.getCategories(),
      Promise.all(
        CONFIGURATOR_KEYS.map(async (key) => {
          const configurator = await menuService.getProductConfigurator(key);
          return configurator ? [key, configurator] as const : null;
        }),
      ),
    ]);

    setProducts(nextProducts);
    setCategories(nextCategories);
    setConfigurators(
      configuratorEntries.reduce<Record<string, ProductConfigurator>>((accumulator, entry) => {
        if (entry) {
          accumulator[entry[0]] = entry[1];
        }
        return accumulator;
      }, {}),
    );

    if (!editingProductId) {
      setForm(createProductFormState(undefined, nextCategories[0]?.id));
    }
  }

  useEffect(() => {
    void refreshMenuData();
  }, []);

  const productsById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const rowsBySection = useMemo(() => {
    const rows = SECTION_OPTIONS.reduce<Record<ProductSectionKey, EditableMenuRow[]>>((accumulator, section) => {
      accumulator[section.key] = [];
      return accumulator;
    }, {} as Record<ProductSectionKey, EditableMenuRow[]>);

    products
      .filter((product) => (product.productType ?? 'simple') === 'simple' || product.configuratorKey === 'formule-gourmande')
      .forEach((product) => {
        const sectionKey = getProductSectionKey(product);
        if (!sectionKey) {
          return;
        }

        rows[sectionKey].push({
          type: 'product',
          id: product.id,
          sectionKey,
          product,
        });
      });

    (Object.entries(configurators) as Array<[string, ProductConfigurator]>).forEach(([configuratorKey, configurator]) => {
      const sectionKey = getConfiguratorSectionKey(configuratorKey);
      if (!sectionKey) {
        return;
      }

      configurator.choiceGroups
        .filter((group) => group.sortOrder === 1 && group.name !== 'Format')
        .forEach((group) => {
          group.options.forEach((option, optionIndex) => {
            rows[sectionKey].push({
              type: 'option',
              id: `${configuratorKey}-${option.id}`,
              sectionKey,
              configuratorKey,
              groupId: group.id,
              groupName: group.name,
              parentProductName: configurator.title,
              optionIndex,
              option,
            });
          });
        });
    });

    return rows;
  }, [configurators, products]);

  function openCreateModal() {
    setEditingProductId(null);
    setFeedback('');
    setForm(createProductFormState(undefined, categories[0]?.id));
    setIsProductModalOpen(true);
  }

  function openEditProductModal(product: Product) {
    setEditingProductId(product.id);
    setFeedback('');
    setForm(createProductFormState(product));
    setIsProductModalOpen(true);
  }

  function openEditOptionModal(row: EditableOptionRow) {
    setEditingOption(row);
    setFeedback('');
    setOptionForm(createOptionFormState(row.option));
    setIsOptionModalOpen(true);
  }

  function closeProductModal() {
    setIsProductModalOpen(false);
    setEditingProductId(null);
  }

  function closeOptionModal() {
    setIsOptionModalOpen(false);
    setEditingOption(null);
  }

  async function toggleAvailability(product: Product) {
    const updated = await menuService.updateProductAvailability(product.id, !product.isAvailable, product.availabilityNote);
    if (!updated) {
      setFeedback('La mise à jour de disponibilité a échoué.');
      return;
    }

    setProducts((current) => current.map((item) => (item.id === product.id ? updated : item)));
    setFeedback(`${updated.name} est maintenant ${updated.isAvailable ? 'disponible' : 'indisponible'}.`);
  }

  async function toggleOptionAvailability(row: EditableOptionRow) {
    const updatedConfigurator = await menuService.updateProductChoiceAvailability(
      row.configuratorKey,
      row.option.id,
      !(row.option.isActive ?? true),
    );

    if (!updatedConfigurator) {
      setFeedback('La mise à jour du choix a échoué.');
      return;
    }

    setConfigurators((current) => ({ ...current, [row.configuratorKey]: updatedConfigurator }));
    setFeedback(`${row.option.name} est maintenant ${row.option.isActive === false ? 'disponible' : 'indisponible'}.`);
  }

  async function moveRow(sectionKey: ProductSectionKey, rowIndex: number, direction: -1 | 1) {
    const sectionRows = rowsBySection[sectionKey];
    const targetIndex = rowIndex + direction;
    const row = sectionRows[rowIndex];
    const targetRow = sectionRows[targetIndex];

    if (!row || !targetRow || row.type !== targetRow.type) {
      return;
    }

    if (row.type === 'product' && targetRow.type === 'product') {
      const currentOrder = row.product.sortOrder;
      const targetOrder = targetRow.product.sortOrder;
      const [updatedCurrent, updatedTarget] = await Promise.all([
        menuService.updateProductSortOrder(row.product.id, targetOrder),
        menuService.updateProductSortOrder(targetRow.product.id, currentOrder),
      ]);

      if (!updatedCurrent || !updatedTarget) {
        setFeedback('Impossible de modifier l’ordre.');
        return;
      }

      setProducts((current) =>
        current.map((product) => {
          if (product.id === updatedCurrent.id) {
            return updatedCurrent;
          }
          if (product.id === updatedTarget.id) {
            return updatedTarget;
          }
          return product;
        }),
      );
      setFeedback('Ordre mis à jour.');
      return;
    }

    if (row.type === 'option' && targetRow.type === 'option' && row.configuratorKey === targetRow.configuratorKey && row.groupId === targetRow.groupId) {
      const [updatedCurrent, updatedTarget] = await Promise.all([
        menuService.updateProductChoiceSortOrder(row.configuratorKey, row.option.id, targetRow.optionIndex + 1),
        menuService.updateProductChoiceSortOrder(targetRow.configuratorKey, targetRow.option.id, row.optionIndex + 1),
      ]);

      const nextConfigurator = updatedTarget ?? updatedCurrent;
      if (!nextConfigurator) {
        setFeedback('Impossible de modifier l’ordre.');
        return;
      }

      setConfigurators((current) => {
        const currentConfigurator = current[row.configuratorKey];
        if (!currentConfigurator) {
          return current;
        }

        return {
          ...current,
          [row.configuratorKey]: {
            ...currentConfigurator,
            choiceGroups: currentConfigurator.choiceGroups.map((group) => {
              if (group.id !== row.groupId) {
                return group;
              }

              const nextOptions = [...group.options];
              const [moved] = nextOptions.splice(row.optionIndex, 1);
              nextOptions.splice(targetRow.optionIndex, 0, moved);
              return {
                ...group,
                options: nextOptions,
              };
            }),
          },
        };
      });
      setFeedback('Ordre mis à jour.');
    }
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(`Supprimer définitivement "${product.name}" ?`);
    if (!confirmed) {
      return;
    }

    const deleted = await menuService.deleteProduct(product.id);
    if (!deleted) {
      setFeedback('La suppression a échoué.');
      return;
    }

    setProducts((current) => current.filter((item) => item.id !== product.id));
    setFeedback(`"${product.name}" a été supprimé.`);
  }

  async function handleSubmitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback('');

    const parsedPrice = Number(form.price);
    const parsedSortOrder = Number(form.sortOrder);
    const normalizedSlug = slugify(form.slug || form.name);
    const currentProduct = editingProductId ? productsById.get(editingProductId) : undefined;
    const rawTags = form.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .filter((tag) => tag !== 'section-boissons-chaudes' && tag !== 'section-boissons-froides');

    if (form.sectionKey === 'boissons-chaudes') {
      rawTags.push('section-boissons-chaudes');
    }

    if (form.sectionKey === 'boissons-froides') {
      rawTags.push('section-boissons-froides');
    }

    const payload: Product = {
      id: editingProductId ?? `temp-${normalizedSlug}`,
      name: form.name.trim(),
      slug: normalizedSlug,
      categoryId: SECTION_OPTIONS.find((section) => section.key === form.sectionKey)?.categoryId ?? 'cat-accompagnements',
      description: form.description.trim(),
      price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
      priceLabel: form.priceLabel.trim() || undefined,
      isAvailable: form.isAvailable,
      availabilityNote: undefined,
      isActive: true,
      tags: rawTags,
      sortOrder: Number.isFinite(parsedSortOrder) ? parsedSortOrder : 1,
      image: currentProduct?.image ?? products[0]?.image ?? '',
      imageAlt: form.name.trim(),
      imageStatus: currentProduct?.imageStatus ?? 'placeholder',
      imageFit: currentProduct?.imageFit,
      productType: editingProductId ? currentProduct?.productType ?? 'simple' : 'simple',
      configuratorKey: editingProductId ? currentProduct?.configuratorKey : undefined,
    };

    const saved = editingProductId
      ? await menuService.updateProduct(editingProductId, payload)
      : await menuService.createProduct(payload);

    setIsSaving(false);

    if (!saved) {
      setFeedback('Enregistrement impossible.');
      return;
    }

    if (editingProductId) {
      setProducts((current) => current.map((item) => (item.id === editingProductId ? saved : item)));
    } else {
      setProducts((current) => [saved, ...current]);
    }

    setFeedback(editingProductId ? 'Produit mis à jour.' : 'Produit ajouté.');
    closeProductModal();
  }

  async function handleSubmitOption(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingOption) {
      return;
    }

    setIsSaving(true);
    setFeedback('');

    const updatedConfigurator = await menuService.updateProductChoice(editingOption.configuratorKey, editingOption.option.id, {
      name: optionForm.name.trim(),
      description: optionForm.description.trim() || undefined,
      price: Number(optionForm.price),
      isActive: optionForm.isAvailable,
    });

    setIsSaving(false);

    if (!updatedConfigurator) {
      setFeedback('Enregistrement impossible.');
      return;
    }

    setConfigurators((current) => ({ ...current, [editingOption.configuratorKey]: updatedConfigurator }));
    setFeedback('Choix du menu mis à jour.');
    closeOptionModal();
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">Produits</h1>
          <p className="mt-2 text-sm text-slate-600">Produits organisés par catégorie, comme dans le menu public.</p>
        </div>
        <button type="button" onClick={openCreateModal} className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white">
          Ajouter un produit
        </button>
      </div>

      {feedback ? (
        <p className="mt-4 rounded-2xl border border-brand-green/10 bg-white px-4 py-3 text-sm text-slate-700">{feedback}</p>
      ) : null}

      <div className="mt-6 grid gap-6">
        {SECTION_OPTIONS.map((section) => (
          <section key={section.key} className="rounded-[1.8rem] bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-950">{section.label}</h2>
              <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-slate-600">
                {rowsBySection[section.key].length} produit{rowsBySection[section.key].length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              {rowsBySection[section.key].length === 0 ? (
                <p className="rounded-2xl bg-brand-cream px-4 py-3 text-sm text-slate-500">Aucun produit dans cette catégorie.</p>
              ) : (
                rowsBySection[section.key].map((row, rowIndex) => {
                  const isAvailable = row.type === 'product' ? row.product.isAvailable : row.option.isActive ?? true;
                  const name = row.type === 'product' ? row.product.name : row.option.name;
                  const description = row.type === 'product' ? row.product.description : row.option.description;
                  const price = row.type === 'product' ? formatPrice(row.product.price, row.product.priceLabel) : formatPrice(row.option.price);
                  const previousRow = rowsBySection[section.key][rowIndex - 1];
                  const nextRow = rowsBySection[section.key][rowIndex + 1];
                  const canMoveUp = previousRow?.type === row.type && (row.type === 'product' || (previousRow.type === 'option' && previousRow.configuratorKey === row.configuratorKey && previousRow.groupId === row.groupId));
                  const canMoveDown = nextRow?.type === row.type && (row.type === 'product' || (nextRow.type === 'option' && nextRow.configuratorKey === row.configuratorKey && nextRow.groupId === row.groupId));
                  return (
                    <div key={row.id} className="rounded-[1.2rem] border border-brand-green/10 bg-brand-offwhite p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="text-lg font-semibold text-slate-950">{name}</p>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {isAvailable ? 'Disponible' : 'Indisponible'}
                            </span>
                            {row.type === 'option' ? (
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                                {row.parentProductName}
                              </span>
                            ) : null}
                          </div>
                          {description ? <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p> : null}
                          <p className="mt-2 text-sm font-semibold text-brand-deepgreen">{price}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" disabled={!canMoveUp} onClick={() => void moveRow(section.key, rowIndex, -1)} className="rounded-full border border-brand-green/10 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">
                            Monter
                          </button>
                          <button type="button" disabled={!canMoveDown} onClick={() => void moveRow(section.key, rowIndex, 1)} className="rounded-full border border-brand-green/10 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">
                            Descendre
                          </button>
                          {row.type === 'product' ? (
                            <>
                              <button type="button" onClick={() => openEditProductModal(row.product)} className="rounded-full border border-brand-green/10 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">
                                Éditer
                              </button>
                              <button type="button" onClick={() => void toggleAvailability(row.product)} className="rounded-full border border-brand-green/10 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">
                                {row.product.isAvailable ? 'Désactiver' : 'Activer'}
                              </button>
                              <button type="button" onClick={() => void handleDelete(row.product)} className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-sm font-semibold text-rose-700">
                                Supprimer
                              </button>
                            </>
                          ) : (
                            <>
                              <button type="button" onClick={() => openEditOptionModal(row)} className="rounded-full border border-brand-green/10 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">
                                Éditer
                              </button>
                              <button type="button" onClick={() => void toggleOptionAvailability(row)} className="rounded-full border border-brand-green/10 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">
                                {row.option.isActive === false ? 'Activer' : 'Désactiver'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        ))}
      </div>

      {isProductModalOpen ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/40 px-4">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-slate-950">{editingProductId ? 'Éditer le produit' : 'Ajouter un produit'}</h2>
              <button type="button" onClick={closeProductModal} className="rounded-full border border-brand-green/10 px-4 py-2 text-sm font-semibold text-slate-700">
                Fermer
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmitProduct}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Nom
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value, slug: current.slug ? current.slug : slugify(event.target.value) }))}
                    required
                    className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Slug
                  <input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} required className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Section visible
                  <select value={form.sectionKey} onChange={(event) => setForm((current) => ({ ...current, sectionKey: event.target.value as ProductSectionKey }))} required className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none">
                    {SECTION_OPTIONS.map((section) => (
                      <option key={section.key} value={section.key}>{section.label}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Prix
                  <input type="number" min="0" step="0.1" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} required className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Prix affiché
                  <input value={form.priceLabel} onChange={(event) => setForm((current) => ({ ...current, priceLabel: event.target.value }))} placeholder="Ex: À partir de 3,50 €" className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Ordre
                  <input type="number" min="1" step="1" value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))} required className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none" />
                </label>
              </div>

              <label className="text-sm font-medium text-slate-700">
                Description
                <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} required className="mt-2 min-h-28 w-full rounded-2xl border border-brand-green/10 bg-brand-cream p-4 outline-none" />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Tags
                <input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} placeholder="Ex: frais, the" className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none" />
              </label>

              <label className="inline-flex items-center gap-3 rounded-2xl bg-brand-cream px-4 py-3 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={form.isAvailable} onChange={(event) => setForm((current) => ({ ...current, isAvailable: event.target.checked }))} />
                Produit disponible
              </label>

              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={isSaving} className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
                  {isSaving ? 'Enregistrement...' : editingProductId ? 'Mettre à jour' : 'Ajouter'}
                </button>
                <button type="button" onClick={closeProductModal} className="rounded-full border border-brand-green/10 px-5 py-3 text-sm font-semibold text-slate-700">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isOptionModalOpen && editingOption ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/40 px-4">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">Éditer le choix</h2>
                <p className="mt-1 text-sm text-slate-500">{editingOption.parentProductName} • {editingOption.groupName}</p>
              </div>
              <button type="button" onClick={closeOptionModal} className="rounded-full border border-brand-green/10 px-4 py-2 text-sm font-semibold text-slate-700">
                Fermer
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmitOption}>
              <label className="text-sm font-medium text-slate-700">
                Nom
                <input value={optionForm.name} onChange={(event) => setOptionForm((current) => ({ ...current, name: event.target.value }))} required className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none" />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Description
                <textarea value={optionForm.description} onChange={(event) => setOptionForm((current) => ({ ...current, description: event.target.value }))} className="mt-2 min-h-28 w-full rounded-2xl border border-brand-green/10 bg-brand-cream p-4 outline-none" />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Prix
                <input type="number" min="0" step="0.1" value={optionForm.price} onChange={(event) => setOptionForm((current) => ({ ...current, price: event.target.value }))} required className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none" />
              </label>

              <label className="inline-flex items-center gap-3 rounded-2xl bg-brand-cream px-4 py-3 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={optionForm.isAvailable} onChange={(event) => setOptionForm((current) => ({ ...current, isAvailable: event.target.checked }))} />
                Choix disponible
              </label>

              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={isSaving} className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
                  {isSaving ? 'Enregistrement...' : 'Mettre à jour'}
                </button>
                <button type="button" onClick={closeOptionModal} className="rounded-full border border-brand-green/10 px-5 py-3 text-sm font-semibold text-slate-700">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
