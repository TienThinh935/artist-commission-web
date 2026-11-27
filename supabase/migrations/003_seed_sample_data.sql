-- 003_seed_sample_data.sql
-- Clearly labeled sample placeholder data so the Artist can replace everything via /admin.
-- NOTE: No fake customer reviews are seeded.

-- 1. Initial Artist Profile Placeholder
INSERT INTO public.artist_profiles (
  artist_name,
  tagline,
  biography,
  artistic_style,
  specialties,
  preferred_subjects,
  contact_email,
  social_links
)
SELECT
  '[Artist Name — Edit in Admin]',
  'Independent Digital Illustrator & Character Designer',
  '[Placeholder Biography] Replace this section with your story, artistic journey, tools you use (e.g. Clip Studio Paint, Procreate), and what inspires your illustrations.',
  'Soft painterly rendering with expressive linework and warm atmospheric lighting.',
  ARRAY['Character Illustration', 'Original Characters (OC)', 'Chibi & Emotes'],
  ARRAY['Original Characters', 'Anime / Stylized Portraits', 'Couple Art', 'Fantasy Themes'],
  'artist-placeholder@example.com',
  '{"twitter": "", "instagram": "", "pixiv": "", "discord": ""}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.artist_profiles);

-- 2. Initial Artwork Categories
INSERT INTO public.artwork_categories (name, slug, display_order)
VALUES
  ('Anime', 'anime', 1),
  ('Original Characters (OC)', 'original-characters', 2),
  ('Chibi', 'chibi', 3),
  ('Couple Art', 'couple-art', 4),
  ('Portrait', 'portrait', 5),
  ('Fanart', 'fanart', 6)
ON CONFLICT (slug) DO NOTHING;

-- 3. Sample Commission Types (Clearly labeled as sample pricing)
INSERT INTO public.commission_types (name, description, base_price, additional_char_percent, estimated_delivery, is_active, display_order)
SELECT * FROM (
  VALUES
    ('[Mẫu] Chibi', 'Vẽ chibi toàn thân dễ thương, tô màu cơ bản, nền đơn giản hoặc trong suốt.', 150000, 80.00, '3–7 ngày', true, 1),
    ('[Mẫu] Headshot / Bust', 'Vẽ chân dung từ vai trở lên, lên màu và ánh sáng chi tiết.', 250000, 75.00, '5–10 ngày', true, 2),
    ('[Mẫu] Half Body', 'Vẽ nửa người từ eo trở lên, chi tiết trang phục và nền đơn giản.', 350000, 75.00, '1–2 tuần', true, 3),
    ('[Mẫu] Full Body', 'Vẽ toàn thân, dáng động và lên màu hoàn chỉnh.', 500000, 75.00, '2–3 tuần', true, 4)
) AS v(name, description, base_price, additional_char_percent, estimated_delivery, is_active, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.commission_types);

-- 4. Sample Commission Add-ons
INSERT INTO public.commission_addons (name, description, price, pricing_type, is_active, display_order)
SELECT * FROM (
  VALUES
    ('[Mẫu] Nền chi tiết (Detailed Background)', 'Vẽ bối cảnh, kiến trúc hoặc không gian theo yêu cầu.', 150000, 'fixed', true, 1),
    ('[Mẫu] Trang phục / Phụ kiện phức tạp', 'Giáp, cánh, vũ khí hoặc nhiều phụ kiện cầu kỳ.', 80000, 'per_character', true, 2),
    ('[Mẫu] Sử dụng thương mại (Commercial)', 'Dùng cho stream, in ấn bán hàng hoặc thương hiệu (+100% giá gốc).', 100.00, 'percentage', true, 3)
) AS v(name, description, price, pricing_type, is_active, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.commission_addons);

-- 5. Initial Site Settings (Placeholder ToS & Commission Process)
INSERT INTO public.site_settings (
  commission_status,
  currency_code,
  currency_symbol,
  terms_of_service,
  commission_process
)
SELECT
  'OPEN',
  'VND',
  '₫',
  E'[PLACEHOLDER TERMS OF SERVICE — ARTIST MUST REVIEW AND REPLACE BEFORE PUBLISHING]\n\n1. Will Draw / Won''t Draw\n• Will Draw: Original characters, fanart, couples, mild fantasy.\n• Won''t Draw: NSFW, extreme gore, mecha, hateful or offensive content.\n\n2. Payment & Pricing\n• Prices shown in the estimator are starting estimates. Final quotes depend on complexity.\n• Payment terms (e.g., 50% upfront after sketch approval / 100% upfront) should be specified here.\n\n3. Revisions\n• Up to 2–3 minor revisions during the sketch phase. Major changes after lineart/coloring may incur an additional fee.\n\n4. Turnaround & Cancellation\n• Typical turnaround is 1–3 weeks depending on queue and complexity.\n• Refunds are only available before work has started.\n\n5. Copyright & Usage\n• Personal use only unless commercial rights are purchased. Artist retains rights to display the artwork in their portfolio unless requested otherwise.',
  '[
    {"step": 1, "title": "Submit Request", "description": "Fill out the commission form with your character details, references, and preferred style."},
    {"step": 2, "title": "Review & Quote", "description": "The artist reviews your request and replies via email or Discord with the final quotation and timeline."},
    {"step": 3, "title": "Agreement & Payment", "description": "Once both parties agree on the terms and quote, your slot is confirmed."},
    {"step": 4, "title": "Sketch & Feedback", "description": "You receive a rough sketch to review composition and pose before final rendering begins."},
    {"step": 5, "title": "Final Delivery", "description": "Completed high-resolution artwork is delivered digitally."}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);
