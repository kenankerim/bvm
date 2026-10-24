import { useState } from 'react';
import { X, User, Bell, BellOff, Lock, Mail, Phone, Save, Loader2, Shield, Briefcase } from 'lucide-react';
import { firebaseAuth } from '@/lib/firebase';
import { updatePassword, signOut, updateProfile } from 'firebase/auth';
import type { FirebaseUser } from '@/lib/firebase';

export function SettingsModal({ onClose, user }: { onClose: () => void; user: FirebaseUser | null }) {
  const [activeSection, setActiveSection] = useState<'profile' | 'notifications' | 'security'>('profile');
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [profession, setProfession] = useState('');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [notificationsOn, setNotificationsOn] = useState(() => {
    try { return localStorage.getItem('bvm_notifications') !== 'off'; } catch { return true; }
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setMsg(null);
    try {
      if (fullName.trim() && fullName !== user.displayName) {
        await updateProfile(user, { displayName: fullName.trim() });
      }
      setMsg({ type: 'ok', text: 'Profil məlumatları saxlanıldı.' });
    } catch {
      setMsg({ type: 'err', text: 'Saxlamaq alınmadı. Yenidən cəhd edin.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setMsg(null);
    if (!newPassword || newPassword.length < 6) {
      setMsg({ type: 'err', text: 'Şifrə ən azı 6 simvol olmalıdır.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setMsg({ type: 'err', text: 'Şifrələr üst-üstə düşmür.' });
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      await updatePassword(user, newPassword);
      setMsg({ type: 'ok', text: 'Şifrə uğurla dəyişdirildi.' });
      setNewPassword('');
      setConfirmNewPassword('');
    } catch {
      setMsg({ type: 'err', text: 'Şifrə dəyişmək üçün yenidən daxil olun.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleNotifications = (on: boolean) => {
    setNotificationsOn(on);
    localStorage.setItem('bvm_notifications', on ? 'on' : 'off');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full max-w-md bg-slate-900/85 border border-white/15 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/50 backdrop-blur-2xl animate-slide-up max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 px-6 py-4 bg-slate-900/85 backdrop-blur-2xl rounded-t-3xl">
          <h2 className="text-base font-bold text-white tracking-tight">Ayarlar</h2>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 border border-white/15 text-slate-300 hover:text-white hover:bg-white/20 transition-all active:scale-95">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 pb-8" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
          <div className="flex gap-1.5 bg-white/5 border border-white/10 rounded-2xl p-1.5">
            <button onClick={() => setActiveSection('profile')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeSection === 'profile' ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200' : 'text-slate-400 border border-transparent hover:text-slate-200'}`}>
              <User className="w-3.5 h-3.5" /> Profil
            </button>
            <button onClick={() => setActiveSection('notifications')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeSection === 'notifications' ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200' : 'text-slate-400 border border-transparent hover:text-slate-200'}`}>
              <Bell className="w-3.5 h-3.5" /> Bildiriş
            </button>
            <button onClick={() => setActiveSection('security')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeSection === 'security' ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200' : 'text-slate-400 border border-transparent hover:text-slate-200'}`}>
              <Shield className="w-3.5 h-3.5" /> Təhlükəsizlik
            </button>
          </div>

          {msg && (
            <div className={`rounded-2xl px-4 py-2.5 text-xs backdrop-blur-xl ${msg.type === 'ok' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'}`}>{msg.text}</div>
          )}

          {activeSection === 'profile' && (
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ad və Soyad" className="w-full bg-white/10 border border-white/15 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/80 transition-all" />
              </div>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="Peşə / Vəzifə" className="w-full bg-white/10 border border-white/15 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/80 transition-all" />
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" value={user?.email || ''} disabled placeholder="E-poçt" className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-400 cursor-not-allowed" />
              </div>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefon nömrəsi" className="w-full bg-white/10 border border-white/15 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/80 transition-all" />
              </div>
              <button onClick={handleSaveProfile} disabled={saving || !user} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold text-sm hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Saxla</>}
              </button>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white/10 border border-white/15 rounded-2xl p-4 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  {notificationsOn ? <Bell className="w-5 h-5 text-cyan-400" /> : <BellOff className="w-5 h-5 text-slate-500" />}
                  <div><p className="text-sm font-semibold text-white">Bildirişlər</p><p className="text-[10px] text-slate-400">Vakansiya və mesaj bildirişləri</p></div>
                </div>
                <button onClick={() => toggleNotifications(!notificationsOn)} className={`relative w-12 h-6 rounded-full transition-all ${notificationsOn ? 'bg-cyan-500' : 'bg-white/15'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${notificationsOn ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between bg-white/10 border border-white/15 rounded-2xl p-4 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-cyan-400" />
                  <div><p className="text-sm font-semibold text-white">E-poçt bildirişləri</p><p className="text-[10px] text-slate-400">Həftəlik vakansiya xülasəsi</p></div>
                </div>
                <button className="relative w-12 h-6 rounded-full bg-cyan-500 transition-all">
                  <span className="absolute top-0.5 left-6 w-5 h-5 rounded-full bg-white shadow-md transition-all" />
                </button>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Yeni şifrə" className="w-full bg-white/10 border border-white/15 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/80 transition-all" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Yeni şifrə (təkrar)" className="w-full bg-white/10 border border-white/15 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/80 transition-all" />
              </div>
              <button onClick={handleChangePassword} disabled={saving || !user} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold text-sm hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock className="w-4 h-4" /> Şifrəni Dəyiş</>}
              </button>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-slate-200">Aktiv Sessiyalar</p>
                <div className="flex items-center justify-between text-xs"><span className="text-slate-400">Bu cihaz</span><span className="text-emerald-400 font-semibold">Aktiv</span></div>
                <button onClick={async () => { await signOut(firebaseAuth); onClose(); }} className="w-full py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold hover:bg-rose-500/20 transition-all mt-2">Bütün sessiyaları sonlandır</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
