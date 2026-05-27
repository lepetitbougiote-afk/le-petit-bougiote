import { Bike, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../lib/utils';

export type OrderModeChoice = 'sur_place' | 'a_emporter' | 'delivery';

const options = [
  {
    id: 'sur_place' as const,
    title: 'Manger sur place',
    description: 'Je consulte la carte et je commande directement pour profiter du service sur place.',
    icon: UtensilsCrossed,
  },
  {
    id: 'a_emporter' as const,
    title: 'Click & Collect',
    description: 'Je prépare ma commande, je règle bientôt en ligne, puis je viens la récupérer.',
    icon: ShoppingBag,
  },
  {
    id: 'delivery' as const,
    title: 'Livraison locale',
    description: `Livraison sur Béziers avec un tarif fixe de ${formatPrice(4)} et confirmation attentive du créneau.`,
    icon: Bike,
  },
];

export function OrderModeSelector({
  title = 'Comment souhaitez-vous commander ?',
  description = 'Choisissez votre mode de service pour afficher le parcours le plus adapté.',
  onChoose,
  compact = false,
}: {
  title?: string;
  description?: string;
  onChoose: (choice: OrderModeChoice) => void;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-[2rem] border border-brand-green/10 bg-white shadow-[0_18px_45px_-34px_rgba(62,40,26,0.28)] ${compact ? 'p-5' : 'p-8'}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-green/70">Commander</p>
      <h2 className={`mt-3 font-semibold tracking-tight text-slate-950 ${compact ? 'text-2xl' : 'text-3xl'}`}>{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
      <div className={`mt-6 grid gap-4 ${compact ? 'md:grid-cols-1' : 'md:grid-cols-3'}`}>
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChoose(option.id)}
              className="rounded-[1.7rem] border border-brand-border bg-brand-offwhite p-5 text-left transition hover:border-brand-green/35 hover:bg-white"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-deepgreen">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-lg font-semibold text-slate-950">{option.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{option.description}</p>
            </button>
          );
        })}
      </div>
      <div className="mt-5 text-sm text-slate-500">
        Vous pouvez aussi
        {' '}
        <Link to="/contact" className="font-semibold text-brand-green">
          nous appeler
        </Link>
        {' '}
        si vous souhaitez confirmer un détail avant la commande.
      </div>
    </div>
  );
}
