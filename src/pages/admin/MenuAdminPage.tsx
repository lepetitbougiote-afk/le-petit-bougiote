import { useEffect, useState } from 'react';
import { menuService } from '../../services/menuService';
import type { Category, Product } from '../../types';

export default function MenuAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    menuService.getCategories().then(setCategories);
    menuService.getProducts().then(setProducts);
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

  return (
    <section>
      <h1 className="text-3xl font-semibold text-slate-950">Vue menu</h1>
      <div className="mt-6 grid gap-4">
        {categories.map((category) => (
          <div key={category.id} className="rounded-[1.8rem] bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-950">{category.name}</h2>
              <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-slate-700">{products.filter((product) => product.categoryId === category.id).length} produits</span>
            </div>
            <div className="mt-4 grid gap-3">
              {products.filter((product) => product.categoryId === category.id).map((product) => (
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
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${product.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
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
                        onChange={(event) => setNoteDrafts((current) => ({ ...current, [product.id]: event.target.value }))}
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
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
