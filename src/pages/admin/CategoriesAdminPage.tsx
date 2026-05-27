import { useEffect, useState } from 'react';
import { menuService } from '../../services/menuService';
import type { Category } from '../../types';

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    menuService.getCategories().then(setCategories);
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-slate-950">Catégories</h1>
        <button type="button" className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white">Ajouter une catégorie</button>
      </div>
      <div className="mt-6 grid gap-4">
        {categories.map((category) => (
          <div key={category.id} className="rounded-[1.8rem] bg-white p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">{category.name}</h2>
                <p className="mt-2 text-sm text-slate-600">{category.description}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="rounded-full border border-brand-green/10 px-4 py-2 text-sm font-semibold text-slate-700">Éditer</button>
                <button type="button" className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700">Supprimer</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
