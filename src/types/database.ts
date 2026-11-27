export type CommissionStatus = 'OPEN' | 'CLOSED';

export type OrderStatus =
  | 'PENDING'
  | 'REVIEWING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type AddonPricingType = 'fixed' | 'percentage' | 'per_character';

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  pixiv?: string;
  discord?: string;
  vgen?: string;
  kofi?: string;
  website?: string;
  [key: string]: string | undefined;
}

export interface ArtistProfile {
  id: string;
  artist_name: string;
  tagline: string;
  avatar_url: string | null;
  biography: string;
  artistic_style: string;
  specialties: string[];
  preferred_subjects: string[];
  contact_email: string;
  social_links: SocialLinks;
  updated_at: string;
}

export interface ArtworkCategory {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  created_at: string;
}

export interface Artwork {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category_id: string;
  is_featured: boolean;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  artwork_categories?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface CommissionType {
  id: string;
  name: string;
  description: string | null;
  example_image_url: string | null;
  base_price: number;
  additional_char_percent: number;
  estimated_delivery: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CommissionAddon {
  id: string;
  name: string;
  description: string | null;
  price: number;
  pricing_type: AddonPricingType;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SelectedAddonSnapshot {
  id: string;
  name: string;
  price: number;
  pricing_type: AddonPricingType;
}

export interface CommissionOrder {
  id: string;
  order_code: string;
  customer_name: string;
  customer_email: string;
  discord_username: string | null;
  commission_type_id: string | null;
  commission_type_name: string;
  character_count: number;
  selected_addons: SelectedAddonSnapshot[];
  description: string;
  reference_image_urls: string[];
  budget: string | null;
  preferred_deadline: string | null;
  additional_notes: string | null;
  estimated_price: number;
  final_quoted_price: number | null;
  status: OrderStatus;
  artist_internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  customer_name: string;
  review_content: string;
  commission_type: string | null;
  artwork_image_url: string | null;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
}

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
}

export interface SiteSettings {
  id: string;
  commission_status: CommissionStatus;
  currency_code: string;
  currency_symbol: string;
  terms_of_service: string;
  commission_process: ProcessStep[];
  updated_at: string;
}
