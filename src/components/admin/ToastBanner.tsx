import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error';
  text: string;
}

interface ToastBannerProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export function ToastBanner({ toasts, onDismiss }: ToastBannerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed right-4 bottom-4 z-50 flex max-w-sm flex-col gap-2 sm:top-4 sm:bottom-auto"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-xs shadow-md ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          )}
          <span className="flex-1 font-medium leading-relaxed">{toast.text}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="rounded p-0.5 opacity-60 hover:opacity-100"
            aria-label="Đóng thông báo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
