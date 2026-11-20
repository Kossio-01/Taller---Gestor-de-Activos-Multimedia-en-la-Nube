export const mediaTypes = ['imagen', 'video', 'pdf'] as const;
export type MediaType = (typeof mediaTypes)[number];

const maxFileBytes = 10 * 1024 * 1024;
const maxBodyBytes = maxFileBytes + 64 * 1024;

export class UploadError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function readMultipart(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (!/^multipart\/form-data\s*;/i.test(contentType)) {
    throw new UploadError('Envía los datos como multipart/form-data.', 415);
  }

  const tooLarge = new UploadError('El archivo supera el límite de 10 MB.', 413);
  if (Number(request.headers.get('content-length')) > maxBodyBytes) throw tooLarge;
  if (!request.body) throw new UploadError('Falta el formulario de carga.', 400);

  let bytes = 0;
  const limitedBody = request.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      bytes += chunk.byteLength;
      if (bytes > maxBodyBytes) throw tooLarge;
      controller.enqueue(chunk);
    },
  }));

  try {
    return await new Response(limitedBody, { headers: { 'content-type': contentType } }).formData();
  } catch {
    if (bytes > maxBodyBytes) throw tooLarge;
    throw new UploadError('El formulario de carga no es válido.', 400);
  }
}

function getText(form: FormData, field: string) {
  const entries = form.getAll(field);
  const value = typeof entries[0] === 'string' ? entries[0].trim() : '';
  if (entries.length !== 1 || !value || value.length > 200 || value.includes('\0')) {
    throw new UploadError(`El campo ${field} debe tener entre 1 y 200 caracteres válidos.`, 400);
  }
  return value;
}

// Check the file header as well as the MIME type supplied by the browser.
function detectType(mime: string, header: Buffer): MediaType | undefined {
  const ascii = (start: number, end: number) => header.toString('latin1', start, end);
  const hex = (end: number) => header.toString('hex', 0, end);
  const hasFtyp = ascii(4, 8) === 'ftyp';
  const brand = ascii(8, 12);

  switch (mime) {
    case 'application/pdf':
      if (/^%PDF-\d\.\d/.test(ascii(0, 8))) return 'pdf';
      break;
    case 'image/jpeg':
      if (hex(3) === 'ffd8ff') return 'imagen';
      break;
    case 'image/png':
      if (hex(8) === '89504e470d0a1a0a') return 'imagen';
      break;
    case 'image/gif':
      if (['GIF87a', 'GIF89a'].includes(ascii(0, 6))) return 'imagen';
      break;
    case 'image/webp':
      if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'imagen';
      break;
    case 'image/avif':
      if (hasFtyp && ['avif', 'avis'].includes(brand)) return 'imagen';
      break;
    case 'video/mp4':
    case 'video/quicktime':
      if (hasFtyp && /^(isom|iso[2-9]|mp4[12]|avc1|dash|M4V |qt  )$/.test(brand)) return 'video';
      break;
    case 'video/webm':
      if (hex(4) === '1a45dfa3' && header.includes(Buffer.from([0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d]))) {
        return 'video';
      }
      break;
  }
}

export async function validateUpload(request: Request) {
  const form = await readMultipart(request);
  const [file, ...extraFiles] = form.getAll('file');
  if (!(file instanceof File) || !file.size || extraFiles.length) {
    throw new UploadError('Selecciona un solo archivo que no esté vacío.', 400);
  }
  if (file.size > maxFileBytes) {
    throw new UploadError('El archivo supera el límite de 10 MB.', 413);
  }

  const titulo = getText(form, 'titulo');
  const subidoPor = getText(form, 'subidoPor');
  const tipoArchivo = detectType(file.type, Buffer.from(await file.slice(0, 512).arrayBuffer()));
  if (!tipoArchivo) {
    throw new UploadError('Formato no permitido o contenido incompatible con el tipo MIME.', 415);
  }
  return { file, titulo, subidoPor, tipoArchivo };
}
