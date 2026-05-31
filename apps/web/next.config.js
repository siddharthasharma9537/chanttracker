/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  // Don't static generate pages that need runtime env vars
  // They'll be SSR'd on Vercel with env vars injected
  skipTrailingSlashRedirect: true,
}

module.exports = nextConfig
