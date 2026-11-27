import { useState, type FormEvent } from 'react';
import { Check, Edit2, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Artwork, ArtworkCategory } from '../../types/database';
import { ConfirmDialog } from './ConfirmDialog';

interface AdminCategoriesTabProps {
  categories: ArtworkCategory[];
  artworks: Artwork[];
  onRefresh: () => Promise<void>;
  onNotify: (type: 'success' | 'error', text: string) => void;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function AdminCategoriesTab({
  categories,
  artworks,
  onRefresh,
  onNotify,
}: AdminCategoriesTabProps) {
  const [name, setName] = useState('');
  const [displayOrder, setDisplayOrder] = useState(categories.length + 1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<ArtworkCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    const slug = toSlug(name) || `category-${Date.now()}`;
    const { error: insertErr } = await supabase.from('artwork_categories').insert({
      name: name.trim(),
      slug,
      display_order: displayOrder,
    });

    if (insertErr) {
      onNotify('error', `Không thể thêm danh mục: ${insertErr.message}`);
    } else {
      onNotify('success', `Đã thêm danh mục "${name.trim()}".`);
      setName('');
      setDisplayOrder(categories.length + 2);
      await onRefresh();
    }
    setSaving(false);
  };

  const handleSaveEdit = async (cat: ArtworkCategory) => {
    if (!editingName.trim()) return;
    const nextSlug = toSlug(editingName) || cat.slug;
    const { error: updateErr } = await supabase
      .from('artwork_categories')
      .update({ name: editingName.trim(), slug: nextSlug })
      .eq('id', cat.id);

    if (updateErr) {
      onNotify('error', `Không thể sửa danh mục: ${updateErr.message}`);
    } else {
      onNotify('success', `Đã đổi tên danh mục thành "${editingName.trim()}".`);
      setEditingId(null);
      await onRefresh();
    }
  };

  const handleUpdateOrder = async (cat: ArtworkCategory, nextOrder: number) => {
    if (cat.display_order === nextOrder) return;
    const { error } = await supabase
      .from('artwork_categories')
      .update({ display_order: nextOrder })
      .eq('id', cat.id);
    if (error) {
      onNotify('error', `Không thể đổi thứ tự: ${error.message}`);
    } else {
      onNotify('success', `Đã cập nhật thứ tự hiển thị cho "${cat.name}".`);
      await onRefresh();
    }
  };

  const requestDelete = (cat: ArtworkCategory) => {
    const usedCount = artworks.filter((a) => a.category_id === cat.id).length;
    if (usedCount > 0) {
      onNotify(
        'error',
        `Không thể xóa "${cat.name}" vì đang có ${usedCount} bức tranh thuộc danh mục này. Hãy chuyển tranh sang danh mục khác trước.`
      );
      return;
    }
    setPendingDelete(cat);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const { error: delErr } = await supabase
      .from('artwork_categories')
      .delete()
      .eq('id', pendingDelete.id);

    setDeleting(false);
    if (delErr) {
      onNotify('error', `Xóa danh mục thất bại: ${delErr.message}`);
    } else {
      onNotify('success', `Đã xóa danh mục "${pendingDelete.name}".`);
      setPendingDelete(null);
      await onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-stone-900">
          Danh mục tranh
        </h2>
        <p className="text-xs text-stone-500">
          Thêm, sửa tên, sắp xếp thứ tự các thẻ lọc trong Gallery. Danh mục đang chứa tranh sẽ
          được bảo vệ khỏi việc xóa nhầm.
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-stone-200 bg-white p-4 text-xs"
      >
        <div className="min-w-[200px] flex-1">
          <label className="block font-semibold text-stone-800">Tên danh mục mới</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Concept Art"
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </div>
        <div className="w-28">
          <label className="block font-semibold text-stone-800">Thứ tự</label>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-stone-900 px-4 py-2 font-semibold text-white hover:bg-[#9A3412]"
        >
          <Plus className="h-4 w-4" />
          {saving ? 'Đang thêm...' : 'Thêm danh mục'}
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Tên danh mục</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold">Số tranh</th>
              <th className="px-4 py-3 font-semibold">Thứ tự hiển thị</th>
              <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {categories.map((cat) => {
              const count = artworks.filter((a) => a.category_id === cat.id).length;
              const isEditing = editingId === cat.id;
              return (
                <tr key={cat.id}>
                  <td className="px-4 py-3 font-medium text-stone-900">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="rounded border border-stone-400 px-2 py-1 text-xs"
                        autoFocus
                      />
                    ) : (
                      cat.name
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-stone-500">{cat.slug}</td>
                  <td className="px-4 py-3 text-stone-600">{count}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      defaultValue={cat.display_order}
                      onBlur={(e) => void handleUpdateOrder(cat, Number(e.target.value) || 0)}
                      className="w-16 rounded border border-stone-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => void handleSaveEdit(cat)}
                          className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                          aria-label="Lưu tên danh mục"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded p-1 text-stone-400 hover:bg-stone-100"
                          aria-label="Hủy sửa"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(cat.id);
                            setEditingName(cat.name);
                          }}
                          className="rounded p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                          aria-label={`Sửa ${cat.name}`}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete(cat)}
                          className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Xóa ${cat.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Xóa danh mục tranh?"
        description={`Bạn có chắc muốn xóa danh mục "${pendingDelete?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa danh mục"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
