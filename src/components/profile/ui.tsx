import type { ReactNode } from 'react';

export const cardClass =
  'rounded-3xl bg-slate-900/90 border border-white/15 backdrop-blur-xl p-5 shadow-xl shadow-black/30';

export const inputClass =
  'w-full bg-slate-800/90 border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors';

export const primaryBtn =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black text-xs font-extrabold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed';

export const ghostBtn =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-slate-100 text-xs font-semibold hover:bg-white/20 active:scale-95 transition-all disabled:opacity-50';

export const iconBtn =
  'p-2 rounded-lg bg-white/10 border border-white/15 text-slate-200 hover:bg-white/20 active:scale-95 transition-all';

export function SectionTitle({ icon, title, extra }: { icon: ReactNode; title: ReactNode; extra?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-white">
        <span className="text-cyan-300">{icon}</span>
        {title}
      </h3>
      {extra}
    </div>
  );
}

export function EmptyText({ children }: { children: ReactNode }) {
  return <p className="text-xs text-slate-300 text-center py-4">{children}</p>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-xs text-rose-300 bg-rose-500/15 border border-rose-500/30 rounded-xl px-3 py-2">
      {children}
    </p>
  );
}
