import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { OpeningHour } from '../../types';

export default function HoursAdminPage() {
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingHours, setSavingHours] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    adminService.getRestaurantSettings().then((settings) => {
      setOpeningHours(settings.openingHours);
      setAnnouncement(settings.announcement);
      setLoading(false);
    });
  }, []);

  async function saveHours() {
    setSavingHours(true);
    setMessage('');
    await adminService.updateOpeningHours(openingHours);
    setSavingHours(false);
    setMessage('Horaires enregistrés.');
  }

  async function saveAnnouncement() {
    setSavingAnnouncement(true);
    setMessage('');
    await adminService.updateRestaurantSettings({ announcement });
    setSavingAnnouncement(false);
    setMessage('Annonce enregistrée.');
  }

  return (
    <section>
      <h1 className="text-3xl font-semibold text-slate-950">Horaires</h1>
      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.8rem] bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-950">Horaires hebdomadaires</h2>
          {loading ? (
            <p className="mt-5 text-sm text-slate-500">Chargement des horaires...</p>
          ) : (
            <>
              <div className="mt-5 grid gap-4">
                {openingHours.map((item) => (
                  <div key={item.day} className="grid gap-3 rounded-3xl bg-brand-cream p-4 md:grid-cols-[160px_1fr_1fr_auto] md:items-center">
                    <span className="font-medium text-slate-900">{item.day}</span>
                    <input
                      type="time"
                      value={item.opensAt ?? ''}
                      disabled={item.isClosed}
                      onChange={(event) =>
                        setOpeningHours((current) =>
                          current.map((hour) =>
                            hour.day === item.day ? { ...hour, opensAt: event.target.value || null } : hour,
                          ),
                        )
                      }
                      className="rounded-2xl border border-brand-green/10 bg-white px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-white/70"
                    />
                    <input
                      type="time"
                      value={item.closesAt ?? ''}
                      disabled={item.isClosed}
                      onChange={(event) =>
                        setOpeningHours((current) =>
                          current.map((hour) =>
                            hour.day === item.day ? { ...hour, closesAt: event.target.value || null } : hour,
                          ),
                        )
                      }
                      className="rounded-2xl border border-brand-green/10 bg-white px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-white/70"
                    />
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={item.isClosed}
                        onChange={(event) =>
                          setOpeningHours((current) =>
                            current.map((hour) =>
                              hour.day === item.day
                                ? {
                                    ...hour,
                                    isClosed: event.target.checked,
                                    opensAt: event.target.checked ? null : hour.opensAt,
                                    closesAt: event.target.checked ? null : hour.closesAt,
                                  }
                                : hour,
                            ),
                          )
                        }
                      />
                      Fermé
                    </label>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => void saveHours()}
                disabled={savingHours}
                className="mt-5 rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {savingHours ? 'Enregistrement...' : 'Enregistrer les horaires'}
              </button>
            </>
          )}
        </div>
        <div className="rounded-[1.8rem] bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-950">Fermeture temporaire / message</h2>
          <textarea
            value={announcement}
            onChange={(event) => setAnnouncement(event.target.value)}
            className="mt-5 min-h-40 w-full rounded-3xl border border-brand-green/10 bg-brand-cream p-4 outline-none"
          />
          <button
            type="button"
            onClick={() => void saveAnnouncement()}
            disabled={savingAnnouncement}
            className="mt-5 rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {savingAnnouncement ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          {message ? (
            <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
