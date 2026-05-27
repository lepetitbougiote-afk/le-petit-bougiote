import { useEffect, useState } from 'react';
import { menuService } from '../../services/menuService';
import type { Product } from '../../types';
import { formatPrice } from '../../lib/utils';

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    menuService.getProducts().then(setProducts);
  }, []);

  async function toggleAvailability(product: Product) {
    const updated = await menuService.updateProductAvailability(product.id, !product.isAvailable, product.availabilityNote);
    setProducts((current) => current.map((item) => (item.id === product.id && updated ? updated : item)));
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-slate-950">Produits</h1>
        <button type="button" className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white">Ajouter un produit</button>
      </div>
      <div className="mt-6 overflow-hidden rounded-[1.8rem] bg-white">
        <div className="grid grid-cols-[1.5fr_1fr_0.8fr_0.9fr] gap-4 border-b border-brand-green/10 px-6 py-4 text-sm font-semibold text-slate-500">
          <span>Produit</span>
          <span>Catégorie</span>
          <span>Prix</span>
          <span>Actions</span>
        </div>
        {products.map((product) => (
          <div key={product.id} className="grid grid-cols-[1.5fr_1fr_0.8fr_0.9fr] gap-4 border-b border-brand-green/10 px-6 py-4 text-sm last:border-b-0">
            <div>
              <p className="font-semibold text-slate-900">{product.name}</p>
              <p className="mt-1 text-slate-500">{product.description}</p>
              {!product.isAvailable && product.availabilityNote ? <p className="mt-2 text-amber-700">Note: {product.availabilityNote}</p> : null}
            </div>
            <span className="text-slate-700">{product.categoryId}</span>
            <span className="font-semibold text-slate-900">{formatPrice(product.price, product.priceLabel)}</span>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-full border border-brand-green/10 px-3 py-1.5 font-semibold text-slate-700">Éditer</button>
              <button type="button" onClick={() => void toggleAvailability(product)} className="rounded-full border border-brand-green/10 px-3 py-1.5 font-semibold text-slate-700">
                {product.isAvailable ? 'Désactiver' : 'Activer'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
