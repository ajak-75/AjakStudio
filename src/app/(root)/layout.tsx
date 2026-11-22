import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AjakStudio",
  robots: { index: false, follow: true },
};

/**
 * "/" has no content of its own: it forwards to the default locale (/ko/).
 * A static meta refresh keeps Cloudflare Pages on pure static hosting (no
 * Functions, no redirect rules to maintain).
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta httpEquiv="refresh" content="0; url=/ko/" />
        <link rel="canonical" href="/ko/" />
      </head>
      <body>{children}</body>
    </html>
  );
}
