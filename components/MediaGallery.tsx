'use client';

import type { MediaAsset } from '@/types/media';
import MediaCard from './MediaCard';

interface MediaGalleryProps {
  assets: MediaAsset[];
  loading: boolean;
  onDeleteSuccess: (id: string) => void;
  mockMode?: boolean;
}

export default function MediaGallery({
  assets,
  loading,
  onDeleteSuccess,
  mockMode = false,
}: MediaGalleryProps) {
  if (loading) {
    return (
      <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="overflow-hidden"
          >
            <div className="aspect-[4/3] animate-pulse bg-[#0D0D0F]" />
            <div className="space-y-3 p-4">
              <div className="h-5 w-2/3 animate-pulse rounded-sm bg-white/10" />
              <div className="h-3 w-1/2 animate-pulse rounded-sm bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!assets.length) {
    return (
      <div className="grid min-h-64 place-items-center border-y border-white/10 px-6 text-center">
        <div>
          <p className="text-lg font-semibold text-slate-200">No hay archivos multimedia</p>
          <p className="mt-1 text-sm text-slate-500">Sube el primer activo desde el formulario.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {assets.map((asset) => (
        <MediaCard
          key={asset.id}
          asset={asset}
          onDeleteSuccess={onDeleteSuccess}
          mockMode={mockMode}
        />
      ))}
    </div>
  );
}
