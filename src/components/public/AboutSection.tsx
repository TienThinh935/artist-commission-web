import { Mail, Sparkles, User } from 'lucide-react';
import type { ArtistProfile } from '../../types/database';

interface AboutSectionProps {
  profile: ArtistProfile | null;
}

export function AboutSection({ profile }: AboutSectionProps) {
  const artistName = profile?.artist_name || '[Tên Họa Sĩ — Chỉnh trong Admin]';
  const biography =
    profile?.biography ||
    '[Giới thiệu mẫu] Hãy vào trang Admin để cập nhật câu chuyện, phần mềm vẽ và phong cách của bạn.';
  const specialties = profile?.specialties || [];
  const preferredSubjects = profile?.preferred_subjects || [];
  const socialLinks = profile?.social_links || {};

  const activeSocials = Object.entries(socialLinks).filter(
    ([, value]) => typeof value === 'string' && value.trim().length > 0
  );

  return (
    <section id="about" className="border-b border-stone-200/80 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-start gap-10 md:grid-cols-12">
          {/* Avatar */}
          <div className="md:col-span-4">
            <div className="overflow-hidden rounded-lg border border-stone-200 bg-white p-2">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={artistName}
                  loading="lazy"
                  className="aspect-square w-full rounded-md object-cover"
                />
              ) : (
                <div className="flex aspect-square w-full flex-col items-center justify-center rounded-md bg-stone-100 text-stone-400">
                  <User className="h-14 w-14 stroke-[1.5]" />
                  <span className="mt-2 text-xs">Ảnh đại diện</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio & Details */}
          <div className="md:col-span-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A3412]">
              Giới thiệu
            </p>
            <h2 className="font-display mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">
              {artistName}
            </h2>

            <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-stone-600">
              {biography}
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {specialties.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-stone-800">
                    <Sparkles className="h-3.5 w-3.5 text-[#9A3412]" />
                    Thế mạnh
                  </h3>
                  <ul className="mt-2.5 flex flex-wrap gap-2">
                    {specialties.map((item) => (
                      <li
                        key={item}
                        className="rounded-md border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-700"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {preferredSubjects.length > 0 && (
                <div>
                  <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-800">
                    Chủ đề nhận vẽ
                  </h3>
                  <ul className="mt-2.5 flex flex-wrap gap-2">
                    {preferredSubjects.map((subject) => (
                      <li
                        key={subject}
                        className="rounded-md border border-stone-200 bg-stone-100/80 px-3 py-1 text-xs font-medium text-stone-700"
                      >
                        {subject}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Socials & Email */}
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-stone-200/80 pt-6">
              {profile?.contact_email && (
                <a
                  href={`mailto:${profile.contact_email}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-800 transition-colors hover:border-stone-900"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {profile.contact_email}
                </a>
              )}

              {activeSocials.map(([platform, url]) => {
                const isUrl = url!.startsWith('http');
                return isUrl ? (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium capitalize text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900"
                  >
                    {platform}
                  </a>
                ) : (
                  <span
                    key={platform}
                    className="rounded-md border border-stone-200 bg-stone-100 px-3.5 py-1.5 text-xs font-medium text-stone-700"
                  >
                    <span className="capitalize">{platform}:</span> {url}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
