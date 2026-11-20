import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CONTROL CENTER",
  robots: { index: false, follow: false, nocache: true },
};

/** `/admin` — a static forward to the private Control Center in Korean. */
export default function AdminGateLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta httpEquiv="refresh" content="0; url=/ko/admin/" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="/ko/admin/" />
      </head>
      <body
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#fbfaf7",
          color: "#14140f",
          fontFamily: "ui-serif, Georgia, serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        {children}
      </body>
    </html>
  );
}
