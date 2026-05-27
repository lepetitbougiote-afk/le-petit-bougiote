import { FormEvent, useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { BusinessSettings } from '../../types';

function createInitialState(settings: BusinessSettings) {
  return {
    name: settings.name,
    brandLine: settings.brandLine,
    address: settings.address,
    postalCode: settings.postalCode,
    city: settings.city,
    mapUrl: settings.mapUrl,
    phonePrimary: settings.phonePrimary,
    phoneSecondary: settings.phoneSecondary,
    announcement: settings.announcement,
    orderingEnabled: settings.orderingEnabled,
    googleAnalyticsMeasurementId: settings.googleAnalyticsMeasurementId ?? '',
  };
}

export default function SettingsAdminPage() {
  const [form, setForm] = useState(() =>
    createInitialState({
      name: 'Le Petit Bougiote',
      brandLine: 'Coffee & Burger',
      address: '28 Rue Diderot',
      postalCode: '34500',
      city: 'Béziers',
      mapUrl: '',
      phonePrimary: '',
      phoneSecondary: '',
      reviewUrl: '',
      leaveReviewUrl: '',
      orderModeLabel: '',
      services: [],
      rating: 5,
      reviewCountLabel: '~30 avis',
      priceRange: '10–20 €',
      openingHours: [],
      announcement: '',
      orderingEnabled: true,
      googleAnalyticsMeasurementId: '',
    }),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    adminService.getRestaurantSettings().then((settings) => {
      setForm(createInitialState(settings));
      setLoading(false);
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    await adminService.updateRestaurantSettings({
      name: form.name,
      brandLine: form.brandLine,
      address: form.address,
      postalCode: form.postalCode,
      city: form.city,
      mapUrl: form.mapUrl,
      phonePrimary: form.phonePrimary,
      phoneSecondary: form.phoneSecondary,
      announcement: form.announcement,
      orderingEnabled: form.orderingEnabled,
      googleAnalyticsMeasurementId: form.googleAnalyticsMeasurementId,
    });
    setSaving(false);
    setMessage('Paramètres enregistrés.');
  }

  return (
    <section>
      <h1 className="text-3xl font-semibold text-slate-950">Paramètres</h1>
      <div className="mt-6 rounded-[1.8rem] bg-white p-6">
        {loading ? (
          <p className="text-sm text-slate-500">Chargement des paramètres...</p>
        ) : (
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Nom
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Brand line
                <input
                  value={form.brandLine}
                  onChange={(event) => setForm((current) => ({ ...current, brandLine: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                />
              </label>
              <label className="text-sm font-medium text-slate-700 md:col-span-2">
                Adresse
                <input
                  value={form.address}
                  onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Code postal
                <input
                  value={form.postalCode}
                  onChange={(event) => setForm((current) => ({ ...current, postalCode: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Ville
                <input
                  value={form.city}
                  onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                />
              </label>
              <label className="text-sm font-medium text-slate-700 md:col-span-2">
                Google Maps
                <input
                  value={form.mapUrl}
                  onChange={(event) => setForm((current) => ({ ...current, mapUrl: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Téléphone principal
                <input
                  value={form.phonePrimary}
                  onChange={(event) => setForm((current) => ({ ...current, phonePrimary: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Téléphone secondaire
                <input
                  value={form.phoneSecondary}
                  onChange={(event) => setForm((current) => ({ ...current, phoneSecondary: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                />
              </label>
              <label className="text-sm font-medium text-slate-700 md:col-span-2">
                Message d’annonce
                <textarea
                  value={form.announcement}
                  onChange={(event) => setForm((current) => ({ ...current, announcement: event.target.value }))}
                  className="mt-2 min-h-28 w-full rounded-2xl border border-brand-green/10 bg-brand-cream p-4 outline-none"
                />
              </label>
              <label className="text-sm font-medium text-slate-700 md:col-span-2">
                Google Analytics Measurement ID
                <input
                  value={form.googleAnalyticsMeasurementId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      googleAnalyticsMeasurementId: event.target.value,
                    }))
                  }
                  placeholder="G-XXXXXXXXXX"
                  className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                />
              </label>
            </div>
            <label className="inline-flex items-center gap-3 rounded-2xl bg-brand-cream px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.orderingEnabled}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    orderingEnabled: event.target.checked,
                  }))
                }
              />
              Commande activée
            </label>
            {message ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={saving}
              className="w-fit rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {saving ? 'Enregistrement...' : 'Mettre à jour'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
