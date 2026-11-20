// Rol 2 — Validaciones del servidor (peso, tipo MIME y firma real del archivo)

export const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export type TipoArchivo = 'imagen' | 'video' | 'pdf';

// Lista blanca de tipos MIME. Se excluye SVG a propósito (puede contener scripts).
export const TIPOS_PERMITIDOS: Record<string, TipoArchivo> = {
  'image/jpeg': 'imagen',
  'image/png': 'imagen',
  'image/webp': 'imagen',
  'image/gif': 'imagen',
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
  'application/pdf': 'pdf',
};

export class ErrorValidacion extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function empieza(buf: Buffer, bytes: number[], offset = 0) {
  return bytes.every((b, i) => buf[offset + i] === b);
}

// file.type lo envía el cliente y es falsificable: se comprueban los primeros bytes.
function firmaCoincide(mime: string, buf: Buffer): boolean {
  switch (mime) {
    case 'image/jpeg':
      return empieza(buf, [0xff, 0xd8, 0xff]);
    case 'image/png':
      return empieza(buf, [0x89, 0x50, 0x4e, 0x47]);
    case 'image/gif':
      return empieza(buf, [0x47, 0x49, 0x46, 0x38]);
    case 'image/webp':
      return empieza(buf, [0x52, 0x49, 0x46, 0x46]) && empieza(buf, [0x57, 0x45, 0x42, 0x50], 8);
    case 'application/pdf':
      return empieza(buf, [0x25, 0x50, 0x44, 0x46]); // %PDF
    case 'video/mp4':
    case 'video/quicktime':
      return empieza(buf, [0x66, 0x74, 0x79, 0x70], 4); // "ftyp"
    case 'video/webm':
      return empieza(buf, [0x1a, 0x45, 0xdf, 0xa3]);
    default:
      return false;
  }
}

export function validarArchivo(file: File, buffer: Buffer): TipoArchivo {
  if (file.size === 0) throw new ErrorValidacion('El archivo está vacío.');
  if (file.size > MAX_BYTES) {
    throw new ErrorValidacion('El archivo supera el límite de 10 MB.', 413);
  }
  const tipo = TIPOS_PERMITIDOS[file.type];
  if (!tipo) {
    throw new ErrorValidacion('Tipo no permitido. Solo imágenes (JPG, PNG, WEBP, GIF), videos (MP4, WEBM, MOV) o PDF.', 415);
  }
  if (!firmaCoincide(file.type, buffer)) {
    throw new ErrorValidacion('El contenido del archivo no coincide con su tipo declarado.', 415);
  }
  return tipo;
}

export function validarTexto(valor: FormDataEntryValue | null, campo: string, max = 120): string {
  if (typeof valor !== 'string' || !valor.trim()) {
    throw new ErrorValidacion(`El campo "${campo}" es obligatorio.`);
  }
  const limpio = valor.trim();
  if (limpio.length > max) {
    throw new ErrorValidacion(`El campo "${campo}" no puede superar ${max} caracteres.`);
  }
  return limpio;
}