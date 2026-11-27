import { useEffect, useState, type FormEvent } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { compressImageToWebP } from '../../lib/imageCompression';
import { supabase } from '../../lib/supabase';
import type { ArtistProfile, CommissionStatus, ProcessStep, SiteSettings } from '../../types/database';

interface AdminSettingsTabProps {
  profile: ArtistProfile | null;
  settings: SiteSettings | null;
  onRefresh: () => Promise<void>;
}

export function AdminSettingsTab({ profile, settings, onRefresh }: AdminSettingsTabProps) {
  const [artistName, setArtistName] = useState('');
  const [tagline, setTagline] = useState('');
  const [biography, setBiography] = useState('');
  const [artisticStyle, setArtisticStyle] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [preferredSubjects, setPreferredSubjects] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [pixiv, setPixiv] = useState('');
  const [discord, setDiscord] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [commissionStatus, setCommissionStatus] = useState<CommissionStatus>('OPEN');
  const [currencyCode, setCurrencyCode] = useState('VND');
  const [currencySymbol, setCurrencySymbol] = useState('₫');
  const [termsOfService, setTermsOfService] = useState('');
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);

  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (profile) {
      setArtistName(profile.artist_name);
      setTagline(profile.tagline);
      setBiography(profile.biography);
      setArtisticStyle(profile.artistic_style);
      setSpecialties(profile.specialties.join(', '));
      setPreferredSubjects(profile.preferred_subjects.join(', '));
      setContactEmail(profile.contact_email);
      setTwitter(profile.social_links?.twitter || '');
      setInstagram(profile.social_links?.instagram || '');
      setPixiv(profile.social_links?.pixiv || '');
      setDiscord(profile.social_links?.discord || '');
    }
    if (settings) {
      setCommissionStatus(settings.commission_status);
      setCurrencyCode(settings.currency_code);
      setCurrencySymbol(settings.currency_symbol);
      setTermsOfService(settings.terms_of_service);
      setProcessSteps(settings.commission_process || []);
    }
  }, [profile, settings]);

  const updateStep = (index: number, field: 'title' | 'description', value: string) => {
    setProcessSteps((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, [field]: value } : s))
    );
  };

  const addStep = () => {
    setProcessSteps((prev) => [
      ...prev,
      { step: prev.length + 1, title: '', description: '' },
    ]);
  };

  const removeStep = (index: number) => {
    setProcessSteps((prev) =>
      prev.filter((_, idx) => idx !== index).map((s, idx) => ({ ...s, step: idx + 1 }))
    );
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(false);

    let avatarUrl = profile?.avatar_url || null;
    if (avatarFile) {
      const compressed = await compressImageToWebP(avatarFile, 800, 0.85);
      const path = `avatars/${crypto.randomUUID()}.webp`;
      const { error } = await supabase.storage
        .from('portfolio-media')
        .upload(path, compressed, { contentType: compressed.type });
      if (!error) {
        const { data } = supabase.storage.from('portfolio-media').getPublicUrl(path);
        avatarUrl = data.publicUrl;
      }
    }

    const profilePayload = {
      artist_name: artistName.trim(),
      tagline: tagline.trim(),
      avatar_url: avatarUrl,
      biography: biography.trim(),
      artistic_style: artisticStyle.trim(),
      specialties: specialties
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      preferred_subjects: preferredSubjects
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      contact_email: contactEmail.trim(),
      social_links: {
        twitter: twitter.trim(),
        instagram: instagram.trim(),
        pixiv: pixiv.trim(),
        discord: discord.trim(),
      },
    };

    if (profile) {
      await supabase.from('artist_profiles').update(profilePayload).eq('id', profile.id);
    } else {
      await supabase.from('artist_profiles').insert(profilePayload);
    }

    const normalizedSteps = processSteps.map((s, idx) => ({
      step: idx + 1,
      title: s.title.trim(),
      description: s.description.trim(),
    }));

    const settingsPayload = {
      commission_status: commissionStatus,
      currency_code: currencyCode.trim().toUpperCase() || 'VND',
      currency_symbol: currencySymbol.trim() || '₫',
      terms_of_service: termsOfService,
      commission_process: normalizedSteps,
    };

    if (settings) {
      await supabase.from('site_settings').update(settingsPayload).eq('id', settings.id);
    } else {
      await supabase.from('site_settings').insert(settingsPayload);
    }

    setSaving(false);
    setAvatarFile(null);
    setSavedNotice(true);
    await onRefresh();
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-stone-900">
            Hồ sơ Họa sĩ &amp; Cài đặt trang
          </h2>
          <p className="text-stone-500">
            Cập nhật thông tin cá nhân, đơn vị tiền tệ, quy trình nhận đơn và Điều khoản dịch vụ.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-5 py-2.5 font-semibold text-white hover:bg-[#9A3412] disabled:opacity-50"
        >
          {savedNotice && <Check className="h-4 w-4 text-emerald-400" />}
          {saving ? 'Đang lưu...' : savedNotice ? 'Đã lưu' : 'Lưu tất cả thay đổi'}
        </button>
      </div>

      {/* Artist Profile */}
      <div className="space-y-4 rounded-lg border border-stone-200 bg-white p-6">
        <h3 className="font-sans text-sm font-semibold text-stone-900">Thông tin Họa sĩ</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block font-semibold text-stone-800">Tên Họa sĩ / Nghệ danh</label>
            <input
              type="text"
              required
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-800">Email liên hệ</label>
            <input
              type="email"
              required
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block font-semibold text-stone-800">Câu giới thiệu ngắn (Tagline)</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-800">Ảnh đại diện (Avatar)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-stone-800">Mô tả phong cách vẽ</label>
          <input
            type="text"
            value={artisticStyle}
            onChange={(e) => setArtisticStyle(e.target.value)}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-semibold text-stone-800">Tiểu sử (Biography)</label>
          <textarea
            rows={4}
            value={biography}
            onChange={(e) => setBiography(e.target.value)}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block font-semibold text-stone-800">
              Thế mạnh (cách nhau bởi dấu phẩy)
            </label>
            <input
              type="text"
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-800">
              Chủ đề nhận vẽ (cách nhau bởi dấu phẩy)
            </label>
            <input
              type="text"
              value={preferredSubjects}
              onChange={(e) => setPreferredSubjects(e.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="block font-semibold text-stone-800">Twitter / X URL</label>
            <input
              type="text"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-800">Instagram URL</label>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-800">Pixiv URL</label>
            <input
              type="text"
              value={pixiv}
              onChange={(e) => setPixiv(e.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-800">Discord / Facebook</label>
            <input
              type="text"
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Site Settings & ToS */}
      <div className="space-y-4 rounded-lg border border-stone-200 bg-white p-6">
        <h3 className="font-sans text-sm font-semibold text-stone-900">
          Trạng thái đơn, Tiền tệ &amp; Điều khoản dịch vụ
        </h3>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block font-semibold text-stone-800">Trạng thái Commission</label>
            <select
              value={commissionStatus}
              onChange={(e) => setCommissionStatus(e.target.value as CommissionStatus)}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            >
              <option value="OPEN">ĐANG MỞ (OPEN)</option>
              <option value="CLOSED">TẠM ĐÓNG (CLOSED)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-800">Đơn vị tiền tệ</label>
            <select
              value={currencyCode}
              onChange={(e) => {
                const code = e.target.value;
                setCurrencyCode(code);
                if (code === 'VND') setCurrencySymbol('₫');
                if (code === 'USD') setCurrencySymbol('$');
                if (code === 'EUR') setCurrencySymbol('€');
              }}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            >
              <option value="VND">VND (₫)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-800">Ký hiệu tiền tệ</label>
            <input
              type="text"
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-stone-800">Điều khoản dịch vụ (ToS)</label>
          <textarea
            rows={10}
            value={termsOfService}
            onChange={(e) => setTermsOfService(e.target.value)}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2 font-mono text-xs"
          />
        </div>
      </div>

      {/* Commission Process Steps */}
      <div className="space-y-4 rounded-lg border border-stone-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-sm font-semibold text-stone-900">
            Các bước quy trình đặt Commission
          </h3>
          <button
            type="button"
            onClick={addStep}
            className="inline-flex items-center gap-1 rounded border border-stone-300 px-3 py-1.5 font-medium text-stone-700 hover:border-stone-900"
          >
            <Plus className="h-3.5 w-3.5" />
            Thêm bước
          </button>
        </div>

        <div className="space-y-3">
          {processSteps.map((step, idx) => (
            <div key={idx} className="grid gap-3 rounded-md border border-stone-200 bg-stone-50 p-3 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <label className="block font-semibold text-stone-700">
                  Bước {idx + 1} — Tiêu đề
                </label>
                <input
                  type="text"
                  value={step.title}
                  onChange={(e) => updateStep(idx, 'title', e.target.value)}
                  className="mt-1 w-full rounded border border-stone-300 bg-white px-2.5 py-1.5"
                />
              </div>
              <div className="sm:col-span-7">
                <label className="block font-semibold text-stone-700">Mô tả</label>
                <input
                  type="text"
                  value={step.description}
                  onChange={(e) => updateStep(idx, 'description', e.target.value)}
                  className="mt-1 w-full rounded border border-stone-300 bg-white px-2.5 py-1.5"
                />
              </div>
              <div className="flex items-end justify-end sm:col-span-1">
                <button
                  type="button"
                  onClick={() => removeStep(idx)}
                  className="rounded p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Xóa bước"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
