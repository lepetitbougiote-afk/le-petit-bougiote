import { Link } from 'react-router-dom';
import logoImage from '../../assets/logo.png';
import { useRestaurant } from '../../contexts/RestaurantContext';

export function PublicFooter() {
  const { settings } = useRestaurant();

  return (
    <footer className="mt-20 border-t border-brand-wood/30 bg-[linear-gradient(180deg,#345d33,#3E281A)] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Le Petit Bougiote Coffee & Burger" className="h-14 w-14 rounded-full object-cover ring-1 ring-white/20" />
            <div>
              <p className="text-lg font-semibold">{settings.name}</p>
              <p className="text-sm text-white/75">{settings.brandLine}</p>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/78">
            Une adresse chaleureuse où l’on retrouve l’esprit des cafés méditerranéens, avec des burgers gourmands, des pauses café et une cuisine simple, généreuse et conviviale.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/65">Infos</p>
          <div className="mt-4 space-y-3 text-sm text-white/80">
            <p>{settings.address}, {settings.postalCode} {settings.city}</p>
            <p>{settings.phonePrimary}</p>
            <p>{settings.phoneSecondary}</p>
            <p>Sur place, à emporter, coffee & desserts</p>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/65">Liens</p>
          <div className="mt-4 grid gap-3 text-sm text-white/80">
            <Link to="/menu">Menu</Link>
            <Link to="/livraison">Livraison</Link>
            <Link to="/compte">Compte client</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/blog">Guides locaux</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
