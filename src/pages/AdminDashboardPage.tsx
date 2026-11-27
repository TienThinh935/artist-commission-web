import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ClipboardList,
  DollarSign,
  ExternalLink,
  FolderOpen,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageSquareQuote,
  Settings,
} from 'lucide-react';
import { AdminArtworksTab } from '../components/admin/AdminArtworksTab';
import { AdminCategoriesTab } from '../components/admin/AdminCategoriesTab';
import { AdminOrdersTab } from '../components/admin/AdminOrdersTab';
import { AdminOverviewTab } from '../components/admin/AdminOverviewTab';
import { AdminPricingTab } from '../components/admin/AdminPricingTab';
import { AdminReviewsTab } from '../components/admin/AdminReviewsTab';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab';
import { ToastBanner, type ToastMessage } from '../components/admin/ToastBanner';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { supabase } from '../lib/supabase';
import type {
  ArtistProfile,
  Artwork,
  ArtworkCategory,
  CommissionAddon,
  CommissionOrder,
  CommissionStatus,
  CommissionType,
  Review,
  SiteSettings,
} from '../types/database';

type AdminTab =
  | 'overview'
  | 'orders'
  | 'artworks'
  | 'categories'
  | 'pricing'
  | 'reviews'
  | 'settings';

export function AdminDashboardPage() {
  const { isAdmin, loading: authLoading, signOut } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loadingData, setLoadingData] = useState(true);

  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [orders, setOrders] = useState<CommissionOrder[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [categories, setCategories] = useState<ArtworkCategory[]>([]);
  const [commissionTypes, setCommissionTypes] = useState<CommissionType[]>([]);
  const [commissionAddons, setCommissionAddons] = useState<CommissionAddon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadAdminData = useCallback(async () => {
    setLoadingData(true);
    const [
      profileRes,
      settingsRes,
      ordersRes,
      artworksRes,
      categoriesRes,
      typesRes,
      addonsRes,
      reviewsRes,
    ] = await Promise.all([
      supabase.from('artist_profiles').select('*').limit(1).maybeSingle(),
      supabase.from('site_settings').select('*').limit(1).maybeSingle(),
      supabase.from('commission_orders').select('*').order('created_at', { ascending: false }),
      supabase
        .from('artworks')
        .select('*, artwork_categories(id, name, slug)')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase.from('artwork_categories').select('*').order('display_order', { ascending: true }),
      supabase.from('commission_types').select('*').order('display_order', { ascending: true }),
      supabase.from('commission_addons').select('*').order('display_order', { ascending: true }),
      supabase.from('reviews').select('*').order('created_at', { ascending: false }),
    ]);

    setProfile(profileRes.data);
    setSettings(settingsRes.data);
    setOrders((ordersRes.data as CommissionOrder[]) || []);
    setArtworks((artworksRes.data as Artwork[]) || []);
    setCategories(categoriesRes.data || []);
    setCommissionTypes(typesRes.data || []);
    setCommissionAddons(addonsRes.data || []);
    setReviews(reviewsRes.data || []);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      void loadAdminData();
    }
  }, [isAdmin, loadAdminData]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5]">
        <Loader2 className="h-6 w-6 animate-spin text-[#9A3412]" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleToggleStatus = async (nextStatus: CommissionStatus) => {
    if (!settings) return;
    const { error } = await supabase
      .from('site_settings')
      .update({ commission_status: nextStatus })
      .eq('id', settings.id);

    if (error) {
      showToast('error', `Không thể đổi trạng thái: ${error.message}`);
      return;
    }

    showToast(
      'success',
      nextStatus === 'OPEN'
        ? 'Đã chuyển trạng thái sang ĐANG MỞ nhận đơn.'
        : 'Đã chuyển trạng thái sang TẠM ĐÓNG nhận đơn.'
    );
    await loadAdminData();
  };

  const navItems: Array<{ id: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'orders', label: 'Đơn đặt', icon: ClipboardList },
    { id: 'artworks', label: 'Tranh mẫu', icon: ImageIcon },
    { id: 'categories', label: 'Danh mục', icon: FolderOpen },
    { id: 'pricing', label: 'Bảng giá', icon: DollarSign },
    { id: 'reviews', label: 'Đánh giá', icon: MessageSquareQuote },
    { id: 'settings', label: 'Hồ sơ & ToS', icon: Settings },
  ];

  const currencySymbol = settings?.currency_symbol || '₫';
  const currencyCode = settings?.currency_code || 'VND';

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900">
      {/* Top Admin Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="font-display whitespace-nowrap text-xl font-semibold text-stone-900 sm:text-2xl">
              Quản trị Studio
            </span>
            <span
              className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                settings?.commission_status === 'OPEN'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {settings?.commission_status === 'OPEN' ? 'ĐANG MỞ' : 'ĐANG ĐÓNG'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-stone-900"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Xem trang công khai</span>
              <span className="sm:hidden">Trang chủ</span>
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-[#9A3412]"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-2">
          <nav className="flex flex-wrap gap-1.5 lg:flex-col">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-white hover:text-stone-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-10">
          {loadingData ? (
            <div className="flex items-center justify-center py-20 text-stone-500">
              <Loader2 className="h-6 w-6 animate-spin text-[#9A3412]" />
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <AdminOverviewTab
                  orders={orders}
                  settings={settings}
                  onToggleStatus={handleToggleStatus}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'orders' && (
                <AdminOrdersTab
                  orders={orders}
                  currencySymbol={currencySymbol}
                  currencyCode={currencyCode}
                  onRefresh={loadAdminData}
                  onNotify={showToast}
                />
              )}
              {activeTab === 'artworks' && (
                <AdminArtworksTab
                  artworks={artworks}
                  categories={categories}
                  onRefresh={loadAdminData}
                  onNotify={showToast}
                />
              )}
              {activeTab === 'categories' && (
                <AdminCategoriesTab
                  categories={categories}
                  artworks={artworks}
                  onRefresh={loadAdminData}
                  onNotify={showToast}
                />
              )}
              {activeTab === 'pricing' && (
                <AdminPricingTab
                  commissionTypes={commissionTypes}
                  commissionAddons={commissionAddons}
                  currencySymbol={currencySymbol}
                  currencyCode={currencyCode}
                  onRefresh={loadAdminData}
                  onNotify={showToast}
                />
              )}
              {activeTab === 'reviews' && (
                <AdminReviewsTab
                  reviews={reviews}
                  onRefresh={loadAdminData}
                  onNotify={showToast}
                />
              )}
              {activeTab === 'settings' && (
                <AdminSettingsTab
                  profile={profile}
                  settings={settings}
                  onRefresh={loadAdminData}
                  onNotify={showToast}
                />
              )}
            </>
          )}
        </main>
      </div>

      <ToastBanner toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
