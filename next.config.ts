import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Inline the small CSS-critical bootstrap rather than blocking on a
    // request. Keeps the first paint free of an extra round trip.
    inlineCss: true,
    optimizePackageImports: ['lucide-react', 'motion'],
  },
}

export default nextConfig
