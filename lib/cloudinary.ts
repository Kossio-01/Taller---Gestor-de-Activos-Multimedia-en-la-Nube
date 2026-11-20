import { createHash } from 'node:crypto';
import type { MediaType } from './media-upload';

type CloudResource = 'image' | 'video' | 'raw';

function resourceFor(tipoArchivo: string): CloudResource {
  if (tipoArchivo === 'pdf') return 'raw';
  return tipoArchivo === 'video' ? 'video' : 'image';
}

async function cloudRequest(
  resource: CloudResource,
  action: 'upload' | 'destroy',
  params: Record<string, string>,
  file?: File,
) {
  const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = process.env;
  if (!cloud || !/^[a-zA-Z0-9_-]+$/.test(cloud) || !key || !secret) {
    throw new Error('Faltan credenciales válidas de Cloudinary.');
  }

  const signedFields = { ...params, timestamp: String(Math.floor(Date.now() / 1000)) };
  const payload = Object.entries(signedFields).sort(([a], [b]) => a < b ? -1 : 1)
    .map(([name, value]) => `${name}=${value}`).join('&');
  const signature = createHash('sha256').update(payload + secret).digest('hex');

  const body = new FormData();
  for (const [name, value] of Object.entries(signedFields)) body.append(name, value);
  body.append('api_key', key);
  body.append('signature', signature);
  if (file) body.append('file', file);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${resource}/${action}`, {
    method: 'POST',
    body,
    cache: 'no-store',
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) throw new Error(`Cloudinary ${action}: HTTP ${response.status}`);
  return response.json();
}

export async function uploadMedia(file: File, tipoArchivo: MediaType, publicId: string) {
  const result = await cloudRequest(resourceFor(tipoArchivo), 'upload', {
    public_id: publicId,
    overwrite: 'false',
  }, file);
  if (
    result?.public_id !== publicId ||
    typeof result.secure_url !== 'string' ||
    !result.secure_url.startsWith('https://')
  ) {
    throw new Error('Cloudinary devolvió un archivo sin metadatos válidos.');
  }
  return { url: result.secure_url as string, publicId };
}

export async function deleteMedia(publicId: string, tipoArchivo: string, url?: string) {
  // Older PDF uploads may have used Cloudinary's image resource instead of raw.
  const isImagePdf = tipoArchivo === 'pdf' && url?.includes('/image/upload/');
  const resource = isImagePdf ? 'image' : resourceFor(tipoArchivo);
  const result = await cloudRequest(resource, 'destroy', {
    public_id: publicId,
    invalidate: 'true',
  });
  if (result?.result !== 'ok' && result?.result !== 'not found') {
    throw new Error('Cloudinary no confirmó la eliminación.');
  }
}
