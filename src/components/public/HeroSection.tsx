import { ArrowRight, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ArtistProfile, Artwork, CommissionStatus } from '../../types/database';

interface HeroSectionProps {
  profile: ArtistProfile | null;
  featuredArtworks: Artwork[];
  commissionStatus: CommissionStatus;
}

export function HeroSection({
  profile,
  featuredArtworks,
  commissionStatus,
}: HeroSectionProps) {
  const isOpen = commissionStatus === 'OPEN';
  const artistName = profile?.artist_name || '[Tên Họa Sĩ — Chỉnh trong Admin]';
  const tagline = profile?.tagline || 'Họa sĩ minh họa tự do & Thiết kế nhân vật';
  const styleDesc =
    profile?.artistic_style ||
    'Không gian sáng tác cá nhân trưng bày tranh minh họa, nhân vật và nhận vẽ commission theo yêu cầu.';

  const heroArt = featuredArtworks[0];

  return (
    <section id="top" className="border-b border-stone-200/80 py-14 sm:py-20 lg:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="lg:col-span-6"
        >
          <div className="mb-5 inline-flex items-center gap-2 border border-stone-300/80 bg-white/70 px-3 py-1 text-xs font-medium tracking-wide text-stone-700">
            <span
              className={`h-2 w-2 rounded-full ${
                isOpen ? 'bg-emerald-500' : 'bg-stone-400'
              }`}
            />
            {isOpen
              ? 'Trạng thái nhận đơn: ĐANG MỞ (OPEN)'
              : 'Trạng thái nhận đơn: TẠM ĐÓNG (CLOSED)'}
          </div>

          <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
            {artistName}
          </h1>

          <p className="mt-4 text-lg font-medium text-[#9A3412] sm:text-xl">{tagline}</p>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-600">
            {styleDesc}
          </p>

          {!isOpen && (
            <p className="mt-4 border-l-2 border-stone-400 pl-3 text-sm text-stone-600">
              Hiện tại mình tạm ngưng nhận thêm đơn để hoàn thành các slot đang vẽ. Bạn vẫn có
              thể xem tranh mẫu và tham khảo bảng giá bên dưới nhé!
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#gallery"
              className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-6 py-3 text-sm font-semibold text-[#FAF8F5] transition-colors hover:bg-[#9A3412]"
            >
              Xem tranh đã vẽ
              <ArrowRight className="h-4 w-4" />
            </a>

            {isOpen ? (
              <a
                href="#request"
                className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-900 transition-colors hover:border-stone-900"
              >
                Đặt Commission
              </a>
            ) : (
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition-colors hover:border-stone-900"
              >
                Xem bảng giá
              </a>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-6"
        >
          {heroArt ? (
            <div className="group relative overflow-hidden rounded-lg border border-stone-200 bg-white p-2.5">
              <div className="aspect-[4/3] overflow-hidden rounded-md bg-stone-100">
                <img
                  src={heroArt.image_url}
                  alt={heroArt.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between px-1 text-xs text-stone-500">
                <span className="font-medium text-stone-800">{heroArt.title}</span>
                <span>Tranh nổi bật</span>
              </div>
            </div>
          ) : (
            <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-100/70 p-8 text-center">
              <Palette className="h-10 w-10 text-stone-400" />
              <p className="mt-3 text-sm font-medium text-stone-700">
                Khung trưng bày tranh nổi bật
              </p>
              <p className="mt-1 max-w-xs text-xs text-stone-500">
                Upload tranh và tick chọn &ldquo;Nổi bật (Featured)&rdquo; trong trang quản trị
                Admin để hiển thị tại đây.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
