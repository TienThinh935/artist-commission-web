import { useState, type FormEvent } from 'react';
import { Edit2, Eye, EyeOff, Plus, Star, Trash2, X } from 'lucide-react';
import { compressImageToWebP } from '../../lib/imageCompression';
import { supabase } from '../../lib/supabase';
import type { Review } from '../../types/database';

interface AdminReviewsTabProps {
  reviews: Review[];
  onRefresh: () => Promise<void>;
}

export function AdminReviewsTab({ reviews, onRefresh }: AdminReviewsTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [commissionType, setCommissionType] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingReview(null);
    setCustomerName('');
    setReviewContent('');
    setCommissionType('');
    setIsFeatured(false);
    setIsPublished(true);
    setFile(null);
    setModalOpen(true);
  };

  const openEdit = (r: Review) => {
    setEditingReview(r);
    setCustomerName(r.customer_name);
    setReviewContent(r.review_content);
    setCommissionType(r.commission_type || '');
    setIsFeatured(r.is_featured);
    setIsPublished(r.is_published);
    setFile(null);
    setModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let artworkUrl: string | null = editingReview?.artwork_image_url || null;
    if (file) {
      const compressed = await compressImageToWebP(file, 1200, 0.84);
      const path = `reviews/${crypto.randomUUID()}.webp`;
      const { error } = await supabase.storage
        .from('portfolio-media')
        .upload(path, compressed, { contentType: compressed.type });
      if (!error) {
        const { data } = supabase.storage.from('portfolio-media').getPublicUrl(path);
        artworkUrl = data.publicUrl;
      }
    }

    const payload = {
      customer_name: customerName.trim(),
      review_content: reviewContent.trim(),
      commission_type: commissionType.trim() || null,
      artwork_image_url: artworkUrl,
      is_featured: isFeatured,
      is_published: isPublished,
    };

    if (editingReview) {
      await supabase.from('reviews').update(payload).eq('id', editingReview.id);
    } else {
      await supabase.from('reviews').insert(payload);
    }

    setSaving(false);
    setModalOpen(false);
    await onRefresh();
  };

  const togglePublish = async (r: Review) => {
    await supabase.from('reviews').update({ is_published: !r.is_published }).eq('id', r.id);
    await onRefresh();
  };

  const toggleFeature = async (r: Review) => {
    await supabase.from('reviews').update({ is_featured: !r.is_featured }).eq('id', r.id);
    await onRefresh();
  };

  const handleDelete = async (r: Review) => {
    if (!window.confirm(`Xóa đánh giá của "${r.customer_name}"?`)) return;
    await supabase.from('reviews').delete().eq('id', r.id);
    await onRefresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-stone-900">
            Đánh giá từ khách hàng ({reviews.length})
          </h2>
          <p className="text-xs text-stone-500">
            Thêm hoặc chỉnh sửa phản hồi thực tế từ các khách đã đặt vẽ. Chỉ đánh giá ở trạng
            thái &ldquo;Đang hiện&rdquo; mới hiển thị công khai.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-[#9A3412]"
        >
          <Plus className="h-4 w-4" />
          Thêm đánh giá
        </button>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 bg-white p-12 text-center text-xs text-stone-500">
          Chưa có đánh giá nào được thêm.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-lg border border-stone-200 bg-white p-5 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-stone-900">{r.customer_name}</p>
                  <p className="text-[11px] text-stone-500">{r.commission_type || 'Commission'}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void toggleFeature(r)}
                    title="Đánh dấu nổi bật"
                    className="rounded p-1 hover:bg-stone-100"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        r.is_featured ? 'fill-amber-400 text-amber-400' : 'text-stone-400'
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => void togglePublish(r)}
                    className="inline-flex items-center gap-1 rounded border border-stone-200 px-2 py-1 text-[11px]"
                  >
                    {r.is_published ? (
                      <>
                        <Eye className="h-3 w-3" /> Đang hiện
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" /> Đang ẩn
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="rounded p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                    aria-label={`Sửa đánh giá ${r.customer_name}`}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(r)}
                    className="rounded p-1 text-stone-400 hover:text-red-600"
                    aria-label={`Xóa đánh giá ${r.customer_name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-stone-700">&ldquo;{r.review_content}&rdquo;</p>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4">
          <form onSubmit={handleSave} className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 text-xs">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-display text-2xl font-semibold">
                {editingReview ? 'Chỉnh sửa đánh giá' : 'Thêm đánh giá khách hàng'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="h-5 w-5 text-stone-400" />
              </button>
            </div>
            <div>
              <label className="block font-semibold">Tên / Nickname khách *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold">Gói đã đặt (Tùy chọn)</label>
              <input
                type="text"
                value={commissionType}
                onChange={(e) => setCommissionType(e.target.value)}
                placeholder="Ví dụ: Half Body"
                className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold">Nội dung nhận xét *</label>
              <textarea
                rows={4}
                required
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold">
                Ảnh tranh đã trả {editingReview ? '(Để trống nếu giữ ảnh cũ)' : '(Tùy chọn)'}
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full"
              />
            </div>
            <div className="flex gap-6">
              <label className="inline-flex items-center gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                Nổi bật
              </label>
              <label className="inline-flex items-center gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                />
                Hiển thị ngay
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-stone-200 pt-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded border border-stone-300 px-4 py-2"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded bg-stone-900 px-5 py-2 font-semibold text-white disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu đánh giá'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
