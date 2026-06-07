import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, ShieldMinus, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userService, type AdminProfileSummary } from '../../services/userService';

function getRoleLabel(profile: AdminProfileSummary) {
  if (profile.roles.includes('super_admin')) {
    return 'Super admin';
  }
  if (profile.roles.includes('admin')) {
    return 'Admin';
  }
  return 'Client';
}

export default function ProfilesAdminPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<AdminProfileSummary[]>([]);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loadingByUserId, setLoadingByUserId] = useState<Record<string, boolean>>({});
  const canManageRoles = user?.role === 'super_admin';

  async function loadProfiles() {
    const nextProfiles = await userService.getAdminProfiles();
    setProfiles(nextProfiles);
  }

  useEffect(() => {
    void loadProfiles();
  }, []);

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return profiles;
    }

    return profiles.filter((profile) =>
      profile.fullName.toLowerCase().includes(query) ||
      profile.email.toLowerCase().includes(query) ||
      profile.phone.includes(query),
    );
  }, [profiles, search]);

  async function setAdmin(profile: AdminProfileSummary, makeAdmin: boolean) {
    setFeedback('');
    setLoadingByUserId((current) => ({ ...current, [profile.id]: true }));
    const updated = await userService.setAdminRole(profile.id, makeAdmin);
    setLoadingByUserId((current) => ({ ...current, [profile.id]: false }));

    if (!updated) {
      setFeedback('Modification impossible. Seul un super admin peut modifier les rôles.');
      return;
    }

    await loadProfiles();
    setFeedback(makeAdmin ? `${profile.fullName} est maintenant admin.` : `${profile.fullName} n’est plus admin.`);
  }

  return (
    <section>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">Profils</h1>
          <p className="mt-2 text-sm text-slate-600">
            Gérez les comptes clients et les accès admin.
          </p>
        </div>
        <label className="relative block w-full max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un nom, email ou téléphone..."
            className="w-full rounded-2xl border border-brand-green/10 bg-white py-3 pl-11 pr-4 text-sm outline-none"
          />
        </label>
      </div>

      {!canManageRoles ? (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Vous pouvez consulter les profils. Pour modifier les rôles admin, connectez-vous avec un compte super admin.
        </p>
      ) : null}

      {feedback ? (
        <p className="mt-4 rounded-2xl border border-brand-green/10 bg-white px-4 py-3 text-sm text-slate-700">
          {feedback}
        </p>
      ) : null}

      <div className="mt-6 grid gap-3">
        {filteredProfiles.map((profile) => {
          const isAdmin = profile.roles.includes('admin') || profile.roles.includes('super_admin');
          const isSuperAdmin = profile.roles.includes('super_admin');
          const actionLoading = loadingByUserId[profile.id] ?? false;

          return (
            <article key={profile.id} className="rounded-[1.4rem] border border-brand-green/10 bg-white p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-950">{profile.fullName}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isAdmin ? 'bg-emerald-100 text-emerald-800' : 'bg-brand-cream text-slate-700'}`}>
                      {getRoleLabel(profile)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {profile.email || 'Email non renseigné'} {profile.phone ? `• ${profile.phone}` : ''}
                  </p>
                  {profile.address ? <p className="mt-1 text-sm text-slate-500">{profile.address}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!isAdmin ? (
                    <button
                      type="button"
                      disabled={!canManageRoles || actionLoading}
                      onClick={() => void setAdmin(profile, true)}
                      className="inline-flex items-center gap-2 rounded-full bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Rendre admin
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!canManageRoles || actionLoading || isSuperAdmin || profile.id === user?.id}
                      onClick={() => void setAdmin(profile, false)}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <ShieldMinus className="h-4 w-4" />
                      Retirer admin
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
