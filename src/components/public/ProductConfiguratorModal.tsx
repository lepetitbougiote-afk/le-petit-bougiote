import { useEffect, useMemo, useState } from 'react';
import type { CartItem, Product, ProductChoiceOption, ProductConfigurator } from '../../types';
import { formatPrice } from '../../lib/utils';
import { menuService } from '../../services/menuService';

function getDisplayName(product: Product, configurator: ProductConfigurator, selectedOptions: ProductChoiceOption[]) {
  if (configurator.key === 'burgers-beef' || configurator.key === 'burgers-chicken') {
    const format = selectedOptions.find((option) => option.name === 'Burger seul' || option.name === 'Menu +3 €');
    const burger = selectedOptions.find((option) => option !== format);
    return `${burger?.name ?? product.name} — ${format?.name === 'Menu +3 €' ? 'Menu' : 'Burger seul'}`;
  }

  if (configurator.key === 'cafes-classiques') {
    return `${product.name} — ${selectedOptions[0]?.name ?? ''}`.trim();
  }

  if (configurator.key === 'boissons-gourmandes') {
    return `${product.name} — ${selectedOptions[0]?.name ?? ''}`.trim();
  }

  if (configurator.key === 'formule-gourmande') {
    return `${product.name} — ${selectedOptions.map((option) => option.name).join(' + ')}`;
  }

  if (configurator.key === 'desserts' || configurator.key === 'gourmandises') {
    return `${product.name} — ${selectedOptions[0]?.name ?? ''}`.trim();
  }

  return product.name;
}

export function ProductConfiguratorModal({
  product,
  open,
  onClose,
  onConfirm,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (item: Omit<CartItem, 'id'>) => void;
}) {
  const [configurator, setConfigurator] = useState<ProductConfigurator | null>(null);
  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open || !product?.configuratorKey) {
      setConfigurator(null);
      setSelectedByGroup({});
      setQuantity(1);
      setNote('');
      return;
    }

    void menuService.getProductConfigurator(product.configuratorKey).then((value) => {
      setConfigurator(value ?? null);
      setSelectedByGroup({});
      setQuantity(1);
      setNote('');
    });
  }, [open, product]);

  const selectedOptions = useMemo(() => {
    if (!configurator) {
      return [];
    }

    return configurator.choiceGroups
      .map((group) => group.options.find((option) => option.id === selectedByGroup[group.id]))
      .filter(Boolean) as ProductChoiceOption[];
  }, [configurator, selectedByGroup]);

  const isReady = useMemo(() => {
    if (!configurator) {
      return false;
    }

    return configurator.choiceGroups.every((group) => !group.required || Boolean(selectedByGroup[group.id]));
  }, [configurator, selectedByGroup]);

  const computedUnitPrice = useMemo(() => {
    if (!product || !configurator) {
      return 0;
    }

    const basePrice = configurator.key === 'formule-gourmande' ? product.price ?? 0 : 0;
    return basePrice + selectedOptions.reduce((sum, option) => sum + option.price, 0);
  }, [configurator, product, selectedOptions]);

  const computedTotalPrice = computedUnitPrice * quantity;

  if (!open || !product) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-green/70">Choix produit</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">{product.name}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{configurator?.description ?? product.description}</p>
          </div>
          <button type="button" className="rounded-full border border-brand-green/10 px-4 py-2 text-sm font-semibold text-slate-700" onClick={onClose}>
            Fermer
          </button>
        </div>

        {configurator ? (
          <div className="mt-6 space-y-6">
            {configurator.choiceGroups
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((group) => (
                <section key={group.id} className="rounded-[1.6rem] border border-brand-green/10 bg-brand-offwhite p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">{group.name}</h3>
                      {group.helperText ? <p className="mt-1 text-sm text-slate-600">{group.helperText}</p> : null}
                    </div>
                    {group.required ? <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">Choix requis</span> : null}
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {group.options.map((option) => {
                      const selected = selectedByGroup[group.id] === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedByGroup((current) => ({ ...current, [group.id]: option.id }))}
                          className={`rounded-[1.4rem] border p-4 text-left transition ${selected ? 'border-brand-green bg-white shadow-sm' : 'border-brand-border bg-white/80'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-950">{option.name}</p>
                              {option.description ? <p className="mt-1 text-sm leading-6 text-slate-600">{option.description}</p> : null}
                            </div>
                            <span className="text-sm font-semibold text-brand-deepgreen">
                              {option.price > 0 ? `+ ${formatPrice(option.price)}` : 'Inclus'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}

            <div className="grid gap-5 md:grid-cols-[160px_1fr]">
              <div className="rounded-[1.6rem] border border-brand-green/10 bg-brand-offwhite p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-green/70">Quantité</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-11 w-11 rounded-full border border-brand-green/10 text-lg font-semibold text-slate-700">
                    -
                  </button>
                  <span className="text-lg font-semibold text-slate-950">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((value) => value + 1)} className="h-11 w-11 rounded-full border border-brand-green/10 text-lg font-semibold text-slate-700">
                    +
                  </button>
                </div>
              </div>
              <label className="rounded-[1.6rem] border border-brand-green/10 bg-brand-offwhite p-5 text-sm font-medium text-slate-700">
                Note pour la commande
                <textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-3 min-h-28 w-full rounded-2xl border border-brand-green/10 bg-white p-4 outline-none" placeholder="Ex: sans oignons, sauce à part..." />
              </label>
            </div>

            <div className="flex flex-col gap-4 rounded-[1.8rem] bg-[linear-gradient(145deg,#2F5E33,#3E281A)] p-5 text-white md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-white/72">Total sélection</p>
                <p className="mt-1 text-2xl font-semibold">{formatPrice(computedTotalPrice)}</p>
                <p className="mt-1 text-sm text-white/72">Prix unitaire {formatPrice(computedUnitPrice)}</p>
                <p className="mt-2 text-sm text-white/72">
                  {isReady ? getDisplayName(product, configurator, selectedOptions) : 'Choisissez les options pour continuer'}
                </p>
              </div>
              <button
                type="button"
                disabled={!isReady}
                onClick={() => {
                  const name = getDisplayName(product, configurator, selectedOptions);
                  onConfirm({
                    productId: product.id,
                    name,
                    price: computedUnitPrice,
                    quantity,
                    note,
                    image: product.image,
                    imageAlt: product.imageAlt,
                    imageFit: product.imageFit,
                    configuratorKey: configurator.key,
                    selectedOptions: configurator.choiceGroups
                      .map((group) => {
                        const option = group.options.find((currentOption) => currentOption.id === selectedByGroup[group.id]);
                        if (!option) {
                          return null;
                        }
                        return {
                          groupId: group.id,
                          optionId: option.id,
                          label: option.name,
                          price: option.price,
                        };
                      })
                      .filter(Boolean) as NonNullable<CartItem['selectedOptions']>,
                  });
                  onClose();
                }}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-deepgreen disabled:cursor-not-allowed disabled:bg-white/50"
              >
                Ajouter au panier
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-[1.6rem] bg-brand-offwhite p-6 text-sm text-slate-600">
            Chargement des choix...
          </div>
        )}
      </div>
    </div>
  );
}
