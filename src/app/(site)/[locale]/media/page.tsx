import type { Metadata } from "next";

import { ArrowGlyph, PageHeader, SectionLabel, StatusTag } from "@/components/site/Editorial";
import { domesticChannels, globalChannels } from "@/config/brand";
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
    title: dict.media.title,
    description: dict.media.lead,
    alternates: { canonical: `/${locale}/media/` },
  };
}

export default async function MediaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return null;
  const locale: Locale = raw;
  const dict = getDictionary(locale);

  const groups = [
    {
      key: "domestic",
      list: domesticChannels,
      title: dict.media.domesticLabel,
      note: dict.media.domesticNote,
    },
    {
      key: "global",
      list: globalChannels,
      title: dict.media.globalLabel,
      note: dict.media.globalNote,
    },
  ];

  return (
    <>
      <PageHeader eyebrow={dict.media.eyebrow} title={dict.media.title} lead={dict.media.lead} />

      <section className="shell pb-section">
        {groups.map((group) => (
          <div key={group.key} className="mb-16 last:mb-0">
            <SectionLabel>{group.title}</SectionLabel>
            <p className="mt-3 max-w-measure font-sans text-[0.75rem] leading-relaxed text-muted">
              {group.note}
            </p>

            <div className="mt-6 hidden grid-cols-12 gap-4 border-b border-ink/80 pb-3 font-sans text-[0.5625rem] uppercase tracking-[0.18em] text-muted md:grid">
              <span className="col-span-3">{dict.media.tableHeaders.channel}</span>
              <span className="col-span-2">{dict.media.tableHeaders.account}</span>
              <span className="col-span-2">{dict.media.tableHeaders.language}</span>
              <span className="col-span-2">{dict.media.tableHeaders.field}</span>
              <span className="col-span-2">{dict.media.tableHeaders.region}</span>
              <span className="col-span-1 text-right">{dict.media.tableHeaders.status}</span>
            </div>

            <ul>
              {group.list.map((channel) => (
                <li key={channel.id} className="border-b border-line">
                  <div className="grid-12 items-baseline gap-y-2 py-6">
                    <div className="col-span-12 md:col-span-3">
                      <p className="whitespace-nowrap font-sans text-[0.75rem] uppercase tracking-[0.16em] text-ink">
                        {channel.platform}
                      </p>
                      {channel.url ? (
                        <a
                          href={channel.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-rule mt-1 inline-flex items-center gap-1.5 font-sans text-[0.6875rem] text-muted"
                        >
                          {channel.handle ?? channel.account}
                          <ArrowGlyph className="h-2.5 w-2.5" />
                        </a>
                      ) : (
                        <p className="mt-1 font-sans text-[0.6875rem] text-muted">{dict.media.unverified}</p>
                      )}
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <p className="font-sans text-[0.8125rem] text-graphite">{channel.account}</p>
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <p className="whitespace-nowrap font-sans text-[0.6875rem] uppercase tracking-[0.1em] text-muted">
                        {channel.languages.map((code) => code.toUpperCase()).join(" · ")}
                      </p>
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <p className="font-sans text-[0.8125rem] text-graphite">{channel.field[locale]}</p>
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <p className="whitespace-nowrap font-sans text-[0.8125rem] text-graphite">
                        {channel.region[locale]}
                      </p>
                    </div>
                    <div className="col-span-12 md:col-span-1 md:text-right">
                      <StatusTag status={channel.status} label={dict.media.status[channel.status]} />
                    </div>
                    {channel.note ? (
                      <p className="col-span-12 mt-1 font-sans text-[0.75rem] leading-relaxed text-muted md:col-span-10">
                        {channel.note[locale]}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <p className="mt-10 font-sans text-[0.75rem] leading-relaxed text-muted">
          {locale === "ko"
            ? "주소를 다시 만든 링크는 쓰지 않습니다. 각 채널의 앱에서 복사한 고유 주소만 등록하고, 확인되지 않은 계정은 ‘확인 중’으로 표시합니다."
            : "We never reconstruct a URL. Only addresses copied from the platform itself are listed; unconfirmed accounts show as being verified."}
        </p>
      </section>
    </>
  );
}
