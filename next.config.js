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
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('pdfkit', 'sharp')
    }
    return config
  },
}

module.exports = nextConfig
