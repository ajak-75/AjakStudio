import type { NextConfig } from "next";

/**
 * Deployment target: Cloudflare Pages (Free) — static export.
 *
 * `output: "export"` emits a fully static `out/` directory that Cloudflare Pages
 * serves from its global network with unlimited static requests (see
 * docs/FREE_INFRA_AND_LIMITS.md). No Node server, no paid runtime.
 *
 * `trailingSlash` keeps every route as `/<route>/index.html`, which is what
 * Cloudflare Pages resolves without extra redirect rules and keeps locale
 * prefixes (`/ko/`, `/en/`) stable.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Static export cannot use the Next.js image optimizer.
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
