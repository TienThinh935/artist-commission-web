import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { CommissionStatus } from '../../types/database';

interface NavbarProps {
  artistName: string;
  commissionStatus: CommissionStatus;
}

const NAV_ITEMS = [
  { label: 'Giới thiệu', href: '#about' },
  { label: 'Tranh mẫu', href: '#gallery' },
  { label: 'Bảng giá', href: '#pricing' },
  { label: 'Quy trình', href: '#process' },
  { label: 'Điều khoản', href: '#terms' },
  { label: 'Đánh giá', href: '#reviews' },
];

export function Navbar({ artistName, commissionStatus }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isOpen = commissionStatus === 'OPEN';

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#FAF8F5]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <a
          href="#top"
          className="font-display max-w-[200px] truncate text-2xl font-semibold tracking-tight text-stone-900 transition-colors hover:text-[#9A3412] lg:max-w-[240px]"
        >
          {artistName}
        </a>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-5 lg:flex xl:gap-7" aria-label="Điều hướng chính">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <span
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium tracking-wide ${
              isOpen
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-stone-300 bg-stone-100 text-stone-600'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                isOpen ? 'bg-emerald-500' : 'bg-stone-400'
              }`}
            />
            {isOpen ? 'Đang mở Commission' : 'Đang đóng Commission'}
          </span>

          {isOpen && (
            <a
              href="#request"
              className="whitespace-nowrap rounded-md bg-stone-900 px-4 py-2 text-xs font-semibold tracking-wide text-[#FAF8F5] transition-colors hover:bg-[#9A3412]"
            >
              Đặt Commission
            </a>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-md p-2 text-stone-700 hover:bg-stone-200/60 lg:hidden"
          aria-label="Mở menu điều hướng"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-stone-200 bg-[#FAF8F5] px-4 py-4 lg:hidden">
          <div className="flex flex-col space-y-3">
            <div className="pb-1">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                  isOpen
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-stone-300 bg-stone-100 text-stone-600'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isOpen ? 'bg-emerald-500' : 'bg-stone-400'
                  }`}
                />
                {isOpen ? 'Đang mở Commission' : 'Đang đóng Commission'}
              </span>
            </div>

            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="py-1 text-sm font-medium text-stone-700 hover:text-stone-900"
              >
                {item.label}
              </a>
            ))}

            <a
              href="#request"
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-flex justify-center rounded-md bg-stone-900 px-4 py-2.5 text-sm font-semibold text-[#FAF8F5]"
            >
              {isOpen ? 'Đặt Commission ngay' : 'Liên hệ & Trạng thái'}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
