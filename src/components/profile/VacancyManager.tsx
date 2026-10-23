import { useEffect, useState } from 'react';
import { Briefcase, CalendarClock, Plus, Power, PowerOff, Trash2, X, MapPin, Clock } from 'lucide-react';
import { useCollection } from '@/hooks/useCollection';
import {
  COMPANY_VACANCIES, effectiveStatus, formatDateTime, pendingTransition, toLocalInput, useNow,
  type CompanyVacancy,
} from '@/lib/vacancies';
import { cardClass, EmptyText, ErrorText, ghostBtn, iconBtn, inputClass, primaryBtn, SectionTitle } from './ui';

type Draft = {
  title: string;
  salary: string;
  location: string;
  duration: string;
  activateAt: string;
  endAt: string;
};

const emptyDraft: Draft = { title: '', salary: '', location: 'Bakı', duration: 'Tam ştat', activateAt: '', endAt: '' };

export function VacancyManager({ uid, companyName, openFormSignal }: { uid: string; companyName: string; openFormSignal: number }) {
  const { items, add, update, remove } = useCollection<CompanyVacancy>(COMPANY_VACANCIES, { firebase_uid: uid });
  const now = useNow();
  const [tab, setTab] = useState<'active' | 'inactive'>('active');
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [scheduleFor, setScheduleFor] = useState<CompanyVacancy | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (openFormSignal > 0) setShowForm(true);
  }, [openFormSignal]);

  useEffect(() => {
    for (const v of items) {
      const patch = pendingTransition(v, now);
      if (patch) void update(v.id, patch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, now]);

  const active = items.filter((v) => effectiveStatus(v, now) === 'active');
  const inactive = items.filter((v) => effectiveStatus(v, now) === 'inactive');
  const visible = tab === 'active' ? active : inactive;

  const validateSchedule = (activateAt: string, endAt: string) => {
    if (activateAt && endAt && new Date(endAt) <= new Date(activateAt)) {
      return 'Deaktiv olma vaxtı aktiv olma vaxtından sonra olmalıdır.';
    }
    if (endAt && new Date(endAt).getTime() <= Date.now()) return 'Deaktiv olma vaxtı gələcəkdə olmalıdır.';
    return '';
  };

  const submit = async () => {
    if (!draft.title.trim() || !draft.salary.trim()) return setError('Vəzifə və maaş tələb olunur.');
    const scheduleError = validateSchedule(draft.activateAt, draft.endAt);
    if (scheduleError) return setError(scheduleError);
    const activateIso = draft.activateAt ? new Date(draft.activateAt).toISOString() : null;
    const startsLater = activateIso && new Date(activateIso).getTime() > Date.now();
    await add({
      company_name: companyName,
      title: draft.title.trim(),
      salary: draft.salary.trim(),
      location: draft.location.trim() || 'Bakı',
      duration: draft.duration,
      status: startsLater ? 'inactive' : 'active',
      auto_activate_at: startsLater ? activateIso : null,
      auto_end_at: draft.endAt ? new Date(draft.endAt).toISOString() : null,
    });
    setDraft(emptyDraft);
    setShowForm(false);
    setError('');
    setTab(startsLater ? 'inactive' : 'active');
  };

  const field = (k: keyof Draft) => ({
    value: draft[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setDraft((d) => ({ ...d, [k]: e.target.value })),
  });

  return (
    <section className={cardClass}>
      <SectionTitle
        icon={<Briefcase className="w-4 h-4" />}
        title="Vakansiyalarım"
        extra={
          <button onClick={() => setShowForm((v) => !v)} className={primaryBtn}>
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? 'Bağla' : 'Yeni'}
          </button>
        }
      />

      {showForm && (
        <div className="mb-4 space-y-2.5 rounded-2xl bg-slate-800/70 border border-white/10 p-3">
          <input placeholder="Vəzifə adı" aria-label="Vəzifə adı" className={inputClass} {...field('title')} />
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Maaş (məs. 1500 AZN)" aria-label="Maaş" className={inputClass} {...field('salary')} />
            <input placeholder="Məkan" aria-label="Məkan" className={inputClass} {...field('location')} />
          </div>
          <select aria-label="İş növü" className={inputClass} {...field('duration')}>
            {['Tam ştat', 'Yarım ştat', 'Uzaqdan', 'Növbəli', 'Mövsümi', 'Freelance'].map((o) => <option key={o}>{o}</option>)}
          </select>
          <ScheduleInputs
            activateAt={draft.activateAt}
            endAt={draft.endAt}
            onActivate={(v) => setDraft((d) => ({ ...d, activateAt: v }))}
            onEnd={(v) => setDraft((d) => ({ ...d, endAt: v }))}
          />
          <ErrorText>{error}</ErrorText>
          <button onClick={submit} className={`${primaryBtn} w-full py-2.5`}>Vakansiyanı yarat</button>
        </div>
      )}

      <div role="tablist" className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-800/80 border border-white/10 mb-4">
        {([
          ['active', 'Aktiv Vakansiyalarım', active.length],
          ['inactive', 'Deaktiv Vakansiyalarım', inactive.length],
        ] as const).map(([id, label, count]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`py-2.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
              tab === id
                ? id === 'active'
                  ? 'bg-emerald-500/25 border border-emerald-400 text-emerald-100'
                  : 'bg-rose-500/20 border border-rose-400 text-rose-100'
                : 'border border-transparent text-slate-300 hover:text-white'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyText>{tab === 'active' ? 'Aktiv vakansiya yoxdur.' : 'Deaktiv vakansiya yoxdur.'}</EmptyText>
      ) : (
        <ul className="space-y-2.5">
          {visible.map((v) => (
            <li key={v.id} className="rounded-2xl bg-slate-800/80 border border-white/10 p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{v.title}</p>
                  <p className="text-xs font-semibold text-cyan-300">{v.salary}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => setScheduleFor(v)} aria-label="Avtomatik vaxt təyin et" className={iconBtn}>
                    <CalendarClock className="w-3.5 h-3.5 text-cyan-300" />
                  </button>
                  <button
                    onClick={() => update(v.id, {
                      status: tab === 'active' ? 'inactive' : 'active',
                      ...(tab === 'active' ? { auto_end_at: null } : { auto_activate_at: null }),
                    })}
                    aria-label={tab === 'active' ? 'Deaktiv et' : 'Aktiv et'}
                    className={iconBtn}
                  >
                    {tab === 'active' ? <PowerOff className="w-3.5 h-3.5 text-amber-300" /> : <Power className="w-3.5 h-3.5 text-emerald-300" />}
                  </button>
                  <button onClick={() => remove(v.id)} aria-label="Sil" className={iconBtn}>
                    <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-200">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10"><MapPin className="w-3 h-3" />{v.location}</span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10"><Clock className="w-3 h-3" />{v.duration}</span>
                {v.auto_activate_at && (
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-200">Aktiv olacaq: {formatDateTime(v.auto_activate_at)}</span>
                )}
                {v.auto_end_at && (
                  <span className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-200">Deaktiv olacaq: {formatDateTime(v.auto_end_at)}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {scheduleFor && (
        <ScheduleDialog
          vacancy={scheduleFor}
          validate={validateSchedule}
          onClose={() => setScheduleFor(null)}
          onSave={async (activateAt, endAt) => {
            const activateIso = activateAt ? new Date(activateAt).toISOString() : null;
            await update(scheduleFor.id, {
              auto_activate_at: activateIso && new Date(activateIso).getTime() > Date.now() ? activateIso : null,
              auto_end_at: endAt ? new Date(endAt).toISOString() : null,
              ...(activateIso && new Date(activateIso).getTime() <= Date.now() ? { status: 'active' as const } : {}),
            });
            setScheduleFor(null);
          }}
        />
      )}
    </section>
  );
}

function ScheduleInputs({ activateAt, endAt, onActivate, onEnd }: {
  activateAt: string; endAt: string; onActivate: (v: string) => void; onEnd: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <label className="space-y-1">
        <span className="text-[11px] font-semibold text-emerald-200">Avtomatik aktiv olma (tarix və saat)</span>
        <input type="datetime-local" value={activateAt} onChange={(e) => onActivate(e.target.value)} className={`${inputClass} [color-scheme:dark]`} />
      </label>
      <label className="space-y-1">
        <span className="text-[11px] font-semibold text-rose-200">Avtomatik deaktiv olma (tarix və saat)</span>
        <input type="datetime-local" value={endAt} onChange={(e) => onEnd(e.target.value)} className={`${inputClass} [color-scheme:dark]`} />
      </label>
    </div>
  );
}

function ScheduleDialog({ vacancy, validate, onClose, onSave }: {
  vacancy: CompanyVacancy;
  validate: (a: string, e: string) => string;
  onClose: () => void;
  onSave: (activateAt: string, endAt: string) => Promise<void>;
}) {
  const [activateAt, setActivateAt] = useState(toLocalInput(vacancy.auto_activate_at));
  const [endAt, setEndAt] = useState(toLocalInput(vacancy.auto_end_at));
  const [error, setError] = useState('');
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4" role="dialog" aria-modal="true" aria-label="Avtomatik vaxt">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/15 p-5 space-y-3 shadow-2xl">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white">{vacancy.title} — Avtomatik vaxt</h4>
          <button onClick={onClose} aria-label="Bağla" className={iconBtn}><X className="w-4 h-4" /></button>
        </div>
        <ScheduleInputs activateAt={activateAt} endAt={endAt} onActivate={setActivateAt} onEnd={setEndAt} />
        <ErrorText>{error}</ErrorText>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { setActivateAt(''); setEndAt(''); }} className={ghostBtn}>Təmizlə</button>
          <button
            onClick={() => {
              const err = validate(activateAt, endAt);
              if (err) return setError(err);
              void onSave(activateAt, endAt);
            }}
            className={primaryBtn}
          >
            Yadda saxla
          </button>
        </div>
      </div>
    </div>
  );
}
