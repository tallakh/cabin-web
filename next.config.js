const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don't fail build on ESLint warnings during production builds
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Don't fail build on TypeScript errors during production builds
    ignoreBuildErrors: false,
  },
}

module.exports = withNextIntl(nextConfig)
