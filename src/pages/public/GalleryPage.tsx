import { useMemo, useState } from 'react';
import { SEO } from '../../components/seo/SEO';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { galleryImages } from '../../data/gallery';
import type { GalleryCategory } from '../../types';

const filters: Array<GalleryCategory | 'Tous'> = ['Tous', 'Ambiance', 'Terrasse', 'Burgers', 'Menu', 'Desserts', 'Cafes'];

export default function GalleryPage() {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>('Tous');

  const images = useMemo(() => {
    return galleryImages.filter((image) => activeFilter === 'Tous' || image.category === activeFilter);
  }, [activeFilter]);

  return (
    <>
      <SEO
        title="Galerie | Le Petit Bougiote Coffee & Burger Béziers"
        description="Parcourez la galerie du restaurant : burgers, cafés, desserts, ambiance et visuels de la carte."
        path="/galerie"
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Galerie"
          title="Un aperçu du lieu et de la carte"
          description="Salon, terrasse, burgers, cafés et douceurs : un aperçu simple et chaleureux de l’univers du restaurant."
          align="center"
        />
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${activeFilter === filter ? 'bg-brand-green text-white' : 'bg-white text-slate-700'}`}
            >
              {filter === 'Tous' ? 'Tous' : filter}
            </button>
          ))}
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {images.map((image) => (
            <article key={image.id} className="overflow-hidden rounded-[2rem] border border-brand-green/10 bg-white">
              <div className="aspect-[4/3] overflow-hidden bg-brand-cream">
                <img src={image.image} alt={image.alt} className="h-full w-full object-cover" />
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-green/70">{image.category}</p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">{image.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">Une sélection pensée pour refléter le lieu, l’ambiance et les produits de la maison.</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
