import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type {
  ArtistProfile,
  Artwork,
  ArtworkCategory,
  CommissionAddon,
  CommissionType,
  Review,
  SiteSettings,
} from '../types/database';

export interface PortfolioDataState {
  profile: ArtistProfile | null;
  categories: ArtworkCategory[];
  artworks: Artwork[];
  commissionTypes: CommissionType[];
  commissionAddons: CommissionAddon[];
  reviews: Review[];
  settings: SiteSettings | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePortfolioData(): PortfolioDataState {
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [categories, setCategories] = useState<ArtworkCategory[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [commissionTypes, setCommissionTypes] = useState<CommissionType[]>([]);
  const [commissionAddons, setCommissionAddons] = useState<CommissionAddon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase environment variables are not configured yet.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        profileRes,
        categoriesRes,
        artworksRes,
        typesRes,
        addonsRes,
        reviewsRes,
        settingsRes,
      ] = await Promise.all([
        supabase.from('artist_profiles').select('*').limit(1).maybeSingle(),
        supabase.from('artwork_categories').select('*').order('display_order', { ascending: true }),
        supabase
          .from('artworks')
          .select('*, artwork_categories(id, name, slug)')
          .eq('is_published', true)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false }),
        supabase
          .from('commission_types')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('commission_addons')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('reviews')
          .select('*')
          .eq('is_published', true)
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase.from('site_settings').select('*').limit(1).maybeSingle(),
      ]);

      const firstError =
        profileRes.error ||
        categoriesRes.error ||
        artworksRes.error ||
        typesRes.error ||
        addonsRes.error ||
        reviewsRes.error ||
        settingsRes.error;

      if (firstError) {
        throw new Error(firstError.message);
      }

      setProfile(profileRes.data);
      setCategories(categoriesRes.data || []);
      setArtworks((artworksRes.data as Artwork[]) || []);
      setCommissionTypes(typesRes.data || []);
      setCommissionAddons(addonsRes.data || []);
      setReviews(reviewsRes.data || []);
      setSettings(settingsRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load studio data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  return {
    profile,
    categories,
    artworks,
    commissionTypes,
    commissionAddons,
    reviews,
    settings,
    loading,
    error,
    refetch: fetchAll,
  };
}
