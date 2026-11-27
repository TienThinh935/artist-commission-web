import { useEffect, useState } from 'react';
import { Image as ImageIcon, Star, X } from 'lucide-react';
import type { Artwork, ArtworkCategory } from '../../types/database';

interface GallerySectionProps {
  artworks: Artwork[];
  categories: ArtworkCategory[];
}

const PAGE_SIZE = 9;

export function GallerySection({ artworks, categories }: GallerySectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [activeArtwork, setActiveArtwork] = useState<Artwork | null>(null);

  const filteredArtworks =
    selectedCategory === 'all'
      ? artworks
      : artworks.filter((art) => art.category_id === selectedCategory);

  const displayedArtworks = filteredArtworks.slice(0, visibleCount);
  const hasMore = visibleCount < filteredArtworks.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory]);

  useEffect(() => {
    if (!activeArtwork) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveArtwork(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeArtwork]);

  return (
    <section id="gallery" className="border-b border-stone-200/80 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A3412]">
              Portfolio
            </p>
            <h2 className="font-display mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">
              Tranh đã thực hiện
            </h2>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Danh mục tranh">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-stone-900 text-[#FAF8F5]'
                  : 'border border-stone-200 bg-white text-stone-700 hover:border-stone-400'
              }`}
            >
              Tất cả ({artworks.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-stone-900 text-[#FAF8F5]'
                    : 'border border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Artwork Grid */}
        {displayedArtworks.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white/60 py-16 text-center">
            <ImageIcon className="h-10 w-10 text-stone-400" />
            <p className="mt-3 text-sm font-medium text-stone-700">
              Chưa có tranh nào được đăng trong danh mục này.
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Họa sĩ có thể upload và hiển thị tranh từ trang quản trị Admin.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayedArtworks.map((art) => (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => setActiveArtwork(art)}
                  className="group flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white text-left transition-colors hover:border-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9A3412]"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                    <img
                      src={art.image_url}
                      alt={art.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    {art.is_featured && (
                      <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded bg-stone-900/80 px-2 py-0.5 text-[11px] font-medium text-[#FAF8F5] backdrop-blur-sm">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        Nổi bật
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-stone-900">
                        {art.title}
                      </h3>
                      {art.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-stone-600">
                          {art.description}
                        </p>
                      )}
                    </div>
                    <span className="mt-3 inline-block text-[11px] font-medium uppercase tracking-wider text-stone-500">
                      {art.artwork_categories?.name || 'Minh họa'}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="rounded-md border border-stone-300 bg-white px-6 py-2.5 text-sm font-medium text-stone-800 transition-colors hover:border-stone-900"
                >
                  Xem thêm tranh ({filteredArtworks.length - visibleCount} tranh còn lại)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Artwork Lightbox Modal */}
      {activeArtwork && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-sm"
          onClick={() => setActiveArtwork(null)}
          role="dialog"
          aria-modal="true"
          aria-label={activeArtwork.title}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-[#FAF8F5] md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveArtwork(null)}
              className="absolute top-3 right-3 z-10 rounded-full bg-stone-900/80 p-2 text-white transition-colors hover:bg-stone-900"
              aria-label="Đóng xem tranh"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-1 items-center justify-center bg-stone-900 p-2 sm:p-4">
              <img
                src={activeArtwork.image_url}
                alt={activeArtwork.title}
                className="max-h-[65vh] w-auto max-w-full rounded object-contain md:max-h-[82vh]"
              />
            </div>

            <div className="flex w-full flex-col justify-between p-6 md:w-80">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#9A3412]">
                  {activeArtwork.artwork_categories?.name || 'Minh họa'}
                </span>
                <h3 className="font-display mt-1.5 text-2xl font-semibold text-stone-900">
                  {activeArtwork.title}
                </h3>
                {activeArtwork.description && (
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-600">
                    {activeArtwork.description}
                  </p>
                )}
              </div>

              <div className="mt-6 border-t border-stone-200 pt-4">
                <a
                  href="#request"
                  onClick={() => setActiveArtwork(null)}
                  className="inline-flex w-full justify-center rounded-md bg-stone-900 px-4 py-2.5 text-xs font-semibold text-[#FAF8F5] transition-colors hover:bg-[#9A3412]"
                >
                  Đặt vẽ theo phong cách này
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
