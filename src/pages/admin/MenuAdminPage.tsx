import { useEffect, useState } from 'react';
import { menuService } from '../../services/menuService';
import type { Category, Product, ProductConfigurator } from '../../types';

export default function MenuAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [configurators, setConfigurators] = useState<Record<string, ProductConfigurator>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [optionNoteDrafts, setOptionNoteDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadMenuData() {
      const [nextCategories, nextProducts] = await Promise.all([
        menuService.getCategories(),
        menuService.getProducts(),
      ]);

      setCategories(nextCategories);
      setProducts(nextProducts);

      const configuratorEntries = await Promise.all(
        nextProducts
          .filter((product) => product.configuratorKey)
          .map(async (product) => {
            const configurator = await menuService.getProductConfigurator(product.configuratorKey!);
            return configurator ? [product.configuratorKey!, configurator] as const : null;
          }),
      );

      const nextConfigurators = Object.fromEntries(
        configuratorEntries.filter(Boolean) as Array<[string, ProductConfigurator]>,
      );

      setConfigurators(nextConfigurators);
      setOptionNoteDrafts((current) => {
        const next = { ...current };
        Object.values(nextConfigurators).forEach((configurator) => {
          configurator.choiceGroups.forEach((group) => {
            group.options.forEach((option) => {
              const key = `${configurator.key}:${option.id}`;
              if (!(key in next)) {
                next[key] =
                  typeof option.meta?.availabilityNote === 'string'
                    ? option.meta.availabilityNote
                    : '';
              }
            });
          });
        });
        return next;
      });
    }

    void loadMenuData();
  }, []);

  useEffect(() => {
    setNoteDrafts(
      Object.fromEntries(products.map((product) => [product.id, product.availabilityNote ?? ''])),
    );
  }, [products]);

  async function saveAvailability(product: Product, nextIsAvailable: boolean) {
    const nextNote = noteDrafts[product.id]?.trim() ?? '';
    const updated = await menuService.updateProductAvailability(
      product.id,
      nextIsAvailable,
      nextIsAvailable ? '' : nextNote,
    );
    setProducts((current) => current.map((item) => (item.id === product.id && updated ? updated : item)));
  }

  async function saveOptionAvailability(
    configuratorKey: string,
    optionId: string,
    nextIsAvailable: boolean,
  ) {
    const draftKey = `${configuratorKey}:${optionId}`;
    const nextNote = optionNoteDrafts[draftKey]?.trim() ?? '';
    const updatedConfigurator = await menuService.updateProductChoiceAvailability(
      configuratorKey,
      optionId,
      nextIsAvailable,
      nextIsAvailable ? '' : nextNote,
    );

    if (updatedConfigurator) {
      setConfigurators((current) => ({
        ...current,
        [configuratorKey]: updatedConfigurator,
      }));
    }
  }

  return (
    <section>
      <h1 className="text-3xl font-semibold text-slate-950">Vue menu</h1>
      <div className="mt-6 grid gap-4">
        {categories.map((category) => (
          <div key={category.id} className="rounded-[1.8rem] bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-950">{category.name}</h2>
              <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-slate-700">
                {products.filter((product) => product.categoryId === category.id).length} produits
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              {products
                .filter((product) => product.categoryId === category.id)
                .map((product) => (
                  <div key={product.id} className="rounded-3xl bg-brand-cream px-4 py-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <span className="font-medium text-slate-800">{product.name}</span>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{product.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void saveAvailability(product, !product.isAvailable)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold ${
                            product.isAvailable
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {product.isAvailable ? 'Disponible' : 'Indisponible'}
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
                      <label className="text-sm font-medium text-slate-700">
                        Note affichée si indisponible
                        <textarea
                          value={noteDrafts[product.id] ?? ''}
                          onChange={(event) =>
                            setNoteDrafts((current) => ({
                              ...current,
                              [product.id]: event.target.value,
                            }))
                          }
                          placeholder="Ex: Retour demain midi, produit en rupture ce soir..."
                          className="mt-2 min-h-24 w-full rounded-2xl border border-brand-green/10 bg-white px-4 py-3 outline-none"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => void saveAvailability(product, false)}
                        className="rounded-full border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-amber-800"
                      >
                        Indisponible + note
                      </button>
                      <button
                        type="button"
                        onClick={() => void saveAvailability(product, true)}
                        className="rounded-full border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-800"
                      >
                        Rendre disponible
                      </button>
                    </div>
                    {!product.isAvailable && product.availabilityNote ? (
                      <p className="mt-3 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm leading-6 text-amber-900">
                        Note publique: {product.availabilityNote}
                      </p>
                    ) : null}

                    {product.configuratorKey && configurators[product.configuratorKey] ? (
                      <div className="mt-5 space-y-4 rounded-[1.5rem] border border-brand-green/10 bg-white p-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-green/70">
                          Choix internes
                        </p>
                        {configurators[product.configuratorKey].choiceGroups.map((group) => (
                          <div key={group.id} className="rounded-3xl bg-brand-offwhite p-4">
                            <p className="text-sm font-semibold text-slate-950">{group.name}</p>
                            {group.helperText ? (
                              <p className="mt-1 text-sm text-slate-500">{group.helperText}</p>
                            ) : null}
                            <div className="mt-3 grid gap-3">
                              {group.options.map((option) => {
                                const draftKey = `${product.configuratorKey}:${option.id}`;
                                const availabilityNote =
                                  typeof option.meta?.availabilityNote === 'string'
                                    ? option.meta.availabilityNote
                                    : '';

                                return (
                                  <div
                                    key={option.id}
                                    className="rounded-3xl border border-brand-green/10 bg-white p-4"
                                  >
                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                      <div className="min-w-0">
                                        <p className="font-medium text-slate-800">{option.name}</p>
                                        {option.description ? (
                                          <p className="mt-1 text-sm leading-6 text-slate-500">
                                            {option.description}
                                          </p>
                                        ) : null}
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            void saveOptionAvailability(
                                              product.configuratorKey!,
                                              option.id,
                                              !(option.isActive ?? true),
                                            )
                                          }
                                          className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                            option.isActive ?? true
                                              ? 'bg-emerald-100 text-emerald-700'
                                              : 'bg-amber-100 text-amber-700'
                                          }`}
                                        >
                                          {option.isActive ?? true ? 'Disponible' : 'Indisponible'}
                                        </button>
                                      </div>
                                    </div>
                                    <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
                                      <label className="text-sm font-medium text-slate-700">
                                        Note affichée si indisponible
                                        <textarea
                                          value={optionNoteDrafts[draftKey] ?? ''}
                                          onChange={(event) =>
                                            setOptionNoteDrafts((current) => ({
                                              ...current,
                                              [draftKey]: event.target.value,
                                            }))
                                          }
                                          placeholder="Ex: Plus disponible ce soir, retour demain."
                                          className="mt-2 min-h-24 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                                        />
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void saveOptionAvailability(product.configuratorKey!, option.id, false)
                                        }
                                        className="rounded-full border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-amber-800"
                                      >
                                        Indisponible + note
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void saveOptionAvailability(product.configuratorKey!, option.id, true)
                                        }
                                        className="rounded-full border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-800"
                                      >
                                        Rendre disponible
                                      </button>
                                    </div>
                                    {!(option.isActive ?? true) && availabilityNote ? (
                                      <p className="mt-3 rounded-2xl border border-amber-200 bg-brand-cream px-4 py-3 text-sm leading-6 text-amber-900">
                                        Note publique: {availabilityNote}
                                      </p>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
