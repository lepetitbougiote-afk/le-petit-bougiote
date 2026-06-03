import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';
import { Reveal } from '../../components/ui/Reveal';
import { clearPendingCheckoutSession } from '../../lib/stripeCheckout';

export default function CheckoutCancelPage() {
  useEffect(() => {
    clearPendingCheckoutSession();
  }, []);

  return (
    <>
      <SEO
        title="Paiement annulé | Le Petit Bougiote Béziers"
        description="Votre paiement a été annulé, votre panier est conservé pour vous permettre de reprendre la commande."
        path="/checkout/cancel"
      />
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-green/70">
            Stripe Checkout
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            Paiement annulé
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
            Aucun paiement n’a été enregistré. Votre panier reste disponible pour vous permettre
            de reprendre votre commande quand vous le souhaitez.
          </p>
        </Reveal>

        <Reveal className="mt-8 rounded-[2rem] bg-white p-8" delay={100}>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/checkout"
              className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white"
            >
              Revenir au checkout
            </Link>
            <Link
              to="/panier"
              className="rounded-full border border-brand-green/10 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Voir le panier
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
