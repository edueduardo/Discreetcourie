/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['pdfkit', 'sharp'],
    outputFileTracingExcludes: {
      '*': [
        'node_modules/pdfkit/**/*',
        'node_modules/sharp/**/*',
        'node_modules/@types/pdfkit/**/*',
      ],
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('pdfkit', 'sharp')
    }
    // Ignore canvas module which pdfkit tries to use
    config.resolve.alias.canvas = false
    return config
  },
}

module.exports = nextConfig
