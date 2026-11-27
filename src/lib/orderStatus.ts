import type { OrderStatus } from '../types/database';

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; badgeClass: string }
> = {
  PENDING: {
    label: 'Chờ duyệt',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  REVIEWING: {
    label: 'Đang xem xét',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  ACCEPTED: {
    label: 'Đã nhận đơn',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  REJECTED: {
    label: 'Từ chối',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
  },
  IN_PROGRESS: {
    label: 'Đang vẽ',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  CANCELLED: {
    label: 'Đã hủy',
    badgeClass: 'bg-stone-100 text-stone-600 border-stone-200',
  },
};

export const ORDER_STATUS_LIST: OrderStatus[] = [
  'PENDING',
  'REVIEWING',
  'ACCEPTED',
  'REJECTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_META[status]?.label || status;
}

export function getOrderStatusBadgeClass(status: OrderStatus): string {
  return ORDER_STATUS_META[status]?.badgeClass || 'bg-stone-100 text-stone-700 border-stone-200';
}
