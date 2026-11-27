import { FileText } from 'lucide-react';
import type { ProcessStep } from '../../types/database';

interface ProcessAndTermsSectionProps {
  processSteps: ProcessStep[];
  termsOfService: string;
}

export function ProcessAndTermsSection({
  processSteps,
  termsOfService,
}: ProcessAndTermsSectionProps) {
  return (
    <>
      {/* Commission Process */}
      <section id="process" className="border-b border-stone-200/80 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A3412]">
            Cách thức làm việc
          </p>
          <h2 className="font-display mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">
            Quy trình đặt Commission
          </h2>

          {processSteps.length === 0 ? (
            <p className="mt-6 text-sm text-stone-500">
              Quy trình đặt vẽ chưa được cập nhật.
            </p>
          ) : (
            <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {processSteps.map((step, idx) => (
                <li
                  key={step.step ?? idx}
                  className="relative flex flex-col rounded-lg border border-stone-200 bg-white p-5"
                >
                  <span className="font-display text-3xl font-semibold text-[#9A3412]">
                    {String(step.step ?? idx + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-3 font-sans text-sm font-semibold text-stone-900">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-stone-600">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* Terms of Service */}
      <section id="terms" className="border-b border-stone-200/80 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-[#9A3412]" />
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A3412]">
              Quy định &amp; Chính sách
            </p>
          </div>
          <h2 className="font-display mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">
            Điều khoản dịch vụ (ToS)
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Vui lòng đọc kỹ các điều khoản dưới đây trước khi gửi yêu cầu đặt vẽ.
          </p>

          <div className="mt-8 rounded-lg border border-stone-200 bg-white p-6 sm:p-8">
            {termsOfService ? (
              <div className="whitespace-pre-line text-sm leading-relaxed text-stone-700">
                {termsOfService}
              </div>
            ) : (
              <p className="text-sm text-stone-500">
                Nội dung Điều khoản dịch vụ mẫu — Họa sĩ có thể chỉnh sửa trong trang Admin.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
