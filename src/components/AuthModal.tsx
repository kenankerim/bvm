import { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Provider = 'google' | 'apple' | 'azure' | 'linkedin' | 'line';

const providerLabels: Record<Provider, string> = {
  google: 'Google ilə daxil ol',
  apple: 'Apple ilə daxil ol',
  azure: 'Microsoft ilə daxil ol',
  linkedin: 'LinkedIn ilə daxil ol',
  line: 'LINE ilə daxil ol',
};

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" fill="#34A853"/>
      <path d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" className2="text-white">
      <path d="M17.05 12.04c-.03-2.66 2.17-3.94 2.27-4-1.24-1.81-3.17-2.06-3.85-2.08-1.64-.17-3.2.97-4.03.97-.84 0-2.12-.94-3.49-.92-1.79.03-3.45 1.04-4.37 2.65-1.86 3.23-.47 8.01 1.34 10.63.88 1.28 1.93 2.72 3.3 2.67 1.33-.05 1.83-.86 3.43-.86 1.6 0 2.06.86 3.46.83 1.43-.03 2.34-1.31 3.21-2.6 1.01-1.49 1.43-2.93 1.45-3-.03-.02-2.78-1.07-2.81-4.25ZM14.62 4.44c.73-.89 1.22-2.11 1.09-3.34-1.05.04-2.33.7-3.08 1.58-.67.78-1.26 2.04-1.1 3.24 1.17.09 2.37-.59 3.09-1.48Z"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022"/>
      <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00"/>
      <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF"/>
      <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/>
    </svg>
  );
}

function LineIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.33 2 1.71 5.57 1.71 9.97c0 3.9 3.67 7.16 8.63 7.84.34.07.8.23.91.52.1.27.07.68.03.95l-.15.9c-.05.27-.21 1.06.91.58s6.05-3.56 8.25-6.1c1.52-1.66 2.25-3.35 2.25-5.19C22.46 5.57 17.84 2 12 2Zm-4.8 7.6h-1.1v4.03c0 .3-.25.54-.54.54-.3 0-.54-.24-.54-.54V9.6h-1.1a.55.55 0 0 1-.55-.54c0-.3.25-.54.55-.54h3.28c.3 0 .55.24.55.54 0 .3-.25.54-.55.54Zm10.82 2.68c0 .16-.06.3-.17.41-.25.24-.65.24-.9 0l-1.86-1.78-.04-.04v1.45c0 .3-.24.54-.54.54-.3 0-.55-.24-.55-.54v-4.04c0-.29.25-.54.55-.54.3 0 .54.25.54.54v1.46l.04-.04 1.86-1.78c.25-.25.65-.25.9 0 .11.11.17.25.17.41 0 .16-.06.3-.17.41l-1.5 1.44 1.5 1.44c.11.1.17.25.17.4ZM14.7 13.7h-2.05c-.3 0-.55-.24-.55-.54V9.06c0-.3.25-.54.55-.54.3 0 .54.24.54.54v3.56h1.5c.3 0 .54.24.54.54 0 .3-.24.54-.54.54Z"/>
    </svg>
  );
}

const providerIcons: Record<Provider, () => JSX.Element> = {
  google: GoogleIcon,
  apple: AppleIcon,
  azure: MicrosoftIcon,
  linkedin: LinkedInIcon,
  line: LineIcon,
};

const providerColors: Record<Provider, string> = {
  google: 'hover:border-red-400/40 hover:bg-red-500/5',
  apple: 'hover:border-slate-300/40 hover:bg-white/15',
  azure: 'hover:border-blue-400/40 hover:bg-blue-500/5',
  linkedin: 'hover:border-sky-400/40 hover:bg-sky-500/10',
  line: 'hover:border-green-400/40 hover:bg-green-500/10',
};

const providerIconColors: Record<Provider, string> = {
  google: '',
  apple: 'text-white',
  azure: '',
  linkedin: 'text-[#0A66C2]',
  line: 'text-[#06C755]',
};

export function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyProvider, setBusyProvider] = useState<string | null>(null);

  const handleOAuth = async (provider: Provider) => {
    setAuthError(null);
    setBusyProvider(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });
      if (error) {
        setAuthError(error.message);
        setBusyProvider(null);
      }
    } catch {
      setAuthError('Bağlantı xətası baş verdi. Bir az sonra yenidən cəhd edin.');
      setBusyProvider(null);
    }
  };

  const handleEmailAuth = async () => {
    setAuthError(null);
    if (!email.trim() || !password.trim()) {
      setAuthError('E-poçt və şifrə tələb olunur.');
      return;
    }
    setBusy(true);
    try {
      const { error } = mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
      if (error) {
        setAuthError(error.message);
      } else {
        onClose();
      }
    } catch {
      setAuthError('Bağlantı xətası baş verdi.');
    } finally {
      setBusy(false);
    }
  };

  const providers: Provider[] = ['google', 'apple', 'azure', 'linkedin', 'line'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-2xl p-0 sm:p-4">
      <div className="w-full max-w-md bg-white/10 border border-white/20 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/30 backdrop-blur-2xl animate-slide-up max-h-[92vh] overflow-y-auto">
        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/15 px-6 py-4 bg-white/10 backdrop-blur-2xl rounded-t-3xl">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center font-black text-lg shadow-lg shadow-cyan-500/30 border border-white/20">
              B
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">BVM Giriş</h2>
              <p className="text-[10px] text-cyan-300/80 font-medium tracking-wide uppercase">Karyera & İş</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 border border-white/15 text-slate-300 hover:text-white hover:bg-white/20 transition-all active:scale-95 backdrop-blur-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* WELCOME TEXT */}
          <div className="text-center space-y-1 pb-1">
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              {mode === 'login' ? 'Xoş gəldiniz' : 'Hesab yaradın'}
            </h3>
            <p className="text-xs text-slate-300">
              {mode === 'login'
                ? 'Davam etmək üçün daxil olun və ya qeydiyyatdan keçin'
                : 'Bir dəqiqə içində pulsuz hesab yaradın'}
            </p>
          </div>

          {/* SOCIAL BUTTONS */}
          <div className="space-y-2.5">
            {providers.map((provider) => {
              const Icon = providerIcons[provider];
              const isThisBusy = busyProvider === provider;
              return (
                <button
                  key={provider}
                  onClick={() => handleOAuth(provider)}
                  disabled={busyProvider !== null}
                  className={`w-full flex items-center justify-center space-x-3 py-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xl font-semibold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${providerColors[provider]}`}
                >
                  {isThisBusy ? (
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-300" />
                  ) : (
                    <span className={providerIconColors[provider]}>
                      <Icon />
                    </span>
                  )}
                  <span>{providerLabels[provider]}</span>
                </button>
              );
            })}
          </div>

          {/* DIVIDER */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-white/15" />
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">və ya</span>
            <div className="flex-1 h-px bg-white/15" />
          </div>

          {/* EMAIL / PASSWORD FORM */}
          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-poçt ünvanı"
                className="w-full bg-white/10 border border-white/15 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-400 backdrop-blur-xl focus:outline-none focus:border-cyan-400/80 transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
                placeholder="Şifrə"
                className="w-full bg-white/10 border border-white/15 rounded-2xl pl-10 pr-11 py-3 text-sm text-white placeholder-slate-400 backdrop-blur-xl focus:outline-none focus:border-cyan-400/80 transition-all"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-all"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* ERROR */}
          {authError && (
            <div className="rounded-xl bg-rose-500/15 border border-rose-500/30 px-4 py-2.5 text-xs text-rose-300 backdrop-blur-xl">
              {authError}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            onClick={handleEmailAuth}
            disabled={busy}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold text-sm shadow-lg shadow-cyan-500/20 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Daxil Ol' : 'Qeydiyyatdan Keç'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* TOGGLE LOGIN / SIGNUP */}
          <div className="text-center text-xs text-slate-300">
            {mode === 'login' ? 'Hesabınız yoxdur? ' : 'Artıq hesabınız var? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setAuthError(null); }}
              className="text-cyan-300 font-bold hover:text-cyan-200 transition-all"
            >
              {mode === 'login' ? 'Qeydiyyatdan keç' : 'Daxil ol'}
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 border-t border-white/15 text-center">
          <p className="text-[10px] text-slate-400">
            Davam edərək BVM İstifadəçi Şərtləri və Məxfilik Siyasətini qəbul edirsiniz
          </p>
        </div>
      </div>
    </div>
  );
}
