// Rol 2 — Cliente de Cloudinary (subida). Rol 3 reutiliza eliminarDeCloudinary() en el DELETE.
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import type { TipoArchivo } from './validaciones';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

type ResourceType = 'image' | 'video';

// Cloudinary guarda los PDF como resource_type "image".
// Para borrar hay que usar el mismo resource_type con el que se subió.
export function resourceTypeDe(tipo: TipoArchivo | string): ResourceType {
  return tipo === 'video' ? 'video' : 'image';
}

export function subirACloudinary(buffer: Buffer, tipo: TipoArchivo): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'cloud-media-vault', resource_type: resourceTypeDe(tipo) },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Cloudinary no devolvió resultado.'));
        resolve(result);
      },
    );
    stream.end(buffer);
  });
}

export async function eliminarDeCloudinary(publicId: string, tipo: TipoArchivo | string) {
  const res = await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceTypeDe(tipo),
    invalidate: true,
  });
  // "ok" = borrado, "not found" = ya no existía (también lo damos por bueno)
  if (res.result !== 'ok' && res.result !== 'not found') {
    throw new Error(`Cloudinary no pudo eliminar el recurso: ${res.result}`);
  }
}