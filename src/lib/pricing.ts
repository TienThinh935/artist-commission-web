import type { CommissionAddon, CommissionType } from '../types/database';

export interface PriceEstimateBreakdown {
  baseTotal: number;
  addonsTotal: number;
  total: number;
}

/**
 * Computes an estimated commission price from database-backed service and add-on rates.
 */
export function calculateCommissionEstimate(
  service: CommissionType | undefined,
  characterCount: number,
  selectedAddons: CommissionAddon[]
): PriceEstimateBreakdown {
  if (!service) {
    return { baseTotal: 0, addonsTotal: 0, total: 0 };
  }

  const safeChars = Math.max(1, Math.min(20, Math.floor(characterCount || 1)));
  const basePrice = Number(service.base_price) || 0;
  const extraCharRate = (Number(service.additional_char_percent) || 0) / 100;

  const baseTotal = basePrice + (safeChars - 1) * basePrice * extraCharRate;

  let addonsTotal = 0;
  for (const addon of selectedAddons) {
    const price = Number(addon.price) || 0;
    if (addon.pricing_type === 'fixed') {
      addonsTotal += price;
    } else if (addon.pricing_type === 'per_character') {
      addonsTotal += price * safeChars;
    } else if (addon.pricing_type === 'percentage') {
      addonsTotal += (baseTotal * price) / 100;
    }
  }

  const roundedBase = Math.round(baseTotal * 100) / 100;
  const roundedAddons = Math.round(addonsTotal * 100) / 100;
  const total = Math.round((roundedBase + roundedAddons) * 100) / 100;

  return {
    baseTotal: roundedBase,
    addonsTotal: roundedAddons,
    total,
  };
}

/**
 * Formats a numeric price using the artist's configured currency symbol and code.
 */
export function formatPrice(
  amount: number,
  currencySymbol = '₫',
  currencyCode = 'VND'
): string {
  const num = Number(amount) || 0;
  if (currencyCode.toUpperCase() === 'VND') {
    return `${Math.round(num).toLocaleString('vi-VN')}${currencySymbol || '₫'}`;
  }
  const formatted = Number.isInteger(num)
    ? num.toLocaleString('en-US')
    : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${currencySymbol}${formatted}`;
}
