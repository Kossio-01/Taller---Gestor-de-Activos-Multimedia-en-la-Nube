export interface MediaAsset {
  id: string;
  titulo: string;
  url: string;
  publicId: string;
  tipoArchivo: 'imagen' | 'video' | 'pdf' | string;
  tamanoBytes: number;
  fechaSubida: string;
  subidoPor: string;
}
