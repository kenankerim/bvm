import { useRef, useState } from 'react';
import { FileText, Image as ImageIcon, Loader2, Paperclip, Send, Trash2, VideoOff, X, Download } from 'lucide-react';
import { useCollection } from '@/hooks/useCollection';
import { checkUpload, compressImage, DOC_ACCEPT, IMAGE_ACCEPT, isVideoFile, readAsDataUrl } from '@/lib/files';
import { cardClass, EmptyText, ErrorText, iconBtn, primaryBtn, SectionTitle, ghostBtn } from './ui';

type Post = {
  id: string;
  created_at: string;
  firebase_uid: string;
  role: string;
  content: string;
  file_name: string | null;
  file_type: 'image' | 'document' | null;
  file_data: string | null;
};

type Attachment = { name: string; kind: 'image' | 'document'; data: string };

export function PostComposer({ uid, role, onPublished }: { uid: string; role: string; onPublished?: () => void }) {
  const { items: posts, add, remove } = useCollection<Post>('posts', { firebase_uid: uid, role });
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, allowed: 'image' | 'document') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const check = checkUpload(file, allowed);
    if (!check.ok) return setError(check.error);
    setError('');
    setBusy(true);
    try {
      const data = check.kind === 'image' ? await compressImage(file, 1280) : await readAsDataUrl(file);
      setAttachment({ name: file.name, kind: check.kind, data });
    } catch {
      setError('Fayl oxunmadı.');
    } finally {
      setBusy(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && isVideoFile(file)) setError('Video yükləmək qadağandır.');
  };

  const publish = async () => {
    if (!text.trim() && !attachment) return;
    setBusy(true);
    setError('');
    try {
      await add({
        content: text.trim(),
        file_name: attachment?.name ?? null,
        file_type: attachment?.kind ?? null,
        file_data: attachment?.data ?? null,
      });
      setText('');
      setAttachment(null);
      onPublished?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Paylaşım alınmadı.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={cardClass} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      <SectionTitle icon={<Send className="w-4 h-4" />} title="Yeni Paylaşım" />
      <div className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nə paylaşmaq istəyirsiniz?"
          rows={3}
          aria-label="Paylaşım mətni"
          className="w-full bg-slate-800/90 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-400 resize-none focus:outline-none focus:border-cyan-400"
        />

        {attachment && (
          <div className="relative rounded-2xl border border-white/15 bg-slate-800/80 p-2">
            {attachment.kind === 'image' ? (
              <img src={attachment.data} alt="Seçilmiş şəkil" className="w-full max-h-56 object-cover rounded-xl" />
            ) : (
              <div className="flex items-center gap-2 px-2 py-2 text-xs text-slate-100">
                <FileText className="w-4 h-4 text-cyan-300" />
                <span className="truncate">{attachment.name}</span>
              </div>
            )}
            <button onClick={() => setAttachment(null)} aria-label="Faylı sil" className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/80 text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <ErrorText>{error}</ErrorText>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-2">
            <button onClick={() => imageRef.current?.click()} className={ghostBtn} disabled={busy}>
              <ImageIcon className="w-3.5 h-3.5 text-cyan-300" /> Şəkil
            </button>
            <button onClick={() => docRef.current?.click()} className={ghostBtn} disabled={busy}>
              <Paperclip className="w-3.5 h-3.5 text-cyan-300" /> Sənəd
            </button>
            <input ref={imageRef} type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={(e) => handleFile(e, 'image')} />
            <input ref={docRef} type="file" accept={DOC_ACCEPT} className="hidden" onChange={(e) => handleFile(e, 'document')} />
          </div>
          <button onClick={publish} disabled={busy || (!text.trim() && !attachment)} className={primaryBtn}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Paylaş
          </button>
        </div>
        <p className="flex items-center gap-1.5 text-[11px] text-slate-300">
          <VideoOff className="w-3.5 h-3.5 text-rose-300" aria-hidden="true" />
          Dəstəklənir: .jpg, .png, .pdf, .docx. Video yükləmək qadağandır.
        </p>
      </div>

      <div className="mt-5 pt-4 border-t border-white/10 space-y-3">
        <h4 className="text-xs font-bold text-slate-200">Paylaşımlarım ({posts.length})</h4>
        {posts.length === 0 ? (
          <EmptyText>Hələ paylaşım yoxdur.</EmptyText>
        ) : (
          posts.map((p) => (
            <article key={p.id} className="rounded-2xl bg-slate-800/80 border border-white/10 p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <time className="text-[10px] text-slate-400">{new Date(p.created_at).toLocaleString('az-AZ')}</time>
                <button onClick={() => remove(p.id)} aria-label="Paylaşımı sil" className={iconBtn}>
                  <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                </button>
              </div>
              {p.content && <p className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">{p.content}</p>}
              {p.file_type === 'image' && p.file_data && (
                <img src={p.file_data} alt={p.file_name ?? 'Paylaşım şəkli'} className="w-full max-h-72 object-cover rounded-xl" />
              )}
              {p.file_type === 'document' && (
                <a
                  href={p.file_data ?? undefined}
                  download={p.file_name ?? undefined}
                  className="flex items-center gap-2 rounded-xl bg-slate-900/80 border border-white/10 px-3 py-2 text-xs text-cyan-200 hover:border-cyan-400/50"
                >
                  <FileText className="w-4 h-4" />
                  <span className="truncate flex-1">{p.file_name}</span>
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
