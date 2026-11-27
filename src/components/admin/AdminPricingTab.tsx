import { useState, type FormEvent } from 'react';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import { compressImageToWebP } from '../../lib/imageCompression';
import { formatPrice } from '../../lib/pricing';
import { supabase } from '../../lib/supabase';
import type { AddonPricingType, CommissionAddon, CommissionType } from '../../types/database';
import { ConfirmDialog } from './ConfirmDialog';

interface AdminPricingTabProps {
  commissionTypes: CommissionType[];
  commissionAddons: CommissionAddon[];
  currencySymbol: string;
  currencyCode: string;
  onRefresh: () => Promise<void>;
  onNotify: (type: 'success' | 'error', text: string) => void;
}

export function AdminPricingTab({
  commissionTypes,
  commissionAddons,
  currencySymbol,
  currencyCode,
  onRefresh,
  onNotify,
}: AdminPricingTabProps) {
  const [serviceModal, setServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<CommissionType | null>(null);
  const [sName, setSName] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [sPrice, setSPrice] = useState('0');
  const [sExtraChar, setSExtraChar] = useState('70');
  const [sDelivery, setSDelivery] = useState('1-2 tuần');
  const [sActive, setSActive] = useState(true);
  const [sFile, setSFile] = useState<File | null>(null);
  const [savingService, setSavingService] = useState(false);

  const [addonModal, setAddonModal] = useState(false);
  const [editingAddon, setEditingAddon] = useState<CommissionAddon | null>(null);
  const [aName, setAName] = useState('');
  const [aDesc, setADesc] = useState('');
  const [aPrice, setAPrice] = useState('0');
  const [aType, setAType] = useState<AddonPricingType>('fixed');
  const [aActive, setAActive] = useState(true);

  const [pendingDelete, setPendingDelete] = useState<
    | { kind: 'service'; item: CommissionType }
    | { kind: 'addon'; item: CommissionAddon }
    | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  const openCreateService = () => {
    setEditingService(null);
    setSName('');
    setSDesc('');
    setSPrice('150000');
    setSExtraChar('75');
    setSDelivery('1-2 tuần');
    setSActive(true);
    setSFile(null);
    setServiceModal(true);
  };

  const openEditService = (t: CommissionType) => {
    setEditingService(t);
    setSName(t.name);
    setSDesc(t.description || '');
    setSPrice(String(t.base_price));
    setSExtraChar(String(t.additional_char_percent));
    setSDelivery(t.estimated_delivery);
    setSActive(t.is_active);
    setSFile(null);
    setServiceModal(true);
  };

  const saveService = async (e: FormEvent) => {
    e.preventDefault();
    setSavingService(true);

    let exampleImageUrl = editingService?.example_image_url || null;
    if (sFile) {
      const compressed = await compressImageToWebP(sFile, 1200, 0.85);
      const path = `services/${crypto.randomUUID()}.webp`;
      const { error } = await supabase.storage
        .from('portfolio-media')
        .upload(path, compressed, { contentType: compressed.type });
      if (!error) {
        const { data } = supabase.storage.from('portfolio-media').getPublicUrl(path);
        exampleImageUrl = data.publicUrl;
      }
    }

    const payload = {
      name: sName.trim(),
      description: sDesc.trim() || null,
      example_image_url: exampleImageUrl,
      base_price: Number(sPrice) || 0,
      additional_char_percent: Number(sExtraChar) || 0,
      estimated_delivery: sDelivery.trim() || '1-2 tuần',
      is_active: sActive,
    };

    if (editingService) {
      await supabase.from('commission_types').update(payload).eq('id', editingService.id);
      onNotify('success', `Đã cập nhật gói "${sName.trim()}".`);
    } else {
      await supabase.from('commission_types').insert(payload);
      onNotify('success', `Đã thêm gói mới "${sName.trim()}".`);
    }

    setSavingService(false);
    setServiceModal(false);
    await onRefresh();
  };

  const openCreateAddon = () => {
    setEditingAddon(null);
    setAName('');
    setADesc('');
    setAPrice('50000');
    setAType('fixed');
    setAActive(true);
    setAddonModal(true);
  };

  const openEditAddon = (a: CommissionAddon) => {
    setEditingAddon(a);
    setAName(a.name);
    setADesc(a.description || '');
    setAPrice(String(a.price));
    setAType(a.pricing_type);
    setAActive(a.is_active);
    setAddonModal(true);
  };

  const saveAddon = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      name: aName.trim(),
      description: aDesc.trim() || null,
      price: Number(aPrice) || 0,
      pricing_type: aType,
      is_active: aActive,
    };

    if (editingAddon) {
      await supabase.from('commission_addons').update(payload).eq('id', editingAddon.id);
      onNotify('success', `Đã cập nhật tùy chọn "${aName.trim()}".`);
    } else {
      await supabase.from('commission_addons').insert(payload);
      onNotify('success', `Đã thêm tùy chọn "${aName.trim()}".`);
    }
    setAddonModal(false);
    await onRefresh();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const table = pendingDelete.kind === 'service' ? 'commission_types' : 'commission_addons';
    const { error } = await supabase.from(table).delete().eq('id', pendingDelete.item.id);
    setDeleting(false);

    if (error) {
      onNotify('error', `Xóa thất bại: ${error.message}`);
      return;
    }

    onNotify('success', `Đã xóa "${pendingDelete.item.name}".`);
    setPendingDelete(null);
    await onRefresh();
  };

  return (
    <div className="space-y-10">
      {/* Commission Types */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-stone-900">
              Các gói dịch vụ Commission
            </h2>
            <p className="text-xs text-stone-500">
              Mọi thay đổi tại đây sẽ cập nhật ngay lập tức lên bảng giá và công cụ tính giá.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateService}
            className="inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-[#9A3412]"
          >
            <Plus className="h-4 w-4" />
            Thêm gói vẽ
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Tên gói</th>
                <th className="px-4 py-3 font-semibold">Giá gốc</th>
                <th className="px-4 py-3 font-semibold">Thêm NV (%)</th>
                <th className="px-4 py-3 font-semibold">Thời gian trả</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {commissionTypes.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-medium text-stone-900">{t.name}</td>
                  <td className="px-4 py-3 font-semibold text-[#9A3412]">
                    {formatPrice(t.base_price, currencySymbol, currencyCode)}
                  </td>
                  <td className="px-4 py-3 text-stone-600">+{t.additional_char_percent}%</td>
                  <td className="px-4 py-3 text-stone-600">{t.estimated_delivery}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                        t.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {t.is_active ? 'Đang mở' : 'Đang ẩn'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEditService(t)}
                      className="mr-2 rounded p-1 text-stone-500 hover:text-stone-900"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete({ kind: 'service', item: t })}
                      className="rounded p-1 text-stone-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Commission Add-ons */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-stone-900">
              Tùy chọn thêm (Add-ons)
            </h2>
            <p className="text-xs text-stone-500">
              Hỗ trợ tính phí cố định, tính theo từng nhân vật, hoặc theo % giá gốc.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateAddon}
            className="inline-flex items-center gap-1.5 rounded-md bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-[#9A3412]"
          >
            <Plus className="h-4 w-4" />
            Thêm Add-on
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Tên tùy chọn</th>
                <th className="px-4 py-3 font-semibold">Mức phí</th>
                <th className="px-4 py-3 font-semibold">Cách tính</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {commissionAddons.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium text-stone-900">{a.name}</td>
                  <td className="px-4 py-3 font-semibold text-[#9A3412]">
                    {a.pricing_type === 'percentage'
                      ? `${a.price}%`
                      : formatPrice(a.price, currencySymbol, currencyCode)}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{a.pricing_type}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                        a.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {a.is_active ? 'Đang mở' : 'Đang ẩn'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEditAddon(a)}
                      className="mr-2 rounded p-1 text-stone-500 hover:text-stone-900"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete({ kind: 'addon', item: a })}
                      className="rounded p-1 text-stone-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Service Modal */}
      {serviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4">
          <form onSubmit={saveService} className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 text-xs">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-display text-2xl font-semibold">
                {editingService ? 'Sửa gói dịch vụ' : 'Thêm gói dịch vụ'}
              </h3>
              <button type="button" onClick={() => setServiceModal(false)}>
                <X className="h-5 w-5 text-stone-400" />
              </button>
            </div>
            <div>
              <label className="block font-semibold">Tên gói *</label>
              <input
                type="text"
                required
                value={sName}
                onChange={(e) => setSName(e.target.value)}
                className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold">Giá gốc ({currencySymbol}) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={sPrice}
                  onChange={(e) => setSPrice(e.target.value)}
                  className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold">Thêm nhân vật (%)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={sExtraChar}
                  onChange={(e) => setSExtraChar(e.target.value)}
                  className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold">Thời gian hoàn thành dự kiến</label>
              <input
                type="text"
                value={sDelivery}
                onChange={(e) => setSDelivery(e.target.value)}
                className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold">Ảnh minh họa gói (Tùy chọn)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setSFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full"
              />
            </div>
            <div>
              <label className="block font-semibold">Mô tả chi tiết</label>
              <textarea
                rows={2}
                value={sDesc}
                onChange={(e) => setSDesc(e.target.value)}
                className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
              />
            </div>
            <label className="inline-flex items-center gap-2 font-medium">
              <input type="checkbox" checked={sActive} onChange={(e) => setSActive(e.target.checked)} />
              Hiển thị công khai trên web
            </label>
            <div className="flex justify-end gap-2 border-t border-stone-200 pt-3">
              <button
                type="button"
                onClick={() => setServiceModal(false)}
                className="rounded border border-stone-300 px-4 py-2"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={savingService}
                className="rounded bg-stone-900 px-5 py-2 font-semibold text-white disabled:opacity-50"
              >
                {savingService ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add-on Modal */}
      {addonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4">
          <form onSubmit={saveAddon} className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 text-xs">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-display text-2xl font-semibold">
                {editingAddon ? 'Sửa Add-on' : 'Thêm Add-on'}
              </h3>
              <button type="button" onClick={() => setAddonModal(false)}>
                <X className="h-5 w-5 text-stone-400" />
              </button>
            </div>
            <div>
              <label className="block font-semibold">Tên tùy chọn *</label>
              <input
                type="text"
                required
                value={aName}
                onChange={(e) => setAName(e.target.value)}
                className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold">Số tiền / % *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={aPrice}
                  onChange={(e) => setAPrice(e.target.value)}
                  className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold">Cách tính phí</label>
                <select
                  value={aType}
                  onChange={(e) => setAType(e.target.value as AddonPricingType)}
                  className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                >
                  <option value="fixed">Cố định (Fixed)</option>
                  <option value="per_character">Theo mỗi nhân vật</option>
                  <option value="percentage">Phần trăm (% giá gốc)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block font-semibold">Mô tả</label>
              <textarea
                rows={2}
                value={aDesc}
                onChange={(e) => setADesc(e.target.value)}
                className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
              />
            </div>
            <label className="inline-flex items-center gap-2 font-medium">
              <input type="checkbox" checked={aActive} onChange={(e) => setAActive(e.target.checked)} />
              Đang mở
            </label>
            <div className="flex justify-end gap-2 border-t border-stone-200 pt-3">
              <button
                type="button"
                onClick={() => setAddonModal(false)}
                className="rounded border border-stone-300 px-4 py-2"
              >
                Hủy
              </button>
              <button type="submit" className="rounded bg-stone-900 px-5 py-2 font-semibold text-white">
                Lưu
              </button>
            </div>
          </form>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete?.kind === 'service' ? 'Xóa gói dịch vụ?' : 'Xóa tùy chọn thêm?'}
        description={`Bạn có chắc muốn xóa "${pendingDelete?.item.name}"? Mục này sẽ biến mất khỏi bảng giá và công cụ ước tính.`}
        confirmLabel="Xác nhận xóa"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
