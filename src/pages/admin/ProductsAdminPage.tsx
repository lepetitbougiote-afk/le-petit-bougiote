import { FormEvent, useEffect, useMemo, useState } from 'react';
import { menuService } from '../../services/menuService';
import type { Category, Product } from '../../types';
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

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createFormState(product?: Product, defaultCategoryId?: string): ProductFormState {
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

const SECTION_OPTIONS: Array<{ key: ProductSectionKey; label: string; categoryId: string }> = [
  { key: 'burgers', label: 'Burgers', categoryId: 'cat-burgers' },
  { key: 'accompagnements', label: 'Accompagnements', categoryId: 'cat-accompagnements' },
  { key: 'desserts-gourmandises', label: 'Desserts & gourmandises', categoryId: 'cat-desserts-gourmandises' },
  { key: 'boissons-chaudes', label: 'Boissons chaudes', categoryId: 'cat-boissons' },
  { key: 'boissons-froides', label: 'Boissons froides', categoryId: 'cat-boissons' },
  { key: 'petit-dejeuner-formules', label: 'Petit-déjeuner & formules', categoryId: 'cat-petit-dejeuner-formules' },
];

function getSectionKeyFromCategoryId(categoryId?: string): ProductSectionKey | null {
  const option = SECTION_OPTIONS.find((item) => item.categoryId === categoryId);
  return option?.key ?? null;
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

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductFormState>(() => createFormState());
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    async function loadData() {
      const [nextProducts, nextCategories] = await Promise.all([
        menuService.getProducts(),
        menuService.getCategories(),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
      if (!editingProductId) {
        setForm(createFormState(undefined, nextCategories[0]?.id));
      }
    }

    void loadData();
  }, [editingProductId]);

  const categoryNameById = useMemo(
    () => Object.fromEntries(SECTION_OPTIONS.map((section) => [section.key, section.label])),
    [],
  );

  function openCreateModal() {
    setEditingProductId(null);
    setFeedback('');
    setForm(createFormState(undefined, categories[0]?.id));
    setIsModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProductId(product.id);
    setFeedback('');
    setForm(createFormState(product));
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingProductId(null);
  }

  async function toggleAvailability(product: Product) {
    const updated = await menuService.updateProductAvailability(product.id, !product.isAvailable, product.availabilityNote);
    if (!updated) {
      setFeedback('La mise à jour de disponibilité a échoué.');
      return;
    }

    setProducts((current) =>
      current.map((item) => (item.id === product.id ? updated : item)),
    );
    setFeedback(`${updated.name} est maintenant ${updated.isAvailable ? 'disponible' : 'indisponible'}.`);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback('');

    const parsedPrice = Number(form.price);
    const parsedSortOrder = Number(form.sortOrder);
    const normalizedSlug = slugify(form.slug || form.name);
    const currentProduct = editingProductId ? products.find((item) => item.id === editingProductId) : undefined;
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
      image: products[0]?.image ?? '',
      imageAlt: form.name.trim(),
      imageStatus: 'placeholder',
      productType: editingProductId
        ? currentProduct?.productType ?? 'simple'
        : 'simple',
      configuratorKey: editingProductId
        ? currentProduct?.configuratorKey
        : undefined,
    };

    const saved = editingProductId
      ? await menuService.updateProduct(editingProductId, payload)
      : await menuService.createProduct(payload);

    setIsSaving(false);

    if (!saved) {
      setFeedback('Enregistrement impossible.');
      return;
    }

    setProducts((current) => {
      if (editingProductId) {
        return current.map((item) => (item.id === editingProductId ? saved : item));
      }

      return [saved, ...current];
    });

    setFeedback(editingProductId ? 'Produit mis à jour.' : 'Produit ajouté.');
    closeModal();
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-slate-950">Produits</h1>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white"
        >
          Ajouter un produit
        </button>
      </div>

      {feedback ? (
        <p className="mt-4 rounded-2xl border border-brand-green/10 bg-white px-4 py-3 text-sm text-slate-700">
          {feedback}
        </p>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-[1.8rem] bg-white">
        <div className="grid grid-cols-[1.5fr_1fr_0.8fr_1.15fr] gap-4 border-b border-brand-green/10 px-6 py-4 text-sm font-semibold text-slate-500">
          <span>Produit</span>
          <span>Catégorie</span>
          <span>Prix</span>
          <span>Actions</span>
        </div>
        {products.map((product) => (
          <div key={product.id} className="grid grid-cols-[1.5fr_1fr_0.8fr_1.15fr] gap-4 border-b border-brand-green/10 px-6 py-4 text-sm last:border-b-0">
            <div>
              <p className="font-semibold text-slate-900">{product.name}</p>
              <p className="mt-1 text-slate-500">{product.description}</p>
              {!product.isAvailable && product.availabilityNote ? <p className="mt-2 text-amber-700">Note: {product.availabilityNote}</p> : null}
            </div>
            <span className="text-slate-700">{categoryNameById[getProductSectionKey(product) ?? 'accompagnements']}</span>
            <span className="font-semibold text-slate-900">{formatPrice(product.price, product.priceLabel)}</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openEditModal(product)}
                className="rounded-full border border-brand-green/10 px-3 py-1.5 font-semibold text-slate-700"
              >
                Éditer
              </button>
              <button
                type="button"
                onClick={() => void toggleAvailability(product)}
                className="rounded-full border border-brand-green/10 px-3 py-1.5 font-semibold text-slate-700"
              >
                {product.isAvailable ? 'Désactiver' : 'Activer'}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(product)}
                className="rounded-full border border-rose-200 px-3 py-1.5 font-semibold text-rose-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/40 px-4">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-slate-950">
                {editingProductId ? 'Éditer le produit' : 'Ajouter un produit'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-brand-green/10 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Fermer
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Nom
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                        slug: current.slug ? current.slug : slugify(event.target.value),
                      }))
                    }
                    required
                    className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Slug
                  <input
                    value={form.slug}
                    onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                    required
                    className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Section visible
                  <select
                    value={form.sectionKey}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        sectionKey: event.target.value as ProductSectionKey,
                      }))
                    }
                    required
                    className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                  >
                    {SECTION_OPTIONS.map((section) => (
                      <option key={section.key} value={section.key}>
                        {section.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Prix
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.price}
                    onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                    required
                    className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Prix affiché
                  <input
                    value={form.priceLabel}
                    onChange={(event) => setForm((current) => ({ ...current, priceLabel: event.target.value }))}
                    placeholder="Ex: À partir de 3,50 €"
                    className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Ordre
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.sortOrder}
                    onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                    required
                    className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                  />
                </label>
              </div>

              <label className="text-sm font-medium text-slate-700">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  required
                  className="mt-2 min-h-28 w-full rounded-2xl border border-brand-green/10 bg-brand-cream p-4 outline-none"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Tags
                <input
                  value={form.tags}
                  onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                  placeholder="Ex: frais, the"
                  className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                />
              </label>

              <label className="inline-flex items-center gap-3 rounded-2xl bg-brand-cream px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(event) => setForm((current) => ({ ...current, isAvailable: event.target.checked }))}
                />
                Produit disponible
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSaving ? 'Enregistrement...' : editingProductId ? 'Mettre à jour' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-brand-green/10 px-5 py-3 text-sm font-semibold text-slate-700"
                >
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
