import { getOrderStatusBadgeClass, getOrderStatusLabel } from '../../lib/orderStatus';
import { formatPrice } from '../../lib/pricing';
import type { CommissionOrder, CommissionStatus, SiteSettings } from '../../types/database';

interface AdminOverviewTabProps {
  orders: CommissionOrder[];
  settings: SiteSettings | null;
  onToggleStatus: (nextStatus: CommissionStatus) => Promise<void>;
  onNavigateTab: (tab: 'orders' | 'artworks' | 'pricing' | 'settings') => void;
}

export function AdminOverviewTab({
  orders,
  settings,
  onToggleStatus,
  onNavigateTab,
}: AdminOverviewTabProps) {
  const isOpen = settings?.commission_status === 'OPEN';
  const currencySymbol = settings?.currency_symbol || '$';
  const currencyCode = settings?.currency_code || 'USD';

  const counts = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'PENDING').length,
    reviewing: orders.filter((o) => o.status === 'REVIEWING').length,
    accepted: orders.filter((o) => o.status === 'ACCEPTED').length,
    inProgress: orders.filter((o) => o.status === 'IN_PROGRESS').length,
    completed: orders.filter((o) => o.status === 'COMPLETED').length,
  };

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Availability Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-stone-200 bg-white p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl font-semibold text-stone-900">
            Trạng thái nhận Commission
          </h2>
          <p className="mt-1 text-xs text-stone-600">
            Điều khiển nhãn trạng thái trên trang chủ và cho phép/tạm khóa khách gửi form đặt vẽ.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onToggleStatus(isOpen ? 'CLOSED' : 'OPEN')}
          className={`inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-xs font-semibold transition-colors ${
            isOpen
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-stone-800 text-white hover:bg-stone-900'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-emerald-200' : 'bg-stone-400'}`} />
          {isOpen ? 'ĐANG MỞ (Bấm để Đóng)' : 'ĐANG ĐÓNG (Bấm để Mở)'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Tổng số đơn', value: counts.total },
          { label: 'Chờ duyệt', value: counts.pending },
          { label: 'Đang xem xét', value: counts.reviewing },
          { label: 'Đã nhận', value: counts.accepted },
          { label: 'Đang vẽ', value: counts.inProgress },
          { label: 'Hoàn thành', value: counts.completed },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-stone-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              {stat.label}
            </p>
            <p className="font-display mt-1 text-3xl font-semibold text-stone-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <h3 className="font-sans text-sm font-semibold text-stone-900">Lối tắt nhanh</h3>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="rounded-md border border-stone-200 px-4 py-2 text-left text-xs font-medium text-stone-700 hover:border-stone-900"
            >
              Quản lý đơn đặt ({counts.pending} đơn chờ duyệt)
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('artworks')}
              className="rounded-md border border-stone-200 px-4 py-2 text-left text-xs font-medium text-stone-700 hover:border-stone-900"
            >
              Upload hoặc sửa Tranh mẫu
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('pricing')}
              className="rounded-md border border-stone-200 px-4 py-2 text-left text-xs font-medium text-stone-700 hover:border-stone-900"
            >
              Cập nhật Bảng giá &amp; Add-ons
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('settings')}
              className="rounded-md border border-stone-200 px-4 py-2 text-left text-xs font-medium text-stone-700 hover:border-stone-900"
            >
              Sửa Hồ sơ, Tiểu sử &amp; Điều khoản
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-sm font-semibold text-stone-900">Đơn đặt gần đây</h3>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-medium text-[#9A3412] hover:underline"
            >
              Xem tất cả
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <p className="mt-6 text-xs text-stone-500">Chưa có yêu cầu đặt commission nào.</p>
          ) : (
            <div className="mt-4 divide-y divide-stone-100">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div>
                    <p className="font-semibold text-stone-900">
                      {order.customer_name}{' '}
                      <span className="font-mono font-normal text-stone-400">
                        ({order.order_code})
                      </span>
                    </p>
                    <p className="text-stone-500">
                      {order.commission_type_name} &middot; {order.character_count} nhân vật
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded border px-2 py-0.5 text-[11px] font-medium ${getOrderStatusBadgeClass(
                        order.status
                      )}`}
                    >
                      {getOrderStatusLabel(order.status)}
                    </span>
                    <p className="mt-0.5 font-medium text-stone-800">
                      {formatPrice(order.estimated_price, currencySymbol, currencyCode)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
