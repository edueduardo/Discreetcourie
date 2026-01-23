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
  // Disable file tracing to prevent stack overflow with pdfkit
  outputFileTracing: false,
  experimental: {
    serverComponentsExternalPackages: ['pdfkit', 'sharp'],
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
