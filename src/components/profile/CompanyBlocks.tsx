import { useState, type ReactNode } from 'react';
import {
  Archive, ListChecks, Users, Crown, Lock, Plus, Trash2, ChevronDown, Eye, EyeOff, Check, X, FileText, Download,
} from 'lucide-react';
import { useCollection } from '@/hooks/useCollection';
import type { Row } from '@/lib/db';
import { checkUpload, DOC_ACCEPT, readAsDataUrl } from '@/lib/files';
import { cardClass, EmptyText, ErrorText, iconBtn, inputClass, primaryBtn } from './ui';

type ReserveCv = Row & { firebase_uid: string; candidate_name: string; file_name: string | null; file_data: string | null };
type CandidateStatus = Row & { firebase_uid: string; candidate_name: string; status: string };
type Employee = Row & { firebase_uid: string; full_name: string; position: string };
type SectionItem = { id: string; text: string; done: boolean };
type CustomSection = Row & { firebase_uid: string; title: string; visible: boolean; items: SectionItem[] };
export type Application = Row & {
  applicant_uid: string; applicant_name: string; company_uid: string; vacancy_id: string; vacancy_title: string;
};

const STATUSES = ['Baxılır', 'Müsahibə', 'Təklif', 'Qəbul edildi', 'İmtina'];
const statusColor: Record<string, string> = {
  'Baxılır': 'bg-sky-500/20 text-sky-200',
  'Müsahibə': 'bg-amber-500/20 text-amber-200',
  'Təklif': 'bg-indigo-500/25 text-indigo-200',
  'Qəbul edildi': 'bg-emerald-500/20 text-emerald-200',
  'İmtina': 'bg-rose-500/20 text-rose-200',
};

const uid8 = () => (crypto.randomUUID?.() ?? `${Date.now()}${Math.random()}`).slice(0, 8);

function Block({ icon, title, count, locked, children, actions }: {
  icon: ReactNode; title: ReactNode; count?: number; locked?: boolean; children: ReactNode; actions?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className={`${cardClass} !p-0 overflow-hidden ${locked ? 'border-amber-400/30' : ''}`}>
      <div className="flex items-center gap-2 px-4 py-3.5">
        <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex flex-1 items-center gap-2.5 min-w-0 text-left">
          <span className={`p-2 rounded-xl ${locked ? 'bg-amber-400/20 text-amber-300' : 'bg-cyan-500/15 text-cyan-300'}`}>{icon}</span>
          <span className="text-sm font-bold text-white truncate">{title}</span>
          {typeof count === 'number' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/10 text-slate-200">{count}</span>
          )}
          <ChevronDown className={`ml-auto w-4 h-4 text-slate-300 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {actions}
      </div>
      {open && <div className="px-4 pb-4 pt-1 border-t border-white/10 space-y-3">{children}</div>}
    </section>
  );
}

function ReserveCvBlock({ uid, applications }: { uid: string; applications: Application[] }) {
  const { items, add, remove } = useCollection<ReserveCv>('company_reserve_cvs', { firebase_uid: uid });
  const [name, setName] = useState('');
  const [file, setFile] = useState<{ name: string; data: string } | null>(null);
  const [error, setError] = useState('');
  const reservedNames = new Set(items.map((i) => i.candidate_name));

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const check = checkUpload(f, 'document');
    if (!check.ok) return setError(check.error);
    setError('');
    setFile({ name: f.name, data: await readAsDataUrl(f) });
  };

  const save = async () => {
    if (!name.trim()) return setError('Namizədin adı tələb olunur.');
    await add({ candidate_name: name.trim(), file_name: file?.name ?? null, file_data: file?.data ?? null });
    setName('');
    setFile(null);
    setError('');
  };

  return (
    <Block icon={<Archive className="w-4 h-4" />} title="Ehtiyatda olan CV-lər" count={items.length}>
      <div className="space-y-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Namizədin adı" aria-label="Namizədin adı" className={inputClass} />
        <div className="flex gap-2">
          <label className="flex-1 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-slate-100 cursor-pointer truncate">
            <FileText className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            <span className="truncate">{file?.name ?? 'CV faylı (.pdf, .docx)'}</span>
            <input type="file" accept={DOC_ACCEPT} className="hidden" onChange={pick} />
          </label>
          <button onClick={save} className={primaryBtn}><Plus className="w-3.5 h-3.5" />Əlavə et</button>
        </div>
        <ErrorText>{error}</ErrorText>
      </div>

      {applications.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-slate-300">Gələn müraciətlər</p>
          {applications.map((a) => (
            <div key={a.id} className="flex items-center gap-2 rounded-xl bg-slate-800/80 px-3 py-2 text-xs">
              <span className="flex-1 truncate text-slate-100">{a.applicant_name} — <span className="text-cyan-300">{a.vacancy_title}</span></span>
              <button
                disabled={reservedNames.has(a.applicant_name)}
                onClick={() => add({ candidate_name: a.applicant_name, file_name: null, file_data: null })}
                className="text-[10px] font-bold text-cyan-300 disabled:text-emerald-300"
              >
                {reservedNames.has(a.applicant_name) ? 'Ehtiyatda' : 'Ehtiyata al'}
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 ? <EmptyText>Ehtiyatda CV yoxdur.</EmptyText> : (
        <ul className="space-y-1.5">
          {items.map((cv) => (
            <li key={cv.id} className="flex items-center gap-2 rounded-xl bg-slate-800/80 border border-white/10 px-3 py-2">
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-semibold text-white truncate">{cv.candidate_name}</span>
                {cv.file_name && <span className="block text-[10px] text-slate-300 truncate">{cv.file_name}</span>}
              </span>
              {cv.file_data && (
                <a href={cv.file_data} download={cv.file_name ?? 'cv'} aria-label="CV-ni yüklə" className={iconBtn}><Download className="w-3.5 h-3.5" /></a>
              )}
              <button onClick={() => remove(cv.id)} aria-label="Sil" className={iconBtn}><Trash2 className="w-3.5 h-3.5 text-rose-300" /></button>
            </li>
          ))}
        </ul>
      )}
    </Block>
  );
}

function StatusBlock({ uid }: { uid: string }) {
  const { items, add, update, remove } = useCollection<CandidateStatus>('company_statuses', { firebase_uid: uid });
  const [name, setName] = useState('');
  const [status, setStatus] = useState(STATUSES[0]);
  const counts = STATUSES.map((s) => [s, items.filter((i) => i.status === s).length] as const);

  return (
    <Block icon={<ListChecks className="w-4 h-4" />} title="Statuslar" count={items.length}>
      <div className="flex flex-wrap gap-1.5">
        {counts.map(([s, c]) => (
          <span key={s} className={`text-[10px] font-bold px-2 py-1 rounded-lg ${statusColor[s]}`}>{s}: {c}</span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Namizəd" aria-label="Namizəd" className={inputClass} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" className="bg-slate-800 border border-white/20 rounded-xl text-xs text-white px-2">
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button
          onClick={async () => { if (!name.trim()) return; await add({ candidate_name: name.trim(), status }); setName(''); }}
          aria-label="Əlavə et"
          className={primaryBtn}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {items.length === 0 ? <EmptyText>Status əlavə edilməyib.</EmptyText> : (
        <ul className="space-y-1.5">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-2 rounded-xl bg-slate-800/80 border border-white/10 px-3 py-2">
              <span className="flex-1 truncate text-xs font-semibold text-white">{i.candidate_name}</span>
              <select
                value={i.status}
                onChange={(e) => update(i.id, { status: e.target.value })}
                aria-label={`${i.candidate_name} statusu`}
                className={`text-[10px] font-bold rounded-lg px-1.5 py-1 border-0 ${statusColor[i.status] ?? 'bg-white/10 text-white'} [&>option]:bg-slate-900 [&>option]:text-white`}
              >
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <button onClick={() => remove(i.id)} aria-label="Sil" className={iconBtn}><Trash2 className="w-3.5 h-3.5 text-rose-300" /></button>
            </li>
          ))}
        </ul>
      )}
    </Block>
  );
}

function EmployeesBlock({ uid }: { uid: string }) {
  const { items, add, remove } = useCollection<Employee>('company_employees', { firebase_uid: uid });
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');

  return (
    <Block icon={<Users className="w-4 h-4" />} title="Əməkdaşlar" count={items.length}>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ad Soyad" aria-label="Ad Soyad" className={inputClass} />
        <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Vəzifə" aria-label="Vəzifə" className={inputClass} />
        <button
          onClick={async () => {
            if (!fullName.trim()) return;
            await add({ full_name: fullName.trim(), position: position.trim() || 'Əməkdaş' });
            setFullName('');
            setPosition('');
          }}
          aria-label="Əməkdaş əlavə et"
          className={primaryBtn}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {items.length === 0 ? <EmptyText>Əməkdaş əlavə edilməyib.</EmptyText> : (
        <ul className="space-y-1.5">
          {items.map((e) => (
            <li key={e.id} className="flex items-center gap-2.5 rounded-xl bg-slate-800/80 border border-white/10 px-3 py-2">
              <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 text-[11px] font-black text-white flex items-center justify-center">
                {e.full_name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-semibold text-white truncate">{e.full_name}</span>
                <span className="block text-[10px] text-slate-300 truncate">{e.position}</span>
              </span>
              <button onClick={() => remove(e.id)} aria-label={`${e.full_name} sil`} className={iconBtn}><Trash2 className="w-3.5 h-3.5 text-rose-300" /></button>
            </li>
          ))}
        </ul>
      )}
    </Block>
  );
}

function PremiumBlock() {
  return (
    <Block icon={<Crown className="w-4 h-4" />} title={<span className="inline-flex items-center gap-1.5">Premium Elanlar <Lock className="w-3.5 h-3.5 text-amber-300" aria-label="kilidli" /></span>} locked>
      <div className="rounded-2xl bg-amber-400/10 border border-amber-400/30 p-4 text-center space-y-2">
        <Lock className="w-6 h-6 mx-auto text-amber-300" aria-hidden="true" />
        <p className="text-xs text-amber-100 leading-relaxed">
          Premium elanlar lentdə ən üstdə göstərilir və VIP nişanı alır. Bu bölmə Premium abunəlik ilə açılır.
        </p>
        <button disabled className="px-4 py-2 rounded-xl bg-amber-400/80 text-black text-xs font-extrabold cursor-not-allowed">Tezliklə</button>
      </div>
    </Block>
  );
}

function CustomSectionBlock({ section, onUpdate, onRemove }: {
  section: CustomSection;
  onUpdate: (patch: Partial<CustomSection>) => void;
  onRemove: () => void;
}) {
  const [text, setText] = useState('');
  const items = section.items ?? [];
  const done = items.filter((i) => i.done).length;
  const setItems = (next: SectionItem[]) => onUpdate({ items: next });

  return (
    <Block
      icon={<ListChecks className="w-4 h-4" />}
      title={section.title}
      count={items.length}
      actions={
        <div className="flex gap-1.5">
          <button onClick={() => onUpdate({ visible: false })} aria-label="Bölməni gizlət" className={iconBtn}><EyeOff className="w-3.5 h-3.5" /></button>
          <button onClick={onRemove} aria-label="Bölməni sil" className={iconBtn}><Trash2 className="w-3.5 h-3.5 text-rose-300" /></button>
        </div>
      }
    >
      {items.length > 0 && <p className="text-[11px] text-slate-300">{done}/{items.length} tamamlandı</p>}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          setItems([...items, { id: uid8(), text: text.trim(), done: false }]);
          setText('');
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Yeni bənd" aria-label="Yeni bənd" className={inputClass} />
        <button type="submit" aria-label="Bənd əlavə et" className={primaryBtn}><Plus className="w-3.5 h-3.5" /></button>
      </form>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2.5 rounded-xl bg-slate-800/80 border border-white/10 px-3 py-2">
            <button
              role="checkbox"
              aria-checked={item.done}
              aria-label={item.text}
              onClick={() => setItems(items.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)))}
              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                item.done ? 'bg-cyan-400 border-cyan-400 text-black' : 'border-white/40'
              }`}
            >
              {item.done && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            </button>
            <span className={`flex-1 text-xs ${item.done ? 'line-through text-slate-400' : 'text-white'}`}>{item.text}</span>
            <button onClick={() => setItems(items.filter((i) => i.id !== item.id))} aria-label="Bəndi sil" className="p-1 text-slate-400 hover:text-rose-300">
              <X className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </Block>
  );
}

export function CompanyBlocks({ uid, applications }: { uid: string; applications: Application[] }) {
  const { items: sections, add, update, remove } = useCollection<CustomSection>('company_sections', { firebase_uid: uid }, true);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const visible = sections.filter((s) => s.visible !== false);
  const hidden = sections.filter((s) => s.visible === false);

  const create = async () => {
    if (!title.trim()) return;
    await add({ title: title.trim(), visible: true, items: [] });
    setTitle('');
    setAdding(false);
  };

  return (
    <div className="space-y-3">
      <ReserveCvBlock uid={uid} applications={applications} />
      <StatusBlock uid={uid} />
      <EmployeesBlock uid={uid} />
      <PremiumBlock />

      {visible.map((s) => (
        <CustomSectionBlock key={s.id} section={s} onUpdate={(patch) => update(s.id, patch)} onRemove={() => remove(s.id)} />
      ))}

      {hidden.length > 0 && (
        <div className={`${cardClass} !p-3 space-y-2`}>
          <p className="text-[11px] font-bold text-slate-300">Gizli bölmələr</p>
          <div className="flex flex-wrap gap-2">
            {hidden.map((s) => (
              <button key={s.id} onClick={() => update(s.id, { visible: true })} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs text-slate-100 hover:bg-white/20">
                <Eye className="w-3.5 h-3.5" /> {s.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {adding ? (
        <form
          className={`${cardClass} !p-3 flex gap-2`}
          onSubmit={(e) => { e.preventDefault(); void create(); }}
        >
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bölmənin adı" aria-label="Bölmənin adı" className={inputClass} autoFocus />
          <button type="submit" className={primaryBtn}><Check className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={() => setAdding(false)} aria-label="Ləğv et" className={iconBtn}><X className="w-4 h-4" /></button>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          aria-label="Yeni bölmə əlavə et"
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-3xl border-2 border-dashed border-cyan-400/50 text-cyan-200 text-sm font-bold hover:bg-cyan-500/10 transition-all"
        >
          <Plus className="w-5 h-5" /> Bölmə əlavə et
        </button>
      )}
    </div>
  );
}
