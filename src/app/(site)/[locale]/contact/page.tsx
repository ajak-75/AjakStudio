import type { Metadata } from "next";

import { ArrowGlyph, PageHeader, SectionLabel } from "@/components/site/Editorial";
import { brand, channels } from "@/config/brand";
import { getDictionary, isLocale, type Locale } from "@/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict.contact.title,
    description: dict.contact.lead,
    alternates: { canonical: `/${locale}/contact/` },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return null;
  const locale: Locale = raw;
  const dict = getDictionary(locale);
  const contactChannels = channels.filter((channel) => channel.status === "active" && channel.url);

  return (
    <>
      <PageHeader eyebrow={dict.contact.eyebrow} title={dict.contact.title} lead={dict.contact.lead} />

      <section className="shell py-section">
        <div className="grid-12 gap-y-12">
          <div className="col-span-12 md:col-span-5">
            <SectionLabel>{dict.contact.emailLabel}</SectionLabel>
            {brand.email ? (
              <a
                href={`mailto:${brand.email}`}
                className="group mt-6 flex items-baseline justify-between gap-4 border-b border-line pb-4 font-serif text-[1.375rem] leading-tight text-ink transition-colors hover:text-brass"
              >
                <span className="break-all">{brand.email}</span>
                <ArrowGlyph className="shrink-0 transition-colors" />
              </a>
            ) : (
              <p className="mt-6 font-serif text-[1.375rem] leading-tight text-muted">
                {dict.common.emailPending}
              </p>
            )}

            <div className="mt-14">
              <SectionLabel>{dict.contact.channelsLabel}</SectionLabel>
              <ul className="mt-8">
                {contactChannels.map((channel) => (
                  <li key={channel.id} className="border-b border-line">
                    <a
                      href={channel.url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-baseline justify-between gap-4 py-4"
                    >
                      <span className="font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-ink">
                        {channel.platform}
                      </span>
                      <span className="flex items-center gap-2 font-sans text-[0.75rem] text-muted">
                        {channel.handle ?? channel.account}
                        <ArrowGlyph className="transition-colors group-hover:text-ink" />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="col-span-12 md:col-span-6 md:col-start-7">
            <div className="border border-line bg-porcelain p-8 md:p-10">
              <div className="flex items-center justify-between">
                <p className="eyebrow">{dict.contact.formLabel}</p>
                <span className="font-sans text-[0.5625rem] uppercase tracking-[0.16em] text-brass">
                  {dict.contact.formPending}
                </span>
              </div>
              <p className="mt-6 font-serif text-[1.375rem] leading-snug text-ink">{dict.contact.note}</p>
              <p className="mt-8 border-t border-line pt-4 font-sans text-[0.75rem] leading-relaxed text-muted">
                {brand.name} · {brand.base[locale]}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
