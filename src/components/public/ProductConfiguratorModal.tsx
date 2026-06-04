import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { CartItem, Product, ProductChoiceOption, ProductConfigurator } from '../../types';
import { formatPrice } from '../../lib/utils';
import { menuService } from '../../services/menuService';

type BurgerSelectionMap = Record<string, { solo: number; menu: number }>;

function getDisplayName(product: Product, configurator: ProductConfigurator, selectedOptions: ProductChoiceOption[]) {
  if (configurator.key === 'burgers-beef') {
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
  initialQuantity = 1,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (items: Array<Omit<CartItem, 'id'>>) => void;
  initialQuantity?: number;
}) {
  const [configurator, setConfigurator] = useState<ProductConfigurator | null>(null);
  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [burgerSelections, setBurgerSelections] = useState<BurgerSelectionMap>({});
  const [note, setNote] = useState('');
  const isBurgerConfigurator = configurator?.key === 'burgers-beef';

  useEffect(() => {
    if (!open || !product?.configuratorKey) {
      setConfigurator(null);
      setSelectedByGroup({});
      setQuantity(initialQuantity);
      setBurgerSelections({});
      setNote('');
      return;
    }

    void menuService.getProductConfigurator(product.configuratorKey).then((value) => {
      setConfigurator(value ?? null);
      setSelectedByGroup({});
      setQuantity(initialQuantity);
      setBurgerSelections({});
      setNote('');
    });
  }, [initialQuantity, open, product]);

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

    if (configurator.key === 'burgers-beef') {
      return (Object.values(burgerSelections) as Array<{ solo: number; menu: number }>).some(
        (selection) => selection.solo > 0 || selection.menu > 0,
      );
    }

    return configurator.choiceGroups.every((group) => !group.required || Boolean(selectedByGroup[group.id]));
  }, [burgerSelections, configurator, selectedByGroup]);

  const computedUnitPrice = useMemo(() => {
    if (!product || !configurator) {
      return 0;
    }

    if (configurator.key === 'burgers-beef') {
      return (Object.entries(burgerSelections) as Array<[string, { solo: number; menu: number }]>).reduce((sum, [optionId, selection]) => {
        const burgerOption = configurator.choiceGroups
          .find((group) => group.id === 'burger-choice')
          ?.options.find((option) => option.id === optionId);

        if (!burgerOption) {
          return sum;
        }

        return sum + burgerOption.price * selection.solo + (burgerOption.price + 3) * selection.menu;
      }, 0);
    }

    const basePrice = configurator.key === 'formule-gourmande' ? product.price ?? 0 : 0;
    return basePrice + selectedOptions.reduce((sum, option) => sum + option.price, 0);
  }, [burgerSelections, configurator, product, selectedOptions]);

  const computedTotalPrice = isBurgerConfigurator ? computedUnitPrice : computedUnitPrice * quantity;

  function updateBurgerSelection(optionId: string, key: 'solo' | 'menu', delta: number) {
    setBurgerSelections((current) => {
      const previous = current[optionId] ?? { solo: 0, menu: 0 };
      return {
        ...current,
        [optionId]: {
          ...previous,
          [key]: Math.max(0, previous[key] + delta),
        },
      };
    });
  }

  function buildBurgerItems() {
    if (!configurator || !product) {
      return [];
    }

    const burgerGroup = configurator.choiceGroups.find((group) => group.id === 'burger-choice');
    if (!burgerGroup) {
      return [];
    }

    return burgerGroup.options.flatMap((option) => {
      const selection = burgerSelections[option.id] ?? { solo: 0, menu: 0 };
      const items: Array<Omit<CartItem, 'id'>> = [];

      if (selection.solo > 0) {
        items.push({
          productId: product.id,
          name: `${option.name} — Burger seul`,
          price: option.price,
          quantity: selection.solo,
          note,
          image: product.image,
          imageAlt: product.imageAlt,
          imageFit: product.imageFit,
          configuratorKey: configurator.key,
          selectedOptions: [
            { groupId: 'burger-choice', optionId: option.id, label: option.name, price: option.price },
            { groupId: 'service-format', optionId: 'burger-seul', label: 'Burger seul', price: 0 },
          ],
        });
      }

      if (selection.menu > 0) {
        items.push({
          productId: product.id,
          name: `${option.name} — Menu`,
          price: option.price + 3,
          quantity: selection.menu,
          note,
          image: product.image,
          imageAlt: product.imageAlt,
          imageFit: product.imageFit,
          configuratorKey: configurator.key,
          selectedOptions: [
            { groupId: 'burger-choice', optionId: option.id, label: option.name, price: option.price },
            { groupId: 'service-format', optionId: 'menu-plus-3', label: 'Menu +3 €', price: 3 },
          ],
        });
      }

      return items;
    });
  }

  if (!open || !product) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-slate-950/55 px-4">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="sticky top-0 z-20 ml-auto flex h-11 w-11 items-center justify-center rounded-full border border-brand-green/10 bg-white text-slate-700 shadow-sm"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-green/70">Choix produit</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">{product.name}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{configurator?.description ?? product.description}</p>
          </div>
        </div>

        {configurator ? (
          <div className="mt-6 space-y-6">
            {configurator.choiceGroups
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .filter((group) => !(isBurgerConfigurator && group.id === 'service-format'))
              .map((group) => (
                <section key={group.id} className="rounded-[1.6rem] border border-brand-green/10 bg-brand-offwhite p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">
                        {isBurgerConfigurator && group.id === 'burger-choice' ? 'Menu' : group.name}
                      </h3>
                      {group.helperText ? <p className="mt-1 text-sm text-slate-600">{group.helperText}</p> : null}
                    </div>
                    {group.required && !isBurgerConfigurator ? <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">Choix requis</span> : null}
                  </div>
                  <div className={`mt-4 grid gap-3 ${isBurgerConfigurator && group.id === 'burger-choice' ? '' : 'md:grid-cols-2'}`}>
                    {group.options.map((option) => {
                      const selected = selectedByGroup[group.id] === option.id;
                      const burgerSelection = burgerSelections[option.id] ?? { solo: 0, menu: 0 };
                      const isAvailable = option.isActive ?? true;
                      const badgeLabel = typeof option.meta?.badge === 'string' ? option.meta.badge : '';
                      const availabilityNote =
                        typeof option.meta?.availabilityNote === 'string'
                          ? option.meta.availabilityNote
                          : '';

                      if (isBurgerConfigurator && group.id === 'burger-choice') {
                        return (
                          <div
                            key={option.id}
                            className="rounded-[1.4rem] border border-brand-border bg-white p-4 transition hover:border-brand-green/50"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <p className="font-semibold text-slate-950">{option.name}</p>
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
                                {option.description ? <p className="mt-1 text-sm leading-6 text-slate-600">{option.description}</p> : null}
                                {!isAvailable && availabilityNote ? (
                                  <p className="mt-2 text-sm leading-6 text-amber-800">{availabilityNote}</p>
                                ) : null}
                              </div>
                              <span className="text-sm font-semibold text-brand-deepgreen">+ {formatPrice(option.price)}</span>
                            </div>
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              <div className="rounded-2xl border border-brand-green/10 bg-brand-offwhite px-4 py-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-950">Seul</p>
                                    <p className="text-xs text-slate-500">{formatPrice(option.price)}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => isAvailable && updateBurgerSelection(option.id, 'solo', -1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-green/15 text-lg font-semibold text-slate-700">-</button>
                                    <span className="w-6 text-center text-sm font-semibold text-slate-950">{burgerSelection.solo}</span>
                                    <button type="button" onClick={() => isAvailable && updateBurgerSelection(option.id, 'solo', 1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-green/15 text-lg font-semibold text-slate-700">+</button>
                                  </div>
                                </div>
                              </div>
                              <div className="rounded-2xl border border-brand-green/10 bg-brand-offwhite px-4 py-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-950">Menu</p>
                                    <p className="text-xs text-slate-500">{formatPrice(option.price + 3)}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => isAvailable && updateBurgerSelection(option.id, 'menu', -1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-green/15 text-lg font-semibold text-slate-700">-</button>
                                    <span className="w-6 text-center text-sm font-semibold text-slate-950">{burgerSelection.menu}</span>
                                    <button type="button" onClick={() => isAvailable && updateBurgerSelection(option.id, 'menu', 1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-green/15 text-lg font-semibold text-slate-700">+</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            if (isAvailable) {
                              setSelectedByGroup((current) => ({ ...current, [group.id]: option.id }));
                            }
                          }}
                          className={`rounded-[1.4rem] border p-4 text-left transition ${selected ? 'border-brand-green bg-white shadow-sm' : 'border-brand-border bg-white/80'} ${!isAvailable ? 'opacity-70' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-3">
                                <p className="font-semibold text-slate-950">{option.name}</p>
                                {!isAvailable ? (
                                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                    Indisponible
                                  </span>
                                ) : null}
                              </div>
                              {option.description ? <p className="mt-1 text-sm leading-6 text-slate-600">{option.description}</p> : null}
                              {!isAvailable && availabilityNote ? (
                                <p className="mt-2 text-sm leading-6 text-amber-800">{availabilityNote}</p>
                              ) : null}
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

            <div className={`grid gap-5 ${isBurgerConfigurator ? 'md:grid-cols-1' : 'md:grid-cols-[160px_1fr]'}`}>
              {!isBurgerConfigurator ? (
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
              ) : null}
              <label className="rounded-[1.6rem] border border-brand-green/10 bg-brand-offwhite p-5 text-sm font-medium text-slate-700">
                Note pour la commande
                <textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-3 min-h-28 w-full rounded-2xl border border-brand-green/10 bg-white p-4 outline-none" placeholder="Ex: sans oignons, sauce à part..." />
              </label>
            </div>

            <div className="flex flex-col gap-4 rounded-[1.8rem] bg-[linear-gradient(145deg,#2F5E33,#3E281A)] p-5 text-white md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-white/72">Total sélection</p>
                <p className="mt-1 text-2xl font-semibold">{formatPrice(computedTotalPrice)}</p>
                <p className="mt-1 text-sm text-white/72">{isBurgerConfigurator ? 'Total de la sélection burgers' : `Prix unitaire ${formatPrice(computedUnitPrice)}`}</p>
                <p className="mt-2 text-sm text-white/72">
                  {isReady
                    ? isBurgerConfigurator
                      ? buildBurgerItems().map((item) => `${item.quantity} × ${item.name}`).join(' • ')
                      : getDisplayName(product, configurator, selectedOptions)
                    : 'Choisissez les options pour continuer'}
                </p>
              </div>
              <button
                type="button"
                disabled={!isReady}
                onClick={() => {
                  if (isBurgerConfigurator) {
                    onConfirm(buildBurgerItems());
                    onClose();
                    return;
                  }

                  const name = getDisplayName(product, configurator, selectedOptions);
                  onConfirm([
                    {
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
                    },
                  ]);
                  onClose();
                }}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-deepgreen disabled:cursor-not-allowed disabled:bg-white/50"
              >
                {isBurgerConfigurator ? 'Ajouter la sélection' : 'Ajouter au panier'}
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
