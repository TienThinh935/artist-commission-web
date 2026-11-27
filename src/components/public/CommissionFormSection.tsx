import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  Search,
  Send,
  Upload,
  X,
} from 'lucide-react';
import { getOrderStatusBadgeClass, getOrderStatusLabel } from '../../lib/orderStatus';
import { calculateCommissionEstimate, formatPrice } from '../../lib/pricing';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import type {
  ArtistProfile,
  CommissionAddon,
  CommissionStatus,
  CommissionType,
  OrderStatus,
} from '../../types/database';

interface CommissionFormSectionProps {
  profile: ArtistProfile | null;
  commissionStatus: CommissionStatus;
  commissionTypes: CommissionType[];
  commissionAddons: CommissionAddon[];
  currencySymbol: string;
  currencyCode: string;
  prefilledSelection: {
    commissionTypeId: string;
    characterCount: number;
    addonIds: string[];
  } | null;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 4;

export function CommissionFormSection({
  profile,
  commissionStatus,
  commissionTypes,
  commissionAddons,
  currencySymbol,
  currencyCode,
  prefilledSelection,
}: CommissionFormSectionProps) {
  const isOpen = commissionStatus === 'OPEN';

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [commissionTypeId, setCommissionTypeId] = useState('');
  const [characterCount, setCharacterCount] = useState(1);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [preferredDeadline, setPreferredDeadline] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [honeypot, setHoneypot] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    orderCode: string;
    estimatedPrice: number;
    message: string;
  } | null>(null);

  // Order status lookup state
  const [lookupCode, setLookupCode] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<{
    order_code: string;
    commission_type_name: string;
    character_count: number;
    status: OrderStatus;
    estimated_price: number;
    final_quoted_price: number | null;
    updated_at: string;
  } | null>(null);

  useEffect(() => {
    if (commissionTypes.length > 0 && !commissionTypeId) {
      setCommissionTypeId(commissionTypes[0].id);
    }
  }, [commissionTypes, commissionTypeId]);

  useEffect(() => {
    if (!prefilledSelection) return;
    setCommissionTypeId(prefilledSelection.commissionTypeId);
    setCharacterCount(prefilledSelection.characterCount);
    setSelectedAddonIds(prefilledSelection.addonIds);
  }, [prefilledSelection]);

  const selectedService = commissionTypes.find((t) => t.id === commissionTypeId);
  const selectedAddons = commissionAddons.filter((a) => selectedAddonIds.includes(a.id));
  const estimate = calculateCommissionEstimate(selectedService, characterCount, selectedAddons);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    const incoming = Array.from(e.target.files || []);
    if (incoming.length === 0) return;

    const combined = [...referenceFiles, ...incoming];
    if (combined.length > MAX_FILES) {
      setFormError(`Bạn chỉ có thể đính kèm tối đa ${MAX_FILES} ảnh tham khảo.`);
      return;
    }

    for (const file of incoming) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setFormError(`Tệp "${file.name}" không được hỗ trợ. Chỉ nhận JPG, PNG hoặc WEBP.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFormError(`Tệp "${file.name}" vượt quá giới hạn 5MB.`);
        return;
      }
    }

    setReferenceFiles(combined);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setReferenceFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const validateForm = (): string | null => {
    if (!isOpen) return 'Hiện tại commission đang đóng.';
    if (customerName.trim().length < 2) return 'Vui lòng nhập tên hoặc nickname (ít nhất 2 ký tự).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      return 'Vui lòng nhập địa chỉ email hợp lệ.';
    }
    if (!commissionTypeId) return 'Vui lòng chọn loại commission.';
    if (characterCount < 1 || characterCount > 20) return 'Số lượng nhân vật phải từ 1 đến 20.';
    if (description.trim().length < 15) {
      return 'Vui lòng mô tả chi tiết yêu cầu vẽ (tối thiểu 15 ký tự).';
    }
    if (description.trim().length > 3000) {
      return 'Mô tả không được vượt quá 3000 ký tự.';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (!isSupabaseConfigured) {
      setFormError('Hệ thống chưa được kết nối Supabase.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('customer_name', customerName.trim());
      formData.append('customer_email', customerEmail.trim());
      formData.append('discord_username', discordUsername.trim());
      formData.append('commission_type_id', commissionTypeId);
      formData.append('character_count', String(characterCount));
      formData.append('addon_ids', JSON.stringify(selectedAddonIds));
      formData.append('description', description.trim());
      formData.append('budget', budget.trim());
      formData.append('preferred_deadline', preferredDeadline.trim());
      formData.append('additional_notes', additionalNotes.trim());
      formData.append('website', honeypot);

      for (const file of referenceFiles) {
        formData.append('reference_images', file);
      }

      const { data, error } = await supabase.functions.invoke('submit-commission', {
        body: formData,
      });

      if (error) {
        let serverMsg = error.message || 'Gửi yêu cầu thất bại.';
        try {
          const ctx = (error as { context?: Response }).context;
          if (ctx && typeof ctx.json === 'function') {
            const errBody = await ctx.json();
            if (errBody?.error) serverMsg = errBody.error;
          }
        } catch {
          // ignore parse error
        }
        throw new Error(serverMsg);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setSubmittedResult({
        orderCode: data.order_code,
        estimatedPrice: data.estimated_price,
        message:
          'Yêu cầu đặt commission của bạn đã được gửi thành công! Vui lòng chờ Họa sĩ xem xét và liên hệ xác nhận báo giá.',
      });

      setCustomerName('');
      setCustomerEmail('');
      setDiscordUsername('');
      setDescription('');
      setBudget('');
      setPreferredDeadline('');
      setAdditionalNotes('');
      setReferenceFiles([]);
      setSelectedAddonIds([]);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gửi đơn thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookupResult(null);

    if (!lookupCode.trim() || !lookupEmail.trim()) {
      setLookupError('Vui lòng nhập đầy đủ Mã yêu cầu và Email đã dùng khi đặt.');
      return;
    }

    setLookupLoading(true);
    const { data, error } = await supabase.rpc('lookup_commission_status', {
      p_order_code: lookupCode.trim(),
      p_email: lookupEmail.trim(),
    });
    setLookupLoading(false);

    if (error) {
      setLookupError('Không thể tra cứu lúc này. Vui lòng thử lại sau.');
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      setLookupError('Không tìm thấy đơn nào khớp với Mã yêu cầu và Email này.');
      return;
    }

    setLookupResult(row);
  };

  return (
    <section id="request" className="py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A3412]">
            Liên hệ &amp; Đặt vẽ
          </p>
          <h2 className="font-display mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">
            Gửi yêu cầu Commission
          </h2>
          {profile?.contact_email && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-stone-600">
              <Mail className="h-4 w-4 text-stone-400" />
              Liên hệ trực tiếp:{' '}
              <a
                href={`mailto:${profile.contact_email}`}
                className="font-medium text-stone-900 underline decoration-stone-300 underline-offset-4 hover:decoration-stone-900"
              >
                {profile.contact_email}
              </a>
            </p>
          )}
        </div>

        {/* CLOSED State */}
        {!isOpen ? (
          <div className="mt-10 rounded-lg border border-stone-200 bg-white p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="font-display mt-4 text-2xl font-semibold text-stone-900">
              Commission hiện đang tạm đóng
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-600">
              Cảm ơn bạn đã quan tâm! Hiện tại mình đang tạm ngưng nhận đơn mới để tập trung hoàn
              thành các slot đang vẽ. Bạn có thể quay lại sau hoặc liên hệ qua mạng xã hội nhé.
            </p>
          </div>
        ) : submittedResult ? (
          /* Success State */
          <div className="mt-10 rounded-lg border border-emerald-200 bg-white p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h3 className="font-display mt-4 text-2xl font-semibold text-stone-900">
              Đã tiếp nhận yêu cầu!
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
              {submittedResult.message}
            </p>
            <div className="mx-auto mt-5 inline-block rounded-md border border-stone-200 bg-[#FAF8F5] px-5 py-3">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Mã yêu cầu của bạn
              </span>
              <span className="mt-1 block font-mono text-lg font-semibold text-stone-900">
                {submittedResult.orderCode}
              </span>
            </div>
            <p className="mt-4 text-xs text-stone-500">
              Giá tạm tính:{' '}
              {formatPrice(submittedResult.estimatedPrice, currencySymbol, currencyCode)} (sẽ được
              Họa sĩ xác nhận lại)
            </p>
            <button
              type="button"
              onClick={() => setSubmittedResult(null)}
              className="mt-6 rounded-md border border-stone-300 bg-white px-5 py-2 text-xs font-semibold text-stone-800 hover:border-stone-900"
            >
              Gửi thêm yêu cầu khác
            </button>
          </div>
        ) : (
          /* Request Form */
          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-10 space-y-6 rounded-lg border border-stone-200 bg-white p-6 sm:p-8"
          >
            {/* Honeypot anti-spam */}
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />

            {formError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="req-name" className="block text-xs font-semibold text-stone-800">
                  Tên / Nickname của bạn <span className="text-[#9A3412]">*</span>
                </label>
                <input
                  id="req-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Tên để họa sĩ xưng hô"
                  className="mt-1.5 w-full rounded-md border border-stone-300 bg-[#FAF8F5] px-3.5 py-2.5 text-sm focus:border-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="req-email" className="block text-xs font-semibold text-stone-800">
                  Địa chỉ Email <span className="text-[#9A3412]">*</span>
                </label>
                <input
                  id="req-email"
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-md border border-stone-300 bg-[#FAF8F5] px-3.5 py-2.5 text-sm focus:border-stone-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label htmlFor="req-discord" className="block text-xs font-semibold text-stone-800">
                  Discord / Facebook (Tùy chọn)
                </label>
                <input
                  id="req-discord"
                  type="text"
                  value={discordUsername}
                  onChange={(e) => setDiscordUsername(e.target.value)}
                  placeholder="username hoặc link"
                  className="mt-1.5 w-full rounded-md border border-stone-300 bg-[#FAF8F5] px-3.5 py-2.5 text-sm focus:border-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="req-type" className="block text-xs font-semibold text-stone-800">
                  Loại Commission <span className="text-[#9A3412]">*</span>
                </label>
                <select
                  id="req-type"
                  required
                  value={commissionTypeId}
                  onChange={(e) => setCommissionTypeId(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-stone-300 bg-[#FAF8F5] px-3.5 py-2.5 text-sm focus:border-stone-900 focus:outline-none"
                >
                  {commissionTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({formatPrice(t.base_price, currencySymbol, currencyCode)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="req-chars" className="block text-xs font-semibold text-stone-800">
                  Số nhân vật <span className="text-[#9A3412]">*</span>
                </label>
                <input
                  id="req-chars"
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={characterCount}
                  onChange={(e) =>
                    setCharacterCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))
                  }
                  className="mt-1.5 w-full rounded-md border border-stone-300 bg-[#FAF8F5] px-3.5 py-2.5 text-sm focus:border-stone-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Optional Add-ons */}
            {commissionAddons.length > 0 && (
              <div>
                <span className="block text-xs font-semibold text-stone-800">
                  Tùy chọn thêm (Add-ons)
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {commissionAddons.map((addon) => {
                    const checked = selectedAddonIds.includes(addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => toggleAddon(addon.id)}
                        className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                          checked
                            ? 'border-stone-900 bg-stone-900 text-[#FAF8F5]'
                            : 'border-stone-300 bg-[#FAF8F5] text-stone-700 hover:border-stone-500'
                        }`}
                      >
                        {addon.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="req-desc" className="block text-xs font-semibold text-stone-800">
                Mô tả yêu cầu vẽ <span className="text-[#9A3412]">*</span>
              </label>
              <textarea
                id="req-desc"
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chi tiết nhân vật, dáng đứng/pose, biểu cảm, trang phục, bối cảnh mong muốn..."
                className="mt-1.5 w-full rounded-md border border-stone-300 bg-[#FAF8F5] px-3.5 py-2.5 text-sm focus:border-stone-900 focus:outline-none"
              />
              <p className="mt-1 text-right text-[11px] text-stone-400">
                {description.length} / 3000
              </p>
            </div>

            {/* Reference Images */}
            <div>
              <label className="block text-xs font-semibold text-stone-800">
                Ảnh tham khảo / Reference (Tùy chọn, tối đa {MAX_FILES} ảnh — JPG, PNG, WEBP, tối đa 5MB/ảnh)
              </label>
              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-stone-400 bg-[#FAF8F5] px-4 py-2 text-xs font-medium text-stone-700 transition-colors hover:border-stone-900">
                  <Upload className="h-3.5 w-3.5" />
                  Đính kèm ảnh
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-stone-500">
                  Ảnh được lưu riêng tư — chỉ Họa sĩ mới xem được.
                </span>
              </div>

              {referenceFiles.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {referenceFiles.map((file, idx) => (
                    <li
                      key={`${file.name}-${idx}`}
                      className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-700"
                    >
                      <span className="max-w-[180px] truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-stone-400 hover:text-red-600"
                        aria-label={`Xóa ${file.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="req-budget" className="block text-xs font-semibold text-stone-800">
                  Ngân sách dự kiến (Tùy chọn)
                </label>
                <input
                  id="req-budget"
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Ví dụ: Linh hoạt hoặc mức tối đa"
                  className="mt-1.5 w-full rounded-md border border-stone-300 bg-[#FAF8F5] px-3.5 py-2.5 text-sm focus:border-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="req-deadline" className="block text-xs font-semibold text-stone-800">
                  Thời hạn mong muốn (Tùy chọn)
                </label>
                <input
                  id="req-deadline"
                  type="text"
                  value={preferredDeadline}
                  onChange={(e) => setPreferredDeadline(e.target.value)}
                  placeholder="Ví dụ: Không gấp / Trước ngày 20/12"
                  className="mt-1.5 w-full rounded-md border border-stone-300 bg-[#FAF8F5] px-3.5 py-2.5 text-sm focus:border-stone-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="req-notes" className="block text-xs font-semibold text-stone-800">
                Ghi chú thêm (Tùy chọn)
              </label>
              <input
                id="req-notes"
                type="text"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Thông tin bổ sung hoặc câu hỏi dành cho Họa sĩ..."
                className="mt-1.5 w-full rounded-md border border-stone-300 bg-[#FAF8F5] px-3.5 py-2.5 text-sm focus:border-stone-900 focus:outline-none"
              />
            </div>

            {/* Live Estimate Bar & Submit */}
            <div className="flex flex-col justify-between gap-4 border-t border-stone-200 pt-5 sm:flex-row sm:items-center">
              <div>
                <span className="text-xs text-stone-500">Tổng ước tính: </span>
                <span className="font-display text-2xl font-semibold text-[#9A3412]">
                  {formatPrice(estimate.total, currencySymbol, currencyCode)}
                </span>
                <p className="text-[11px] text-stone-500">
                  Báo giá chính thức sẽ được Họa sĩ xác nhận lại.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || commissionTypes.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-stone-900 px-6 py-3 text-sm font-semibold text-[#FAF8F5] transition-colors hover:bg-[#9A3412] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu Commission'}
              </button>
            </div>
          </form>
        )}

        {/* Order Status Lookup Box */}
        <div className="mt-12 rounded-lg border border-stone-200 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-[#9A3412]" />
            <h3 className="font-display text-2xl font-semibold text-stone-900">
              Tra cứu tiến độ đơn đã đặt
            </h3>
          </div>
          <p className="mt-1 text-xs text-stone-600">
            Nhập mã đơn (ví dụ: <span className="font-mono">COMM-202611-XXXXXX</span>) và Email
            bạn đã dùng khi đặt để kiểm tra trạng thái xử lý.
          </p>

          <form onSubmit={handleLookup} className="mt-4 grid gap-3 sm:grid-cols-12">
            <input
              type="text"
              value={lookupCode}
              onChange={(e) => setLookupCode(e.target.value)}
              placeholder="Mã đơn (COMM-...)"
              className="rounded-md border border-stone-300 bg-[#FAF8F5] px-3.5 py-2 text-xs focus:border-stone-900 focus:outline-none sm:col-span-5"
            />
            <input
              type="email"
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              placeholder="Email đã đặt đơn"
              className="rounded-md border border-stone-300 bg-[#FAF8F5] px-3.5 py-2 text-xs focus:border-stone-900 focus:outline-none sm:col-span-5"
            />
            <button
              type="submit"
              disabled={lookupLoading}
              className="rounded-md bg-stone-900 px-4 py-2 text-xs font-semibold text-[#FAF8F5] transition-colors hover:bg-[#9A3412] disabled:opacity-50 sm:col-span-2"
            >
              {lookupLoading ? 'Đang tìm...' : 'Tra cứu'}
            </button>
          </form>

          {lookupError && (
            <p className="mt-3 text-xs text-red-700">{lookupError}</p>
          )}

          {lookupResult && (
            <div className="mt-4 flex flex-col justify-between gap-3 rounded-md border border-stone-200 bg-[#FAF8F5] p-4 text-xs sm:flex-row sm:items-center">
              <div>
                <p className="font-mono font-semibold text-stone-900">
                  {lookupResult.order_code}
                </p>
                <p className="mt-0.5 text-stone-600">
                  {lookupResult.commission_type_name} ({lookupResult.character_count} nhân vật)
                </p>
                <p className="mt-0.5 text-[11px] text-stone-500">
                  Cập nhật lần cuối:{' '}
                  {new Date(lookupResult.updated_at).toLocaleDateString('vi-VN')}
                </p>
              </div>

              <div className="sm:text-right">
                <span
                  className={`inline-block rounded border px-2.5 py-1 text-xs font-semibold ${getOrderStatusBadgeClass(
                    lookupResult.status
                  )}`}
                >
                  {getOrderStatusLabel(lookupResult.status)}
                </span>
                <p className="mt-1.5 text-stone-700">
                  {lookupResult.final_quoted_price !== null ? (
                    <>
                      Giá chốt:{' '}
                      <strong className="text-[#9A3412]">
                        {formatPrice(lookupResult.final_quoted_price, currencySymbol, currencyCode)}
                      </strong>
                    </>
                  ) : (
                    <>
                      Giá tạm tính:{' '}
                      <strong>
                        {formatPrice(lookupResult.estimated_price, currencySymbol, currencyCode)}
                      </strong>
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
