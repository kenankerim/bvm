const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string || '';

export async function uploadToCloudinary(file: File): Promise<string | null> {
  if (!CLOUD_NAME) return null;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'bvm_unsigned');
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.secure_url as string;
  } catch {
    return null;
  }
}

export function isCloudinaryConfigured(): boolean {
  return !!CLOUD_NAME;
}
