import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { formatPrice } from '../../lib/utils';
import { StatusBadge } from '../ui/StatusBadge';

export function ProductCard({
  product,
  onAdd,
  onOpen,
  compact = false,
}: {
  product: Product;
  onAdd?: (product: Product) => void;
  onOpen?: (product: Product) => void;
  compact?: boolean;
}) {
  const actionLabel = product.productType === 'configurable' ? 'Choisir' : 'Ajouter';
  const unavailableLabel = product.availabilityNote?.trim() || 'Ce produit est momentanement indisponible.';

  return (
    <article className="overflow-hidden rounded-[1.8rem] border border-brand-border bg-white shadow-[0_18px_45px_-34px_rgba(62,40,26,0.35)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-offwhite">
        <img
          src={product.image}
          alt={product.imageAlt}
          className={`h-full w-full ${product.imageFit === 'contain' ? 'object-contain p-8' : 'object-cover'}`}
        />
        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(30,30,30,0.7))] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-lg font-semibold text-white">{product.name}</p>
            {product.isAvailable ? <StatusBadge tone="success">Disponible</StatusBadge> : <StatusBadge tone="warning">Indisponible</StatusBadge>}
          </div>
        </div>
      </div>
      <div className="p-5">
        <p className={`text-slate-600 ${compact ? 'text-sm leading-6' : 'text-sm leading-7'}`}>{product.description}</p>
        {!product.isAvailable ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            {unavailableLabel}
          </div>
        ) : null}
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-base font-semibold text-brand-deepgreen">{formatPrice(product.price, product.priceLabel)}</p>
          <div className="flex flex-wrap gap-2">
            {onOpen ? (
              <button type="button" disabled={!product.isAvailable} onClick={() => onOpen(product)} className="rounded-full border border-brand-border px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400">
                Choisir
              </button>
            ) : null}
            {onAdd ? (
              <button type="button" disabled={!product.isAvailable} onClick={() => onAdd(product)} className="rounded-full bg-brand-deepgreen px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
                {actionLabel}
              </button>
            ) : (
              <Link to="/livraison" className="rounded-full bg-brand-cream px-4 py-2 text-sm font-semibold text-slate-700">
                Livraison
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
