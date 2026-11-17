interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  activeType: 'todos' | 'imagenes' | 'videos' | 'pdfs';
  onTypeChange: (value: 'todos' | 'imagenes' | 'videos' | 'pdfs') => void;
}

export default function FilterBar({
  search,
  onSearchChange,
  activeType,
  onTypeChange,
}: FilterBarProps) {
  const filters = [
    ['todos', 'Todos'],
    ['imagenes', 'Imágenes'],
    ['videos', 'Videos'],
    ['pdfs', 'PDFs'],
  ] as const;

  return (
    <div className="flex flex-col gap-5 border-b border-white/12 pb-6 md:flex-row md:items-end md:justify-between">
      <label className="group flex max-w-md flex-1 items-center gap-3 border-b border-white/20 pb-3 transition focus-within:border-white/70">
        <span className="museum-label text-[9px] text-white/45">Buscar</span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Título o autor"
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
        />
      </label>
      <div className="flex flex-wrap gap-2" aria-label="Filtrar por tipo">
        {filters.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onTypeChange(value)}
            className={`museum-label rounded-full border px-3 py-2 text-[9px] transition ${
              activeType === value
                ? 'border-white/50 bg-white text-black'
                : 'border-white/12 text-white/55 hover:border-white/35 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
