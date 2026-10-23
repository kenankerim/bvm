import { useRef, useState } from 'react';
import { Camera, ImagePlus, Lock, Loader2, Pencil, Check, X } from 'lucide-react';
import { checkUpload, compressImage, getInitials, IMAGE_ACCEPT } from '@/lib/files';
import { ErrorText, inputClass } from './ui';

export type ProfileRow = {
  id: string;
  created_at: string;
  firebase_uid: string;
  role: 'jobseeker' | 'employer';
  display_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
};

export function ProfileHeader({
  name, role, profile, onSave,
}: {
  name: string;
  role: 'jobseeker' | 'employer';
  profile: ProfileRow | undefined;
  onSave: (patch: Partial<ProfileRow>) => Promise<void>;
}) {
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'avatar' | 'cover' | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>, kind: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const check = checkUpload(file, 'image');
    if (!check.ok) return setError(check.error);
    setError('');
    setBusy(kind);
    try {
      const url = await compressImage(file, kind === 'avatar' ? 320 : 1200);
      await onSave(kind === 'avatar' ? { avatar_url: url } : { cover_url: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şəkil yüklənmədi.');
    } finally {
      setBusy(null);
    }
  };

  const saveName = async () => {
    const value = draftName.trim();
    if (!value) return;
    await onSave({ display_name: value });
    setEditing(false);
  };

  const initials = getInitials(name);
  const label = role === 'employer' ? 'Şirkət' : 'İş Axtaran';

  return (
    <section className="rounded-3xl overflow-hidden bg-slate-900/90 border border-white/15 shadow-xl shadow-black/30">
      <div className="relative h-36 bg-gradient-to-br from-cyan-600/50 via-blue-700/50 to-indigo-800/60">
        {profile?.cover_url && (
          <img src={profile.cover_url} alt="Örtük şəkli" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <button
          onClick={() => coverRef.current?.click()}
          disabled={busy !== null}
          className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-white/20 text-[11px] font-semibold text-white backdrop-blur-md hover:bg-slate-950/90 transition-all"
        >
          {busy === 'cover' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
          Örtük şəkli
        </button>
        <input ref={coverRef} type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={(e) => handleImage(e, 'cover')} />
      </div>

      <div className="px-5 pb-5 -mt-12 relative">
        <div className="relative w-24 h-24">
          <div className="w-24 h-24 rounded-full border-4 border-slate-900 bg-gradient-to-tr from-cyan-400 to-blue-600 overflow-hidden flex items-center justify-center text-2xl font-black text-white shadow-lg">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={`${name} profil şəkli`} className="w-full h-full object-cover" />
            ) : (
              <span aria-label={name}>{initials || '?'}</span>
            )}
          </div>
          <button
            onClick={() => avatarRef.current?.click()}
            disabled={busy !== null}
            aria-label="Profil şəklini dəyiş"
            className="absolute bottom-0 right-0 p-2 rounded-full bg-cyan-400 text-black border-2 border-slate-900 hover:bg-cyan-300 transition-all"
          >
            {busy === 'avatar' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          </button>
          <input ref={avatarRef} type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={(e) => handleImage(e, 'avatar')} />
        </div>

        <div className="mt-3 space-y-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className={inputClass}
                aria-label="Ad"
                autoFocus
              />
              <button onClick={saveName} aria-label="Yadda saxla" className="p-2 rounded-lg bg-cyan-400 text-black">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setEditing(false)} aria-label="Ləğv et" className="p-2 rounded-lg bg-white/10 text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-xl font-extrabold text-white text-balance">{name}</h2>
              {role === 'employer' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[10px] font-extrabold">
                  Premium <Lock className="w-3 h-3" aria-label="kilidli" />
                </span>
              )}
              <button
                onClick={() => { setDraftName(name); setEditing(true); }}
                aria-label="Adı redaktə et"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <p className="text-xs font-semibold text-cyan-300">{label}</p>
        </div>
        {error && <div className="mt-3"><ErrorText>{error}</ErrorText></div>}
      </div>
    </section>
  );
}
