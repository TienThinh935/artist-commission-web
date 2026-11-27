import { useEffect, useState } from 'react';
import { Calculator, Check, Clock, Info } from 'lucide-react';
import { calculateCommissionEstimate, formatPrice } from '../../lib/pricing';
import type { CommissionAddon, CommissionStatus, CommissionType } from '../../types/database';

interface PricingSectionProps {
  commissionTypes: CommissionType[];
  commissionAddons: CommissionAddon[];
  currencySymbol: string;
  currencyCode: string;
  commissionStatus: CommissionStatus;
  onApplyEstimateToForm: (selection: {
    commissionTypeId: string;
    characterCount: number;
    addonIds: string[];
  }) => void;
}

export function PricingSection({
  commissionTypes,
  commissionAddons,
  currencySymbol,
  currencyCode,
  commissionStatus,
  onApplyEstimateToForm,
}: PricingSectionProps) {
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [characterCount, setCharacterCount] = useState<number>(1);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  useEffect(() => {
    if (commissionTypes.length > 0 && !commissionTypes.some((t) => t.id === selectedTypeId)) {
      setSelectedTypeId(commissionTypes[0].id);
    }
  }, [commissionTypes, selectedTypeId]);

  const selectedService = commissionTypes.find((t) => t.id === selectedTypeId);
  const selectedAddons = commissionAddons.filter((a) => selectedAddonIds.includes(a.id));
  const estimate = calculateCommissionEstimate(selectedService, characterCount, selectedAddons);

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const formatAddonLabel = (addon: CommissionAddon) => {
    if (addon.pricing_type === 'percentage') {
      return `+${addon.price}% giá gốc`;
    }
    if (addon.pricing_type === 'per_character') {
      return `+${formatPrice(addon.price, currencySymbol, currencyCode)} / nhân vật`;
    }
    return `+${formatPrice(addon.price, currencySymbol, currencyCode)}`;
  };

  return (
    <section id="pricing" className="border-b border-stone-200/80 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A3412]">
            Dịch vụ &amp; Chi phí
          </p>
          <h2 className="font-display mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">
            Bảng giá Commission
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            Tham khảo các gói vẽ hiện có và sử dụng công cụ ước tính bên dưới để dự trù kinh phí.
          </p>
        </div>

        {/* Service Cards */}
        {commissionTypes.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-stone-300 bg-white/60 p-10 text-center text-sm text-stone-500">
            Chưa có gói dịch vụ nào được mở. Hãy cấu hình bảng giá trong trang Admin.
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {commissionTypes.map((service) => (
              <div
                key={service.id}
                className="flex flex-col justify-between rounded-lg border border-stone-200 bg-white p-5"
              >
                <div>
                  {service.example_image_url && (
                    <div className="mb-4 aspect-[4/3] overflow-hidden rounded-md bg-stone-100">
                      <img
                        src={service.example_image_url}
                        alt={service.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <h3 className="font-display text-2xl font-semibold text-stone-900">
                    {service.name}
                  </h3>
                  <p className="mt-2 text-2xl font-semibold text-[#9A3412]">
                    {formatPrice(service.base_price, currencySymbol, currencyCode)}
                    <span className="ml-1 text-xs font-normal text-stone-500">giá cơ bản</span>
                  </p>
                  {service.description && (
                    <p className="mt-3 text-xs leading-relaxed text-stone-600">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 border-t border-stone-100 pt-3 text-xs text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Thời gian dự kiến: {service.estimated_delivery}</span>
                  </div>
                  <p className="mt-1">
                    Thêm nhân vật: +{service.additional_char_percent}% giá gốc
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Interactive Price Calculator */}
        {commissionTypes.length > 0 && (
          <div className="mt-12 rounded-lg border border-stone-200 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-2.5 border-b border-stone-100 pb-4">
              <Calculator className="h-5 w-5 text-[#9A3412]" />
              <h3 className="font-display text-2xl font-semibold text-stone-900">
                Công cụ ước tính giá nhanh
              </h3>
            </div>

            <div className="mt-6 grid gap-8 lg:grid-cols-12">
              {/* Controls */}
              <div className="space-y-6 lg:col-span-7">
                <div>
                  <label
                    htmlFor="calc-service"
                    className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                  >
                    1. Chọn gói vẽ
                  </label>
                  <select
                    id="calc-service"
                    value={selectedTypeId}
                    onChange={(e) => setSelectedTypeId(e.target.value)}
                    className="mt-2 w-full rounded-md border border-stone-300 bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
                  >
                    {commissionTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {formatPrice(t.base_price, currencySymbol, currencyCode)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="calc-chars"
                    className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                  >
                    2. Số lượng nhân vật
                  </label>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCharacterCount((c) => Math.max(1, c - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 bg-[#FAF8F5] text-base font-medium text-stone-800 hover:border-stone-900"
                      aria-label="Giảm số nhân vật"
                    >
                      -
                    </button>
                    <input
                      id="calc-chars"
                      type="number"
                      min={1}
                      max={20}
                      value={characterCount}
                      onChange={(e) =>
                        setCharacterCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))
                      }
                      className="w-16 rounded-md border border-stone-300 bg-[#FAF8F5] py-1.5 text-center text-sm font-medium text-stone-900"
                    />
                    <button
                      type="button"
                      onClick={() => setCharacterCount((c) => Math.min(20, c + 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 bg-[#FAF8F5] text-base font-medium text-stone-800 hover:border-stone-900"
                      aria-label="Tăng số nhân vật"
                    >
                      +
                    </button>
                    {selectedService && characterCount > 1 && (
                      <span className="text-xs text-stone-500">
                        (+{selectedService.additional_char_percent}% mỗi nhân vật thêm)
                      </span>
                    )}
                  </div>
                </div>

                {commissionAddons.length > 0 && (
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                      3. Tùy chọn thêm (Add-ons)
                    </span>
                    <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                      {commissionAddons.map((addon) => {
                        const checked = selectedAddonIds.includes(addon.id);
                        return (
                          <button
                            key={addon.id}
                            type="button"
                            onClick={() => toggleAddon(addon.id)}
                            className={`flex items-start justify-between gap-2 rounded-md border p-3 text-left transition-colors ${
                              checked
                                ? 'border-stone-900 bg-stone-900/5'
                                : 'border-stone-200 bg-[#FAF8F5] hover:border-stone-400'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <span
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                  checked
                                    ? 'border-stone-900 bg-stone-900 text-white'
                                    : 'border-stone-400 bg-white'
                                }`}
                              >
                                {checked && <Check className="h-3 w-3" />}
                              </span>
                              <div>
                                <p className="text-xs font-semibold text-stone-900">
                                  {addon.name}
                                </p>
                                {addon.description && (
                                  <p className="mt-0.5 text-[11px] text-stone-500">
                                    {addon.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="shrink-0 text-xs font-medium text-[#9A3412]">
                              {formatAddonLabel(addon)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="flex flex-col justify-between rounded-md border border-stone-200 bg-[#FAF8F5] p-6 lg:col-span-5">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Chi tiết tạm tính
                  </h4>

                  <dl className="mt-4 space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-stone-600">
                        {selectedService?.name} ({characterCount} nhân vật)
                      </dt>
                      <dd className="font-medium text-stone-900">
                        {formatPrice(estimate.baseTotal, currencySymbol, currencyCode)}
                      </dd>
                    </div>

                    {selectedAddons.map((addon) => (
                      <div key={addon.id} className="flex justify-between text-xs">
                        <dt className="text-stone-600">{addon.name}</dt>
                        <dd className="text-stone-800">{formatAddonLabel(addon)}</dd>
                      </div>
                    ))}

                    <div className="flex items-baseline justify-between border-t border-stone-200 pt-3">
                      <dt className="font-semibold text-stone-900">Tổng ước tính</dt>
                      <dd className="font-display text-3xl font-semibold text-[#9A3412]">
                        {formatPrice(estimate.total, currencySymbol, currencyCode)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex items-start gap-2 rounded-md border border-amber-200/80 bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-900">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                    <p>
                      Đây chỉ là mức giá ước tính tham khảo. Báo giá chính thức sẽ được Họa sĩ
                      xác nhận lại sau khi xem xét chi tiết yêu cầu của bạn.
                    </p>
                  </div>
                </div>

                {commissionStatus === 'OPEN' && selectedService && (
                  <a
                    href="#request"
                    onClick={() =>
                      onApplyEstimateToForm({
                        commissionTypeId: selectedService.id,
                        characterCount,
                        addonIds: selectedAddonIds,
                      })
                    }
                    className="mt-6 inline-flex w-full justify-center rounded-md bg-stone-900 px-4 py-2.5 text-xs font-semibold text-[#FAF8F5] transition-colors hover:bg-[#9A3412]"
                  >
                    Áp dụng cấu hình này vào Form đặt
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
