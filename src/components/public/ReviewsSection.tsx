import { MessageSquareQuote, Star } from 'lucide-react';
import type { Review } from '../../types/database';

interface ReviewsSectionProps {
  reviews: Review[];
}

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  return (
    <section id="reviews" className="border-b border-stone-200/80 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A3412]">
          Phản hồi từ khách hàng
        </p>
        <h2 className="font-display mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">
          Đánh giá của khách đã đặt
        </h2>

        {reviews.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white/60 py-14 text-center">
            <MessageSquareQuote className="h-9 w-9 text-stone-400" />
            <p className="mt-3 text-sm font-medium text-stone-700">
              Chưa có đánh giá nào được đăng tải.
            </p>
            <p className="mt-1 max-w-md text-xs text-stone-500">
              Các phản hồi thực tế từ khách hàng sau khi được Họa sĩ duyệt sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="flex flex-col justify-between rounded-lg border border-stone-200 bg-white p-6"
              >
                <div>
                  {review.artwork_image_url && (
                    <div className="mb-4 aspect-[16/10] overflow-hidden rounded-md bg-stone-100">
                      <img
                        src={review.artwork_image_url}
                        alt={`Tranh commission của ${review.customer_name}`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-900">
                      {review.customer_name}
                    </span>
                    {review.is_featured && (
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    )}
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-stone-600">
                    &ldquo;{review.review_content}&rdquo;
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-3 text-[11px] text-stone-500">
                  <span>{review.commission_type || 'Commission'}</span>
                  <time dateTime={review.created_at}>
                    {new Date(review.created_at).toLocaleDateString('vi-VN')}
                  </time>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
