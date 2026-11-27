# Personal Artist Portfolio & Commission Booking Website

A production-ready personal artist portfolio and commission booking web application built with **React, Vite, TypeScript, Tailwind CSS**, and **Supabase** (PostgreSQL, Authentication, Storage, Row Level Security, and Edge Functions), ready to deploy on **Vercel**.

---

## Features

### Public Website (`/`)
- **Hero & Live Availability:** Displays the Artist's identity, featured artwork, and live `OPEN` / `CLOSED` commission status from the database.
- **About Me:** Artist avatar, biography, artistic style, specialties, preferred subjects, and social links.
- **Portfolio Gallery:** Filterable by artist-managed categories, incremental pagination, lazy-loaded WebP images, and an accessible Lightbox modal.
- **Commission Pricing & Interactive Calculator:** Displays active services and calculates live estimates based on service type, character count, and optional add-ons (`fixed`, `per_character`, `percentage`).
- **Commission Process & Terms of Service:** Editable workflow steps and policies.
- **Customer Reviews:** Displays only Artist-approved, published reviews.
- **No-Account Commission Request Form:** Validated client- and server-side, supports up to 4 private reference images (JPG, PNG, WEBP, max 5MB), automatically blocks submissions when `CLOSED`, and returns a unique Request ID (`COMM-YYYYMM-XXXXXX`).

### Private Artist Dashboard (`/admin`)
- **Protected Access:** Powered by Supabase Auth + `public.admin_users` allowlist + RLS. No public registration.
- **Overview:** Real-time order counts by status, quick `OPEN`/`CLOSED` toggle, and recent requests.
- **Request Management:** Search, filter, sort, view private reference images via signed URLs, update status (`PENDING` → `REVIEWING` → `ACCEPTED` / `REJECTED` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED`), set final quoted price, and save private internal notes.
- **Artwork & Category Management:** Upload artwork (automatically compressed to WebP in-browser), toggle Featured/Published, delete with storage cleanup, and safely manage categories.
- **Pricing, Reviews, Profile & Settings:** Manage services, add-ons, currency (`USD`, `VND`, `EUR`), reviews, artist bio, avatar, and Terms of Service.

---

## 1. Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your local environment file
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 3. Start the dev server
npm run dev
```

---

## 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run the migration files in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_and_storage.sql`
   - `supabase/migrations/003_seed_sample_data.sql` (sample placeholders — replace via `/admin`)
3. **Create the Artist Admin Account:**
   - Go to **Authentication → Providers → Email** and **disable "Allow new users to sign up"** (so visitors cannot register).
   - Go to **Authentication → Users → Add User** and create the Artist's email & password.
   - Copy the new user's **UUID** and run this in the SQL Editor:
     ```sql
     INSERT INTO public.admin_users (user_id) VALUES ('PASTE-USER-UUID-HERE');
     ```
4. **Deploy the `submit-commission` Edge Function:**
   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase functions deploy submit-commission --no-verify-jwt
   ```
   *(Optional)* Set Edge Function secrets for Discord notifications or Cloudflare Turnstile:
   ```bash
   npx supabase secrets set DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
   npx supabase secrets set TURNSTILE_SECRET_KEY="your-turnstile-secret"
   ```

---

## 3. Security & RLS Verification

- **RLS is enabled on every table** in `002_rls_and_storage.sql`.
- **Public (`anon`)** can only `SELECT` published artworks, active pricing, published reviews, public profile, and site settings. `commission_orders` has **zero** public policies—unauthenticated users cannot read or write orders directly.
- **Private Storage (`commission-references`)** has `public = false` and only allows `is_admin()` to read/delete. Uploads happen exclusively inside the `submit-commission` Edge Function after validation.
- **To verify RLS:** Open the browser console on the public site and run `supabase.from('commission_orders').select('*')` — it will return an empty array / permission error.

---

## 4. Deploying to GitHub & Vercel

1. Push this repository to GitHub (`.env` is gitignored; never commit secrets).
2. Import the repository in [vercel.com](https://vercel.com):
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - `vercel.json` is already configured for SPA routing so refreshing `/admin` works without 404s.
3. Add Environment Variables in Vercel **Project Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. Every push to `main` will automatically rebuild and deploy.

### Adding a Custom Domain Later
1. In Vercel: **Project Settings → Domains → Add** your domain (e.g., `artistname.com`).
2. Update your domain registrar's DNS records (`A` record or `CNAME` to `cname.vercel-dns.com`) as shown in Vercel.
3. Vercel automatically provisions and renews the SSL/HTTPS certificate.
