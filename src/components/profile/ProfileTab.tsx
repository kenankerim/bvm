import { Briefcase, Send, Star, Eye, LogOut, Loader2, UserRound, Building2, Lock } from 'lucide-react';
import type { FirebaseUser } from '@/lib/firebase';
import { useCollection } from '@/hooks/useCollection';
import { COMPANY_VACANCIES, type CompanyVacancy } from '@/lib/vacancies';
import type { Row } from '@/lib/db';
import { ProfileHeader, type ProfileRow } from './ProfileHeader';
import { PostComposer } from './PostComposer';
import { CvManager } from './CvManager';
import { VacancyManager } from './VacancyManager';
import { CompanyBlocks, type Application } from './CompanyBlocks';
import { cardClass, primaryBtn } from './ui';

type Role = 'jobseeker' | 'employer';
type View = Row & { viewer_uid: string; item_id: string };

export function ProfileTab({
  role, setRole, user, authLoading, onShowAuth, onSignOut, newVacancySignal,
}: {
  role: Role;
  setRole: (r: Role) => void;
  user: FirebaseUser | null;
  authLoading: boolean;
  onShowAuth: () => void;
  onSignOut: () => void;
  newVacancySignal: number;
}) {
  if (authLoading) {
    return (
      <div className="flex justify-center py-16" aria-label="Yüklənir">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-300" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <RoleSwitch role={role} setRole={setRole} />
        <section className={`${cardClass} text-center space-y-3 py-10`}>
          <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/15 flex items-center justify-center">
            <UserRound className="w-8 h-8 text-cyan-300" />
          </div>
          <h2 className="text-lg font-extrabold text-white">Profilinizə daxil olun</h2>
          <p className="text-xs text-slate-300">Paylaşım, CV və vakansiyaları idarə etmək üçün giriş edin.</p>
          <button onClick={onShowAuth} className={`${primaryBtn} px-6 py-3 text-sm`}>Daxil ol / Qeydiyyat</button>
        </section>
      </div>
    );
  }

  return <SignedInProfile role={role} setRole={setRole} user={user} onSignOut={onSignOut} newVacancySignal={newVacancySignal} />;
}

function SignedInProfile({ role, setRole, user, onSignOut, newVacancySignal }: {
  role: Role; setRole: (r: Role) => void; user: FirebaseUser; onSignOut: () => void; newVacancySignal: number;
}) {
  const uid = user.uid;
  const { items: profiles, add: addProfile, update: updateProfileRow } = useCollection<ProfileRow>('profiles', { firebase_uid: uid, role });
  const profile = profiles[0];
  const { items: myVacancies } = useCollection<CompanyVacancy>(COMPANY_VACANCIES, { firebase_uid: uid });
  const { items: sentApplications } = useCollection<Application>('applications', { applicant_uid: uid });
  const { items: receivedApplications } = useCollection<Application>('applications', { company_uid: uid });
  const { items: views } = useCollection<View>('views', { viewer_uid: uid });
  const { items: posts } = useCollection<Row>('posts', { firebase_uid: uid, role });

  const fallbackName = user.displayName?.trim() || (role === 'employer' ? 'Şirkətim' : 'İstifadəçi');
  const name = profile?.display_name || fallbackName;

  const saveProfile = async (patch: Partial<ProfileRow>) => {
    if (profile) await updateProfileRow(profile.id, patch);
    else await addProfile({ display_name: null, avatar_url: null, cover_url: null, ...patch });
  };

  const activity = role === 'employer'
    ? myVacancies.length + receivedApplications.length + posts.length
    : sentApplications.length + views.length + posts.length;
  const rating = Math.min(5, activity * 0.5);
  const ratingLabel = rating === 0 ? '0' : rating.toFixed(1);

  const stats = role === 'employer'
    ? [
        { icon: Briefcase, value: myVacancies.length, label: 'Vakansiya' },
        { icon: Send, value: receivedApplications.length, label: 'Müraciət' },
        { icon: Star, value: ratingLabel, label: 'Reytinq' },
      ]
    : [
        { icon: Eye, value: views.length, label: 'Baxış' },
        { icon: Send, value: sentApplications.length, label: 'Müraciət' },
        { icon: Star, value: ratingLabel, label: 'Reytinq' },
      ];

  return (
    <div className="space-y-4">
      <RoleSwitch role={role} setRole={setRole} />
      <ProfileHeader key={`${uid}-${role}`} name={name} role={role} profile={profile} onSave={saveProfile} />

      <div className="grid grid-cols-3 gap-2.5">
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="rounded-2xl bg-slate-900/90 border border-white/15 p-3 text-center shadow-lg shadow-black/20">
            <Icon className="w-4 h-4 mx-auto text-cyan-300 mb-1" aria-hidden="true" />
            <p className="text-lg font-black text-white tabular-nums">{value}</p>
            <p className="text-[10px] font-semibold text-slate-300">{label}</p>
          </div>
        ))}
      </div>

      <PostComposer uid={uid} role={role} />

      {role === 'jobseeker' ? (
        <CvManager uid={uid} />
      ) : (
        <>
          <VacancyManager uid={uid} companyName={name} openFormSignal={newVacancySignal} />
          <CompanyBlocks uid={uid} applications={receivedApplications} />
        </>
      )}

      <button
        onClick={onSignOut}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-500/15 border border-rose-400/40 text-rose-200 text-sm font-bold hover:bg-rose-500/25 transition-all"
      >
        <LogOut className="w-4 h-4" /> Çıxış
      </button>
    </div>
  );
}

function RoleSwitch({ role, setRole }: { role: Role; setRole: (r: Role) => void }) {
  const options = [
    { id: 'jobseeker' as const, label: 'İş Axtaran', icon: UserRound },
    { id: 'employer' as const, label: 'Şirkət', icon: Building2 },
  ];
  return (
    <div className={`${cardClass} !p-3`}>
      <p className="text-[11px] font-bold text-slate-300 mb-2 px-1">Rejim Dəyişdir</p>
      <div role="radiogroup" aria-label="Rejim" className="grid grid-cols-2 gap-2">
        {options.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="radio"
            aria-checked={role === id}
            onClick={() => setRole(id)}
            className={`h-12 w-full flex items-center justify-center gap-2 rounded-2xl text-sm font-bold border transition-all ${
              role === id
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black border-transparent shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/90 border-white/15 text-slate-100 hover:bg-slate-700/90'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {id === 'employer' && <Lock className={`w-3 h-3 ${role === id ? 'text-black' : 'text-amber-300'}`} aria-label="Premium" />}
          </button>
        ))}
      </div>
    </div>
  );
}
