-- 002_rls_and_storage.sql
-- Row Level Security Policies & Storage Bucket Configuration

-- Explicit table-level grants (RLS still enforces fine-grained row access)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

GRANT SELECT ON public.artist_profiles,
  public.artwork_categories,
  public.artworks,
  public.commission_types,
  public.commission_addons,
  public.reviews,
  public.site_settings
TO anon, authenticated;

GRANT SELECT ON public.admin_users TO authenticated;

GRANT ALL ON public.artist_profiles,
  public.artwork_categories,
  public.artworks,
  public.commission_types,
  public.commission_addons,
  public.commission_orders,
  public.reviews,
  public.site_settings
TO authenticated;

-- Enable RLS on all tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artwork_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- TABLE POLICIES
-- ==========================================

-- admin_users: Only admins can read their own row
CREATE POLICY "Admins can view admin_users"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- artist_profiles: Public read, Admin write
CREATE POLICY "Public can view artist profile"
  ON public.artist_profiles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can manage artist profile"
  ON public.artist_profiles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- artwork_categories: Public read, Admin write
CREATE POLICY "Public can view artwork categories"
  ON public.artwork_categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can manage artwork categories"
  ON public.artwork_categories FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- artworks: Public read published only, Admin full access
CREATE POLICY "Public can view published artworks"
  ON public.artworks FOR SELECT
  TO anon, authenticated
  USING (is_published = true OR public.is_admin());

CREATE POLICY "Admin can insert artworks"
  ON public.artworks FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update artworks"
  ON public.artworks FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete artworks"
  ON public.artworks FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- commission_types: Public read active only, Admin full access
CREATE POLICY "Public can view active commission types"
  ON public.commission_types FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admin can manage commission types"
  ON public.commission_types FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- commission_addons: Public read active only, Admin full access
CREATE POLICY "Public can view active commission addons"
  ON public.commission_addons FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admin can manage commission addons"
  ON public.commission_addons FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- commission_orders: STRICTLY PRIVATE.
-- Public visitors CANNOT select, insert, update, or delete directly.
-- Public submissions go through the `submit-commission` Edge Function using service_role.
CREATE POLICY "Admin can manage commission orders"
  ON public.commission_orders FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- reviews: Public read published only, Admin full access
CREATE POLICY "Public can view published reviews"
  ON public.reviews FOR SELECT
  TO anon, authenticated
  USING (is_published = true OR public.is_admin());

CREATE POLICY "Admin can manage reviews"
  ON public.reviews FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- site_settings: Public read, Admin write
CREATE POLICY "Public can view site settings"
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can manage site settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==========================================
-- STORAGE BUCKETS & POLICIES
-- ==========================================

-- 1. Public bucket for portfolio artworks, avatar, and review images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-media',
  'portfolio-media',
  true,
  10485760, -- 10MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Private bucket for customer commission reference images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'commission-references',
  'commission-references',
  false,
  5242880, -- 5MB max per reference image
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for portfolio-media (Public read, Admin upload/update/delete)
CREATE POLICY "Public can view portfolio media"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'portfolio-media');

CREATE POLICY "Admin can upload portfolio media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'portfolio-media' AND public.is_admin());

CREATE POLICY "Admin can update portfolio media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'portfolio-media' AND public.is_admin());

CREATE POLICY "Admin can delete portfolio media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'portfolio-media' AND public.is_admin());

-- Storage policies for commission-references (STRICTLY PRIVATE: Admin read/delete only; uploads handled by Edge Function)
CREATE POLICY "Admin can view commission references"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'commission-references' AND public.is_admin());

CREATE POLICY "Admin can delete commission references"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'commission-references' AND public.is_admin());
