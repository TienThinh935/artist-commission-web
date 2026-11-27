// supabase/functions/submit-commission/index.ts
// Edge Function: Validates public commission requests, enforces OPEN status,
// verifies optional Turnstile CAPTCHA, uploads reference images to private bucket,
// calculates authoritative estimated price, saves order, and optionally notifies Discord.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 4;

// Simple in-memory rate limit per IP (resets on cold start; supplemented by Turnstile)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 5;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function generateOrderCode(): string {
  const now = new Date();
  const ym = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const randomPart = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `COMM-${ym}-${randomPart}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // 1. Basic IP Rate Limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const now = Date.now();
    const record = rateLimitMap.get(clientIp);
    if (record && record.resetAt > now) {
      if (record.count >= RATE_LIMIT_MAX) {
        return jsonResponse(
          { error: 'Too many requests. Please wait a few minutes before submitting again.' },
          429
        );
      }
      record.count += 1;
    } else {
      rateLimitMap.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY');
    const discordWebhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL');

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Server configuration error.' }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // 2. Parse multipart form data
    const formData = await req.formData();

    // Honeypot anti-spam field
    const honeypot = String(formData.get('website') || '').trim();
    if (honeypot) {
      return jsonResponse({ error: 'Invalid submission.' }, 400);
    }

    // Optional Turnstile CAPTCHA verification if configured
    if (turnstileSecret) {
      const turnstileToken = String(formData.get('turnstile_token') || '').trim();
      if (!turnstileToken) {
        return jsonResponse({ error: 'Please complete the verification check.' }, 400);
      }
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: turnstileSecret,
          response: turnstileToken,
          remoteip: clientIp,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return jsonResponse({ error: 'Verification failed. Please try again.' }, 400);
      }
    }

    // 3. Check if commissions are currently OPEN
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('site_settings')
      .select('commission_status, currency_symbol')
      .limit(1)
      .single();

    if (settingsError || !settings) {
      console.error('settingsError:', settingsError);
      return jsonResponse(
        {
          error: `Unable to verify commission availability. ${settingsError?.message || ''}`.trim(),
        },
        500
      );
    }

    if (settings.commission_status !== 'OPEN') {
      return jsonResponse(
        { error: 'Commissions are currently closed and not accepting new requests.' },
        403
      );
    }

    // 4. Validate required fields
    const customerName = String(formData.get('customer_name') || '').trim();
    const customerEmail = String(formData.get('customer_email') || '').trim();
    const discordUsername = String(formData.get('discord_username') || '').trim() || null;
    const commissionTypeId = String(formData.get('commission_type_id') || '').trim();
    const characterCount = Number(formData.get('character_count') || 1);
    const description = String(formData.get('description') || '').trim();
    const budget = String(formData.get('budget') || '').trim() || null;
    const preferredDeadline = String(formData.get('preferred_deadline') || '').trim() || null;
    const additionalNotes = String(formData.get('additional_notes') || '').trim() || null;
    const addonIdsRaw = String(formData.get('addon_ids') || '[]');

    if (customerName.length < 2 || customerName.length > 100) {
      return jsonResponse({ error: 'Name must be between 2 and 100 characters.' }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail) || customerEmail.length > 150) {
      return jsonResponse({ error: 'Please provide a valid email address.' }, 400);
    }

    if (!commissionTypeId) {
      return jsonResponse({ error: 'Please select a commission type.' }, 400);
    }

    if (!Number.isInteger(characterCount) || characterCount < 1 || characterCount > 20) {
      return jsonResponse({ error: 'Character count must be between 1 and 20.' }, 400);
    }

    if (description.length < 15 || description.length > 3000) {
      return jsonResponse(
        { error: 'Commission description must be between 15 and 3000 characters.' },
        400
      );
    }

    let addonIds: string[] = [];
    try {
      const parsed = JSON.parse(addonIdsRaw);
      if (Array.isArray(parsed)) {
        addonIds = parsed.filter((id) => typeof id === 'string');
      }
    } catch {
      return jsonResponse({ error: 'Invalid add-ons format.' }, 400);
    }

    // 5. Fetch authoritative commission type & add-ons from DB
    const { data: commissionType, error: typeError } = await supabaseAdmin
      .from('commission_types')
      .select('id, name, base_price, additional_char_percent, is_active')
      .eq('id', commissionTypeId)
      .single();

    if (typeError || !commissionType || !commissionType.is_active) {
      return jsonResponse({ error: 'Selected commission type is unavailable.' }, 400);
    }

    let selectedAddonsSnapshot: Array<{
      id: string;
      name: string;
      price: number;
      pricing_type: string;
    }> = [];

    if (addonIds.length > 0) {
      const { data: addonsData } = await supabaseAdmin
        .from('commission_addons')
        .select('id, name, price, pricing_type, is_active')
        .in('id', addonIds)
        .eq('is_active', true);

      if (addonsData) {
        selectedAddonsSnapshot = addonsData.map((a) => ({
          id: a.id,
          name: a.name,
          price: Number(a.price),
          pricing_type: a.pricing_type,
        }));
      }
    }

    // Compute authoritative estimated price on server
    const basePrice = Number(commissionType.base_price);
    const extraCharMultiplier = Number(commissionType.additional_char_percent) / 100;
    const baseTotal =
      basePrice + (characterCount - 1) * basePrice * extraCharMultiplier;

    let addonsTotal = 0;
    for (const addon of selectedAddonsSnapshot) {
      if (addon.pricing_type === 'fixed') {
        addonsTotal += addon.price;
      } else if (addon.pricing_type === 'per_character') {
        addonsTotal += addon.price * characterCount;
      } else if (addon.pricing_type === 'percentage') {
        addonsTotal += (baseTotal * addon.price) / 100;
      }
    }
    const estimatedPrice = Math.round((baseTotal + addonsTotal) * 100) / 100;

    // 6. Validate & upload reference images to private bucket
    const files = formData
      .getAll('reference_images')
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (files.length > MAX_FILES) {
      return jsonResponse(
        { error: `You can upload at most ${MAX_FILES} reference images.` },
        400
      );
    }

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return jsonResponse(
          { error: `Unsupported file type (${file.name}). Only JPG, PNG, and WEBP are allowed.` },
          400
        );
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return jsonResponse(
          { error: `File ${file.name} exceeds the 5MB limit.` },
          400
        );
      }
    }

    const orderCode = generateOrderCode();
    const uploadedPaths: string[] = [];

    for (const file of files) {
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const storagePath = `${orderCode}/${crypto.randomUUID()}.${ext}`;
      const arrayBuffer = await file.arrayBuffer();

      const { error: uploadError } = await supabaseAdmin.storage
        .from('commission-references')
        .upload(storagePath, arrayBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        // Rollback already uploaded files on failure
        if (uploadedPaths.length > 0) {
          await supabaseAdmin.storage.from('commission-references').remove(uploadedPaths);
        }
        return jsonResponse({ error: 'Failed to upload reference images.' }, 500);
      }

      uploadedPaths.push(storagePath);
    }

    // 7. Insert commission order
    const { data: order, error: insertError } = await supabaseAdmin
      .from('commission_orders')
      .insert({
        order_code: orderCode,
        customer_name: customerName,
        customer_email: customerEmail,
        discord_username: discordUsername,
        commission_type_id: commissionType.id,
        commission_type_name: commissionType.name,
        character_count: characterCount,
        selected_addons: selectedAddonsSnapshot,
        description,
        reference_image_urls: uploadedPaths,
        budget,
        preferred_deadline: preferredDeadline,
        additional_notes: additionalNotes,
        estimated_price: estimatedPrice,
        status: 'PENDING',
      })
      .select('order_code')
      .single();

    if (insertError || !order) {
      if (uploadedPaths.length > 0) {
        await supabaseAdmin.storage.from('commission-references').remove(uploadedPaths);
      }
      return jsonResponse({ error: 'Failed to save commission request.' }, 500);
    }

    // 8. Optional Discord Webhook notification (non-blocking)
    if (discordWebhookUrl) {
      try {
        await fetch(discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [
              {
                title: `New Commission Request: ${order.order_code}`,
                color: 0xc2410c,
                fields: [
                  { name: 'Client', value: customerName, inline: true },
                  { name: 'Service', value: `${commissionType.name} (${characterCount} char)`, inline: true },
                  { name: 'Estimated', value: `${settings.currency_symbol}${estimatedPrice}`, inline: true },
                  { name: 'Description', value: description.slice(0, 300) },
                ],
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });
      } catch {
        // Ignore webhook errors so customer submission still succeeds
      }
    }

    return jsonResponse({
      success: true,
      order_code: order.order_code,
      estimated_price: estimatedPrice,
      message: 'Your commission request has been submitted successfully. Please wait while the Artist reviews your request.',
    });
  } catch {
    return jsonResponse({ error: 'An unexpected error occurred.' }, 500);
  }
});
