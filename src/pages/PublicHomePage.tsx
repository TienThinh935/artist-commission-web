import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { isSupabaseConfigured } from '../lib/supabase';
import { AboutSection } from '../components/public/AboutSection';
import { CommissionFormSection } from '../components/public/CommissionFormSection';
import { GallerySection } from '../components/public/GallerySection';
import { HeroSection } from '../components/public/HeroSection';
import { Navbar } from '../components/public/Navbar';
import { PricingSection } from '../components/public/PricingSection';
import { ProcessAndTermsSection } from '../components/public/ProcessAndTermsSection';
import { ReviewsSection } from '../components/public/ReviewsSection';

export function PublicHomePage() {
  const {
    profile,
    categories,
    artworks,
    commissionTypes,
    commissionAddons,
    reviews,
    settings,
    loading,
    error,
  } = usePortfolioData();

  const [prefilledSelection, setPrefilledSelection] = useState<{
    commissionTypeId: string;
    characterCount: number;
    addonIds: string[];
  } | null>(null);

  const artistName = profile?.artist_name || 'Artist Studio';
  const commissionStatus = settings?.commission_status || 'CLOSED';
  const currencySymbol = settings?.currency_symbol || '₫';
  const currencyCode = settings?.currency_code || 'VND';
  const featuredArtworks = artworks.filter((a) => a.is_featured);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF8F5] text-stone-600">
        <Loader2 className="h-7 w-7 animate-spin text-[#9A3412]" />
        <p className="mt-3 text-sm">Đang tải dữ liệu portfolio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900">
      <Navbar artistName={artistName} commissionStatus={commissionStatus} />

      {!isSupabaseConfigured || error ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs text-amber-900">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            {error || 'Chưa cấu hình kết nối Supabase trong file .env.'}
          </span>
        </div>
      ) : null}

      <main>
        <HeroSection
          profile={profile}
          featuredArtworks={featuredArtworks}
          commissionStatus={commissionStatus}
        />

        <AboutSection profile={profile} />

        <GallerySection artworks={artworks} categories={categories} />

        <PricingSection
          commissionTypes={commissionTypes}
          commissionAddons={commissionAddons}
          currencySymbol={currencySymbol}
          currencyCode={currencyCode}
          commissionStatus={commissionStatus}
          onApplyEstimateToForm={setPrefilledSelection}
        />

        <ProcessAndTermsSection
          processSteps={settings?.commission_process || []}
          termsOfService={settings?.terms_of_service || ''}
        />

        <ReviewsSection reviews={reviews} />

        <CommissionFormSection
          profile={profile}
          commissionStatus={commissionStatus}
          commissionTypes={commissionTypes}
          commissionAddons={commissionAddons}
          currencySymbol={currencySymbol}
          currencyCode={currencyCode}
          prefilledSelection={prefilledSelection}
        />
      </main>

      <footer className="border-t border-stone-200 bg-white/70 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-stone-500 sm:flex-row sm:px-6">
          <p>
            &copy; {new Date().getFullYear()} {artistName}. Bản quyền tranh thuộc về Họa sĩ.
          </p>
          <div className="flex items-center gap-5">
            <a href="#terms" className="hover:text-stone-900">
              Điều khoản dịch vụ
            </a>
            <Link to="/admin" className="hover:text-stone-900">
              Quản trị (Admin)
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
