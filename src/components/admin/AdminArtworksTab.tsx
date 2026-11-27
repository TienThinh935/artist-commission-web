import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Plus, Star, Trash2, Edit2, X } from 'lucide-react';
import { compressImageToWebP } from '../../lib/imageCompression';
import { supabase } from '../../lib/supabase';
import type { Artwork, ArtworkCategory } from '../../types/database';

interface AdminArtworksTabProps {
  artworks: Artwork[];
  categories: ArtworkCategory[];
  onRefresh: () => Promise<void>;
}

export function AdminArtworksTab({ artworks, categories, onRefresh }: AdminArtworksTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArt, setEditingArt] = useState<Artwork | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreate = () => {
    setEditingArt(null);
    setTitle('');
    setDescription('');
    setCategoryId(categories[0]?.id || '');
    setIsFeatured(false);
    setIsPublished(true);
    setFile(null);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (art: Artwork) => {
    setEditingArt(art);
    setTitle(art.title);
    setDescription(art.description || '');
    setCategoryId(art.category_id);
    setIsFeatured(art.is_featured);
    setIsPublished(art.is_published);
    setFile(null);
    setError(null);
    setModalOpen(true);
  };

  const uploadArtworkImage = async (rawFile: File): Promise<string> => {
    const compressed = await compressImageToWebP(rawFile, 1800, 0.86);
    const filePath = `artworks/${crypto.randomUUID()}.webp`;
    const { error: uploadErr } = await supabase.storage
      .from('portfolio-media')
      .upload(filePath, compressed, { contentType: compressed.type });

    if (uploadErr) throw new Error(uploadErr.message);

    const { data } = supabase.storage.from('portfolio-media').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Vui lòng nhập tên bức tranh.');
      return;
    }
    if (!categoryId) {
      setError('Vui lòng chọn danh mục.');
      return;
    }
    if (!editingArt && !file) {
      setError('Vui lòng chọn tệp ảnh để tải lên.');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = editingArt?.image_url || '';
      if (file) {
        imageUrl = await uploadArtworkImage(file);
      }

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        category_id: categoryId,
        is_featured: isFeatured,
        is_published: isPublished,
        image_url: imageUrl,
      };

      if (editingArt) {
        const { error: updateErr } = await supabase
          .from('artworks')
          .update(payload)
          .eq('id', editingArt.id);
        if (updateErr) throw new Error(updateErr.message);
      } else {
        const { error: insertErr } = await supabase.from('artworks').insert(payload);
        if (insertErr) throw new Error(insertErr.message);
      }

      setModalOpen(false);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu tranh thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (art: Artwork) => {
    await supabase
      .from('artworks')
      .update({ is_published: !art.is_published })
      .eq('id', art.id);
    await onRefresh();
  };

  const handleDelete = async (art: Artwork) => {
    if (!window.confirm(`Xóa vĩnh viễn tranh "${art.title}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    const { error: delErr } = await supabase.from('artworks').delete().eq('id', art.id);
    if (!delErr) {
      const marker = '/portfolio-media/';
      const idx = art.image_url.indexOf(marker);
      if (idx !== -1) {
        const storagePath = art.image_url.slice(idx + marker.length);
        await supabase.storage.from('portfolio-media').remove([storagePath]);
      }
      await onRefresh();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-stone-900">
            Tranh mẫu Portfolio ({artworks.length})
          </h2>
          <p className="text-xs text-stone-500">
            Ảnh sẽ được tự động nén sang WebP trước khi tải lên để trang web chạy nhanh và nhẹ.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          disabled={categories.length === 0}
          className="inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-[#9A3412] disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Upload Tranh
        </button>
      </div>

      {artworks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 bg-white p-12 text-center text-xs text-stone-500">
          Chưa có tranh nào. Bấm &ldquo;Upload Tranh&rdquo; để thêm bức tranh đầu tiên.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {artworks.map((art) => (
            <div
              key={art.id}
              className="flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white"
            >
              <div className="relative aspect-[4/3] bg-stone-100">
                <img
                  src={art.image_url}
                  alt={art.title}
                  className={`h-full w-full object-cover ${!art.is_published ? 'opacity-50' : ''}`}
                />
                <div className="absolute top-2 left-2 flex gap-1.5">
                  {art.is_featured && (
                    <span className="inline-flex items-center gap-1 rounded bg-stone-900/85 px-2 py-0.5 text-[10px] font-medium text-white">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Nổi bật
                    </span>
                  )}
                  {!art.is_published && (
                    <span className="rounded bg-stone-800/85 px-2 py-0.5 text-[10px] font-medium text-stone-200">
                      Đang ẩn
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-4 text-xs">
                <div>
                  <h3 className="font-semibold text-stone-900">{art.title}</h3>
                  <p className="text-[11px] text-stone-500">
                    {art.artwork_categories?.name || 'Chưa phân loại'}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                  <button
                    type="button"
                    onClick={() => void togglePublish(art)}
                    className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900"
                  >
                    {art.is_published ? (
                      <>
                        <Eye className="h-3.5 w-3.5" /> Đang hiện
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5" /> Đang ẩn
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(art)}
                      className="rounded p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                      aria-label={`Sửa ${art.title}`}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(art)}
                      className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Xóa ${art.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-lg space-y-4 rounded-lg bg-white p-6 text-xs"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-display text-2xl font-semibold text-stone-900">
                {editingArt ? 'Chỉnh sửa tranh' : 'Upload Tranh mới'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="h-5 w-5 text-stone-400 hover:text-stone-900" />
              </button>
            </div>

            {error && (
              <div className="rounded border border-red-200 bg-red-50 p-2.5 text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block font-semibold text-stone-800">Tên tranh *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-800">Danh mục *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-800">Mô tả ngắn (Tùy chọn)</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-800">
                Tệp ảnh {editingArt ? '(Để trống nếu giữ nguyên ảnh cũ)' : '*'}
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-stone-600"
              />
            </div>

            <div className="flex gap-6 pt-1">
              <label className="inline-flex items-center gap-2 font-medium text-stone-800">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                Hiển thị nổi bật ở Trang chủ
              </label>

              <label className="inline-flex items-center gap-2 font-medium text-stone-800">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                />
                Công khai
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-stone-200 pt-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-md border border-stone-300 px-4 py-2 font-medium text-stone-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-stone-900 px-5 py-2 font-semibold text-white hover:bg-[#9A3412] disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu tranh'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
