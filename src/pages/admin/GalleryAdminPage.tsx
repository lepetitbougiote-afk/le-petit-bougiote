import { galleryImages } from '../../data/gallery';

export default function GalleryAdminPage() {
  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-slate-950">Galerie</h1>
        <button type="button" className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white">Ajouter une image</button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {galleryImages.map((image) => (
          <article key={image.id} className="overflow-hidden rounded-[1.8rem] bg-white">
            <div className="aspect-[4/3] bg-brand-cream">
              <img src={image.image} alt={image.alt} className="h-full w-full object-cover" />
            </div>
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-green/70">{image.category}</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">{image.title}</h2>
              <div className="mt-4 flex gap-2">
                <button type="button" className="rounded-full border border-brand-green/10 px-4 py-2 text-sm font-semibold text-slate-700">Masquer</button>
                <button type="button" className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700">Supprimer</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
