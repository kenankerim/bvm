import { useRef, useState } from 'react';
import { FileText, Plus, Trash2, Download } from 'lucide-react';
import { useCollection } from '@/hooks/useCollection';
import { checkUpload, DOC_ACCEPT, readAsDataUrl } from '@/lib/files';
import { cardClass, EmptyText, ErrorText, iconBtn, primaryBtn, SectionTitle } from './ui';

type Cv = { id: string; created_at: string; firebase_uid: string; file_name: string; lang: string; file_data: string | null };

const MAX_CVS = 5;

export function CvManager({ uid }: { uid: string }) {
  const { items, add, remove } = useCollection<Cv>('cvs', { firebase_uid: uid });
  const [lang, setLang] = useState('AZ');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const check = checkUpload(file, 'document');
    if (!check.ok) return setError(check.error);
    setError('');
    try {
      await add({ file_name: file.name, lang, file_data: await readAsDataUrl(file) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CV yüklənmədi.');
    }
  };

  return (
    <section className={cardClass}>
      <SectionTitle
        icon={<FileText className="w-4 h-4" />}
        title={`Mənim CV-lərim (${items.length}/${MAX_CVS})`}
        extra={
          <div className="flex items-center gap-2">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label="CV dili"
              className="bg-slate-800 border border-white/20 rounded-lg text-xs text-white px-2 py-1.5"
            >
              {['AZ', 'EN', 'RU', 'TR'].map((l) => <option key={l}>{l}</option>)}
            </select>
            <button onClick={() => inputRef.current?.click()} disabled={items.length >= MAX_CVS} className={primaryBtn}>
              <Plus className="w-3.5 h-3.5" /> Yüklə
            </button>
          </div>
        }
      />
      <input ref={inputRef} type="file" accept={DOC_ACCEPT} className="hidden" onChange={onFile} />
      <ErrorText>{error}</ErrorText>
      {items.length === 0 ? (
        <EmptyText>CV yükləyin (.pdf, .docx).</EmptyText>
      ) : (
        <ul className="space-y-2">
          {items.map((cv) => (
            <li key={cv.id} className="flex items-center gap-2 rounded-xl bg-slate-800/80 border border-white/10 px-3 py-2">
              <FileText className="w-4 h-4 text-cyan-300 shrink-0" />
              <span className="flex-1 truncate text-xs text-slate-100">{cv.file_name}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200">{cv.lang}</span>
              {cv.file_data && (
                <a href={cv.file_data} download={cv.file_name} aria-label="Yüklə" className={iconBtn}>
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
              <button onClick={() => remove(cv.id)} aria-label="CV-ni sil" className={iconBtn}>
                <Trash2 className="w-3.5 h-3.5 text-rose-300" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
