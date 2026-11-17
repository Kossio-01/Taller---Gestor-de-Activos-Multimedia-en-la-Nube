'use client';

import { ChangeEvent, DragEvent, FormEvent, useRef, useState } from 'react';
import type { MediaAsset } from '@/types/media';

interface UploadFormProps {
  onUploadSuccess: (nuevoArchivo: MediaAsset) => void;
  mockMode?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function UploadForm({ onUploadSuccess, mockMode = false }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [titulo, setTitulo] = useState('');
  const [subidoPor, setSubidoPor] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function validateFile(selectedFile: File) {
    const validType =
      selectedFile.type.startsWith('image/') ||
      selectedFile.type.startsWith('video/') ||
      selectedFile.type === 'application/pdf';
    if (!validType) return 'Solo se permiten imágenes, videos y documentos PDF.';
    if (selectedFile.size > MAX_FILE_SIZE) return 'El archivo supera el límite estricto de 10 MB.';
    return '';
  }

  function inferType(selectedFile: File): MediaAsset['tipoArchivo'] {
    if (selectedFile.type.startsWith('image/')) return 'imagen';
    if (selectedFile.type.startsWith('video/')) return 'video';
    return 'pdf';
  }

  function selectFile(selectedFile: File) {
    const validationError = validateFile(selectedFile);
    setError(validationError);
    setSuccess('');
    if (validationError) {
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setFile(selectedFile);
    if (!titulo.trim()) setTitulo(selectedFile.name.replace(/\.[^/.]+$/, ''));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) selectFile(selectedFile);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) selectFile(droppedFile);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!file) return setError('Selecciona un archivo para continuar.');
    if (!titulo.trim()) return setError('El título es obligatorio.');
    if (!subidoPor.trim()) return setError('El nombre del autor es obligatorio.');
    const validationError = validateFile(file);
    if (validationError) return setError(validationError);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('titulo', titulo.trim());
    formData.append('subidoPor', subidoPor.trim());

    setUploading(true);
    try {
      const response = await fetch('/api/archivos', { method: 'POST', body: formData });
      if (!response.ok) {
        if (mockMode && (response.status === 404 || response.status >= 500)) {
          const mockAsset: MediaAsset = {
            id: `local-${Date.now()}`,
            titulo: titulo.trim(),
            url: URL.createObjectURL(file),
            publicId: `local/${file.name}`,
            tipoArchivo: inferType(file),
            tamanoBytes: file.size,
            fechaSubida: new Date().toISOString(),
            subidoPor: subidoPor.trim(),
          };
          onUploadSuccess(mockAsset);
          setSuccess('Archivo añadido al archivo local.');
        } else {
          const result = await response.json().catch(() => null);
          throw new Error(result?.message || 'No fue posible subir el archivo.');
        }
      } else {
        const result = await response.json();
        const nuevoArchivo = result.asset || result.archivo || result;
        if (!nuevoArchivo?.id) throw new Error('El servidor no devolvió el archivo creado.');
        onUploadSuccess(nuevoArchivo as MediaAsset);
        setSuccess('Archivo subido correctamente.');
      }
      setFile(null);
      setTitulo('');
      setSubidoPor('');
      if (inputRef.current) inputRef.current.value = '';
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Ocurrió un error al subir.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[minmax(0,1.18fr)_minmax(320px,.82fr)]">
      <label
        htmlFor="media-file"
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={handleDrop}
        className={`glass-line flex min-h-[320px] cursor-pointer flex-col items-center justify-center px-6 text-center transition duration-500 sm:min-h-[420px] ${
          dragging
            ? 'scale-[1.01] border-white/40 bg-[radial-gradient(circle_at_center,rgba(34,211,238,.11),rgba(236,72,153,.06),transparent_65%)]'
            : 'hover:bg-white/[0.025]'
        }`}
      >
        <span className={`mb-8 text-5xl transition duration-300 ${dragging ? 'rotate-45 text-cyan-200' : 'text-white/35'}`} aria-hidden="true">+</span>
        <span className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
          {dragging ? 'Suelta la pieza aquí' : file ? 'Cambiar archivo' : 'Arrastra tu archivo'}
        </span>
        <span className="museum-label mt-4 text-[9px] text-white/40">
          O selecciona desde tu dispositivo
        </span>
        {file && (
          <span className="mt-6 max-w-full truncate border-b border-white/20 px-3 pb-2 text-sm text-cyan-100">
            {file.name}
          </span>
        )}
        <input
          ref={inputRef}
          id="media-file"
          type="file"
          accept="image/*,video/*,application/pdf"
          onChange={handleFileChange}
          className="sr-only"
          disabled={uploading}
        />
      </label>

      <div className="flex flex-col justify-end">
        <label className="museum-label grid gap-3 border-b border-white/15 pb-4 text-[9px] text-white/45 focus-within:border-white/60">
          Título
          <input
            type="text"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Nombre de la obra"
            className="museum-label border-0 bg-transparent text-base text-white outline-none placeholder:text-white/20"
          />
        </label>
        <label className="museum-label mt-7 grid gap-3 border-b border-white/15 pb-4 text-[9px] text-white/45 focus-within:border-white/60">
          Autor
          <input
            type="text"
            value={subidoPor}
            onChange={(event) => setSubidoPor(event.target.value)}
            placeholder="Nombre del autor"
            className="museum-label border-0 bg-transparent text-base text-white outline-none placeholder:text-white/20"
          />
        </label>

        {error && <p role="alert" className="mt-5 text-sm text-red-300">{error}</p>}
        {success && <p role="status" className="mt-5 text-sm text-cyan-200">{success}</p>}

        <button
          type="submit"
          disabled={uploading}
          className="mt-8 flex h-14 items-center justify-between bg-white px-5 text-sm font-semibold text-black transition duration-300 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>{uploading ? 'Contribuyendo...' : 'Añadir al archivo'}</span>
          <span className="text-xl" aria-hidden="true">{uploading ? '◌' : '↗'}</span>
        </button>
      </div>
    </form>
  );
}
