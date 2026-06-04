import { FormEvent, useEffect, useState } from 'react';
import { type MenuCardConfig, type MenuCardSectionKey } from '../../data/menuCards';
import { menuService } from '../../services/menuService';

type MenuCardFormState = {
  key: string;
  title: string;
  description: string;
  sectionKeys: MenuCardSectionKey[];
  sortOrder: string;
  isActive: boolean;
};

const SECTION_KEY_OPTIONS: Array<{ key: MenuCardSectionKey; label: string }> = [
  { key: 'burgers', label: 'Burgers' },
  { key: 'accompagnements', label: 'Accompagnements' },
  { key: 'smoothies', label: 'Smoothies' },
  { key: 'boissons-froides', label: 'Boissons froides' },
  { key: 'petit-dejeuner', label: 'Petit-déjeuner' },
  { key: 'cafes-classiques', label: 'Cafés classiques' },
  { key: 'boissons-chaudes-simples', label: 'Boissons chaudes simples' },
  { key: 'boissons-gourmandes', label: 'Boissons gourmandes' },
  { key: 'formule-gourmande', label: 'Formule gourmande' },
  { key: 'desserts', label: 'Desserts' },
  { key: 'gourmandises', label: 'Gourmandises' },
];

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createFormState(card?: MenuCardConfig): MenuCardFormState {
  return {
    key: card?.key ?? '',
    title: card?.title ?? '',
    description: card?.description ?? '',
    sectionKeys: card?.sectionKeys ?? [],
    sortOrder: String(card?.sortOrder ?? 1),
    isActive: card?.isActive ?? true,
  };
}

export default function CategoriesAdminPage() {
  const [cards, setCards] = useState<MenuCardConfig[]>([]);
  const [form, setForm] = useState<MenuCardFormState>(() => createFormState());
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    menuService.getMenuCards().then(setCards);
  }, []);

  function openCreateModal() {
    setEditingCardId(null);
    setForm(createFormState());
    setIsModalOpen(true);
  }

  function openEditModal(card: MenuCardConfig) {
    setEditingCardId(card.id);
    setForm(createFormState(card));
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingCardId(null);
  }

  function toggleSectionKey(sectionKey: MenuCardSectionKey) {
    setForm((current) => ({
      ...current,
      sectionKeys: current.sectionKeys.includes(sectionKey)
        ? current.sectionKeys.filter((key) => key !== sectionKey)
        : [...current.sectionKeys, sectionKey],
    }));
  }

  async function handleDelete(card: MenuCardConfig) {
    const confirmed = window.confirm(`Supprimer la carte "${card.title}" ?`);
    if (!confirmed) {
      return;
    }

    const deleted = await menuService.deleteMenuCard(card.id);
    if (!deleted) {
      setFeedback('Suppression impossible.');
      return;
    }

    setCards((current) => current.filter((item) => item.id !== card.id));
    setFeedback(`"${card.title}" a été supprimée.`);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback('');

    const parsedSortOrder = Number(form.sortOrder);
    const normalizedKey = slugify(form.key || form.title);

    const payload: MenuCardConfig = {
      id: editingCardId ?? `temp-${normalizedKey}`,
      key: normalizedKey,
      title: form.title.trim(),
      description: form.description.trim(),
      sectionKeys: form.sectionKeys,
      sortOrder: Number.isFinite(parsedSortOrder) ? parsedSortOrder : 1,
      isActive: form.isActive,
    };

    const saved = editingCardId
      ? await menuService.updateMenuCard(editingCardId, payload)
      : await menuService.createMenuCard(payload);

    setIsSaving(false);

    if (!saved) {
      setFeedback('Enregistrement impossible.');
      return;
    }

    setCards((current) => {
      if (editingCardId) {
        return current
          .map((item) => (item.id === editingCardId ? saved : item))
          .sort((a, b) => a.sortOrder - b.sortOrder);
      }

      return [...current, saved].sort((a, b) => a.sortOrder - b.sortOrder);
    });

    setFeedback(editingCardId ? 'Carte mise à jour.' : 'Carte ajoutée.');
    closeModal();
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-slate-950">Catégories visibles</h1>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white"
        >
          Ajouter une catégorie
        </button>
      </div>

      {feedback ? (
        <p className="mt-4 rounded-2xl border border-brand-green/10 bg-white px-4 py-3 text-sm text-slate-700">
          {feedback}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4">
        {cards.map((card) => (
          <div key={card.id} className="rounded-[1.8rem] bg-white p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">{card.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{card.description}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-brand-green/70">
                  {card.sectionKeys.join(' • ')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(card)}
                  className="rounded-full border border-brand-green/10 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Éditer
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(card)}
                  className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/40 px-4">
          <div className="w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-slate-950">
                {editingCardId ? 'Éditer la catégorie visible' : 'Ajouter une catégorie visible'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-brand-green/10 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Fermer
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Titre
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                        key: current.key ? current.key : slugify(event.target.value),
                      }))
                    }
                    required
                    className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Clé
                  <input
                    value={form.key}
                    onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))}
                    required
                    className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700 md:col-span-2">
                  Description
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    required
                    className="mt-2 min-h-28 w-full rounded-2xl border border-brand-green/10 bg-brand-cream p-4 outline-none"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Ordre
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.sortOrder}
                    onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                    required
                    className="mt-2 w-full rounded-2xl border border-brand-green/10 bg-brand-cream px-4 py-3 outline-none"
                  />
                </label>
              </div>

              <div className="rounded-2xl bg-brand-cream p-4">
                <p className="text-sm font-medium text-slate-700">Sections incluses</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {SECTION_KEY_OPTIONS.map((option) => (
                    <label key={option.key} className="inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.sectionKeys.includes(option.key)}
                        onChange={() => toggleSectionKey(option.key)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              <label className="inline-flex items-center gap-3 rounded-2xl bg-brand-cream px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                />
                Catégorie visible active
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSaving ? 'Enregistrement...' : editingCardId ? 'Mettre à jour' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-brand-green/10 px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
