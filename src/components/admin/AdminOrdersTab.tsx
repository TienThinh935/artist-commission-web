import { useMemo, useState } from 'react';
import { Eye, Search, X } from 'lucide-react';
import {
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
  ORDER_STATUS_LIST,
} from '../../lib/orderStatus';
import { formatPrice } from '../../lib/pricing';
import { supabase } from '../../lib/supabase';
import type { CommissionOrder, OrderStatus } from '../../types/database';

interface AdminOrdersTabProps {
  orders: CommissionOrder[];
  currencySymbol: string;
  currencyCode: string;
  onRefresh: () => Promise<void>;
}

export function AdminOrdersTab({
  orders,
  currencySymbol,
  currencyCode,
  onRefresh,
}: AdminOrdersTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedOrder, setSelectedOrder] = useState<CommissionOrder | null>(null);
  const [signedRefUrls, setSignedRefUrls] = useState<string[]>([]);

  const [editStatus, setEditStatus] = useState<OrderStatus>('PENDING');
  const [editFinalPrice, setEditFinalPrice] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders
      .filter((o) => (statusFilter === 'ALL' ? true : o.status === statusFilter))
      .filter((o) =>
        q
          ? o.customer_name.toLowerCase().includes(q) ||
          o.customer_email.toLowerCase().includes(q) ||
          o.order_code.toLowerCase().includes(q) ||
          o.commission_type_name.toLowerCase().includes(q)
          : true
      )
      .sort((a, b) => {
        const tA = new Date(a.created_at).getTime();
        const tB = new Date(b.created_at).getTime();
        return sortOrder === 'newest' ? tB - tA : tA - tB;
      });
  }, [orders, search, statusFilter, sortOrder]);

  const openOrderModal = async (order: CommissionOrder) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setEditFinalPrice(order.final_quoted_price !== null ? String(order.final_quoted_price) : '');
    setEditNotes(order.artist_internal_notes || '');
    setSignedRefUrls([]);

    if (order.reference_image_urls && order.reference_image_urls.length > 0) {
      const urls: string[] = [];
      for (const path of order.reference_image_urls) {
        const { data } = await supabase.storage
          .from('commission-references')
          .createSignedUrl(path, 3600);
        if (data?.signedUrl) {
          urls.push(data.signedUrl);
        }
      }
      setSignedRefUrls(urls);
    }
  };

  const handleSaveOrder = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    const parsedPrice = editFinalPrice.trim() ? Number(editFinalPrice) : null;

    await supabase
      .from('commission_orders')
      .update({
        status: editStatus,
        final_quoted_price: parsedPrice,
        artist_internal_notes: editNotes.trim() || null,
      })
      .eq('id', selectedOrder.id);

    setSaving(false);
    setSelectedOrder(null);
    await onRefresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email hoặc mã đơn..."
            className="w-full rounded-md border border-stone-300 bg-white py-2 pr-3 pl-9 text-xs focus:border-stone-900 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-stone-300 bg-white px-3 py-2 text-xs"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {ORDER_STATUS_LIST.map((s) => (
              <option key={s} value={s}>
                {getOrderStatusLabel(s)}
              </option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="rounded-md border border-stone-300 bg-white px-3 py-2 text-xs"
          >
            <option value="newest">Mới nhất trước</option>
            <option value="oldest">Cũ nhất trước</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Mã đơn</th>
              <th className="px-4 py-3 font-semibold">Khách hàng</th>
              <th className="px-4 py-3 font-semibold">Gói vẽ</th>
              <th className="px-4 py-3 font-semibold">Tạm tính</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold">Ngày gửi</th>
              <th className="px-4 py-3 text-right font-semibold">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-stone-500">
                  Không tìm thấy đơn đặt nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-50/70">
                  <td className="px-4 py-3 font-mono font-medium text-stone-900">
                    {order.order_code}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-900">{order.customer_name}</p>
                    <p className="text-[11px] text-stone-500">{order.customer_email}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {order.commission_type_name} ({order.character_count} NV)
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-900">
                    {formatPrice(order.estimated_price, currencySymbol, currencyCode)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded border px-2 py-0.5 text-[11px] font-semibold ${getOrderStatusBadgeClass(
                        order.status
                      )}`}
                    >
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-500">
                    {new Date(order.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void openOrderModal(order)}
                      className="inline-flex items-center gap-1 rounded border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-700 hover:border-stone-900"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Xem
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
            <div className="flex items-start justify-between border-b border-stone-200 pb-4">
              <div>
                <span className="font-mono text-xs font-semibold text-[#9A3412]">
                  {selectedOrder.order_code}
                </span>
                <h3 className="font-display text-2xl font-semibold text-stone-900">
                  {selectedOrder.customer_name}
                </h3>
                <p className="text-xs text-stone-500">
                  {selectedOrder.customer_email}
                  {selectedOrder.discord_username && ` • Liên hệ khác: ${selectedOrder.discord_username}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded p-1 text-stone-400 hover:text-stone-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid gap-3 rounded-md bg-stone-50 p-3.5 sm:grid-cols-3">
                <div>
                  <span className="text-stone-500">Gói vẽ</span>
                  <p className="font-semibold text-stone-900">
                    {selectedOrder.commission_type_name} ({selectedOrder.character_count} nhân vật)
                  </p>
                </div>
                <div>
                  <span className="text-stone-500">Giá tạm tính</span>
                  <p className="font-semibold text-stone-900">
                    {formatPrice(selectedOrder.estimated_price, currencySymbol, currencyCode)}
                  </p>
                </div>
                <div>
                  <span className="text-stone-500">Ngân sách / Hạn chót</span>
                  <p className="font-semibold text-stone-900">
                    {selectedOrder.budget || 'Không có'} / {selectedOrder.preferred_deadline || 'Không có'}
                  </p>
                </div>
              </div>

              {selectedOrder.selected_addons?.length > 0 && (
                <div>
                  <span className="font-semibold text-stone-800">Add-ons đã chọn:</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {selectedOrder.selected_addons.map((a) => (
                      <span
                        key={a.id}
                        className="rounded border border-stone-200 bg-stone-50 px-2 py-0.5 text-stone-700"
                      >
                        {a.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="font-semibold text-stone-800">Mô tả yêu cầu:</span>
                <p className="mt-1 whitespace-pre-line rounded-md border border-stone-200 p-3 text-stone-700">
                  {selectedOrder.description}
                </p>
              </div>

              {selectedOrder.additional_notes && (
                <div>
                  <span className="font-semibold text-stone-800">Ghi chú từ khách:</span>
                  <p className="mt-1 text-stone-700">{selectedOrder.additional_notes}</p>
                </div>
              )}

              {signedRefUrls.length > 0 && (
                <div>
                  <span className="font-semibold text-stone-800">
                    Ảnh tham khảo riêng tư ({signedRefUrls.length}):
                  </span>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {signedRefUrls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded border border-stone-200"
                      >
                        <img src={url} alt={`Ref ${idx + 1}`} className="h-24 w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Artist Management Controls */}
              <div className="space-y-3 border-t border-stone-200 pt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block font-semibold text-stone-800">Trạng thái đơn</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                      className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-xs"
                    >
                      {ORDER_STATUS_LIST.map((s) => (
                        <option key={s} value={s}>
                          {getOrderStatusLabel(s)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-800">
                      Giá chốt chính thức ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFinalPrice}
                      onChange={(e) => setEditFinalPrice(e.target.value)}
                      placeholder="Nhập giá chốt"
                      className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-800">
                    Ghi chú nội bộ của Họa sĩ (Riêng tư — khách không thấy)
                  </label>
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Ghi chú riêng về tiến độ, báo giá, yêu cầu chỉnh sửa..."
                    className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-stone-200 pt-4">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-md border border-stone-300 px-4 py-2 text-xs font-medium text-stone-700"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveOrder()}
                className="rounded-md bg-stone-900 px-5 py-2 text-xs font-semibold text-white hover:bg-[#9A3412] disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
