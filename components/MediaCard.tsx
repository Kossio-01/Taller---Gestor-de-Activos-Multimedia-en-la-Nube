'use client';

import { useState } from 'react';
import type { MediaAsset } from '@/types/media';

interface MediaCardProps {
  asset: MediaAsset;
  onDeleteSuccess: (id: string) => void;
  mockMode?: boolean;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 KB';
  const megabyte = 1024 * 1024;
  if (bytes >= megabyte) return `${(bytes / megabyte).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function MediaCard({
  asset,
  onDeleteSuccess,
  mockMode = false,
}: MediaCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar "${asset.titulo}"?`)) return;
    setDeleting(true);
    setError('');
    try {
      const response = await fetch(`/api/archivos/${encodeURIComponent(asset.id)}`, {
        method: 'DELETE',
      });
      if (!response.ok && !(mockMode && (response.status === 404 || response.status >= 500))) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.message || 'No fue posible eliminar el archivo.');
      }
      onDeleteSuccess(asset.id);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No fue posible eliminar.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#0D0D0F]">
        {asset.tipoArchivo === 'imagen' ? (
          <a
            href={asset.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block h-full"
            aria-label={`Abrir ${asset.titulo} en pestaña nueva`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.url}
              alt={asset.titulo}
              className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.035]"
            />
          </a>
        ) : asset.tipoArchivo === 'video' ? (
          <video
            src={asset.url}
            controls
            preload="metadata"
            className="h-full w-full object-cover"
          >
            Tu navegador no soporta video HTML5.
          </video>
        ) : (
          <div className="relative flex h-full flex-col justify-between overflow-hidden p-6 sm:p-8">
            <div className="absolute inset-0 opacity-40" style={{
              backgroundImage: 'repeating-linear-gradient(125deg, transparent 0, transparent 18px, rgba(255,255,255,.025) 19px)',
            }} />
            <div className="relative flex items-start justify-between">
              <span className="museum-label text-[9px] text-white/45">Documento / PDF</span>
              <span className="text-sm text-white/50">↗</span>
            </div>
            <h3 className="relative max-w-[80%] text-3xl font-semibold leading-[0.95] tracking-[-0.04em] text-white sm:text-4xl">
              {asset.titulo}
            </h3>
          </div>
        )}

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          title={`Eliminar ${asset.titulo}`}
          className="absolute right-3 top-3 translate-y-[-4px] border border-white/12 bg-black/60 px-3 py-2 text-[9px] uppercase tracking-[0.16em] text-white/65 opacity-0 backdrop-blur-md transition duration-300 hover:border-white/35 hover:text-white group-hover:translate-y-0 group-hover:opacity-100 focus:translate-y-0 focus:opacity-100 disabled:cursor-not-allowed"
        >
          {deleting ? 'Eliminando' : 'Eliminar'}
        </button>
      </div>

      <div className="border-b border-white/12 py-4">
        {asset.tipoArchivo === 'pdf' ? (
          <a
            href={asset.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 flex items-center justify-between text-sm font-medium text-white transition hover:text-cyan-200"
          >
            <span>Abrir documento</span>
            <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <h3 className="mb-3 text-xl font-semibold tracking-[-0.025em] text-white">{asset.titulo}</h3>
        )}
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-[10px] uppercase tracking-[0.14em] text-white/42">
          <div>
            <dt className="sr-only">Autor</dt>
            <dd>{asset.subidoPor}</dd>
          </div>
          <div className="text-right">
            <dt className="sr-only">Tipo</dt>
            <dd>{asset.tipoArchivo}</dd>
          </div>
          <div>
            <dt className="sr-only">Fecha</dt>
            <dd>{formatDate(asset.fechaSubida)}</dd>
          </div>
          <div className="text-right">
            <dt className="sr-only">Peso</dt>
            <dd>{formatBytes(asset.tamanoBytes)}</dd>
          </div>
        </dl>
        {error && <p role="alert" className="mt-3 text-xs text-red-300">{error}</p>}
      </div>
    </article>
  );
}
