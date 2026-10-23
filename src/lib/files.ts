export const IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png';
export const DOC_ACCEPT =
  '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const IMAGE_EXT = ['jpg', 'jpeg', 'png'];
const DOC_EXT = ['pdf', 'docx'];
const VIDEO_EXT = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', '3gp', 'wmv', 'flv', 'mpeg', 'mpg'];
export const MAX_DOC_BYTES = 2 * 1024 * 1024;

function ext(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

export function isVideoFile(file: File) {
  return file.type.startsWith('video/') || VIDEO_EXT.includes(ext(file.name));
}

export type FileCheck = { ok: true; kind: 'image' | 'document' } | { ok: false; error: string };

export function checkUpload(file: File, allowed: 'image' | 'document' | 'any'): FileCheck {
  if (isVideoFile(file)) return { ok: false, error: 'Video yükləmək qadağandır.' };
  const e = ext(file.name);
  const isImage = IMAGE_EXT.includes(e) && (file.type === '' || ['image/jpeg', 'image/png'].includes(file.type));
  const isDoc = DOC_EXT.includes(e);
  if (isImage && allowed !== 'document') return { ok: true, kind: 'image' };
  if (isDoc && allowed !== 'image') {
    if (file.size > MAX_DOC_BYTES) return { ok: false, error: 'Sənəd maksimum 2 MB ola bilər.' };
    return { ok: true, kind: 'document' };
  }
  if (allowed === 'image') return { ok: false, error: 'Yalnız .jpg və .png şəkillər qəbul olunur.' };
  if (allowed === 'document') return { ok: false, error: 'Yalnız .pdf və .docx sənədlər qəbul olunur.' };
  return { ok: false, error: 'Bu fayl növü dəstəklənmir.' };
}

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function compressImage(file: File, maxSize: number, quality = 0.82): Promise<string> {
  const src = await readAsDataUrl(file);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Şəkil oxunmadı.'));
    img.src = src;
  });
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

export function getInitials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase('az');
  return (parts[0][0] + parts[parts.length - 1][0]).toLocaleUpperCase('az');
}
