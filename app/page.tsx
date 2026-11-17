'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import FilterBar from '@/components/FilterBar';
import MediaGallery from '@/components/MediaGallery';
import UploadForm from '@/components/UploadForm';
import type { MediaAsset } from '@/types/media';

const MOCK_ASSETS: MediaAsset[] = [
  {
    id: 'mock-image',
    titulo: 'Montañas al amanecer',
    url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=90',
    publicId: 'samples/mountains',
    tipoArchivo: 'imagen',
    tamanoBytes: 2457600,
    fechaSubida: '2026-11-10T12:00:00.000Z',
    subidoPor: 'Equipo Cloud',
  },
  {
    id: 'mock-video',
    titulo: 'Flor en movimiento',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    publicId: 'samples/flower',
    tipoArchivo: 'video',
    tamanoBytes: 491520,
    fechaSubida: '2026-11-12T09:30:00.000Z',
    subidoPor: 'Equipo Cloud',
  },
  {
    id: 'mock-pdf',
    titulo: 'Documento de ejemplo',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    publicId: 'samples/document',
    tipoArchivo: 'pdf',
    tamanoBytes: 132096,
    fechaSubida: '2026-11-14T15:45:00.000Z',
    subidoPor: 'Equipo Cloud',
  },
];

export default function Home() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [mockMode, setMockMode] = useState(false);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<'todos' | 'imagenes' | 'videos' | 'pdfs'>('todos');

  useEffect(() => {
    let active = true;
    async function loadAssets() {
      try {
        const response = await fetch('/api/archivos');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!active) return;
        setAssets(Array.isArray(data) ? data : data.assets || data.archivos || []);
      } catch {
        if (!active) return;
        setAssets(MOCK_ASSETS);
        setMockMode(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadAssets();
    return () => { active = false; };
  }, []);

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assets.filter((asset) => {
      const matchesSearch =
        !query ||
        asset.titulo.toLowerCase().includes(query) ||
        asset.subidoPor.toLowerCase().includes(query);
      const matchesType =
        activeType === 'todos' ||
        (activeType === 'imagenes' && asset.tipoArchivo === 'imagen') ||
        (activeType === 'videos' && asset.tipoArchivo === 'video') ||
        (activeType === 'pdfs' && asset.tipoArchivo === 'pdf');
      return matchesSearch && matchesType;
    });
  }, [assets, search, activeType]);

  const handleUploadSuccess = useCallback((nuevoArchivo: MediaAsset) => {
    setAssets((current) => [nuevoArchivo, ...current]);
  }, []);
  const handleDeleteSuccess = useCallback((id: string) => {
    setAssets((current) => current.filter((asset) => asset.id !== id));
  }, []);

  const collageAssets = [...assets.slice(0, 8)];
  while (collageAssets.length < 8) collageAssets.push(MOCK_ASSETS[collageAssets.length % 3]);

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main className="overflow-hidden bg-[#050505] text-white">
      <section id="inicio" className="relative h-[100svh] min-h-[680px] overflow-hidden border-b border-white/10">
        <nav className="absolute left-0 right-0 top-0 z-30 flex h-20 items-center justify-between px-5 sm:px-8 lg:px-12">
          <button type="button" onClick={() => scrollToSection('inicio')} className="text-sm font-bold tracking-[-0.04em]">
            Tu arte
          </button>
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
            {[
              ['Colección', 'coleccion'],
              ['Explorar', 'coleccion'],
              ['Subir obra', 'contribuir'],
            ].map(([label, id]) => (
              <button
                key={label}
                type="button"
                onClick={() => scrollToSection(id)}
                className="museum-label text-[9px] text-white/70 transition hover:text-white"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="museum-label flex items-center gap-2 text-[8px] text-white/55">
            <span className={`h-1.5 w-1.5 rounded-full ${mockMode ? 'bg-amber-300' : 'bg-cyan-300'}`} />
            {mockMode ? 'Archivo local' : 'En vivo'}
          </div>
        </nav>

        <div className="absolute inset-x-0 top-20 bottom-0 grid grid-cols-4 grid-rows-2 gap-px bg-black">
          {collageAssets.slice(0, 8).map((asset, index) => (
            <div key={`${asset.id}-${index}`} className="relative overflow-hidden bg-[#0D0D0F]">
              {asset.tipoArchivo === 'video' ? (
                <video src={asset.url} muted loop autoPlay playsInline preload="metadata" className="h-full w-full object-cover opacity-75 saturate-[0.82] transition duration-700 hover:scale-105 hover:opacity-100" />
              ) : asset.tipoArchivo === 'imagen' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset.url} alt="" className="h-full w-full object-cover opacity-75 saturate-[0.82] transition duration-700 hover:scale-105 hover:opacity-100" />
              ) : (
                <div className="flex h-full flex-col justify-between p-5" style={{ background: 'linear-gradient(135deg,#111116,#09090b)' }}>
                  <span className="museum-label text-[8px] text-white/40">PDF / Documento</span>
                  <span className="max-w-32 text-lg font-semibold leading-none text-white/85">{asset.titulo}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/10" />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,.08)_45%,rgba(0,0,0,.55)_100%)]" />
        <h1 className="hero-title absolute left-1/2 top-1/2 z-20 w-[92vw] -translate-x-1/2 -translate-y-1/2 text-center text-[18vw] leading-[0.78] text-white sm:text-[16vw] lg:text-[12vw]">
          Tu Arte
        </h1>

        <div className="absolute bottom-7 left-5 right-5 z-20 flex items-end justify-between sm:left-8 sm:right-8 lg:left-12 lg:right-12">
          <p className="max-w-[290px] text-xs leading-relaxed text-white/72 sm:text-sm">
            Un archivo visual y documental vivo.<br />
            Obras de equipo, memoria compartida y procesos.
          </p>
          <button type="button" onClick={() => scrollToSection('coleccion')} className="museum-label hidden items-center gap-3 text-[9px] text-white/70 sm:flex">
            Explorar colección
            <span className="text-lg">↓</span>
          </button>
        </div>
      </section>

      <section id="coleccion" className="min-h-screen px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-12">
            <p className="museum-label mb-5 text-[9px] text-cyan-200/60">Archivo seleccionado / 01</p>
            <h2 className="text-[clamp(3.2rem,8vw,8rem)] font-semibold leading-[0.82] tracking-[-0.075em]">
              Archivos<br />multimedia
            </h2>
          </div>

          <FilterBar
            search={search}
            onSearchChange={setSearch}
            activeType={activeType}
            onTypeChange={setActiveType}
          />

          <div className="mt-10 flex items-center justify-between border-b border-white/10 pb-4">
            <span className="museum-label text-[9px] text-white/40">
              {filteredAssets.length} {filteredAssets.length === 1 ? 'pieza' : 'piezas'}
            </span>
            {mockMode && (
              <span className="museum-label text-[8px] text-amber-200/60">Modo respaldo</span>
            )}
          </div>

          <div className="mt-8">
            {filteredAssets.length ? (
              <MediaGallery
                assets={filteredAssets}
                loading={loading}
                onDeleteSuccess={handleDeleteSuccess}
                mockMode={mockMode}
              />
            ) : (
              <MediaGallery assets={[]} loading={loading} onDeleteSuccess={handleDeleteSuccess} mockMode={mockMode} />
            )}
          </div>
        </div>
      </section>

      <section id="contribuir" className="border-t border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-12 lg:grid-cols-[.36fr_1fr] lg:gap-16">
            <div>
              <p className="museum-label mb-5 text-[9px] text-fuchsia-300/70">Contribución / 02</p>
              <h2 className="text-[clamp(3.2rem,6vw,6.5rem)] font-semibold leading-[0.86] tracking-[-0.07em]">
                Suma una nueva pieza
              </h2>
              <p className="mt-8 max-w-sm text-sm leading-relaxed text-white/55">
                Incorpora una imagen, video o documento al archivo compartido.
              </p>
              <p className="museum-label mt-6 text-[9px] leading-5 text-white/40">
                Imágenes · Videos · PDF<br />Máximo 10 MB
              </p>
            </div>
            <UploadForm onUploadSuccess={handleUploadSuccess} mockMode={mockMode} />
          </div>
        </div>
      </section>
    </main>
  );
}
