import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import { useAdminAuth } from '../hooks/useAdminAuth';

export function AdminLoginPage() {
  const { isAdmin, loading, signIn } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const errMsg = await signIn(email.trim(), password);
    if (errMsg) {
      setError(errMsg);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF8F5] px-4">
      <div className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-8">
        <div className="flex items-center gap-2.5 text-stone-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-stone-900 text-[#FAF8F5]">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">Quản trị Studio</h1>
            <p className="text-xs text-stone-500">Đăng nhập dành riêng cho Họa sĩ</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="admin-email" className="block text-xs font-semibold text-stone-800">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-stone-300 bg-[#FAF8F5] px-3.5 py-2.5 text-sm focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-semibold text-stone-800">
              Mật khẩu
            </label>
            <input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-stone-300 bg-[#FAF8F5] px-3.5 py-2.5 text-sm focus:border-stone-900 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full rounded-md bg-stone-900 py-2.5 text-sm font-semibold text-[#FAF8F5] transition-colors hover:bg-[#9A3412] disabled:opacity-50"
          >
            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-6 border-t border-stone-100 pt-4 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
