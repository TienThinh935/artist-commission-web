-- 001_initial_schema.sql
-- Personal Artist Portfolio & Commission Booking Database Schema

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function to auto-update updated_at columns
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Admin Users (Explicit allowlist for Artist dashboard access)
-- Even if Supabase Auth public signup is accidentally left on, only users in this table have admin privileges.
CREATE TABLE public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Artist Profiles
CREATE TABLE public.artist_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_name TEXT NOT NULL DEFAULT '[Artist Name Placeholder]',
  tagline TEXT NOT NULL DEFAULT '[Short Personal Tagline Placeholder]',
  avatar_url TEXT,
  biography TEXT NOT NULL DEFAULT '[Artist biography placeholder. Edit this in the Admin Dashboard.]',
  artistic_style TEXT NOT NULL DEFAULT '[Artistic style description placeholder]',
  specialties TEXT[] NOT NULL DEFAULT ARRAY['Character Illustration', 'Digital Painting'],
  preferred_subjects TEXT[] NOT NULL DEFAULT ARRAY['Original Characters', 'Anime / Stylized Portraits'],
  contact_email TEXT NOT NULL DEFAULT 'artist@example.com',
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_artist_profiles_updated_at
  BEFORE UPDATE ON public.artist_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Artwork Categories
CREATE TABLE public.artwork_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_artwork_categories_order ON public.artwork_categories(display_order);

-- 4. Artworks
CREATE TABLE public.artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.artwork_categories(id) ON DELETE RESTRICT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_artworks_category ON public.artworks(category_id);
CREATE INDEX idx_artworks_published ON public.artworks(is_published, display_order, created_at DESC);
CREATE INDEX idx_artworks_featured ON public.artworks(is_featured) WHERE is_published = TRUE;

CREATE TRIGGER set_artworks_updated_at
  BEFORE UPDATE ON public.artworks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Commission Types
CREATE TABLE public.commission_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  example_image_url TEXT,
  base_price NUMERIC(12, 2) NOT NULL CHECK (base_price >= 0),
  additional_char_percent NUMERIC(5, 2) NOT NULL DEFAULT 70 CHECK (additional_char_percent >= 0 AND additional_char_percent <= 200),
  estimated_delivery TEXT NOT NULL DEFAULT '1-2 weeks',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commission_types_active ON public.commission_types(is_active, display_order);

CREATE TRIGGER set_commission_types_updated_at
  BEFORE UPDATE ON public.commission_types
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Commission Add-ons
CREATE TABLE public.commission_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  pricing_type TEXT NOT NULL DEFAULT 'fixed' CHECK (pricing_type IN ('fixed', 'percentage', 'per_character')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commission_addons_active ON public.commission_addons(is_active, display_order);

CREATE TRIGGER set_commission_addons_updated_at
  BEFORE UPDATE ON public.commission_addons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. Commission Orders (Private: Only Artist Admin can read/manage)
CREATE TABLE public.commission_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  discord_username TEXT,
  commission_type_id UUID REFERENCES public.commission_types(id) ON DELETE SET NULL,
  commission_type_name TEXT NOT NULL,
  character_count INTEGER NOT NULL DEFAULT 1 CHECK (character_count >= 1 AND character_count <= 20),
  selected_addons JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT NOT NULL,
  reference_image_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  budget TEXT,
  preferred_deadline TEXT,
  additional_notes TEXT,
  estimated_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (estimated_price >= 0),
  final_quoted_price NUMERIC(12, 2) CHECK (final_quoted_price >= 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
  ),
  artist_internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commission_orders_status ON public.commission_orders(status, created_at DESC);
CREATE INDEX idx_commission_orders_created_at ON public.commission_orders(created_at DESC);

CREATE TRIGGER set_commission_orders_updated_at
  BEFORE UPDATE ON public.commission_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. Customer Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  review_content TEXT NOT NULL,
  commission_type TEXT,
  artwork_image_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_published ON public.reviews(is_published, is_featured, created_at DESC);

-- 9. Site Settings
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_status TEXT NOT NULL DEFAULT 'OPEN' CHECK (commission_status IN ('OPEN', 'CLOSED')),
  currency_code TEXT NOT NULL DEFAULT 'VND',
  currency_symbol TEXT NOT NULL DEFAULT '₫',
  terms_of_service TEXT NOT NULL DEFAULT '',
  commission_process JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
