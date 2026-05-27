import { SEO } from '../../components/seo/SEO';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { brandAssets, business } from '../../data/business';

export default function AboutPage() {
  return (
    <>
      <SEO
        title="À propos | Le Petit Bougiote Béziers"
        description="Le Petit Bougiote est une adresse conviviale située rue Diderot à Béziers, avec une cuisine simple, généreuse et gourmande."
        path="/a-propos"
      />
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="overflow-hidden rounded-[2.4rem]">
          <img src={brandAssets.heroImage} alt="Le Petit Bougiote Coffee & Burger" className="h-full w-full object-cover" />
        </div>
        <div className="rounded-[2rem] bg-white p-8">
          <SectionHeading
            eyebrow="À propos"
            title="Une adresse conviviale située rue Diderot à Béziers"
            description="Derrière Le Petit Bougiote, il y a une vraie passion pour la cuisine simple, propre et généreuse. Après une expérience dans la restauration à Paris, le propriétaire a voulu apporter à Béziers le même niveau d’exigence, avec une attention particulière portée à la qualité, à l’accueil et au plaisir de bien manger."
          />
          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
            <p>
              Ici, l’objectif est simple : proposer une adresse conviviale où l’on peut venir pour un burger gourmand, une pause café, un dessert ou une commande à emporter, toujours dans un esprit familial et chaleureux.
            </p>
            <p>
              Lorsque vous poussez la porte du Petit Bougiote, vous êtes accueilli avec simplicité, sourire et attention, comme dans une adresse de quartier où l’on aime revenir.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              'Accueil personnel et attentionné',
              'Cuisine simple, soignée et généreuse',
              'Pause café, desserts et burgers gourmands',
              `${business.phonePrimary} • ${business.phoneSecondary}`,
            ].map((item) => (
              <div key={item} className="rounded-3xl bg-brand-cream p-5 text-sm leading-7 text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
